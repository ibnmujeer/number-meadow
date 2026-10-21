/*
 * targets (L2): the adaptive target resolver (DESIGN 14.8), pure. learningEngine re-exports
 * resolveTarget (used by the child recommendation path); the module is split out only to keep
 * learning-engine.js short.
 *
 *   resolveTarget(c, fixed, where, cache, cfg) -> { conceptId, driverConceptId, activityId,
 *       representation, difficulty, template, clamped, adaptive (the decide result used, or null) }
 *     fixed = { activityIds: [], representation: rep | null, difficulty: 1-4 | null }
 *     where = { kind: 'auto', j, rot } | { kind: 'slot', slotConceptId, v1Default: { activityId, difficulty } }
 *     cache = { mastery: { conceptId: snapshot }, now }
 *   candidateList(c, fixed, driver?)  F(c) of 14.8 step 2 (for addsub.mixed: only the driver's row)
 */
(function () {
  'use strict';

  NBA.define('targets', ['config', 'util', 'catalog', 'masteryEngine', 'adaptiveEngine'],
    (config, util, catalog, masteryEngine, adaptiveEngine) => {
      const C = catalog.CURRICULUM;
      const own = (o, k) => !!o && typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k);
      const tableOf = (c) => (own(C.assignable, c) ? C.assignable[c] : null);
      const SELECTABLE = Object.keys(C.assignable);
      const isLevel = (x) => Number.isInteger(x) && x >= 1 && x <= 4;
      const repOf = (id) => { const a = catalog.activityById(id); return a ? a.representation : null; };
      const inRow = (driver, id) => !!adaptiveEngine.repInRow(driver, id);

      /** The default driver of c at occurrence j (addsub.mixed: add row when j is even, sub row when odd). */
      function defaultDriver(c, j) {
        const A = tableOf(c);
        if (!A) return null;
        return A.mixed && j % 2 === 1 ? A.oddDriver : A.defaultDriver;
      }
      /** Every driver c's table names (default, odd and activity drivers). */
      function namedDrivers(c) {
        const A = tableOf(c);
        if (!A) return [];
        const out = [A.defaultDriver];
        if (A.oddDriver) out.push(A.oddDriver);
        Object.keys(A.activityDriver).forEach((k) => out.push(A.activityDriver[k]));
        return out.filter((x, i) => out.indexOf(x) === i);
      }

      /** Normalise the fixed fields: Auto ('auto', null, missing) becomes null / []. */
      function normFixed(f) {
        const x = f || {};
        const ids = Array.isArray(x.activityIds) ? x.activityIds.filter((a) => typeof a === 'string' && a !== 'auto')
          : (typeof x.activityId === 'string' && x.activityId !== 'auto' ? [x.activityId] : []);
        const rep = typeof x.representation === 'string' && x.representation !== 'auto' ? x.representation : null;
        const diff = isLevel(x.difficulty) ? x.difficulty : null;
        return { activityIds: ids, representation: rep, difficulty: diff };
      }

      function candidateList(c, fixed, driver) {
        const A = tableOf(c);
        if (!A) return [];
        const f = normFixed(fixed);
        const listed = f.activityIds.filter((id) => A.activities.indexOf(id) >= 0);
        // addsub.mixed: only the driver's matrix row (the even or odd row, or the slot concept's row)
        const d = driver || A.defaultDriver;
        const base = A.mixed ? C.matrixColumns.map((r) => adaptiveEngine.activityFor(d, r)).filter((x) => x) : A.activities;
        // listed activities that fit c; every fitting activity only when the list is empty (N4)
        let F = f.activityIds.length ? listed : base.slice();
        if (f.representation) F = F.filter((id) => repOf(id) === f.representation);
        if (A.mixed) F = F.filter((id) => inRow(d, id));
        return F;
      }

      function evaluate(cache, c, cfg) {
        const snap = cache && cache.mastery ? cache.mastery[c] : null;
        return { snap: snap || null, m: masteryEngine.evaluate(snap || masteryEngine.empty(null, c), cfg.mastery, cache && cache.now, cfg.error) };
      }
      function decideOn(driver, fallback, cache, cfg) {
        const e = evaluate(cache, driver, cfg);
        return adaptiveEngine.decide({ conceptId: driver, mastery: e.m, snapshot: e.snap, fallback: fallback, now: cache && cache.now }, cfg.adaptive);
      }
      const hasData = (cache, c, cfg) => evaluate(cache, c, cfg).m.level !== 'insufficient_data';

      function resolveTarget(c, fixed, where, cache, cfg0) {
        const cfg = Object.assign({ mastery: config.mastery, adaptive: config.adaptive, error: config.error }, cfg0 || {});
        const A = tableOf(c);
        if (!A) return null;
        const w = where || { kind: 'auto', j: 0 };
        const j = Math.max(0, Math.floor(Number(w.j) || 0));
        const f = normFixed(fixed);
        // 1. preferred driver
        let p = defaultDriver(c, j);
        const sc = w.kind === 'slot' ? w.slotConceptId : null;
        if (sc && (sc === c || namedDrivers(c).indexOf(sc) >= 0 || A.mixed) && adaptiveEngine.isMatrixConcept(sc)) p = sc;
        // the no-data default: the slot's v1 default when p is the slot concept, else the table default
        const nd0 = sc && p === sc && w.v1Default ? w.v1Default : (A.mixed && j % 2 === 1 ? A.oddDefault : A.default);
        const noData = { activityId: nd0.activityId, difficulty: nd0.difficulty, representation: repOf(nd0.activityId) };
        // 2. candidate list
        let F = candidateList(c, f, p);
        if (!F.length && A.mixed && sc) {
          const rep = adaptiveEngine.nearestAvailable(p, f.representation || 'visual', cfg.adaptive);
          const act = rep ? adaptiveEngine.activityFor(p, rep) : null;
          if (act) F = [act];
        }
        // 3. activity
        const anyFixed = f.activityIds.length > 0 || !!f.representation;
        let activityId = null, dec = null;
        if (anyFixed && F.length) {
          if (w.kind === 'auto') {
            const rot = Math.max(0, Math.floor(Number(w.rot !== undefined ? w.rot : j) || 0));
            activityId = F[rot % F.length];
          } else activityId = F.find((id) => inRow(p, id)) || F[0];
        } else if (!anyFixed && hasData(cache, p, cfg)) {
          dec = decideOn(p, noData, cache, cfg);
          activityId = dec.activityId;
        }
        if (!activityId || (A.activities.indexOf(activityId) < 0 && !(A.mixed && inRow(p, activityId)))) {
          activityId = F.length ? (F.indexOf(noData.activityId) >= 0 ? noData.activityId : F[0]) : noData.activityId;
        }
        // 4. driver
        const driver = inRow(p, activityId) ? p : (own(A.activityDriver, activityId) ? A.activityDriver[activityId] : defaultDriver(c, j));
        // 5. difficulty
        let difficulty;
        if (f.difficulty) difficulty = f.difficulty;
        else if (hasData(cache, driver, cfg)) {
          const d2 = dec && driver === p ? dec : decideOn(driver, noData, cache, cfg);
          if (!dec) dec = d2;
          difficulty = d2.toDifficulty;
        } else difficulty = noData.difficulty;
        let clamped = false;
        if (A.levels.indexOf(difficulty) < 0) {
          const lo = A.levels[0], hi = A.levels[A.levels.length - 1];
          difficulty = util.clamp(difficulty, lo, hi);
          clamped = true;
        }
        // 6. template
        const meta = catalog.activityById(activityId);
        const template = meta && meta.templates ? (driver === 'sub.difference' ? 'diff' : 'take') : null;
        return { conceptId: c, driverConceptId: driver, activityId, representation: repOf(activityId), difficulty, template, clamped, adaptive: dec };
      }

      return { resolveTarget, candidateList, defaultDriver, normFixed, SELECTABLE };
    });
}());
