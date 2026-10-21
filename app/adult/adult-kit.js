/*
 * adultKit (L6): small HTML builders and the press-and-hold control for the Grown-ups screens (step 3, brief O2,
 * O15). Number Meadow components only (docs/STYLE.md, app/styles/adults.css); every control is at least 64 px and
 * labelled. The one piece of module state is the session-only "Larger text" switch (Step 12, D12-7): a flag in memory,
 * never written to prefs, storage or the database, gone when the page closes.
 *   page(name, title, body, opts)   one <section class="screen adult-screen"> with a Back button (opts.back: the
 *                                   action, default 'ad-list'; opts.backLabel) and a heading; class ad-large when the
 *                                   switch is on (only Grown-ups screens are built here, so child screens never change)
 *   isLarge() / setLarge(on)        read and set the Larger text switch
 *   card(body, cls?), heading(text), text(s), note(s), msg(id, s)   a flat paper card and its lines
 *   btn(action, label, opts)        a 64 px button (opts: cls, attrs, go: the teal accent, disabled)
 *   toggle(action, label, on, attrs?)  a button with aria-pressed (no checkboxes: 64 px targets)
 *   field(id, label, opts)          a labelled 64 px text input (opts: hint, value, inputmode, maxlength, type 'password')
 *   holdButton(id, label)           the hold-to-open button with its fill
 *   wireHold(el, ms, onDone)        hold with a pointer, or with Enter or Space: onDone after `ms` (dom.later, so
 *                                   NBA_TEST.setSpeed shortens it); releasing, leaving or blurring early cancels quietly
 */
(function () {
  'use strict';

  NBA.define('adultKit', ['util', 'dom', 'art'], (util, dom, art) => {
    const { esc } = util;
    const attrs = (o) => Object.keys(o || {}).map((k) => ' ' + k + '="' + esc(o[k]) + '"').join('');

    function btn(action, label, opts) {
      const o = opts || {};
      return '<button type="button" class="ad-btn' + (o.go ? ' ad-go' : '') + (o.cls ? ' ' + o.cls : '') + '"' +
        (action ? ' data-action="' + esc(action) + '"' : '') + attrs(o.attrs) + (o.disabled ? ' disabled' : '') + '>' +
        (o.icon ? art.ICONS[o.icon] : '') + '<span>' + esc(label) + '</span></button>';
    }

    function toggle(action, label, on, extra) {
      return btn(action, label, { cls: 'ad-toggle', attrs: Object.assign({ 'aria-pressed': on ? 'true' : 'false' }, extra || {}) });
    }

    let large = false; // Larger text: this page session only, nothing saved
    const isLarge = () => large;
    const setLarge = (on) => { large = !!on; };

    function page(name, title, body, opts) {
      const o = opts || {};
      const back = o.back === undefined ? 'ad-list' : o.back;
      return '<section class="screen adult-screen' + (large ? ' ad-large' : '') + '" data-screen="' + esc(name) + '"' + (o.gate ? ' data-gate="1"' : '') + '><header class="bar">' +
        (back ? art.iconBtn(back, 'home', o.backLabel || 'Back') : '') +
        '<h1 class="screen-title ad-title">' + esc(title) + '</h1></header><div class="ad-body">' + body + '</div></section>';
    }

    const card = (body, cls) => '<div class="ad-card' + (cls ? ' ' + cls : '') + '">' + body + '</div>';
    const heading = (s) => '<h2 class="ad-h">' + esc(s) + '</h2>';
    const text = (s) => '<p class="ad-text">' + esc(s) + '</p>';
    const note = (s) => '<p class="ad-text ad-note">' + esc(s) + '</p>';
    const msg = (id, s) => '<p class="ad-text ad-msg" id="' + esc(id) + '" aria-live="polite">' + esc(s || '') + '</p>';

    function field(id, label, opts) {
      const o = opts || {};
      return '<div class="ad-field"><label class="ad-label" for="' + esc(id) + '">' + esc(label) + '</label>' +
        (o.hint ? '<p class="ad-text ad-note" id="' + esc(id) + '-hint">' + esc(o.hint) + '</p>' : '') +
        '<input id="' + esc(id) + '" type="' + (o.type === 'password' ? 'password' : 'text') + '" autocomplete="off" spellcheck="false"' +
        (o.inputmode ? ' inputmode="' + esc(o.inputmode) + '"' : '') + (o.maxlength ? ' maxlength="' + o.maxlength + '"' : '') +
        (o.hint ? ' aria-describedby="' + esc(id) + '-hint"' : '') + ' value="' + esc(o.value || '') + '"></div>';
    }

    function holdButton(id, label) {
      return '<button type="button" class="ad-hold" id="' + esc(id) + '"><span class="hold-fill" aria-hidden="true"></span>' +
        '<span class="ad-hold-label">' + esc(label) + '</span></button>';
    }

    function wireHold(el, ms, onDone) {
      if (!el) return;
      el.style.setProperty('--hold-ms', Math.max(0, Math.round(ms * dom.getSpeed())) + 'ms'); // the fill runs as long as the hold
      let timer = 0;
      const start = () => {
        if (timer) return;
        el.classList.add('holding');
        timer = dom.later(() => { timer = 0; el.classList.remove('holding'); onDone(); }, ms);
      };
      const stop = () => {
        if (!timer) return;
        clearTimeout(timer);
        timer = 0;
        el.classList.remove('holding');
      };
      const isKey = (e) => e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar';
      el.addEventListener('pointerdown', (e) => { if (e.button === 0 || e.button === undefined) start(); });
      ['pointerup', 'pointerleave', 'pointercancel', 'blur'].forEach((t) => el.addEventListener(t, stop));
      el.addEventListener('keydown', (e) => { if (!isKey(e)) return; e.preventDefault(); if (!e.repeat) start(); });
      el.addEventListener('keyup', (e) => { if (isKey(e)) { e.preventDefault(); stop(); } });
    }

    return { isLarge, setLarge, page, card, heading, text, note, msg, btn, toggle, field, holdButton, wireHold, esc };
  });
}());
