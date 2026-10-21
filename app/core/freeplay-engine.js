/*
 * freeplayEngine (L2): the level controller of Free Play (F1). Pure: state and events come in, new state goes out; no clock, no
 * randomness except the rng the caller passes to next(), no page. It never looks at who the child is. Every number is a design
 * hypothesis (config.freeplay). One state per category (strand id):
 *   { level, answers, sinceChange, window (first-try results since the last change, at most 12), mistakeRun, successRun,
 *     needTwo, lastLowStep, guided (the next question shows a guided example), struggle (a step back may be needed) }
 *
 *   initial(ladder, start?) / begin(cat, cache)   a fresh state: the easiest level, or the level the child already did well in
 *   zone(window, cfg?)                            'harder' | 'easier' | 'stay' | null (too few answers); exactly 85 or 75 stays
 *   step(state, event, opts?)                     { state, move }; event = { firstTry, kind? } with kind normal | guided | review |
 *                                                 stepBack (the last three are neutral for the level); opts = { ladder, cfg }
 *   replay(attempts, strandId, opts?)             the state rebuilt from tagged attempts (decision.source freeplay, decision.strand)
 *   next(state, ctx)                              the plan for the next question, or { mastered: true }; ctx = { category, tag, cache,
 *                                                 recent, dueItems, sinceReview, rng, lastRep, mixed, cfg }
 *   sinceReview(attempts)                         tagged questions since the last review question (for the one-in-four cap)
 * Rule order (S5): (1) three first-try mistakes in a row step down once, with no 6-answer gap; at the lowest level they give only a
 * guided example and a change of way, at most once per lowStepGap answers; after a step down, two first-try successes in a row and
 * minGap answers are needed before a step up. (2) With a weak earlier skill, the next question goes back to it (prereqEngine).
 * (3) Warm-up: a step up after two first-try successes in a row in the first warmUpAnswers; after that one level at a time, at least
 * minGap answers apart, from the window (above upAbove up, below downBelow down).
 */
