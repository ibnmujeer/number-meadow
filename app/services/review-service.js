/*
 * review (L4): the spaced-review schedule of the loaded child (step 5). It keeps the child's schedule items in memory,
 * seeds them when the child loads, updates them with each answer, and decides which run slots ask a review question.
 * It writes nothing itself: it hands records to the learning service, which writes them in the same batch as the answer
 * (a schedule update never lands without its answer, and an answer never without its update).
 *
 *   learning hook   learning.setReviewHook({ load, attempt, reset }) is called by create():
 *     load(studentId, levels)   reads the child's items, then returns the items to write for every skill that is already
 *                               strong and has none (a child from before this update; step 0, first review the next day).
 *                               Idempotent. A failed read leaves no items, seeds nothing and the app still plays.
 *     attempt(rec, levels)      after the mastery update of one answer: a review answer moves only the item it asked
 *                               (reviewEngine.update); every credited skill that is now strong and has no item enters.
 *                               The in-memory items change at once. Returns the records to write. A skill that later falls
 *                               below strong keeps its item.
 *   pickFor(run, i)             a target for slot i of a world run (index from 0), or null. At the first call of a run it picks
 *                               the due items (most overdue first, up to config.review share of the base slots, two
 *                               operations preferred) and plans their slots; review goes in positions 2 to 6 only. An item is
 *                               asked at most once per run; a planned slot taken by another question moves it to a later
 *                               allowed slot, else it stays due for the next run.
 *   items(), dueItems(filter?), summary()   copies for tests, Free Play (filter { conceptIds }) and the adult side
 * create({ repo?, learning?, now? }) makes an independent service (tests); the module itself is the app's.
 */
(function () {
  'use strict';

  NBA.define('review', ['config', 'util', 'repo', 'learning', 'reviewEngine', 'reviewPick'],
    (config, util, appRepo, appLearning, reviewEngine, reviewPick) => {
    const R = config.review;
    const copy = (x) => (x === null || x === undefined ? null : JSON.parse(JSON.stringify(x)));

    function create(options) {
      const o = options || {};
      const repo = o.repo || appRepo;
      const learning = o.learning || appLearning;
      const now = typeof o.now === 'function' ? o.now : () => util.now();
      let studentId = null;
      let cache = {};       // conceptId -> item, for the loaded child
      let readOk = false;   // false until the child's items were read; false again after a failed read

      const list = () => Object.keys(cache).sort().map((c) => cache[c]);
      const floor = () => reviewEngine.floorOf(list());

      /** Items for the strong skills that have none, put in the cache at once; returns the new records. */
      function enterStrong(ids, levels, t) {
        const out = [];
        ids.forEach((c) => {
          if (levels[c] !== 'strong' || cache[c] || !reviewEngine.reviewable(c)) return;
          cache[c] = reviewEngine.enter(studentId, c, t, floor());
          out.push(cache[c]);
        });
        return out;
      }

      async function load(id, levels) {
        studentId = id;
        cache = {};
        readOk = false;
        let rows = null;
        try { rows = (await repo.getAll('schedule', { index: 'studentId', value: id })) || []; } catch (e) { rows = null; }
        if (studentId !== id || rows === null) return [];
        rows.forEach((r) => { cache[r.conceptId] = r; });
        readOk = true;
        return enterStrong(Object.keys(levels || {}).sort(), levels || {}, now());
      }

      function attempt(rec, levels) {
        if (!readOk || rec.studentId !== studentId) return [];
        const out = [];
        const asked = rec.decisionSource === 'review' && rec.decision ? rec.decision.conceptId : null;
        if (asked && cache[asked]) {
          const next = reviewEngine.update(cache[asked], rec, rec.timestamp, floor());
          if (next) { cache[asked] = next; out.push(next); }
        }
        return out.concat(enterStrong(Array.isArray(rec.conceptIds) ? rec.conceptIds : [], levels || {}, rec.timestamp));
      }

      function dueItems(filter) { return reviewEngine.dueItems(readOk ? list() : [], now(), filter); }

      /** Choose this run's review items (each must build a question) and plan their slots. */
      function plan(run) {
        const day = reviewEngine.today(now(), floor());
        const usable = dueItems().filter((it) => reviewPick.buildTarget(it, learning.snapshot(it.conceptId)));
        const items = reviewEngine.choose(usable, reviewEngine.maxReviews(R.baseSlots));
        return { items: items.map((it) => it.conceptId), idx: reviewEngine.slotIndexes(items.length), served: 0, day: day };
      }

      function pickFor(run, i) {
        if (!readOk || !studentId || !run || i < R.firstPosition - 1 || i > R.lastPosition - 1) return null;
        if (!run.review) run.review = plan(run);
        const rv = run.review;
        if (rv.served >= rv.items.length || i < rv.idx[rv.served]) return null;
        const item = cache[rv.items[rv.served]];
        rv.served++;
        if (!item) return null;
        const late = reviewEngine.overdueDays(item, rv.day);
        return reviewPick.buildTarget(item, learning.snapshot(item.conceptId), { overdueDays: late });
      }

      function reset() { studentId = null; cache = {}; readOk = false; }

      if (learning && typeof learning.setReviewHook === 'function') learning.setReviewHook({ load, attempt, reset });

      return {
        pickFor, load, attempt, reset,
        items: () => copy(list()),
        item: (c) => copy(cache[c] || null),
        dueItems: (filter) => copy(dueItems(filter)),
        summary: () => reviewEngine.summary(readOk ? list() : [], now()),
        ready: () => readOk
      };
    }

    const app = create();
    return Object.assign({ create }, app);
  });
}());
