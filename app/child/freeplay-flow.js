/*
 * freeplayFlow (L5): the Free Play run on the mission screen (F2). It joins the Free Play service to missionUI: it starts a run,
 * answers missionUI's hook after every right answer (is today's limit reached? which question comes next?) and keeps the order of
 * what may stand between two questions. It draws nothing itself: the cards and screens (pause, stretch, end of the day, category
 * done) are added by later code through addGate and setHandlers. Rules kept here:
 *   - a card or the next question comes only after the Next tap; nothing moves on by itself
 *   - the stop for the daily limit is checked first, and only between two questions (never in the middle of one)
 *   - the limit is asked on the Next card (onNextCard) so the answer is ready at the Next tap; if it is not ready the run goes on
 * API:
 *   start(tag?, opts?)     async. tag 'mixed' (default) or a category id; opts { includeNew }. Resolves { ok: true, fp } after the first
 *                          question is shown, or { ok: false, why } with why = no_child | off | unknown_category | hidden | unreadable |
 *                          limit | done (the handlers for limit and done have been called)
 *   addGate(fn)            fn(run, proceed, status) returns true when it showed a card; proceed() then shows the next question; status is the\n *                          latest limit check (service.status, with periodMin) or null when it was not ready at the Next tap
 *   setHandlers({ limit?, exhausted? })  limit(run, status) and exhausted(run, plan); run is null when the run never started.
 *                          The defaults leave the run and show Home.
 *   advance(run)           plan and show the next question now (a card's Keep going button calls proceed, which is this)
 *   lastCheck()            the promise of the latest limit check (tests await it before tapping Next)
 */
(function () {
  'use strict';

  NBA.define('freeplayFlow', ['screens', 'missionUI', 'freeplay'], (screens, missionUI, freeplay) => {
    const { state } = screens;
    let pending = Promise.resolve(null);
    let stop = null;      // the status of the latest check when it said "reached"
    let seen = null;      // the status of the latest check (gates read it at the Next tap)
    const gates = [];

    function toHome() { missionUI.leaveRun(); state.run = null; screens.show('home'); }
    const on = { limit: toHome, exhausted: toHome };
    const labelOf = (child, tag) => (tag === 'mixed' ? NBA.data.freeplay.mixed : freeplay.categories(child).offered.find((c) => c.id === tag).label);

    async function start(tag, opts) {
      const child = state.currentStudent;
      const t = tag || 'mixed';
      if (!child) return { ok: false, why: 'no_child' };
      const cats = freeplay.categories(child);
      if (!cats.enabled) return { ok: false, why: 'off' };
      const fp = freeplay.newRun(t, opts);
      if (!fp) return { ok: false, why: 'unknown_category' };
      if (t !== 'mixed' && !cats.offered.some((c) => c.id === t)) return { ok: false, why: 'hidden' };
      if (!(await freeplay.open(child))) return { ok: false, why: 'unreadable' };
      const st = await freeplay.status(child);
      if (state.currentStudent !== child) return { ok: false, why: 'no_child' };
      stop = null;
      if (st.reached) { on.limit(null, st); return { ok: false, why: 'limit', status: st }; }
      const plan = freeplay.plan(fp, child);
      if (!plan.ok) { on.exhausted(null, plan); return { ok: false, why: 'done', plan: plan }; }
      missionUI.startFree(fp, labelOf(child, t), plan);
      return { ok: true, fp: fp };
    }

    /** Plan and show the next question of the run (a similar question after a model plans itself). */
    function advance(run) {
      if (state.run !== run) return; // the child left meanwhile
      if (!run.similarSpec) {
        const plan = freeplay.plan(run.fp, state.currentStudent);
        if (!plan.ok) { on.exhausted(run, plan); return; }
        run.fpPlan = plan;
      }
      run.fp.n += 1;
      missionUI.showMission(Math.min(run.fp.n, 999));
    }

    missionUI.setFreeHook({
      recorded(rec) { freeplay.recorded(rec); },
      onNextCard() {
        const child = state.currentStudent;
        stop = null;
        seen = null;
        pending = freeplay.status(child).then((s) => { if (state.currentStudent === child) { seen = s; if (s.reached) stop = s; } return s; }).catch(() => null);
      },
      next(run) {
        if (stop) { const s = stop; stop = null; on.limit(run, s); return; }
        const proceed = () => advance(run);
        const st = seen;
        seen = null;
        if (!gates.some((g) => g(run, proceed, st))) proceed();
      }
    });

    return {
      start, advance, lastCheck: () => pending,
      addGate(fn) { if (typeof fn === 'function') gates.push(fn); },
      setHandlers(h) { if (h && typeof h.limit === 'function') on.limit = h.limit; if (h && typeof h.exhausted === 'function') on.exhausted = h.exhausted; }
    };
  });
}());