(function () {
  'use strict';

  NBA.define('freeplayEngine', ['config', 'freeplayPick', 'prereqEngine', 'prereqPick', 'reviewPick'],
    (config, pick, prereqEngine, prereqPick, reviewPick) => {
      const EPS = 1e-9;
      const cfgOf = (c) => Object.assign({}, config.freeplay, c || {});
      const pos = (ladder, level) => { let i = 0; ladder.forEach((l, k) => { if (l <= level) i = k; }); return i; };
      const snapOf = (cache, c) => (cache && cache.mastery && Object.prototype.hasOwnProperty.call(cache.mastery, c) ? cache.mastery[c] : null);

      function initial(ladder, start) {
        const l = Array.isArray(ladder) && ladder.length ? ladder : [1];
        return { level: l[Number.isInteger(start) ? pos(l, start) : 0], answers: 0, sinceChange: 0, window: [], mistakeRun: 0, successRun: 0,
          needTwo: false, lastLowStep: null, guided: false, struggle: false };
      }

      function begin(cat, cache) {
        const done = cat.conceptIds.map((c) => reviewPick.doneLevel(snapOf(cache, c))).filter(Number.isInteger);
        return initial(pick.ladder(cat), done.length ? Math.max.apply(null, done) : null);
      }

      function zone(window, cfg) {
        const c = cfgOf(cfg);
        const w = (Array.isArray(window) ? window : []).slice(-c.comfortWindow);
        if (w.length < c.comfortMin) return null;
        const hit = w.filter(Boolean).length;
        if (hit > c.upAbove * w.length + EPS) return 'harder';
        return hit < c.downBelow * w.length - EPS ? 'easier' : 'stay';
      }

      function move(s, ladder, j, kind) {
        const from = s.level;
        Object.assign(s, { level: ladder[j], sinceChange: 0, window: [], successRun: 0, mistakeRun: 0 });
        if (kind === 'up') s.needTwo = false;
        return { state: s, move: { kind: kind, from: from, to: s.level } };
      }

      /** Rule 1: three first-try mistakes in a row. One level easier with a guided example and another way, or at the lowest level only the example. */
      function down(s, ladder, c) {
        s.mistakeRun = 0;
        s.successRun = 0;
        s.needTwo = true;
        const i = pos(ladder, s.level);
        if (i > 0) {
          const m = move(s, ladder, i - 1, 'down');
          s.guided = true;
          Object.assign(m.move, { guided: true, switchWay: true });
          return m;
        }
        s.struggle = true;
        if (s.lastLowStep === null || s.answers - s.lastLowStep >= c.lowStepGap) {
          s.lastLowStep = s.answers;
          s.guided = true;
          return { state: s, move: { kind: 'guided', from: s.level, to: s.level, guided: true, switchWay: true } };
        }
        return { state: s, move: null };
      }

      function step(state, ev, opts) {
        const o = opts || {};
        const c = cfgOf(o.cfg);
        const ladder = Array.isArray(o.ladder) && o.ladder.length ? o.ladder : [1, 2, 3, 4];
        const s = Object.assign({}, state, { window: state['window'].slice(), guided: false });
        const win = s['window'];
        const kind = (ev && ev.kind) || 'normal';
        const first = !!(ev && ev.firstTry);
        s.answers += 1;
        s.sinceChange += 1;
        if (kind !== 'normal') {
          if (kind === 'stepBack') {
            s.successRun = first ? s.successRun + 1 : 0;
            if (s.struggle && s.successRun >= c.warmStepUpRun) s.struggle = false;
          }
          return { state: s, move: null };
        }
        win.push(first);
        if (win.length > c.comfortWindow) win.shift();
        s.successRun = first ? s.successRun + 1 : 0;
        s.mistakeRun = first ? 0 : s.mistakeRun + 1;
        if (s.struggle && s.successRun >= c.warmStepUpRun) s.struggle = false;
        if (s.mistakeRun >= c.mistakeRun) return down(s, ladder, c);
        const i = pos(ladder, s.level);
        const upOk = i < ladder.length - 1 && (!s.needTwo || (s.successRun >= c.warmStepUpRun && s.sinceChange >= c.minGap));
        if (s.answers <= c.warmUpAnswers) return s.successRun >= c.warmStepUpRun && upOk ? move(s, ladder, i + 1, 'up') : { state: s, move: null };
        if (s.sinceChange < c.minGap || win.length < c.comfortMin) return { state: s, move: null };
        const z = zone(win, c);
        if (z === 'harder' && upOk) return move(s, ladder, i + 1, 'up');
        if (z === 'easier' && i > 0) return move(s, ladder, i - 1, 'easier');
        if (z === 'easier') s.struggle = true;
        return { state: s, move: null };
      }

      const kindOf = (d) => (d.event === 'review' || d.event === 'stepBack' ? d.event : (d.guided ? 'guided' : 'normal'));
      const cmpId = (x, y) => (String(x.id) < String(y.id) ? -1 : (String(x.id) > String(y.id) ? 1 : 0));
      const taggedOf = (attempts) => (Array.isArray(attempts) ? attempts : []).filter((a) => a && a.decision && a.decision.source === 'freeplay' && Number.isFinite(a.timestamp))
        .sort((x, y) => (x.timestamp - y.timestamp) || cmpId(x, y));

      function replay(attempts, strandId, opts) {
        const o = opts || {};
        const mine = taggedOf(attempts).filter((a) => a.decision.strand === strandId);
        const own = mine.find((a) => kindOf(a.decision) === 'normal' || kindOf(a.decision) === 'guided');
        let s = o.state || initial(o.ladder, own && Number.isInteger(own.decision.fromDifficulty) ? own.decision.fromDifficulty : o.start);
        mine.forEach((a) => { s = step(s, { firstTry: a.firstAttemptCorrect === true, kind: kindOf(a.decision) }, o).state; });
        return s;
      }

      function sinceReview(attempts) {
        const list = taggedOf(attempts);
        let n = 0;
        for (let k = list.length - 1; k >= 0 && list[k].decision.event !== 'review'; k--) n++;
        return n;
      }

      /** Rule 2: the weak earlier skill to go back to (one in the same category when the path has one), as a target, or null. */
      function stepBackTarget(state, ctx, cat, cache) {
        const sb = prereqEngine.stepBack(pick.conceptFor(cat, state.level, cache), prereqEngine.levelsFor(cache, null));
        if (!sb) return null;
        const to = sb.path.slice(1).reverse().find((id) => cat.conceptIds.indexOf(id) >= 0) || sb.conceptId;
        const t = prereqPick.buildTarget(to, cache);
        if (!t) return null;
        return Object.assign(t, { exclude: pick.excludeFor(t.activityId, t.difficulty, t.template, ctx.recent), decision: { action: 'freeplay', source: 'freeplay',
          reasonCode: sb.reasonCode, strand: cat.id, conceptId: to, stepBackTo: to, path: sb.path, activityId: t.activityId, representation: t.representation,
          template: t.template, fromDifficulty: t.fromDifficulty, toDifficulty: t.difficulty, event: 'stepBack', guided: false } });
      }

      function reviewTarget(ctx, cat, cache, tag) {
        const list = (ctx.dueItems || []).filter((d) => ctx.mixed || cat.conceptIds.indexOf(d.conceptId) >= 0);
        for (let k = 0; k < list.length; k++) {
          const t = reviewPick.buildTarget(list[k], snapOf(cache, list[k].conceptId), { source: 'freeplay', strand: cat.id, category: tag, event: 'review', guided: false });
          if (t) return Object.assign(t, { exclude: pick.excludeFor(t.activityId, t.difficulty, t.template, ctx.recent) });
        }
        return null;
      }

      function next(state, ctx) {
        const x = ctx || {};
        const c = cfgOf(x.cfg);
        const cat = x.category;
        const tag = x.tag || cat.id;
        const cache = x.cache || { mastery: {}, now: 0 };
        const due = x.dueItems || [];
        if (pick.mastered(cat, cache, due.map((d) => d.conceptId))) return { ok: false, mastered: true, category: tag };
        let t = null;
        if (state.struggle) t = stepBackTarget(state, x, cat, cache);
        if (!t && !state.guided && !state.struggle && (x.sinceReview || 0) >= c.reviewEvery - 1) t = reviewTarget(x, cat, cache, tag);
        if (!t) {
          t = pick.target(cat, state, cache, x.rng, { recent: x.recent, avoidRep: state.guided ? x.lastRep : null, guided: state.guided, mixed: x.mixed });
          if (t) t.decision.event = 'answer';
        }
        if (!t) return { ok: false, mastered: false, category: tag };
        t.category = tag;
        t.strand = cat.id;
        t.conceptId = t.conceptId || t.slotConceptId;
        t.decision = Object.assign({}, t.decision, { category: tag, strand: cat.id, guided: t.decision.event === 'review' ? false : !!state.guided });
        return Object.assign({ ok: true, mastered: false }, t);
      }

      return { initial, begin, zone, step, replay, next, sinceReview, kindOf };
    });
}());
