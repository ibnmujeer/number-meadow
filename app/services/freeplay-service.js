/*
 * freeplay (L4): the Free Play service (F2). It keeps the level state of one child in memory, picks the next question, tags nothing
 * itself (the plan carries the tag in decision), and answers "is today's limit reached" from derived active time. It writes nothing:
 * every answer is stored by learning.recordAttempt like any other. It never looks at who the child is beyond the child's own
 * Free Play settings (the students fields freePlay and fpHidden, absent = on and none hidden).
 *
 *   categories(child)       { all, offered, enabled, mixed }: lists of { id, label }; offered = not hidden by an adult (empty when
 *                           Free Play is off for the child); mixed = two or more offered (the Mixed tile is shown)
 *   open(child)             awaits the write queue, reads the child's attempts once and replays the tagged ones into one level
 *                           state per category (freeplayEngine.replay). Cached for the child until learning loads someone again.
 *   newRun(tag, opts?)      the run part { tag ('mixed' or a category id), includeNew, lastStrand, lastRep, n }, or null for an unknown tag
 *   plan(fp, child)         the next question: { ok: true, activityId, difficulty, template, decisionSource, decision, leadConcepts,
 *                           exclude (a Set), strand, category, ... } or { ok: false, mastered, category } (calm message)
 *   recorded(rec)           an attempt of the loaded child was recorded: a tagged one moves that category's state (live replay);
 *                           returns the move or null
 *   status(child)           { reached, minutes, limit, allowedUntil, day, periodMin }: today's derived active minutes (guided and Free Play
 *                           together, activeTime.activeMs over the stored attempts of the day), the daily limit setting (0 = Off),
 *                           and the active minutes of the newest continuous period (the stretch card reads it)
 *   approve(child)          G2: one adult approval allows approvalMin (15) more active minutes today; kept in memory only, so a
 *                           reload asks again; each approval adds another 15; returns the new status
 *   stateOf(strandId), sinceReview()   copies for tests
 * Day and clock: the day is activeTime.dayWithFloor(now, floor) with floor = the newest time this page has seen (a clock that jumps
 * backwards does not open an earlier day). A forward jump cannot be detected and a backward jump before the first answer of a day
 * is not seen. Under-count of active time: see core/active-time.js. create({ repo, learning, review, now?, rng? }) makes an
 * independent service (tests); rng() returns a fresh random function.
 */
