/*
 * fileSave (L6): save a text file and copy text for the Grown-ups area (brief O13). Nothing leaves the device.
 *   save(name, text, mime)  a Blob, an object URL and a temporary <a download>; the URL is revoked after
 *                           config.adults.revokeDelayMs (1.5 s; iOS needs time). -> { ok: true } or, when there is no
 *                           Blob, no URL.createObjectURL, no download attribute, or anything throws, { ok: false }
 *                           (the caller then shows the text in a box with a Copy button)
 *   copy(text, box?)        navigator.clipboard.writeText when present; otherwise (or when it is refused) select the
 *                           box and document.execCommand('copy'). Resolves 'Copied.' or 'Select the text and copy it.'
 *   boxHTML(id, text, label)  a read-only text box with its label
 */
(function () {
  'use strict';

  NBA.define('fileSave', ['config', 'util'], (config, util) => {
    const COPIED = 'Copied.';
    const BY_HAND = 'Select the text and copy it.';

    function save(name, text, mime) {
      try {
        const g = window;
        if (typeof g.Blob !== 'function' || !g.URL || typeof g.URL.createObjectURL !== 'function') return { ok: false };
        const a = document.createElement('a');
        if (!('download' in a)) return { ok: false };
        const url = g.URL.createObjectURL(new g.Blob([text], { type: mime }));
        a.href = url;
        a.download = name;
        a.hidden = true;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => { try { g.URL.revokeObjectURL(url); } catch (e) { /* ignore */ } }, config.adults.revokeDelayMs);
        return { ok: true, name: name };
      } catch (e) {
        return { ok: false };
      }
    }

    function byHand(box) {
      try {
        if (!box) return BY_HAND;
        box.focus();
        box.select();
        return document.execCommand('copy') ? COPIED : BY_HAND;
      } catch (e) { return BY_HAND; }
    }

    async function copy(text, box) {
      const c = navigator.clipboard;
      if (c && typeof c.writeText === 'function') {
        try { await c.writeText(text); return COPIED; } catch (e) { /* refused: try by selection */ }
      }
      let el = box || null, made = false;
      if (!el) {
        el = document.createElement('textarea');
        el.value = text;
        el.setAttribute('readonly', '');
        el.className = 'ad-offscreen';
        document.body.appendChild(el);
        made = true;
      }
      const out = byHand(el);
      if (made) el.remove();
      return out;
    }

    function boxHTML(id, text, label) {
      return '<label class="ad-label" for="' + util.esc(id) + '">' + util.esc(label) + '</label>' +
        '<textarea id="' + util.esc(id) + '" class="ad-box" readonly rows="12">' + util.esc(text) + '</textarea>';
    }

    return { save, copy, boxHTML, COPIED, BY_HAND };
  });
}());
