/*
 * placementEngine (L2): the staircase of the placement check (step 8). Pure: no clock, no Math.random,
 * no DOM. The caller passes the seed source and the exclusion set; the engine never reads them itself.
 * EVERY staircase number is a design hypothesis (config.placement, data/placement.js); none has a source.
 *
 *   begin(opts)              a start state at the rung for the band (opts.band, opts.form, opts.now from the caller)
 *   next(state, ctx)         the next question to ask, or null when the run has stopped. ctx = { seed, used }:
 *                            seed is a uint32 from the caller (util.newSeed in the app, NBA_TEST.seed in tests);
 *                            used is a Set of question keys to avoid (earlier answers in this run and matching runs).
 *                            A ladder variant the generator cannot build at that rung is skipped (as prereqPick.probe).
 *   step(state, ok)          a NEW state after a first-try verdict (ok true = correct): move the rung, update the
 *                            path and the stop reason. The input state is never changed.
 *   stop(state)              the stop reason ('cap' | 'floor' | 'stable') or null (still going / child stopped)
 *   settled(state)           the settled rung = floor(mean of the last stableWindow answered rungs), or null
 *   summarize(attempts)      a summary from a list of placement attempts (the live state's equal): total, stop,
 *                            settledRung, levels by concept id, outcome ('stable' | 'cap' | 'floor' | 'child_stopped')
 *   compare(baseline, post)  pair the latest complete baseline run with the latest complete post run after it
 *
 * A placement attempt is tagged in its free-form decision object: { source: 'placement', ... } (service P2).
 */
