/*
 * offlineModel: the PURE decisions of the offline copy (Step 12, H5b-2). No browser API is used here, so unit tests cover it
 * and the worker file (sw.js) loads this same file.
 *
 * What it decides. Each app version has its own cache (nba-<version>-<hash8>). One small marker per scope, kept in Cache
 * Storage (never in the database), says which cache is PINNED (the one that serves the pages), which was PREVIOUS, which update
 * an adult APPROVED, which copy was installed LATEST (clean-up must not delete it) and whether the last switch is FRESH:
 *   { pinned, previous, approved, latest, fresh }  (cache names or null; fresh true or false)
 *   afterInstall(marker, mine, existing)           the first copy ever pins itself; a later copy waits and changes nothing
 *   afterApprove(marker, mine, mineReady)          an adult approved: remember the approved cache (nothing is switched yet)
 *   settle(input)                                  at a full launch (a launch with no other window open): switch to the approved
 *                                                  cache if it is complete, fall back if the pinned one is damaged, drop the
 *                                                  previous cache one launch after a switch. NEVER switches while another window is open.
 *   keepSet(markers, mine, abandon) / deletions(...)  which caches clean-up must keep (every scope's pinned, previous, approved and
 *                                                  latest, and the running worker's own unless it just failed its self-check); the rest may go.
 *   readiness(listed, haveKeys)                    is every listed file in the cache
 *   answerFields / safeAnswer                      the only fields a reply to the page may hold (names, numbers, yes or no)
 *   answerOrBackup(first, backup, ms, timers)      a page never waits on a stuck worker: after ms the backup (the file from its own host) may answer
 * Cache names that are not version caches (the marker's own cache) are never returned for deletion.
 */
