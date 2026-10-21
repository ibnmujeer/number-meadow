/*
 * freeplayPick (L2): which categories exist and which question comes next inside one (Free Play F1). Pure: the caller passes the data,
 * the cache and an rng; nothing here reads a clock, draws its own random numbers or touches the page. It never looks at who the child is.
 *
 *   categories(map, strands, labels, playable, mixedOnly?)  [{ id (strand id), label, conceptIds, extraIds }] in strand order. A strand
 *                                  is listed only when it has a playable skill (empty ones are hidden, nothing says "coming soon");
 *                                  mixedOnly skills (addsub.mixed) are kept out of conceptIds and listed in extraIds
 *   missingLabels(cats)            ids of listed categories that have no label (a test must find none)
 *   offered(cats, hiddenIds?)      the categories an adult has not hidden
 *   isPlayable(conceptId)          true when the skill builds a question today (rep.transition does not)
 *   ladder(cat)                    the levels a category can be asked at, easiest first (four categories have only 2 and 4)
 *   mastered(cat, cache, dueIds?)  every skill at its top level, strong, and none due (OD-16)
 *   conceptFor(cat, level, cache)  the skill that asks at that level: needs support first, then teaching order
 *   mixedChoice(cats, cache, states, rng, opts?)  { cat, kind } for Mixed: a played category; none played = all; opts.includeNew
 *                                  sometimes brings in an unplayed one; opts.lastStrand is not repeated
 *   target(cat, state, cache, rng, opts?)  { conceptId, activityId, difficulty, template, representation, exclude, decision ... } or null
 *   opts = { level, conceptId, recent (newest first, { activityId, questionId }), avoidRep, guided, mixed, reasonCode }
 * No-repeat window: exclude = the newest distinct keys of the activity, min(noRepeat - 1, pool - 1) of them, so a pool of 20 or more
 * never repeats within 20 and a smaller pool repeats only its oldest question. Variety: the same activity at most
 * config.adaptive.maxSameActivityRun times in a row when another one fits; the way that was used longest ago comes next.
 */
