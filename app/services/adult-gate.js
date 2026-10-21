/*
 * adultGate (L4): the optional grown-up PIN (brief O2, O3, D-D). Only a salted PBKDF2-SHA-256 hash is stored, in
 * meta.adultGate = { key, algo, iterations, salt, hash } (hex). The salt comes from crypto.getRandomValues here in
 * the service layer, never in app/core. The record never leaves the device (schema.PRIVATE_META_KEYS).
 *   supported()      Web Crypto can derive (crypto.subtle.importKey and deriveBits, crypto.getRandomValues)
 *   hasPin()         a PIN record exists
 *   setPin(pin)      4 digits -> { ok } | { ok: false, code: 'bad_pin' | 'unsupported' }
 *   checkPin(pin)    -> { ok: true } | { ok: false, waitMs }: after config.adults.gate.pinTries misses in a row, every
 *                    check waits pinWaitMs (counted in memory; a reload starts again)
 *   lockedFor(now?)  ms still to wait (0 = none)
 *   clearPin()       deletes only meta.adultGate (Forgot PIN, Remove PIN); no other record changes
 * Limits (docs/ARCHITECTURE.md): 10,000 possible PINs; the hash only slows guessing; anyone with the device can
 * clear site data. The PIN keeps children out by accident; it is not a security lock.
 * create({ repo, crypto?, now?, iterations? }) makes an independent service (tests); the module itself is the app's.
 */
(function () {
  'use strict';

  NBA.define('adultGate', ['config', 'util', 'repo'], (config, util, appRepo) => {
    const G = config.adults.gate;
    const KEY = 'adultGate';
    const ALGO = 'PBKDF2-SHA-256';
    const hex = (bytes) => Array.prototype.map.call(new Uint8Array(bytes), (b) => (b < 16 ? '0' : '') + b.toString(16)).join('');
    const unhex = (s) => new Uint8Array((String(s).match(/../g) || []).map((h) => parseInt(h, 16)));

    function create(options) {
      const o = options || {};
      const repo = o.repo || appRepo;
      const now = typeof o.now === 'function' ? o.now : () => util.now();
      const iterations = o.iterations || G.pbkdf2Iterations;
      const cr = () => (o.crypto !== undefined ? o.crypto : globalThis.crypto);
      let misses = 0;
      let lockedUntil = 0;

      function supported() {
        const c = cr();
        return !!c && typeof c.getRandomValues === 'function' && !!c.subtle &&
          typeof c.subtle.importKey === 'function' && typeof c.subtle.deriveBits === 'function';
      }

      async function derive(pin, salt, iters) {
        const subtle = cr().subtle;
        const key = await subtle.importKey('raw', new TextEncoder().encode(String(pin)), 'PBKDF2', false, ['deriveBits']);
        return subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: salt, iterations: iters }, key, 256);
      }

      /** Every byte is compared, with no early exit. */
      function same(a, b) {
        if (a.length !== b.length) return false;
        let d = 0;
        for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
        return d === 0;
      }

      async function record() { try { return (await repo.get('meta', KEY)) || null; } catch (e) { return null; } }
      async function hasPin() { return !!(await record()); }

      async function setPin(pin) {
        if (!new RegExp('^\\d{' + G.pinLength + '}$').test(String(pin))) return { ok: false, code: 'bad_pin' };
        if (!supported()) return { ok: false, code: 'unsupported' };
        const salt = cr().getRandomValues(new Uint8Array(G.saltBytes));
        const bits = await derive(pin, salt, iterations);
        await repo.put('meta', { key: KEY, algo: ALGO, iterations: iterations, salt: hex(salt), hash: hex(bits) });
        misses = 0;
        lockedUntil = 0;
        return { ok: true };
      }

      function lockedFor(t) { return Math.max(0, lockedUntil - (typeof t === 'number' ? t : now())); }

      async function checkPin(pin) {
        const wait = lockedFor();
        if (wait > 0) return { ok: false, waitMs: wait };
        const rec = await record();
        if (!rec || !supported()) return { ok: false, waitMs: 0, code: rec ? 'unsupported' : 'no_pin' };
        let ok = false;
        try { ok = same(hex(await derive(pin, unhex(rec.salt), rec.iterations)), rec.hash); } catch (e) { ok = false; }
        if (ok) { misses = 0; return { ok: true }; }
        misses++;
        if (misses >= G.pinTries) { misses = 0; lockedUntil = now() + G.pinWaitMs; return { ok: false, waitMs: G.pinWaitMs }; }
        return { ok: false, waitMs: 0 };
      }

      async function clearPin() {
        await repo.batch([{ op: 'delete', store: 'meta', key: KEY }]);
        misses = 0;
        lockedUntil = 0;
        return { ok: true };
      }

      return { supported, hasPin, setPin, checkPin, lockedFor, clearPin, record, ALGO, KEY };
    }

    const app = create();
    return Object.assign({ create }, app);
  });
}());