(function () {
  'use strict';

  NBA.define('freeplay', ['config', 'util', 'repo', 'learning', 'review', 'childSettings', 'usageMath', 'activeTime', 'freeplayPick', 'freeplayEngine'],
    (config, util, appRepo, appLearning, appReview, childSettings, usageMath, activeTime, pick, engine) => {
    const FP = config.freeplay;
    const copy = (x) => (x === null || x === undefined ? null : JSON.parse(JSON.stringify(x)));
    const slim = (c) => ({ id: c.id, label: c.label });

    function create(options) {
      const o = options || {};
      const repo = o.repo || appRepo;
      const learning = o.learning || appLearning;
      const review = o.review || appReview;
      const clock = typeof o.now === 'function' ? o.now : () => util.now();
      const newRng = typeof o.rng === 'function' ? o.rng : () => util.rngFrom(util.newSeed());
      let all = null;      // every category with a playable skill, built once from the real data
      let who = null;      // { id, gen }: the child whose states are loaded, and the learning load it belongs to
      let states = {};     // strand id -> level state (freeplayEngine)
      let sinceRev = 0;    // tagged questions since the last review question
      let high = null;     // the newest time this page has seen (the clock floor)
      const approved = {}; // 'childId|day' -> active minutes allowed that day after an approval (memory only)

      const allCats = () => {
        if (!all) all = pick.categories(NBA.data.concepts.map, NBA.data.concepts.strands, NBA.data.freeplay.labels, pick.isPlayable, NBA.data.freeplay.mixedOnly);
        return all;
      };
      const gen = () => (typeof learning.generation === 'function' ? learning.generation() : 0);
      const offeredFor = (child) => { const s = childSettings.freePlayOf(child); return s.on ? pick.offered(allCats(), s.hidden) : []; };

      function categories(child) {
        const offered = offeredFor(child);
        return { all: allCats().map(slim), offered: offered.map(slim), enabled: offered.length > 0, mixed: offered.length >= 2 };
      }

      function stateFor(cat, cache) {
        if (!states[cat.id]) states[cat.id] = engine.begin(cat, cache);
        return states[cat.id];
      }

      async function open(child) {
        if (!child || !child.id) return false;
        await learning.flush();
        if (who && who.id === child.id && who.gen === gen()) return true;
        let rows = null;
        try { rows = (await repo.getAll('attempts', { index: 'studentId', value: child.id })) || []; } catch (e) { rows = null; }
        if (rows === null) return false;
        const tagged = rows.filter((a) => a.decision && a.decision.source === 'freeplay');
        const cache = learning.cacheView();
        states = {};
        allCats().forEach((cat) => {
          states[cat.id] = engine.replay(tagged, cat.id, { ladder: pick.ladder(cat), start: engine.begin(cat, cache).level });
        });
        sinceRev = engine.sinceReview(tagged);
        high = activeTime.floorOf(rows.map((a) => a.timestamp).concat(high === null ? [] : [high]));
        who = { id: child.id, gen: gen() };
        return true;
      }

      function newRun(tag, opts) {
        const known = tag === 'mixed' || allCats().some((c) => c.id === tag);
        return known ? { tag: tag, includeNew: !!(opts && opts.includeNew), lastStrand: null, lastRep: null, n: 0 } : null;
      }

      /** The next question for this run, or the calm "nothing more here" answer. Mixed skips a category that is all done. */
      function plan(fp, child) {
        const cats = offeredFor(child);
        const cache = learning.cacheView();
        const rng = newRng();
        const recent = learning.recentQuestions();
        const due = review.dueItems();
        const mixed = fp.tag === 'mixed';
        let pool = mixed ? cats : cats.filter((c) => c.id === fp.tag);
        const had = pool.length > 0;
        while (pool.length) {
          const cat = mixed ? pick.mixedChoice(pool, cache, states, rng, { includeNew: fp.includeNew, lastStrand: fp.lastStrand }).cat : pool[0];
          const p = engine.next(stateFor(cat, cache), { category: cat, tag: fp.tag, cache: cache, recent: recent, dueItems: due,
            sinceReview: sinceRev, rng: rng, lastRep: fp.lastRep, mixed: mixed });
          if (p.ok) {
            fp.lastStrand = p.strand;
            fp.lastRep = p.representation;
            return Object.assign(p, { exclude: new Set(p.exclude || []) });
          }
          pool = pool.filter((c) => c !== cat);
        }
        return { ok: false, mastered: had, category: fp.tag };
      }

      function recorded(rec) {
        const d = rec && rec.decision;
        if (!who || !d || d.source !== 'freeplay' || rec.studentId !== who.id) return null;
        const cat = allCats().find((c) => c.id === d.strand);
        if (!cat) return null;
        if (Number.isFinite(rec.timestamp)) high = Math.max(high === null ? 0 : high, rec.timestamp);
        const r = engine.step(stateFor(cat, learning.cacheView()), { firstTry: rec.firstAttemptCorrect === true, kind: engine.kindOf(d) }, { ladder: pick.ladder(cat) });
        states[cat.id] = r.state;
        sinceRev = d.event === 'review' ? 0 : sinceRev + 1;
        return r.move;
      }

      /** The newest stored attempt time of a child, or null. */
      async function newestAt(id) {
        const rows = (await repo.getAll('attempts', { index: 'studentTime', lower: [id, 0], upper: [id, Infinity], direction: 'prev', limit: 1 })) || [];
        return rows.length && Number.isFinite(rows[0].timestamp) ? rows[0].timestamp : null;
      }

      /** Today's derived active minutes for a child: every stored attempt of the day, guided or Free Play. */
      async function today(child) {
        await learning.flush();
        const t = clock();
        high = activeTime.floorOf([t, high, await newestAt(child.id)]);
        const day = activeTime.dayWithFloor(t, high);
        const b = usageMath.dayBounds(day);
        const atts = (await repo.getAll('attempts', { index: 'studentTime', lower: [child.id, b.start], upper: [child.id, b.end - 1] })) || [];
        const sessions = {};
        const ids = atts.map((a) => a.sessionId).filter((s, i, l) => typeof s === 'string' && l.indexOf(s) === i);
        await Promise.all(ids.map(async (sid) => { const s = await repo.get('sessions', sid); if (s) sessions[sid] = { startedAt: s.startedAt }; }));
        return { day: day, minutes: activeTime.activeMs(atts, { sessions: sessions, day: day }) / usageMath.MINUTE_MS,
          periodMin: activeTime.lastPeriodMs(atts, { sessions: sessions }) / usageMath.MINUTE_MS };
      }

      async function status(child) {
        const lim = childSettings.settingsOf(child).dailyLimitMin;
        const d = await today(child);
        const until = approved[child.id + '|' + d.day] || 0;
        return { reached: lim > 0 && d.minutes >= Math.max(lim, until), minutes: d.minutes, limit: lim, allowedUntil: until, day: d.day, periodMin: d.periodMin };
      }

      async function approve(child) {
        const s = await status(child);
        if (s.limit > 0) approved[child.id + '|' + s.day] = Math.max(s.minutes, s.limit, s.allowedUntil) + FP.approvalMin;
        return status(child);
      }

      return {
        categories, open, newRun, plan, recorded, status, approve,
        stateOf: (strand) => copy(states[strand] || null),
        sinceReview: () => sinceRev,
        isOpen: () => !!who
      };
    }

    const app = create();
    return Object.assign({ create }, app);
  });
}());
