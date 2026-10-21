/*
 * usage (L4): minutes played per child (FP-1/FP-2). minutesOnDay is the ONE function every caller uses for
 * "minutes played today" (the rest card, the child page): a later stage can swap in an active-time tracker here
 * without touching its callers. Today it counts from session start and end times (usageMath.sessionSpan):
 * the open session runs to `now`, a session left open by a closed tab ends at its newest attempt.
 *   minutesOnDay(childId, dayKey, now)      whole minutes on that local day
 *   minutesInLastDays(childId, n, now)      the last n local days, today included (7 and 30 on the child page)
 *   totals(childId, now)                    every minute of the child
 * create({ repo, learning, now? }) makes an independent service (tests); the module itself is the app's.
 */
(function () {
  'use strict';

  NBA.define('usage', ['config', 'util', 'repo', 'learning', 'usageMath'], (config, util, appRepo, appLearning, usageMath) => {
    function create(options) {
      const o = options || {};
      const repo = o.repo || appRepo;
      const learning = o.learning || appLearning;
      const clock = typeof o.now === 'function' ? o.now : () => util.now();
      const capMs = config.adults.sessionCapMin * usageMath.MINUTE_MS;

      /** Minutes of this child's sessions inside [start, end). Reads only this child's records. */
      async function minutesBetween(childId, start, end, now) {
        const t = typeof now === 'number' ? now : clock();
        let sessions = (await repo.getAll('sessions', { index: 'studentId', value: childId })) || [];
        const open = learning.currentSession();
        const openId = open && open.studentId === childId ? open.id : null;
        if (openId) sessions = sessions.filter((s) => s.id !== openId).concat([open]);
        const lastAttemptAt = {};
        for (const s of sessions) {
          if (typeof s.endedAt === 'number' || s.id === openId) continue;
          if (!(s.startedAt < end && s.startedAt + capMs > start)) continue;
          const atts = (await repo.getAll('attempts', { index: 'sessionId', value: s.id })) || [];
          atts.forEach((a) => { if (typeof a.timestamp === 'number') lastAttemptAt[s.id] = Math.max(lastAttemptAt[s.id] || 0, a.timestamp); });
        }
        return usageMath.minutesIn(sessions, start, end, { openId: openId, now: t, capMs: capMs, lastAttemptAt: lastAttemptAt });
      }

      function minutesOnDay(childId, dayKey, now) {
        const b = usageMath.dayBounds(dayKey);
        return minutesBetween(childId, b.start, b.end, now);
      }

      function minutesInLastDays(childId, n, now) {
        const t = typeof now === 'number' ? now : clock();
        const days = usageMath.daysBack(usageMath.dayKey(t), n);
        return minutesBetween(childId, usageMath.dayBounds(days[0]).start, usageMath.dayBounds(days[days.length - 1]).end, t);
      }

      function totals(childId, now) { return minutesBetween(childId, -Infinity, Infinity, now); }

      return { minutesOnDay, minutesInLastDays, totals };
    }

    const app = create();
    return Object.assign({ create }, app);
  });
}());
