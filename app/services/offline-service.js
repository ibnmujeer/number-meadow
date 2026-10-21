/*
 * offline (L4): the page side of the offline copy (Step 12, H5b-2). The ONLY app module that names the service worker.
 *   register()      once the page has loaded and only from a web address in a secure context that has a service worker: register 'sw.js'
 *                   (a relative address). From a file, or in an unsupported browser, nothing happens and the app works as before.
 *                   A page opened with ?test does not register unless it also has &sw=1 (so the 25 older suites keep their own pace).
 *   status()        asks the worker by message (no network request is made) and returns { kind, missing, total, update }:
 *                   kind 'ready' | 'notReady' | 'none' (not installed yet) | 'file' | 'unsupported';
 *                   update null or { approved, via: 'waiting' | 'active' } when a complete newer copy is waiting.
 *   approve(via)    an adult confirmed: tell the worker, which remembers it. Nothing changes until the app is closed and opened again.
 *   persistence()   ADULT AREA ONLY. Once per page session: ask whether the browser will keep this site's data
 *                   (navigator.storage.persisted(), then persist() when not yet granted). Returns { state: 'granted' | 'denied' | 'unknown' }.
 *                   Never called at boot or from a child screen (static_checks.py check 19).
 *   offlineLine(status), persistLine(result), updateLine(status)   the plain words shown on the Grown-ups page (pure).
 * Nothing here reads or writes the database or settings. Messages carry no child data (names and numbers only).
 */
(function () {
  'use strict';

  NBA.define('offline', ['offlineModel'], (model) => {
    const ASK_MS = 2500;
    const search = window.location.search || '';
    const TEST_OFF = /[?&]test(=|&|$)/.test(search) && !/[?&]sw=1(&|$)/.test(search);
    let registration = null, persistAnswer = null;

    /** 'file' (opened from a file: already offline), 'unsupported' (no secure web address or no worker support), or 'ok'. */
    function kind() {
      const proto = window.location.protocol;
      if (proto === 'file:') return 'file';
      if ((proto !== 'http:' && proto !== 'https:') || !window.isSecureContext || !('serviceWorker' in navigator)) return 'unsupported';
      return 'ok';
    }

    function register() {
      if (kind() !== 'ok' || TEST_OFF) return Promise.resolve(null);
      const go = () => navigator.serviceWorker.register('sw.js').then((r) => { registration = r; return r; }, () => null);
      return new Promise((resolve) => {
        if (document.readyState === 'complete') resolve(go());
        else window.addEventListener('load', () => resolve(go()), { once: true });
      });
    }

    /** One question to one worker on a private message port; null when it does not answer in time. */
    function ask(worker, type) {
      return new Promise((resolve) => {
        if (!worker) { resolve(null); return; }
        const channel = new MessageChannel();
        const timer = setTimeout(() => resolve(null), ASK_MS);
        channel.port1.onmessage = (e) => { clearTimeout(timer); resolve(e.data || null); };
        try { worker.postMessage({ type: type }, [channel.port2]); } catch (e) { clearTimeout(timer); resolve(null); }
      });
    }

    async function current() {
      if (registration) return registration;
      try { registration = (await navigator.serviceWorker.getRegistration()) || null; } catch (e) { registration = null; }
      return registration;
    }

    async function status() {
      const k = kind();
      if (k !== 'ok') return { kind: k, missing: 0, total: 0, update: null };
      const reg = await current();
      if (!reg || !(reg.active || reg.waiting)) return { kind: 'none', missing: 0, total: 0, update: null };
      const active = (await ask(reg.active, 'status')) || {};
      const waiting = reg.waiting ? await ask(reg.waiting, 'status') : null;
      const newer = waiting && waiting.update ? { via: 'waiting', a: waiting } : (active.update ? { via: 'active', a: active } : null);
      return { kind: active.ready ? 'ready' : 'notReady', missing: Number(active.missing) || 0, total: Number(active.total) || 0,
        update: newer ? { via: newer.via, approved: !!newer.a.isApproved } : null };
    }

    async function approve(via) {
      const reg = await current();
      if (!reg) return false;
      const answer = await ask(via === 'waiting' ? reg.waiting : reg.active, 'approve');
      return !!(answer && answer.ok === true);
    }

    /** Asks a storage object whether it keeps the data: persisted() first, persist() only when not yet granted. Never throws. */
    async function askPersistence(store) {
      if (!store || typeof store.persisted !== 'function') return { state: 'unknown' };
      try {
        let kept = await store.persisted();
        if (!kept && typeof store.persist === 'function') kept = await store.persist();
        return { state: kept ? 'granted' : 'denied' };
      } catch (e) { return { state: 'unknown' }; }
    }

    /** Adult area only. Asked once per page session; the answer is kept for the rest of the session. */
    function persistence() {
      if (!persistAnswer) persistAnswer = askPersistence(navigator.storage);
      return persistAnswer;
    }

    const LINES = {
      ready: 'Works offline: ready',
      notReady: 'Works offline: not ready (open this page once with internet and wait)',
      file: 'Works offline: not available on this copy (it runs from a file, which is already offline)',
      unsupported: 'Works offline: not available here (this browser, or this kind of web address, cannot keep an offline copy)'
    };
    function offlineLine(st) {
      const k = st && st.kind;
      if (k === 'ready' || k === 'file' || k === 'unsupported') return LINES[k];
      return LINES.notReady;
    }
    function persistLine(result) {
      const s = result && result.state;
      if (s === 'granted') return 'Your browser will keep this data.';
      if (s === 'denied') return 'Your browser did not promise to keep this data. Save a backup often.';
      return 'This browser cannot say.';
    }
    function updateLine(st) {
      if (!st || !st.update) return '';
      return st.update.approved ? 'Update approved. Close the app completely and open it again to use the new version.' : 'Update ready, install on next start';
    }

    return { register, status, approve, persistence, askPersistence, offlineLine, persistLine, updateLine, kind, safeFields: model.ANSWER_FIELDS };
  });
}());
