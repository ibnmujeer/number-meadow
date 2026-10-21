/*
 * reviewEngine (L2): the spaced-review schedule as pure functions (step 5). No DOM, no clock, no randomness:
 * the caller passes `now` (ms) and, for the backwards-clock guard, the newest schedule update (`floorMs`).
 * Days are local calendar days ('YYYY-MM-DD', usageMath.dayKey); a due day is compared as a string.
 * The intervals (1, 3, 7, 14, 30, 60 days) and the 30 percent cap are design hypotheses (config.review).
 *
 * One item per skill (concept): { studentId, conceptId, step (0..5), dueDay, reviews, firstTries, lapses,
 * createdDay, updatedAt }. step indexes config.review.intervals; the item is due again `intervals[step]` days
 * after the review that set it.
 *   INTERVALS, MAX_STEP             the intervals in days and the highest step index
 *   reviewable(conceptId)           a known skill that can be asked (not config.review.excluded)
 *   today(now, floorMs)             the local day key of max(now, floorMs): a clock that jumped back never makes
 *                                   an item look earlier; a jump forward can not be detected
 *   floorOf(items)                  the newest updatedAt of a list of items (0 for none)
 *   enter(studentId, conceptId, now, floorMs)  a new item at step 0, first review the next calendar day
 *   isSuccess(attempt) / wasAnswered(attempt)  first-try correct / at least one submitted answer
 *   update(item, attempt, now, floorMs)  null when the child gave no answer (nothing changes); otherwise a new
 *                                   item: a right answer on the first try moves one step later (at most step 5),
 *                                   any other answer one step earlier (at least step 0, the 1-day interval). No reset.
 *   isDue / overdueDays             dueDay <= today / whole days past the due day (0 when not due)
 *   order(items, today)             most overdue first, then lower step, then the curriculum concept order, then
 *                                   concept id (a total order, so equal input gives equal output)
 *   dueItems(items, now, filter)    the due items in that order; filter = { conceptIds } limits to those skills
 *                                   (the floor always uses every item, filtered or not)
 *   maxReviews(slots)               floor(share x slots): 2 of 8
 *   choose(due, max)                the first `max` of an ordered list, preferring different operations
 *   slotIndexes(count)              the 0-based run slots for `count` review questions (never the first or last)
 *   summary(items, now)             { scheduled, due, nextDueDay }: nextDueDay is the earliest due day, today at the earliest
 * Inputs are never changed; results are new objects.
 */
(function () {
  'use strict';

  NBA.define('reviewEngine', ['config', 'catalog', 'usageMath'], (config, catalog, usageMath) => {
    const R = config.review;
    const INTERVALS = R.intervals.slice();
    const MAX_STEP = INTERVALS.length - 1;
    const ORDER = catalog.CURRICULUM.conceptOrder;
    const num = (x) => typeof x === 'number' && Number.isFinite(x);
    const clampStep = (s) => Math.max(0, Math.min(MAX_STEP, Math.trunc(Number(s) || 0)));
    const cmp = (a, b) => (a < b ? -1 : (a > b ? 1 : 0));
    const orderIndex = (id) => { const i = ORDER.indexOf(id); return i < 0 ? ORDER.length : i; };

    function reviewable(conceptId) {
      return !!catalog.conceptById(conceptId) && R.excluded.indexOf(conceptId) < 0;
    }

    function today(now, floorMs) {
      return usageMath.dayKey(Math.max(now, num(floorMs) ? floorMs : 0));
    }

    function floorOf(items) {
      let m = 0;
      (Array.isArray(items) ? items : []).forEach((it) => { if (it && num(it.updatedAt) && it.updatedAt > m) m = it.updatedAt; });
      return m;
    }

    function enter(studentId, conceptId, now, floorMs) {
      const day = today(now, floorMs);
      return {
        studentId: studentId, conceptId: conceptId, step: 0, dueDay: usageMath.addDays(day, INTERVALS[0]),
        reviews: 0, firstTries: 0, lapses: 0, createdDay: day, updatedAt: Math.max(now, num(floorMs) ? floorMs : 0)
      };
    }

    const wasAnswered = (a) => !!a && Array.isArray(a.submittedAnswers) && a.submittedAnswers.length > 0;
    const isSuccess = (a) => wasAnswered(a) && a.outcome === 'correct' && a.firstAttemptCorrect === true;

    function update(item, attempt, now, floorMs) {
      if (!item || !wasAnswered(attempt)) return null;
      const up = isSuccess(attempt);
      const step = clampStep(item.step + (up ? 1 : -1));
      const floor = Math.max(num(floorMs) ? floorMs : 0, num(item.updatedAt) ? item.updatedAt : 0);
      return Object.assign({}, item, {
        step: step,
        dueDay: usageMath.addDays(today(now, floor), INTERVALS[step]),
        reviews: item.reviews + 1,
        firstTries: item.firstTries + (up ? 1 : 0),
        lapses: item.lapses + (up ? 0 : 1),
        updatedAt: Math.max(now, floor)
      });
    }

    const isDue = (item, now, floorMs) => item.dueDay <= today(now, floorMs);
    const overdueDays = (item, todayKey) => Math.max(0, usageMath.dayDiff(item.dueDay, todayKey));

    function order(items, todayKey) {
      return (Array.isArray(items) ? items : []).slice().sort((a, b) =>
        (overdueDays(b, todayKey) - overdueDays(a, todayKey)) || (a.step - b.step) ||
        (orderIndex(a.conceptId) - orderIndex(b.conceptId)) || cmp(a.conceptId, b.conceptId));
    }

    function dueItems(items, now, filter) {
      const all = Array.isArray(items) ? items : [];
      const day = today(now, floorOf(all));
      const ids = filter && Array.isArray(filter.conceptIds) ? filter.conceptIds : null;
      return order(all.filter((it) => it.dueDay <= day && reviewable(it.conceptId) && (!ids || ids.indexOf(it.conceptId) >= 0)), day);
    }

    const maxReviews = (slots) => Math.max(0, Math.floor(R.share * slots + 1e-9));

    function operationOf(conceptId) {
      const c = catalog.conceptById(conceptId);
      return c ? c.operation : '';
    }

    function choose(due, max) {
      const rest = (Array.isArray(due) ? due : []).slice();
      const out = [];
      const ops = [];
      while (out.length < max && rest.length) {
        let k = rest.findIndex((it) => ops.indexOf(operationOf(it.conceptId)) < 0);
        if (k < 0) k = 0;
        const it = rest.splice(k, 1)[0];
        out.push(it);
        ops.push(operationOf(it.conceptId));
      }
      return out;
    }

    function slotIndexes(count) {
      const plan = R.plan[Math.max(0, Math.min(R.plan.length - 1, count))] || [];
      return plan.map((p) => p - 1);
    }

    function summary(items, now) {
      const all = (Array.isArray(items) ? items : []).filter((it) => reviewable(it.conceptId));
      const day = today(now, floorOf(items));
      let next = null;
      let due = 0;
      all.forEach((it) => {
        if (it.dueDay <= day) due++;
        const d = it.dueDay < day ? day : it.dueDay;
        if (next === null || d < next) next = d;
      });
      return { scheduled: all.length, due: due, nextDueDay: next };
    }

    return {
      INTERVALS, MAX_STEP, reviewable, today, floorOf, enter, isSuccess, wasAnswered, update, isDue, overdueDays,
      order, dueItems, maxReviews, choose, slotIndexes, summary
    };
  });
}());