(function () {
  'use strict';

  NBA.define('placementEngine', ['config', 'catalog', 'generator', 'masteryEngine'],
    (config, catalog, generator, masteryEngine) => {
      const DATA = NBA.data.placement;
      const RUNGS = DATA.rungs;
      const clampInt = (x, lo, hi) => Math.min(hi, Math.max(lo, Math.floor(Number(x) || 0)));
      const own = (o, k) => !!o && Object.prototype.hasOwnProperty.call(o, k);

      /** The config block, with any tuned values merged over the defaults (tests pass a tuned cfg). */
      function conf(cfg) { return Object.assign({}, config.placement, cfg || {}); }

      /** The rung record for a 1-based rung number (clamped to the ladder). */
      function rungAt(n, c) {
        const r = clampInt(n, c.minRung, c.maxRung);
        return RUNGS[r - 1] || RUNGS[0];
      }

      /** The start rung for a band id: data first, then config, else the kind unknown start. */
      function startRungFor(band) {
        const key = own(DATA.startRung, band) ? band : 'unknown';
        return clampInt(DATA.startRung[key], config.placement.minRung, config.placement.maxRung);
      }

      /** True when the generator can build this variant (and does not throw), as prereqPick.probe. */
      function probe(variant, seed) {
        try {
          const q = generator.generate(variant.act, variant.level, new Set(), seed >>> 0, { template: variant.template });
          return !!q;
        } catch (e) { return false; }
      }

      function begin(opts) {
        const o = opts || {};
        const band = typeof o.band === 'string' && own(DATA.startRung, o.band) ? o.band : 'unknown';
        const startRung = startRungFor(band);
        return {
          form: o.form === 'post' ? 'post' : 'baseline',
          startBand: band,
          startRung: startRung,
          rung: startRung,
          dir: 0,              // -1 down, +1 up, 0 before the first move
          reversed: false,     // true once the path has turned at least once (step size drops to stepAfter)
          stepSize: null,      // set lazily in step() from config so a tuned cfg is honoured
          n: 0,                // answers so far
          history: [],         // { rung, ok } per answer, in order
          reversals: 0,
          floorRun: 0,         // first-try misses in a row, all at rung 1
          stopReason: null,
          startedAt: typeof o.now === 'number' ? o.now : null
        };
      }

      /** The variant to show at this rung and visit count: visits mod variants, skipping ones that cannot build. */
      function pickVariant(rung, visits, seed) {
        const variants = rung.variants || [];
        const start = ((visits % variants.length) + variants.length) % variants.length;
        for (let i = 0; i < variants.length; i++) {
          const v = variants[(start + i) % variants.length];
          if (probe(v, seed + i)) return v;
        }
        return null; // no variant builds (should not happen for a built ladder; the test proves it)
      }

      /** How many questions this run has already asked at a given rung (to spread variants). */
      function visitsAt(state, rungN) {
        return state.history.filter((h) => h.rung === rungN).length;
      }

      function next(state, ctx) {
        const c = conf(ctx && ctx.cfg);
        if (stop(state)) return null;
        const seed = (ctx && Number.isFinite(ctx.seed)) ? (ctx.seed >>> 0) : 0;
        const used = ctx && ctx.used instanceof Set ? ctx.used : new Set();
        const rung = rungAt(state.rung, c);
        const variant = pickVariant(rung, visitsAt(state, rung.n), seed);
        if (!variant) return null;
        let q = null;
        try {
          q = generator.generate(variant.act, variant.level, used, seed, { template: variant.template, buddyId: ctx && ctx.buddyId });
        } catch (e) { q = null; }
        if (!q) return null;
        return {
          rung: rung.n, n: state.n + 1, form: state.form,
          activityId: variant.act, difficulty: variant.level, template: variant.template || null,
          concepts: (variant.concepts || []).slice(), words: variant.words || '',
          question: q, questionId: q.questionId, representation: q.representation,
          reasonCode: state.n === 0 ? 'placement_start' : (state.dir > 0 ? 'placement_up' : 'placement_down'),
          startBand: state.startBand, startRung: state.startRung
        };
      }

      /** The move direction after a verdict at the current rung (clamped to the ladder ends). */
      function moveDir(ok) { return ok ? 1 : -1; }

      function step(state, ok, cfg) {
        const c = conf(cfg);
        const s = {
          form: state.form, startBand: state.startBand, startRung: state.startRung,
          rung: state.rung, dir: state.dir, reversed: state.reversed,
          stepSize: state.stepSize, n: state.n, history: state.history.slice(),
          reversals: state.reversals, floorRun: state.floorRun, stopReason: state.stopReason,
          startedAt: state.startedAt
        };
        const correct = ok === true;
        s.history.push({ rung: s.rung, ok: correct });
        s.n = s.history.length;
        // floor: first-try misses in a row, all at the easiest rung
        s.floorRun = (!correct && s.rung === c.minRung) ? s.floorRun + 1 : 0;
        // direction and reversals
        const dir = moveDir(correct);
        if (s.dir !== 0 && dir !== s.dir) { s.reversals++; s.reversed = true; }
        s.dir = dir;
        const size = s.reversed ? c.stepAfter : c.stepFirst;
        s.stepSize = size;
        s.rung = clampInt(s.rung + dir * size, c.minRung, c.maxRung);
        s.stopReason = computeStop(s, c);
        return s;
      }

      /** The last `window` answered rungs. */
      function lastRungs(history, window) {
        const list = history.map((h) => h.rung);
        return list.slice(Math.max(0, list.length - window));
      }

      /** Stop reasons in order: cap, floor, stable. Returns the reason or null. */
      function computeStop(s, c) {
        if (s.n >= c.maxAnswers) return 'cap';
        if (c.floorMisses > 0 && s.floorRun >= c.floorMisses) return 'floor';
        if (s.n >= c.minAnswers) {
          const window = c.stableWindow;
          const rungs = lastRungs(s.history, window);
          if (rungs.length >= window) {
            const spread = Math.max.apply(null, rungs) - Math.min.apply(null, rungs);
            if (spread <= c.stableSpread && s.reversals >= c.stableReversals) return 'stable';
          }
          // ceiling: the last ceilingRun answers all correct at the top rung
          const tail = s.history.slice(Math.max(0, s.history.length - c.ceilingRun));
          if (tail.length >= c.ceilingRun && tail.every((h) => h.ok && h.rung === c.maxRung)) return 'stable';
        }
        return null;
      }

      function stop(state) { return (state && state.stopReason) || null; }

      function settled(state, cfg) {
        const c = conf(cfg);
        if (!state || !state.history || !state.history.length) return null;
        const rungs = lastRungs(state.history, c.stableWindow);
        const sum = rungs.reduce((a, b) => a + b, 0);
        return Math.floor(sum / rungs.length);
      }

      return {
        begin, next, step, stop, settled, summarize, compare,
        startRungFor, pickVariant, probe, DATA
      };

      /**
       * summarize: fold a list of placement attempts (any order) into the same shape the live state gives.
       * outcome 'child_stopped' when the last answered attempt carries no stop tag; else the stop reason.
       * levels: masteryEngine level per credited concept, over this run's attempts only.
       */
      function summarize(attempts, cfg) {
        const list = (Array.isArray(attempts) ? attempts : []).filter((a) => a && typeof a === 'object');
        const ordered = list.slice().sort((x, y) => {
          const nx = pos(x), ny = pos(y);
          if (nx !== ny) return nx - ny;
          return String(x.id) < String(y.id) ? -1 : 1;
        });
        const last = ordered[ordered.length - 1] || null;
        const stopTag = last && last.decision ? (last.decision.stop || null) : null;
        const outcome = stopTag || (ordered.length ? 'child_stopped' : 'empty');
        const form = last && last.assessmentForm ? last.assessmentForm : (ordered[0] && ordered[0].assessmentForm) || 'baseline';
        const concepts = {};
        ordered.forEach((a) => (a.conceptIds || []).forEach((cid) => { concepts[cid] = concepts[cid] || []; }));
        const levels = {};
        Object.keys(concepts).forEach((cid) => {
          const snap = masteryEngine.rebuild(ordered, last && last.studentId, cid, (cfg && cfg.mastery) || config.mastery);
          const ev = masteryEngine.evaluate(snap, (cfg && cfg.mastery) || config.mastery, null, (cfg && cfg.error) || config.error);
          levels[cid] = { level: ev.level, confidence: ev.confidence, total: snap.total };
        });
        const settledRung = settledFromHistory(ordered, cfg);
        return {
          form: form, total: ordered.length, stop: stopTag, outcome: outcome,
          settledRung: settledRung, levels: levels
        };
      }

      /** The answer index of a placement attempt (missionIndex, else history length order). */
      function pos(a) {
        const d = a && a.decision;
        if (d && Number.isFinite(d.n)) return d.n;
        if (Number.isFinite(a && a.missionIndex)) return a.missionIndex;
        return 0;
      }

      /** The settled rung from the attempts' recorded rungs (decision.rung), last stableWindow of them. */
      function settledFromHistory(ordered, cfg) {
        const c = conf(cfg);
        const rungs = ordered.map((a) => a.decision && Number.isFinite(a.decision.rung) ? a.decision.rung : null)
          .filter((r) => r !== null);
        if (!rungs.length) return null;
        const tail = rungs.slice(Math.max(0, rungs.length - c.stableWindow));
        return Math.floor(tail.reduce((a, b) => a + b, 0) / tail.length);
      }

      /**
       * compare: the pairing rule of the old check re-read over tagged attempts. A "complete" run is one whose
       * last attempt carries a stop tag (not child_stopped). Pass two summaries (baseline, post) or two attempt
       * lists; returns { baseline, post, movedFrom, movedTo } with the two settled rungs, or null when either side is missing.
       */
      function compare(baseline, post, cfg) {
        const b = asSummary(baseline, cfg);
        const p = asSummary(post, cfg);
        if (!b || !p) return null;
        return { baseline: b, post: p, movedFrom: b.settledRung, movedTo: p.settledRung };
      }

      /** Accept either a summary object or a list of attempts. */
      function asSummary(x, cfg) {
        if (!x) return null;
        if (Array.isArray(x)) return x.length ? summarize(x, cfg) : null;
        if (typeof x === 'object' && own(x, 'settledRung')) return x;
        return null;
      }
    });
}());