(function () {
  'use strict';

  NBA.define('freeplayPick', ['config', 'questionTypes', 'reviewPick', 'prereqPick', 'prereqEngine', 'learningEngine'],
    (config, questionTypes, reviewPick, prereqPick, prereqEngine, learningEngine) => {
      const EMPTY = { mastery: {}, now: 0 };
      const own = (o, k) => !!o && typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k);
      const memo = new Map();
      const snapOf = (cache, c) => (cache && own(cache.mastery, c) ? cache.mastery[c] : null);

      function isPlayable(c) {
        if (!memo.has(c)) memo.set(c, !!prereqPick.buildTarget(c, EMPTY));
        return memo.get(c);
      }

      function categories(map, strands, labels, playable, mixedOnly) {
        const rows = Array.isArray(map) ? map : [];
        const solo = Array.isArray(mixedOnly) ? mixedOnly : [];
        return (Array.isArray(strands) ? strands : []).map((s) => {
          const ok = rows.filter((r) => r && r.strand === s.id && playable(r.id));
          return { id: s.id, label: own(labels, s.id) ? labels[s.id] : null,
            conceptIds: ok.filter((r) => solo.indexOf(r.id) < 0).map((r) => r.id), extraIds: ok.filter((r) => solo.indexOf(r.id) >= 0).map((r) => r.id) };
        }).filter((c) => c.conceptIds.length > 0);
      }

      const missingLabels = (cats) => cats.filter((c) => typeof c.label !== 'string' || !c.label).map((c) => c.id);
      const offered = (cats, hidden) => cats.filter((c) => (hidden || []).indexOf(c.id) < 0);

      /** The levels a skill can be asked at, easiest first (the union over its activities). */
      function levelsOf(c) {
        const set = new Set();
        reviewPick.activitiesFor(c).forEach((a) => reviewPick.levelsFor(a, c).forEach((l) => set.add(l)));
        return Array.from(set).sort((x, y) => x - y);
      }

      function ladder(cat) {
        const set = new Set();
        cat.conceptIds.forEach((c) => levelsOf(c).forEach((l) => set.add(l)));
        return Array.from(set).sort((x, y) => x - y);
      }

      function mastered(cat, cache, dueIds) {
        const due = dueIds || [];
        const lv = prereqEngine.levelsFor(cache || EMPTY, null, cat.conceptIds);
        return cat.conceptIds.every((c) => {
          const top = levelsOf(c);
          return top.length > 0 && reviewPick.doneLevel(snapOf(cache, c)) === top[top.length - 1] && lv[c] === 'strong' && due.indexOf(c) < 0;
        });
      }

      function conceptFor(cat, level, cache, extra) {
        const all = cat.conceptIds.concat(extra || []);
        const fits = all.filter((c) => levelsOf(c).indexOf(level) >= 0);
        return learningEngine.slotConcept(fits.length ? fits : cat.conceptIds, cache || EMPTY, { mastery: config.mastery, error: config.error });
      }

      function played(cat, cache, states) {
        return !!(states && states[cat.id] && states[cat.id].answers > 0) || cat.conceptIds.some((c) => { const s = snapOf(cache, c); return !!s && s.total > 0; });
      }

      function mixedChoice(cats, cache, states, rng, opts) {
        const o = opts || {};
        const seen = cats.filter((c) => played(c, cache, states));
        const fresh = seen.length ? cats.filter((c) => seen.indexOf(c) < 0) : [];
        if (o.includeNew && fresh.length && rng() < config.freeplay.newKindShare) return { cat: fresh[Math.floor(rng() * fresh.length)], kind: 'new' };
        let pool = seen.length ? seen : cats;
        if (pool.length > 1 && o.lastStrand) pool = pool.filter((c) => c.id !== o.lastStrand);
        return { cat: pool[Math.floor(rng() * pool.length)], kind: seen.length ? 'played' : 'all' };
      }

      const run = (id, ids) => { let n = 0; while (n < ids.length && ids[n] === id) n++; return n; };

      /** The activity for the next question: not a third in a row, not the way to avoid, the one used longest ago first. */
      function chooseActivity(acts, recent, avoidRep, rng) {
        const ids = (recent || []).map((r) => r.activityId);
        let list = acts.filter((a) => run(a.id, ids) < config.adaptive.maxSameActivityRun);
        if (!list.length) list = acts.slice();
        const other = avoidRep ? list.filter((a) => a.representation !== avoidRep) : list;
        if (other.length) list = other;
        const ago = (a) => (ids.indexOf(a.id) < 0 ? Infinity : ids.indexOf(a.id));
        const best = Math.max.apply(null, list.map(ago));
        const tied = list.filter((a) => ago(a) === best);
        return tied[Math.floor(rng() * tied.length)];
      }

      /** The newest distinct question keys of an activity, at most n. */
      function recentKeys(recent, activityId, n) {
        const out = [];
        (recent || []).forEach((r) => { if (r && r.activityId === activityId && out.length < n && out.indexOf(r.questionId) < 0) out.push(r.questionId); });
        return out;
      }

      function excludeFor(activityId, level, template, recent) {
        const pool = questionTypes.get(activityId).candidates(level, template).length;
        return recentKeys(recent, activityId, Math.max(0, Math.min(config.freeplay.noRepeat - 1, pool - 1)));
      }

      function target(cat, state, cache, rng, opts) {
        const o = opts || {};
        const k = cache || EMPTY;
        const want = Number.isInteger(o.level) ? o.level : (state && state.level);
        let extra = [];
        if (o.mixed) {
          const lv = prereqEngine.levelsFor(k, null);
          extra = cat.extraIds.filter((c) => prereqEngine.isOpen(c, lv));
        }
        const concept = o.conceptId || conceptFor(cat, want, k, extra);
        const acts = reviewPick.activitiesFor(concept).filter((a) => reviewPick.levelsFor(a, concept).length > 0);
        const exact = acts.filter((a) => reviewPick.levelsFor(a, concept).indexOf(want) >= 0);
        let left = exact.length ? exact : acts;
        while (left.length) {
          const a = chooseActivity(left, o.recent, o.avoidRep, rng);
          const level = reviewPick.clampLevel(reviewPick.levelsFor(a, concept), want);
          const template = a.templates ? (concept === 'sub.difference' ? 'diff' : 'take') : null;
          if (prereqPick.probe(a.id, level, template)) {
            return { category: cat.id, strand: cat.id, conceptId: concept, activityId: a.id, difficulty: level, template: template,
              representation: a.representation, decisionSource: 'default', mixed: false, leadConcepts: [concept], slotConceptId: concept,
              exclude: excludeFor(a.id, level, template, o.recent),
              decision: { action: 'freeplay', source: 'freeplay', reasonCode: o.reasonCode || 'freeplay_pick', strand: cat.id, conceptId: concept,
                activityId: a.id, representation: a.representation, template: template, fromDifficulty: want, toDifficulty: level, guided: !!o.guided } };
          }
          left = left.filter((x) => x !== a);
        }
        return null;
      }

      return { categories, missingLabels, offered, isPlayable, ladder, levelsOf, mastered, conceptFor, mixedChoice, chooseActivity, recentKeys, excludeFor, target };
    });
}());
