/*
 * prereqPick (L2): turns a chosen skill into a playable question target (step 7). Pure: the caller passes the skill and the
 * cache; nothing here reads a clock or picks at random. Free of worlds and slots (the same split as reviewEngine / reviewPick).
 *
 *   buildTarget(conceptId, cache, cfg?) -> { conceptId, kind, activityId, difficulty, template, representation, mixed: false,
 *       leadConcepts: [conceptId], slotConceptId: conceptId, fromDifficulty, fromRepresentation, evidence, rulesChecked,
 *       adaptiveAction, adaptiveReasonCode, clamped } | null
 *     cache = { mastery: { conceptId: snapshot }, now }
 *
 * Three kinds of skill:
 *   matrix      the four skills the adaptive engine decides on: adaptiveEngine.decide for that skill, so the change of level
 *               is at most one and the earlier skill gets its own struggle remedies first (more concrete, then easier).
 *   assignable  a range skill (add.within-10 ...) or addsub.mixed: targets.resolveTarget with every field Auto.
 *   fixed       a skill with one fixed activity (num.count, num.compare, mul.groups, div.share): that activity at the lowest
 *               level it declares (these four declare only levels 2 and 4, and the generator throws on any other level).
 * mixed is always false, so a step-back or next-skill question never credits addsub.mixed by accident. The target is probed with
 * generator.generate; a skill with no question of its own (rep.transition) or one the generator cannot build gives null.
 */
(function () {
  'use strict';

  NBA.define('prereqPick', ['config', 'catalog', 'generator', 'masteryEngine', 'adaptiveEngine', 'targets'],
    (config, catalog, generator, masteryEngine, adaptiveEngine, targets) => {
      const C = catalog.CURRICULUM;
      const own = (o, k) => !!o && typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k);
      const repOf = (id) => { const a = catalog.activityById(id); return a ? a.representation : null; };

      /** True when the generator gives a question for this activity and level (and does not throw). */
      function probe(activityId, level, template) {
        try {
          const a = catalog.activityById(activityId);
          const q = generator.generate(activityId, level, new Set(), 1, { template: template });
          return !!a && !!q && q.representation === a.representation;
        } catch (e) { return false; }
      }

      function finish(c, kind, t) {
        if (!t || !t.activityId || !probe(t.activityId, t.difficulty, t.template || null)) return null;
        return {
          conceptId: c, kind: kind, activityId: t.activityId, difficulty: t.difficulty, template: t.template || null,
          representation: repOf(t.activityId), mixed: false, leadConcepts: [c], slotConceptId: c,
          fromDifficulty: Number.isInteger(t.fromDifficulty) ? t.fromDifficulty : t.difficulty,
          fromRepresentation: t.fromRepresentation || repOf(t.activityId), evidence: t.evidence || null,
          rulesChecked: t.rulesChecked || [], adaptiveAction: t.adaptiveAction || null, adaptiveReasonCode: t.adaptiveReasonCode || null,
          clamped: !!t.clamped
        };
      }

      function matrixTarget(c, cache, cfg) {
        const A = C.assignable[c];
        const snap = cache && cache.mastery && own(cache.mastery, c) ? cache.mastery[c] : null;
        const m = masteryEngine.evaluate(snap || masteryEngine.empty(null, c), cfg.mastery, cache && cache.now, cfg.error);
        const d = adaptiveEngine.decide({ conceptId: c, mastery: m, snapshot: snap, now: cache && cache.now,
          fallback: { activityId: A.default.activityId, difficulty: A.default.difficulty, representation: repOf(A.default.activityId) } }, cfg.adaptive);
        return finish(c, 'matrix', { activityId: d.activityId, difficulty: d.toDifficulty, template: d.template, fromDifficulty: d.fromDifficulty,
          fromRepresentation: d.fromRepresentation, evidence: d.evidence, rulesChecked: d.rulesChecked, adaptiveAction: d.action,
          adaptiveReasonCode: d.reasonCode });
      }

      function assignableTarget(c, cache, cfg) {
        const t = targets.resolveTarget(c, {}, { kind: 'auto', j: 0, rot: 0 }, cache, cfg);
        if (!t) return null;
        const a = t.adaptive;
        const lv = C.assignable[c].levels; // the driver's level, read inside this skill's own levels: the move stays at most one
        const from = a ? Math.min(lv[lv.length - 1], Math.max(lv[0], a.fromDifficulty)) : t.difficulty;
        return finish(c, 'assignable', { activityId: t.activityId, difficulty: t.difficulty, template: t.template, clamped: t.clamped,
          fromDifficulty: from, fromRepresentation: a ? a.fromRepresentation : null,
          evidence: a ? a.evidence : null, rulesChecked: a ? a.rulesChecked : [], adaptiveAction: a ? a.action : null,
          adaptiveReasonCode: a ? a.reasonCode : null });
      }

      /** The skill's own activity (primary first, then any that serves it) at the lowest level it declares. */
      function fixedTarget(c) {
        const list = catalog.ACTIVITIES.filter((a) => (a.concepts || []).indexOf(c) >= 0 && (a.difficulties || []).length > 0);
        const a = list.find((x) => x.primaryConcept === c) || list[0];
        if (!a || a.templates) return null;
        return finish(c, 'fixed', { activityId: a.id, difficulty: Math.min.apply(null, a.difficulties), template: null });
      }

      function buildTarget(conceptId, cache, cfg0) {
        const cfg = Object.assign({ mastery: config.mastery, adaptive: config.adaptive, error: config.error }, cfg0 || {});
        try {
          if (!catalog.conceptById(conceptId)) return null;
          if (adaptiveEngine.isMatrixConcept(conceptId)) return matrixTarget(conceptId, cache, cfg);
          if (own(C.assignable, conceptId)) return assignableTarget(conceptId, cache, cfg);
          return fixedTarget(conceptId);
        } catch (e) { return null; }
      }

      return { buildTarget, probe };
    });
}());
