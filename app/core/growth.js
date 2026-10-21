/*
 * growth (L2): growth marks as pure functions (step 4, P1). No DOM, no clock, no randomness; the caller passes everything.
 * A growth mark is earned when an attempt raises a skill's level above the highest level that skill ever reached for this
 * child, and the new level is developing or strong. Levels come from masteryEngine.evaluate over a window of recent
 * answers, so a level can wobble; the highest level ever reached (maxRank) only rises, so a drop followed by a rise earns
 * nothing and a mark can not be farmed.
 *   RANK, rankOf(level)                 insufficient_data 0 < needs_support 1 < developing 2 < strong 3
 *   seed(levels)                        { marks: [], maxRank } from the current levels, awarding nothing (a child who
 *                                       has no growth record yet starts here, so nobody gets a burst of marks)
 *   apply(growth, levels, order)        { growth, mark }: levels = { conceptId: level } for the skills one attempt credited;
 *                                       mark = null or { conceptId, level, n }. At most one mark per attempt: the highest
 *                                       newly reached level wins; a tie goes to the skill earlier in `order`
 *   unlocked(growth)                    how many marks the child has earned (the rewards catalog unlocks one item each)
 *   unlockedItems(marksCount)           { tints, accessories } ids unlocked by that many marks: mark k unlocks entry k of the rewards
 *                                       catalog (data/rewards.js); more than twelve marks unlock nothing more
 *   MAX_MARKS                           two marks at most per skill
 * Inputs are never changed; results are new objects.
 */
(function () {
  'use strict';

  NBA.define('growth', ['catalog'], (catalog) => {
    const RANK = { insufficient_data: 0, needs_support: 1, developing: 2, strong: 3 };
    const LEVEL_OF_RANK = ['insufficient_data', 'needs_support', 'developing', 'strong'];
    const MAX_MARKS = catalog.CONCEPTS.length * 2;
    const own = (m, k) => Object.prototype.hasOwnProperty.call(m, k);
    const rankOf = (level) => (own(RANK, level) ? RANK[level] : 0);
    const known = (id) => !!catalog.conceptById(id);
    const copyOf = (g) => ({
      marks: ((g && g.marks) || []).map((m) => ({ conceptId: m.conceptId, level: m.level, n: m.n })),
      maxRank: Object.assign({}, (g && g.maxRank) || {})
    });

    function seed(levels) {
      const out = { marks: [], maxRank: {} };
      Object.keys(levels || {}).forEach((id) => {
        const r = rankOf(levels[id]);
        if (known(id) && r > 0) out.maxRank[id] = r;
      });
      return out;
    }

    function apply(growth, levels, order) {
      const g = copyOf(growth);
      const ids = Object.keys(levels || {}).filter(known);
      const rank = (id) => { const i = (order || []).indexOf(id); return i < 0 ? (order || []).length + ids.indexOf(id) : i; };
      ids.sort((a, b) => rank(a) - rank(b));
      let best = null;
      ids.forEach((id) => {
        const r = rankOf(levels[id]);
        if (r <= (g.maxRank[id] || 0)) return;
        g.maxRank[id] = r;
        if (r >= 2 && (!best || r > best.r)) best = { id: id, r: r };
      });
      let mark = null;
      if (best && g.marks.length < MAX_MARKS) {
        mark = { conceptId: best.id, level: LEVEL_OF_RANK[best.r], n: g.marks.length + 1 };
        g.marks.push(mark);
        mark = { conceptId: mark.conceptId, level: mark.level, n: mark.n };
      }
      return { growth: g, mark: mark };
    }

    function unlockedItems(marksCount) {
      const n = Math.max(0, Math.min(catalog.REWARDS.order.length, Math.floor(Number(marksCount)) || 0));
      const out = { tints: [], accessories: [] };
      catalog.REWARDS.order.slice(0, n).forEach((e) => out[e.kind === 'tint' ? 'tints' : 'accessories'].push(e.id));
      return out;
    }
    const unlocked = (growth) => (growth && Array.isArray(growth.marks) ? growth.marks.length : 0);

    return { RANK, MAX_MARKS, rankOf, seed, apply, unlocked, unlockedItems };
  });
}());
