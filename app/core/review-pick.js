/*
 * reviewPick (L2): builds a playable question target from a schedule item (step 5). Pure: the caller passes the item and
 * the child's mastery snapshot for that skill; nothing here reads a clock or picks at random.
 *
 *   buildTarget(item, snapshot, extra?) -> { decisionSource: 'review', decision, activityId, difficulty, template,
 *       representation, mixed: false, leadConcepts: [conceptId], slotConceptId } | null
 *
 * It is data-driven: the activities of a skill are those whose `concepts` include it (narrowed to the curriculum's
 * assignable list when the skill has one), so a new skill with activities needs no code here.
 *   way of showing  one the child has done before (snapshot.byRepresentation), best first-try share first, then the more
 *                   concrete way; the choice rotates with item.reviews so each known way comes round. A way the skill has
 *                   no activity for is skipped; with no known way the most concrete available way is used.
 *   level           the highest level the child did well in (design hypothesis: at least 2 answers and 70 percent right on
 *                   the first try), one level easier while the item is at step 0 (new or just stepped back); never harder
 *                   than that level when an easier one is declared. Clamped to the levels the activity declares and the
 *                   skill allows (four skills declare only levels 2 and 4; generator.generate throws on any other level).
 *   verified        the target is probed with generator.generate: a way or level the generator does not give is skipped.
 * rep.transition (config.review.excluded) has no question of its own and returns null.
 */
(function () {
  'use strict';

  NBA.define('reviewPick', ['config', 'catalog', 'generator', 'reviewEngine'], (config, catalog, generator, reviewEngine) => {
    const C = catalog.CURRICULUM;
    const ORDER = config.adaptive.concretenessOrder.concat(['word-problem']);
    const DONE = { minAnswers: 2, firstShare: 0.7 }; // design hypothesis
    const own = (o, k) => !!o && Object.prototype.hasOwnProperty.call(o, k);
    const cmp = (a, b) => (a < b ? -1 : (a > b ? 1 : 0));
    const rank = (rep) => { const i = ORDER.indexOf(rep); return i < 0 ? ORDER.length : i; };

    /** The activities that can ask this skill, in catalog order. */
    function activitiesFor(conceptId) {
      const table = own(C.assignable, conceptId) ? C.assignable[conceptId] : null;
      return catalog.ACTIVITIES.filter((a) => (a.concepts || []).indexOf(conceptId) >= 0 && (!table || table.activities.indexOf(a.id) >= 0));
    }

    /** The levels an activity may be asked at for this skill (the activity's levels, narrowed by the skill's own levels). */
    function levelsFor(a, conceptId) {
      const table = own(C.assignable, conceptId) ? C.assignable[conceptId] : null;
      return (a.difficulties || []).filter((d) => !table || table.levels.indexOf(d) >= 0).sort((x, y) => x - y);
    }

    /** The ways the child has done for this skill that the skill has activities for, best first. */
    function knownWays(snapshot, available) {
      const by = snapshot && snapshot.byRepresentation && typeof snapshot.byRepresentation === 'object' ? snapshot.byRepresentation : {};
      return Object.keys(by).filter((r) => by[r] && by[r].n > 0 && available.indexOf(r) >= 0).sort((a, b) =>
        (by[b].first / by[b].n - by[a].first / by[a].n) || (by[b].n - by[a].n) || (rank(a) - rank(b)) || cmp(a, b));
    }

    /** The highest level the child did well in (a level with enough answers and first tries), else the highest tried, else null. */
    function doneLevel(snapshot) {
      const by = snapshot && snapshot.byDifficulty && typeof snapshot.byDifficulty === 'object' ? snapshot.byDifficulty : {};
      const levels = Object.keys(by).map(Number).filter((d) => d >= 1 && d <= 4 && by[d] && by[d].n > 0).sort((a, b) => b - a);
      const good = levels.find((d) => by[d].n >= DONE.minAnswers && by[d].first >= DONE.firstShare * by[d].n - 1e-9);
      return good !== undefined ? good : (levels.length ? levels[0] : null);
    }

    /** The largest allowed level that is not above `wanted`; the smallest allowed level when all are above it. */
    function clampLevel(allowed, wanted) {
      const below = allowed.filter((d) => d <= wanted);
      return below.length ? below[below.length - 1] : allowed[0];
    }

    const templateOf = (a, conceptId) => (a.templates ? (conceptId === 'sub.difference' ? 'diff' : 'take') : null);

    /** True when the generator gives a question at this level in this way (and does not throw). */
    function probe(a, level, template) {
      try {
        const q = generator.generate(a.id, level, new Set(), 1, { template: template });
        return !!q && q.representation === a.representation;
      } catch (e) { return false; }
    }

    function buildTarget(item, snapshot, extra) {
      const conceptId = item && item.conceptId;
      if (!reviewEngine.reviewable(conceptId)) return null;
      const acts = activitiesFor(conceptId).filter((a) => levelsFor(a, conceptId).length > 0);
      if (!acts.length) return null;
      const reps = acts.map((a) => a.representation).filter((r, i, l) => l.indexOf(r) === i);
      let ways = knownWays(snapshot, reps);
      const fallbackWay = ways.length === 0;
      if (fallbackWay) ways = reps.slice().sort((a, b) => (rank(a) - rank(b)) || cmp(a, b));
      const rot = Math.max(0, Math.floor(Number(item.reviews) || 0));
      const done = doneLevel(snapshot);
      const wanted = (done === null ? 2 : done) - (item.step === 0 && done !== null ? 1 : 0);
      for (let k = 0; k < ways.length; k++) {
        const way = ways[(rot + k) % ways.length];
        const ofWay = acts.filter((a) => a.representation === way);
        for (let j = 0; j < ofWay.length; j++) {
          const a = ofWay[(rot + j) % ofWay.length];
          const level = clampLevel(levelsFor(a, conceptId), wanted);
          const template = templateOf(a, conceptId);
          if (!probe(a, level, template)) continue;
          return {
            decisionSource: 'review', activityId: a.id, difficulty: level, template: template, representation: a.representation,
            mixed: false, leadConcepts: [conceptId], slotConceptId: conceptId,
            decision: Object.assign({ action: 'review', reasonCode: 'review_due', source: 'review', conceptId: conceptId, step: item.step,
              dueDay: item.dueDay, activityId: a.id, representation: a.representation, fromDifficulty: done === null ? level : done,
              toDifficulty: level, knownWay: !fallbackWay }, extra || {})
          };
        }
      }
      return null;
    }

    return { activitiesFor, levelsFor, knownWays, doneLevel, clampLevel, buildTarget };
  });
}());
