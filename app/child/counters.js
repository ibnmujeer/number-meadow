/*
 * counters (L5): seeds, pebbles, bead rods and flat tiles (docs/STYLE.md section 9), the global UI scale
 * and stage fitting (moved from v1 section 6). Every counter is one inline SVG inside a
 * <span class="counter k-<kind> c-<tone>"> with the old footprint: 2u wide (3u in "bigger"),
 * 1.2u high, in columns of 10 standing on a 0.5u mat. Colours come only from CSS (app/styles/counters.css:
 * c-<tone> sets --cc, the deep tone, and --cb, the base tone).
 */
(function () {
  'use strict';

  NBA.define('counters', ['config', 'util'], (config, util) => {
    const { BAND_CYCLE, COL_ROWS, SIZE } = config;
    const { clamp, range } = util;
    const svg = (vb, body) => '<svg viewBox="' + vb + '" aria-hidden="true" focusable="false">' + body + '</svg>';

    /** Tone of counter i in a banded stack: it changes every 5 counters. */
    function bandTone(i) { return BAND_CYCLE[Math.floor(i / 5) % BAND_CYCLE.length]; }
    /** Shape changes with the band too (seed for even bands, pebble for odd), so a band edge is not colour only. */
    function bandKind(i) { return Math.floor(i / 5) % 2 ? 'pebble' : 'seed'; }

    const SHAPES = {
      seed: '<ellipse class="cc" cx="10" cy="6" rx="8.4" ry="4.6"/><path class="cg" stroke-opacity="0.55" d="M4.6 6.6Q10 3.4 15.4 6.6"/>',
      pebble: '<path class="cc" d="M2.6 7C2 3.4 6.4 1.6 10.6 1.7C15.4 1.8 18.4 4 17.9 7.2C17.4 10.2 13.4 10.6 9.6 10.5C5.6 10.4 3 9.4 2.6 7Z"/>' +
        '<circle class="cd" fill-opacity="0.6" cx="7.4" cy="5" r="0.8"/><circle class="cd" fill-opacity="0.6" cx="12.8" cy="7.2" r="0.8"/>'
    };

    /** One seed or pebble. kind: 'seed' | 'pebble'; tone: a colour token name (BAND_CYCLE). */
    function counterHTML(kind, tone, extraClass, attrs) {
      const k = kind === 'pebble' ? 'pebble' : 'seed';
      return '<span class="counter k-' + k + ' c-' + tone + (extraClass ? ' ' + extraClass : '') + '"' + (attrs || '') + '>' +
        svg('0 0 20 12', SHAPES[k]) + '</span>';
    }
    /** An empty spot for a "missing" counter (a dashed oval, no fill). */
    function slotHTML(attrs) {
      return '<span class="slot"' + (attrs || '') + '>' + svg('0 0 20 12', '<ellipse class="cr" stroke-dasharray="2.4 1.8" cx="10" cy="6" rx="8" ry="4.4"/>') + '</span>';
    }

    /**
     * `count` counters in columns (bottom-up, then the next column to the right).
     * opt.rows: counters per column (default COL_ROWS); opt.cols: force a column count (empty build
     * columns); opt.toneAt(i) / opt.kindAt(i): tone and kind of counter i (default: the bands);
     * opt.dashedFrom: from this index on, empty slots.
     */
    function columnsHTML(count, opt) {
      const o = opt || {};
      const rows = o.rows || COL_ROWS;
      const cols = o.cols || Math.max(1, Math.ceil(count / rows));
      let html = '';
      for (let c = 0; c < cols; c++) {
        html += '<div class="col">';
        for (let r = 0; r < rows; r++) {
          const i = c * rows + r;
          if (i >= count) break;
          const attr = ' data-i="' + i + '"';
          if (o.dashedFrom != null && i >= o.dashedFrom) html += slotHTML(attr);
          else html += counterHTML(o.kindAt ? o.kindAt(i) : bandKind(i), o.toneAt ? o.toneAt(i) : bandTone(i), '', attr);
        }
        html += '</div>';
      }
      return html;
    }

    /** Columns of counters standing on a flat mat. */
    function stackHTML(count, opt, cls) {
      return '<div class="stack' + (cls ? ' ' + cls : '') + '"><div class="cols">' + columnsHTML(count, opt) +
        '</div><div class="mat"></div></div>';
    }

    /** Stack size in u. Width: 2u columns, 0.5u gaps, 0.25u mat overhang each side. */
    function stackW(cols) { return cols * 2 + (cols - 1) * 0.5 + 0.5; }
    /** Height: rows of 1.2u plus the 0.5u mat (no outline and nothing on top, so nothing else). */
    function stackH(rows) { return 1.2 * rows + 0.5; }
    function colsFor(count) { return Math.max(1, Math.ceil(count / COL_ROWS)); }
    function rowsFor(count) { return clamp(count, 1, COL_ROWS); }

    /** A ten: ten beads on one thin rod line, five and five (2u by 12.4u). Ready and tested; on no screen yet. */
    function rodHTML(tone) {
      const beads = range(0, 9).map((k) => '<circle class="cc" cx="10" cy="' + (7 + k * 11.1 + (k >= 5 ? 3 : 0)).toFixed(1) + '" r="5.4"/>').join('');
      return '<span class="rod c-' + tone + '">' + svg('0 0 20 124', '<line class="cr" x1="10" y1="2" x2="10" y2="122"/>' + beads) + '</span>';
    }
    /** A hundred: one flat rounded square scored with 18 lines (no dots). Ready and tested; on no screen yet. */
    function tileHTML(tone) {
      let lines = '';
      for (let k = 1; k <= 9; k++) {
        lines += '<line class="cs" stroke-opacity="0.45" x1="0" y1="' + k * 10 + '" x2="100" y2="' + k * 10 + '"/>';
        lines += '<line class="cs" stroke-opacity="0.45" x1="' + k * 10 + '" y1="0" x2="' + k * 10 + '" y2="100"/>';
      }
      return '<span class="tile c-' + tone + '">' + svg('0 0 100 100', '<rect class="cc" x="0" y="0" width="100" height="100" rx="14"/>' + lines) + '</span>';
    }
    /** One of each piece (screenshots and the render tests). */
    function samplerHTML() {
      return '<div class="sampler">' + counterHTML('seed', 'moss') + counterHTML('pebble', 'apricot') + slotHTML() +
        rodHTML('teal') + tileHTML('plum') + '<div class="mat"></div></div>';
    }

    /**
     * Global UI scale: root font-size = 16px * s, s = clamp(min(w/400, h/720), 1, 1.45).
     * s never drops below 1, so phones keep every minimum size; tablets scale up.
     */
    function applyScale() {
      const s = clamp(Math.min(window.innerWidth / 400, window.innerHeight / 720), 1, 1.45);
      document.documentElement.style.fontSize = (16 * s).toFixed(2) + 'px';
    }
    function rootPx() { return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16; }

    /**
     * Pick the counter pitch u so the current picture fits #stage. render() leaves
     * stage._fit = { wu, hu, wpx, hpx, prep }: the picture is (wu*u + wpx) wide
     * and (hu*u + hpx) tall; prep(W, H, rem) may size fixed-px parts first (buddy
     * faces, tower buttons) and return new wpx/hpx. The stage's own size never
     * depends on its contents (flex: 1 1 0), so this cannot loop.
     * Called after render, when the hint appears, and on resize. When --u changes it fires
     * 'nba:fit' on the stage (a running take-away then ends at once, spec 3.5).
     */
    /** Three answers side by side are too narrow for a wide number at the full answer size (50 px or more): when one label would spill
     *  out of its button, the screen gets the class answers-stacked and the three buttons stand one over the other (CSS, mission.css). */
    function stackAnswers() {
      const screen = document.querySelector('.screen.mission');
      if (!screen) return;
      screen.classList.remove('answers-stacked');
      const wide = Array.prototype.some.call(screen.querySelectorAll('.answers .choice'), (b) => b.scrollWidth > b.clientWidth);
      if (wide) screen.classList.add('answers-stacked');
      // answers-col: the three answers stand one over the other (stacked now, or by the activity's own CSS); short phones compact the hint then
      const row = screen.querySelector('.answers');
      screen.classList.toggle('answers-col', !!row && getComputedStyle(row).flexDirection === 'column');
    }
    /**
     * Fit of a plain prompt card (.b1-card, .b2-card): its lines are text, not counters, so the picture does not scale with u alone. The first
     * line is k1 u high (28 px at the least) and the others k2 u (28 px at the least); the card wraps a long line, bold glyphs are about 0.68 em
     * wide, line height 1.2. prep() tries u from the biggest allowed pitch downwards and keeps the first that fits the stage both ways.
     */
    function cardFit(display, k1, k2) {
      return { wu: 10, hu: 5, prep: (W, H, rem) => {
        let u = SIZE.U_MAX_REM * rem;
        for (; u > SIZE.U_MIN; u -= 0.25) {
          const avail = W - 2 * (1.2 * u + 2);
          let h = 1.2 * u + 4;
          display.forEach((t, i) => {
            const f = Math.max(28, (i ? k2 : k1) * u);
            h += Math.ceil(t.length * 0.68 * f * 1.12 / avail) * 1.2 * f + (i ? 0.4 * u : 0);
          });
          if (avail > 0 && h <= H * 0.9) break;
        }
        return { wu: (W * SIZE.FIT_SAFETY) / u, hu: (H * SIZE.FIT_SAFETY) / u, wpx: 0, hpx: 0 };
      } };
    }
    /** Fit of a symbolic card that holds one text (.b3-divcard / .b3-divline): font max(28 px, k u), line height 1.364, padding 0.9u by 1.3u, 2 px border. */
    function textCardFit(text, k) {
      return { wu: 10, hu: 5, prep: (W, H, rem) => {
        let u = SIZE.U_MAX_REM * rem;
        for (; u > SIZE.U_MIN; u -= 0.25) {
          const f = Math.max(28, k * u), avail = W - 2 * (1.3 * u + 2);
          if (avail > 0 && Math.ceil(String(text).length * 0.62 * f * 1.12 / avail) * 1.364 * f + 1.8 * u + 4 <= H * 0.9) break;
        }
        return { wu: (W * SIZE.FIT_SAFETY) / u, hu: (H * SIZE.FIT_SAFETY) / u, wpx: 0, hpx: 0 };
      } };
    }
    function fitStage() {
      const stage = document.getElementById('stage');
      if (!stage || !stage._fit) return;
      stackAnswers();
      const cs = getComputedStyle(stage);
      const W = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const H = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      const rem = rootPx();
      const f = Object.assign({ wpx: 0, hpx: 0 }, stage._fit);
      if (f.prep) Object.assign(f, f.prep(W, H, rem));
      let u = Math.min((W - f.wpx) / f.wu, (H - f.hpx) / f.hu) * SIZE.FIT_SAFETY;
      u = clamp(Math.floor(u * 4) / 4, SIZE.U_MIN, SIZE.U_MAX_REM * rem);
      const old = stage.style.getPropertyValue('--u');
      stage.style.setProperty('--u', u + 'px');
      if (old && old !== u + 'px') stage.dispatchEvent(new CustomEvent('nba:fit'));
    }

    return {
      bandTone, bandKind, counterHTML, slotHTML, columnsHTML, stackHTML, stackW, stackH, colsFor, rowsFor,
      rodHTML, tileHTML, samplerHTML, applyScale, rootPx, fitStage, cardFit, textCardFit
    };
  });
}());
