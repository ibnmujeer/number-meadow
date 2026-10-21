/*
 * usageMath (L2): minutes of play from session records (FP-1/FP-2, plan DD10). Pure: every time is passed in;
 * dates are local calendar dates built from a given time, never from the clock.
 *   dayKey(ms)                     the local 'YYYY-MM-DD' of a time
 *   dayBounds(key)                 { start, end }: local midnight to the next local midnight (ms)
 *   daysBack(key, n)               the n day keys ending with key, oldest first
 *   addDays(key, n)                the day key n calendar days after key (n may be negative or 0)
 *   dayDiff(keyA, keyB)            whole calendar days from keyA to keyB (negative when keyB is earlier); DST never gives 23 or 25 hour days
 *   sessionSpan(session, opts)     { start, end } of one session: end = endedAt, else `now` for the open session
 *                                  (opts.openId), else opts.lastAttemptAt (its newest attempt), else startedAt;
 *                                  never longer than opts.capMs
 *   minutesIn(sessions, start, end, opts)  whole minutes (rounded down) of the spans that fall in [start, end);
 *                                  opts = { openId, now, capMs, lastAttemptAt: { sessionId: ms } }
 */
(function () {
  'use strict';

  NBA.define('usageMath', ['config'], (config) => {
    const MIN = 60000;
    const pad = (n) => (n < 10 ? '0' : '') + n;
    const num = (x) => typeof x === 'number' && Number.isFinite(x);

    function dayKey(ms) {
      const d = new Date(ms);
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    }

    function parts(key) {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key));
      if (!m) throw new Error('[NBA] bad day key: ' + key);
      return [Number(m[1]), Number(m[2]), Number(m[3])];
    }

    function dayBounds(key) {
      const p = parts(key);
      return { start: new Date(p[0], p[1] - 1, p[2]).getTime(), end: new Date(p[0], p[1] - 1, p[2] + 1).getTime() };
    }

    function daysBack(key, n) {
      const p = parts(key);
      const out = [];
      for (let i = Math.max(1, n) - 1; i >= 0; i--) out.push(dayKey(new Date(p[0], p[1] - 1, p[2] - i, 12).getTime()));
      return out;
    }

    function addDays(key, n) {
      const p = parts(key);
      return dayKey(new Date(p[0], p[1] - 1, p[2] + Math.trunc(Number(n) || 0), 12).getTime());
    }

    function dayDiff(a, b) {
      const pa = parts(a), pb = parts(b);
      return Math.round((Date.UTC(pb[0], pb[1] - 1, pb[2]) - Date.UTC(pa[0], pa[1] - 1, pa[2])) / 86400000);
    }

    function sessionSpan(session, opts) {
      const o = opts || {};
      const s = session || {};
      const start = num(s.startedAt) ? s.startedAt : 0;
      let end;
      if (num(s.endedAt)) end = s.endedAt;
      else if (o.openId && s.id === o.openId && num(o.now)) end = o.now;
      else if (num(o.lastAttemptAt)) end = o.lastAttemptAt;
      else end = start;
      const cap = num(o.capMs) ? o.capMs : config.adults.sessionCapMin * MIN;
      return { start: start, end: Math.max(start, Math.min(end, start + cap)) };
    }

    function minutesIn(sessions, rangeStart, rangeEnd, opts) {
      const o = opts || {};
      const last = o.lastAttemptAt || {};
      let ms = 0;
      (Array.isArray(sessions) ? sessions : []).forEach((s) => {
        if (!s) return;
        const span = sessionSpan(s, { openId: o.openId, now: o.now, capMs: o.capMs, lastAttemptAt: last[s.id] });
        const a = Math.max(span.start, rangeStart), b = Math.min(span.end, rangeEnd);
        if (b > a) ms += b - a;
      });
      return Math.floor(ms / MIN);
    }

    return { dayKey, dayBounds, daysBack, addDays, dayDiff, sessionSpan, minutesIn, MINUTE_MS: MIN };
  });
}());
