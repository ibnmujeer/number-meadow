/*
 * activeTime (L2): active play time derived from stored attempts (Free Play F1, investigation section 4.2). Pure: every time is
 * passed in; there is no clock, no randomness and no DOM. No time is stored; the same attempts always give the same answer.
 *
 *   spans(attempts, opts?)       [{ attempt, ms, lead, think, period }] in time order. For each attempt:
 *                                think = min(timestamp - shownAt, touchMs x max(1, answers submitted));
 *                                lead  = the time from the previous touch to the question being shown: from the previous attempt of
 *                                the same session, or from session.startedAt for the first attempt of a session (opts.sessions =
 *                                { sessionId: { startedAt } }); a gap up to touchMs counts whole, a gap of touchMs to periodGapMs
 *                                counts only touchMs, a longer gap counts nothing and starts a new period (period = its index)
 *   activeMs(attempts, opts?)    the sum of ms; opts.day ('YYYY-MM-DD') keeps the attempts whose timestamp falls on that local day
 *   periods(attempts, opts?)     [{ index, start, end, ms, count }]: the continuous periods of play
 *   lastPeriodMs(attempts, opts?) active ms of the newest period (0 when there is none)
 *   floorOf(times)               the newest finite time of a list, or null
 *   dayWithFloor(now, floor)     the local day key of max(now, floor): a clock that jumps backwards does not open an earlier day
 * opts = { sessions, day, time: { touchMs, periodGapMs } } (defaults: config.freeplay.time). Under-count: the time between the last
 * answer and the child leaving, and a question shown but never answered. Both are design hypotheses.
 */
(function () {
  'use strict';

  NBA.define('activeTime', ['config', 'usageMath'], (config, usageMath) => {
    const fin = (x) => typeof x === 'number' && Number.isFinite(x);
    const lim = (o) => Object.assign({}, config.freeplay.time, (o && o.time) || {});
    const idOf = (a) => (typeof a.id === 'string' ? a.id : '');

    /** Attempts with a usable timestamp, oldest first (timestamp, then id). The input list is not changed. */
    function ordered(attempts) {
      return (Array.isArray(attempts) ? attempts : []).filter((a) => a && typeof a === 'object' && fin(a.timestamp))
        .sort((x, y) => (x.timestamp - y.timestamp) || (idOf(x) < idOf(y) ? -1 : (idOf(x) > idOf(y) ? 1 : 0)));
    }

    function spans(attempts, opts) {
      const t = lim(opts);
      const sessions = (opts && opts.sessions) || {};
      const out = [];
      let prev = null, period = -1;
      ordered(attempts).forEach((a) => {
        const shown = fin(a.shownAt) ? Math.min(a.shownAt, a.timestamp) : a.timestamp;
        const answers = Array.isArray(a.submittedAnswers) ? a.submittedAnswers.length : 1;
        const think = Math.max(0, Math.min(a.timestamp - shown, t.touchMs * Math.max(1, answers)));
        const ses = sessions[a.sessionId];
        let from = null;
        if (prev && prev.sessionId === a.sessionId) from = prev.timestamp;
        else if (ses && fin(ses.startedAt)) from = ses.startedAt;
        const gap = from === null ? null : Math.max(0, shown - from);
        const lead = gap === null || gap > t.periodGapMs ? 0 : Math.min(gap, t.touchMs);
        const sincePrev = prev ? shown - prev.timestamp : null;
        if (period < 0 || sincePrev === null || sincePrev > t.periodGapMs || gap === null || gap > t.periodGapMs) period += 1;
        out.push({ attempt: a, ms: lead + think, lead: lead, think: think, period: period });
        prev = a;
      });
      return out;
    }

    function activeMs(attempts, opts) {
      const day = opts && opts.day;
      return spans(attempts, opts).filter((s) => !day || usageMath.dayKey(s.attempt.timestamp) === day)
        .reduce((n, s) => n + s.ms, 0);
    }

    function periods(attempts, opts) {
      const out = [];
      spans(attempts, opts).forEach((s) => {
        const a = s.attempt;
        const shown = fin(a.shownAt) ? Math.min(a.shownAt, a.timestamp) : a.timestamp;
        if (!out[s.period]) out[s.period] = { index: s.period, start: shown - s.lead, end: a.timestamp, ms: 0, count: 0 };
        const p = out[s.period];
        p.end = Math.max(p.end, a.timestamp);
        p.ms += s.ms;
        p.count += 1;
      });
      return out;
    }

    function lastPeriodMs(attempts, opts) {
      const p = periods(attempts, opts);
      return p.length ? p[p.length - 1].ms : 0;
    }

    function floorOf(times) {
      const list = (Array.isArray(times) ? times : []).filter(fin);
      return list.length ? Math.max.apply(null, list) : null;
    }

    function dayWithFloor(now, floor) {
      return usageMath.dayKey(fin(floor) && fin(now) && floor > now ? floor : now);
    }

    return { spans, activeMs, periods, lastPeriodMs, floorOf, dayWithFloor };
  });
}());