(function (root) {
  'use strict';

  const META_CACHE = 'nba-meta';
  const NAME_RE = /^nba-[0-9A-Za-z._]+(-[0-9A-Za-z._]+)*-[0-9a-f]{8}$/;
  const ANSWER_FIELDS = ['type', 'ok', 'reason', 'mine', 'pinned', 'approved', 'previous', 'ready', 'mineReady', 'missing', 'total', 'update', 'isApproved'];

  const isVersionCache = (name) => typeof name === 'string' && name !== META_CACHE && NAME_RE.test(name);
  const emptyMarker = () => ({ pinned: null, previous: null, approved: null, latest: null, fresh: false });
  const name = (v) => (isVersionCache(v) ? v : null);

  /** A marker from stored text; anything damaged gives the empty marker (the app then pins the copy that is running). */
  function parseMarker(text) {
    let raw = null;
    try { raw = JSON.parse(String(text)); } catch (e) { raw = null; }
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return emptyMarker();
    return { pinned: name(raw.pinned), previous: name(raw.previous), approved: name(raw.approved), latest: name(raw.latest), fresh: raw.fresh === true };
  }
  const writeMarker = (m) => JSON.stringify({ pinned: name(m && m.pinned), previous: name(m && m.previous), approved: name(m && m.approved), latest: name(m && m.latest), fresh: !!(m && m.fresh) });
  const copy = (m) => Object.assign(emptyMarker(), m || {});

  /** Which listed files are missing from the cache keys (paths). */
  function readiness(listed, haveKeys) {
    const have = new Set(haveKeys || []);
    const missing = (listed || []).filter((p) => !have.has(p));
    return { ready: Array.isArray(listed) && listed.length > 0 && missing.length === 0, missing: missing.length, total: (listed || []).length };
  }

  /** After this worker filled its own cache: the very first copy (or one whose pinned cache is gone) pins itself. */
  function afterInstall(marker, mine, existing) {
    const m = copy(marker), have = new Set(existing || []);
    if (!isVersionCache(mine)) return m;
    m.latest = mine;
    if (!m.pinned || !have.has(m.pinned)) return Object.assign(m, { pinned: mine, previous: null, approved: null, fresh: false });
    return m;
  }

  /** A worker starts filling its cache: clean-up by another worker must not delete it meanwhile (it is the latest copy). */
  function noteInstalling(marker, mine) {
    const m = copy(marker);
    if (isVersionCache(mine)) m.latest = mine;
    return m;
  }

  /** An adult confirmed on the Grown-ups page. Only a complete cache that is not already pinned can be approved. */
  function afterApprove(marker, mine, mineReady) {
    const m = copy(marker);
    if (!isVersionCache(mine)) return { marker: m, ok: false, reason: 'no_cache' };
    if (!m.pinned) return { marker: m, ok: false, reason: 'nothing_pinned' };
    if (m.pinned === mine) return { marker: m, ok: false, reason: 'already_current' };
    if (!mineReady) return { marker: m, ok: false, reason: 'not_complete' };
    m.approved = mine;
    return { marker: m, ok: true, reason: 'approved' };
  }

  /**
   * One decision at a launch. input = { marker, mine, mineReady, pinnedReady, previousReady, others, existing (cache names),
   * source: 'activate' | 'navigate' }. Returns { marker, action, note }. Actions: none, pin-first, switch, cancel, fallback,
   * ack, drop-previous. Nothing is switched while another window is open (others > 0): a version never changes inside a session.
   */
  function settle(input) {
    const x = input || {}, m = copy(x.marker), have = new Set(x.existing || []);
    const mine = x.mine, others = Number(x.others) || 0;
    const out = (action, note, abandon) => ({ marker: m, action: action, note: note || '', abandon: abandon || [] });
    if (!m.pinned || !have.has(m.pinned)) {
      if (m.previous && have.has(m.previous) && x.previousReady) {
        const lost = m.pinned;
        Object.assign(m, { pinned: m.previous, previous: null, approved: null, latest: m.latest === lost ? null : m.latest, fresh: false });
        return out('fallback', 'the pinned cache is gone; the previous one serves', lost ? [lost] : []);
      }
      if (isVersionCache(mine) && have.has(mine) && x.mineReady) {
        Object.assign(m, { pinned: mine, previous: null, approved: null, fresh: false });
        return out('pin-first', 'no usable pinned cache; this copy pins itself');
      }
      return out('none', 'no usable cache');
    }
    if (others > 0) return out('none', 'another window is open: nothing changes in a session');
    if (m.approved && m.approved === mine && mine !== m.pinned) {
      if (x.mineReady) {
        // Switched at activation: the launch's own page load follows and confirms it (ack). Switched by that page load: it is the launch.
        Object.assign(m, { previous: m.pinned, pinned: mine, approved: null, fresh: x.source === 'activate' });
        return out('switch', 'the approved update is complete: it serves from now on');
      }
      m.approved = null;
      if (m.latest === mine) m.latest = null; // the broken copy is no longer protected from clean-up
      return out('cancel', 'the approved update failed its self-check; the current copy keeps serving', [mine]);
    }
    if (!x.pinnedReady) {
      if (m.previous && have.has(m.previous) && x.previousReady) {
        const bad = m.pinned;
        Object.assign(m, { pinned: m.previous, previous: null, approved: null, latest: m.latest === bad ? null : m.latest, fresh: false });
        return out('fallback', 'the pinned cache failed its self-check; the previous copy serves', [bad]);
      }
      return out('none', 'the pinned cache is not complete and nothing better exists');
    }
    if (m.fresh) { m.fresh = false; return out('ack', 'the launch that started on the new copy worked'); }
    if (m.previous) { m.previous = null; return out('drop-previous', 'a second launch worked on the new copy'); }
    return out('none');
  }

  /** The version caches that must stay: every scope's pinned, previous and approved, and the running worker's own. */
  function keepSet(markers, mine, abandon) {
    const keep = new Set();
    (markers || []).forEach((m) => [m && m.pinned, m && m.previous, m && m.approved, m && m.latest].forEach((n) => { if (isVersionCache(n)) keep.add(n); }));
    if (isVersionCache(mine) && (abandon || []).indexOf(mine) < 0) keep.add(mine); // a copy that failed its own self-check is not kept for itself
    return keep;
  }

  /** Cache names to delete: version caches that are not in the keep set. Never the marker cache, never a foreign cache. */
  function deletions(allNames, markers, mine, abandon) {
    const keep = keepSet(markers, mine, abandon);
    return (allNames || []).filter((n) => isVersionCache(n) && !keep.has(n));
  }

  /** A reply for the page holds only the allowed fields, and only names, numbers, yes or no and short reason words. */
  function safeAnswer(obj) {
    const out = {};
    ANSWER_FIELDS.forEach((k) => {
      const v = obj ? obj[k] : undefined;
      if (v === undefined) return;
      if (v === null || typeof v === 'boolean' || (typeof v === 'number' && isFinite(v))) out[k] = v;
      else if (typeof v === 'string' && v.length <= 80 && /^[A-Za-z0-9._-]*$/.test(v)) out[k] = v;
    });
    return out;
  }

  /**
   * A page must never wait on a stuck worker. Waits for first (a promise of the answer from the cache). If it has not settled after
   * ms, backup() is tried once; a usable answer from backup wins, a missing one (null, false) or a failure (a throw, no network) means
   * "keep waiting for first". When first settles in time, backup is never called. timers = { set, clear } lets a test use a fake clock.
   */
  function answerOrBackup(first, backup, ms, timers) {
    const t = timers || { set: (fn, n) => setTimeout(fn, n), clear: (h) => clearTimeout(h) };
    return new Promise((resolve, reject) => {
      let done = false, handle = null;
      const finish = (fn, v) => { if (done) return; done = true; t.clear(handle); fn(v); };
      handle = t.set(() => {
        if (done) return;
        Promise.resolve().then(backup).then((r) => { if (r) finish(resolve, r); }, () => undefined);
      }, ms);
      Promise.resolve(first).then((r) => finish(resolve, r), (e) => finish(reject, e));
    });
  }

  const api = { META_CACHE, ANSWER_FIELDS, isVersionCache, emptyMarker, parseMarker, writeMarker, readiness, afterInstall, afterApprove,
    noteInstalling, settle, keepSet, deletions, safeAnswer, answerOrBackup };

  if (typeof NBA !== 'undefined' && NBA && typeof NBA.define === 'function') NBA.define('offlineModel', [], () => api);
  else root.NbaOfflineModel = api;
}(typeof self !== 'undefined' ? self : this));
