/*
 * art (L5): buddy SVG, icons and icon buttons (moved from v1 section 7).
 * All art is original, flat fills and strokes only (no <defs> or ids, so the
 * same face can appear many times on one screen).
 */
(function () {
  'use strict';

  NBA.define('art', ['util', 'catalog', 'buddyLooks'], (util, catalog, buddyLooks) => {
    const { esc } = util;
    const { buddyById, resolveBuddy, DEFAULT_BUDDY } = catalog;

    function icon(body) { return '<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">' + body + '</svg>'; }
    /** A stroke-only pictogram line in currentColor (the button sets color: var(--ink)). */
    const L = (d, w) => '<path d="' + d + '" fill="none" stroke="currentColor" stroke-width="' + (w || 2.6) + '" stroke-linecap="round" stroke-linejoin="round"/>';
    /**
     * Inline SVG icons for every essential control (no emoji). Every icon is stroke-only in currentColor.
     */
    const ICONS = {
      home: icon(L('M5 15.5 16 6l11 9.5') + L('M8.5 13.5V26h5.5v-6.5h4V26h5.5V13.5')),
      speaker: icon(L('M5 12.5h4.5L15.5 7v18l-6-5.5H5z') + L('M20.5 12a5.6 5.6 0 0 1 0 8M24 8.5a10.6 10.6 0 0 1 0 15')),
      soundOn: icon(L('M5 12.5h4.5L15.5 7v18l-6-5.5H5z') + L('M20.5 12a5.6 5.6 0 0 1 0 8M24 8.5a10.6 10.6 0 0 1 0 15')),
      soundOff: icon(L('M5 12.5h4.5L15.5 7v18l-6-5.5H5z') + L('M20.5 12.5l7 7M27.5 12.5l-7 7')),
      undo: icon(L('M11 8 5.5 13.5 11 19', 3) + L('M6 13.5h12a6.5 6.5 0 0 1 0 13h-4.5', 3)),
      next: icon(L('M6 16h18M17 9l7 7-7 7', 3.2)),
      play: icon(L('M11 7v18l14-9z', 2.8)),
      swap: icon(L('M6 11.5h18l-4.5-4.5M26 20.5H8l4.5 4.5', 2.8)),
      tick: icon(L('M7 16.5l5.5 5.5L25 9.5', 3.6)),
      check: icon(L('M9 4.5h14a2.5 2.5 0 0 1 2.5 2.5v18a2.5 2.5 0 0 1-2.5 2.5H9A2.5 2.5 0 0 1 6.5 25V7A2.5 2.5 0 0 1 9 4.5z') + L('M11 16l3.5 3.5L21.5 12', 3)),
      again: icon(L('M25 17a9 9 0 1 1-3-7.6', 2.8) + L('M23 4.5v5.6h-5.6', 2.8)),
      // "Change player" (two round heads) and the Grown-ups button (a clipboard)
      players: icon(L('M10 13.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM22 13.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z') + L('M4 26c.8-5 11.2-5 12 0M16 26c.8-5 11.2-5 12 0')),
      // a quiet leaf with a tick vein: a finished world on Home (step 4)
      leaf: icon(L('M6 24C6 12 14 6 26 6c0 12-6 20-18 20', 2.6) + L('M9 23l9-9', 2.4) + L('M13 18.5l2.2 2.2L20 15.8', 2.4)),
      // a small sprout: the quiet mark that a skill grew (step 4); stroke-only like the other pictograms
      sprout: icon(L('M16 27V13') + L('M16 17c-6.5 0-9.5-3-9.5-8.5 6.5 0 9.5 3 9.5 8.5z') + L('M16 14c0-5.5 3-8.5 9.5-8.5 0 5.5-3 8.5-9.5 8.5z')),
      adults: icon(L('M9 6.5h14a2 2 0 0 1 2 2V27a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V8.5a2 2 0 0 1 2-2z') + L('M12.5 4h7v4.5h-7z', 2.2) + L('M11.5 15h9M11.5 19.5h9M11.5 24h5.5', 2.2))
    };

    /*
     * Buddies (docs/STYLE.md section 8): one shared body, one face and one feature each, in a 100 x 100
     * viewBox. Colour comes only from CSS (app/styles/buddies.css): bb body, bd deep tone, bi ink,
     * ln stroke-only line. Every element is either filled or a stroke-only line, never both.
     */
    const LN = (d, w) => '<path class="ln" stroke-width="' + w + '" d="' + d + '"/>';
    const C = (cls, x, y, r) => '<circle class="' + cls + '" cx="' + x + '" cy="' + y + '" r="' + r + '"/>';
    /** Feature parts drawn behind the body ([0]) and in front of it ([1]). */
    const FEATURES = {
      leaf: ['', '<path class="bd" d="M50 28C40 20 41 9 54 5C61 13 59 23 50 28Z"/>'],
      'round-ears': [C('bd', 28, 30, 10) + C('bd', 72, 30, 10) + C('bb', 28, 30, 5) + C('bb', 72, 30, 5), ''],
      antenna: ['', LN('M50 27Q45 17 54 10', 3) + C('bd', 54, 9, 5)],
      'curly-tail': [LN('M82 66C92 66 96 58 92 52C88 47 82 51 85 56', 5), ''],
      'side-fins': ['<ellipse class="bd" cx="15" cy="60" rx="8" ry="12"/><ellipse class="bd" cx="85" cy="60" rx="8" ry="12"/>', ''],
      'floppy-ear': ['<ellipse class="bd" cx="77" cy="32" rx="8" ry="15" transform="rotate(25 77 32)"/>', ''],
      flower: ['', [0, 72, 144, 216, 288].map((a) => C('bd', (50 + 7 * Math.sin(a * Math.PI / 180)).toFixed(1),
        (22 - 7 * Math.cos(a * Math.PI / 180)).toFixed(1), 5)).join('') + C('bb', 50, 22, 4)],
      curl: ['', LN('M50 27C50 18 58 16 58 22C58 27 51 27 52 21', 3)],
      spots: ['', C('bd', 31, 66, 4.5) + C('bd', 69, 66, 4.5) + C('bd', 50, 81, 4.5)],
      stripes: ['', LN('M30 74Q50 79 70 74', 3.5) + LN('M35 84Q50 88 65 84', 3.5)],
      'pom-pom': ['', C('bd', 50, 24, 9)],
      tuft: ['', LN('M44 28Q42 19 40 12', 3.2) + LN('M50 27Q50 18 50 9', 3.2) + LN('M56 28Q58 19 60 13', 3.2)]
    };

    /**
     * Inline SVG of a buddy; a retired id draws its mapped buddy, an unknown id the first buddy. look = { tint, accessory }
     * (step 4): a tint changes the colour pair, an accessory is drawn over the face; no look gives the plain buddy.
     */
    function buddySVG(id, look) {
      const b = resolveBuddy(id) || buddyById(DEFAULT_BUDDY);
      const f = FEATURES[b.feature];
      const l = look || {};
      const tint = buddyLooks.tintClass(l.tint);
      return '<svg class="buddy buddy-' + b.id + (tint ? ' ' + tint : '') + '" viewBox="0 0 100 100" aria-hidden="true" focusable="false">' + f[0] +
        '<ellipse class="bd" cx="50" cy="62" rx="34" ry="32"/><ellipse class="bb" cx="50" cy="58" rx="34" ry="32"/>' + f[1] +
        '<ellipse class="bi" cx="40" cy="54" rx="3.4" ry="4.2"/><ellipse class="bi" cx="60" cy="54" rx="3.4" ry="4.2"/>' +
        '<path class="ln mouth" stroke-width="2.6" d="M44 66Q50 71 56 66"/>' + buddyLooks.accessorySVG(l.accessory) + '</svg>';
    }

    /** A face wrapped in a sized box. */
    function faceHTML(id, cls, extraAttr, look) {
      return '<span class="face ' + (cls || '') + '"' + (extraAttr || '') + '>' + buddySVG(id, look) + '</span>';
    }

    function iconBtn(action, iconName, label, extra) {
      return '<button type="button" class="icon-btn" data-action="' + action + '" aria-label="' + esc(label) + '"' +
        (extra || '') + '>' + ICONS[iconName] + '</button>';
    }

    return { ICONS, buddySVG, faceHTML, iconBtn };
  });
}());
