/*
 * buddyLooks (L5): the six buddy accessories as flat SVG groups, and the look of a child (step 4, P4 and P5). Loaded
 * before art.js, which draws the accessory after the face. Same rules as every buddy string (docs/STYLE.md 7.1 and 8.2):
 * colour comes from CSS rules only (bb body base, bd deep tone, bi ink, ln stroke-only line), every element is either
 * filled or a stroke-only line, no gradient, no id, no <defs>, in the 100 x 100 buddy box, drawn over the face.
 * Nothing may look like gear, a costume or a toy piece: the denied words are listed in tests/scan-words.js.
 *   accessorySVG(id)        the group of one accessory ('' for None or an unknown id)
 *   tintClass(id)           'tint-<id>' for a known tint, else ''
 *   lookOf(student)         { tint, accessory } from the student's record (unknown ids become null)
 *   ACCESSORY_IDS, TINT_IDS the ids the rewards catalog names
 */
(function () {
  'use strict';

  NBA.define('buddyLooks', ['catalog'], (catalog) => {
    const R = catalog.REWARDS;
    const TINT_IDS = R.tints.map((t) => t.id);
    const ACCESSORY_IDS = R.accessories.map((a) => a.id);
    const own = (m, k) => typeof k === 'string' && Object.prototype.hasOwnProperty.call(m, k);
    const C = (cls, x, y, r) => '<circle class="' + cls + '" cx="' + x + '" cy="' + y + '" r="' + r + '"/>';
    const LN = (d, w) => '<path class="ln" stroke-width="' + w + '" d="' + d + '"/>';
    const petals = (cx, cy) => [0, 72, 144, 216, 288].map((a) => C('bd', (cx + 5.5 * Math.sin(a * Math.PI / 180)).toFixed(1),
      (cy - 5.5 * Math.cos(a * Math.PI / 180)).toFixed(1), 4.2)).join('');
    const ACCESSORIES = {
      // two leaves on a short stem at the top left of the head
      sprig: LN('M36 31Q30 24 25 19', 2.6) + '<path class="bd" d="M25 19C17 20 14 12 18 7C24 8 28 13 25 19Z"/>' +
        '<path class="bd" d="M31 26C25 30 18 27 17 21C23 18 29 20 31 26Z"/>',
      // a small flower at the right side of the head
      daisy: petals(72, 33) + C('bb', 72, 33, 3.6),
      // a flat brim and a low crown over the top of the head
      sunhat: '<ellipse class="bd" cx="50" cy="32" rx="31" ry="6"/><path class="bd" d="M35 32C35 15 65 15 65 32Z"/>' +
        '<path class="bb" d="M36 29H64L64.6 32H35.4Z"/>',
      // two round rings around the eyes and a small bridge; the eyes stay on the body colour
      glasses: '<circle class="ln" cx="40" cy="54" r="8" stroke-width="2.4"/><circle class="ln" cx="60" cy="54" r="8" stroke-width="2.4"/>' +
        LN('M48 53Q50 51 52 53', 2.4),
      // a thin cord and a small bell under the chin
      bell: LN('M34 79Q50 87 66 79', 2.2) + '<path class="bd" d="M43 92C43 80 57 80 57 92Z"/>' + C('bb', 50, 90.6, 1.8),
      // a small dome with a stalk on the head
      acorn: '<path class="bd" d="M37 30C37 15 63 15 63 30Z"/>' + LN('M50 17V10', 3.2)
    };

    const accessorySVG = (id) => (own(ACCESSORIES, id) ? '<g class="acc acc-' + id + '">' + ACCESSORIES[id] + '</g>' : '');
    const tintClass = (id) => (TINT_IDS.indexOf(id) >= 0 ? 'tint-' + id : '');
    function lookOf(student) {
      const s = student || {};
      return { tint: TINT_IDS.indexOf(s.buddyTint) >= 0 ? s.buddyTint : null, accessory: ACCESSORY_IDS.indexOf(s.buddyAccessory) >= 0 ? s.buddyAccessory : null };
    }
    return { ACCESSORY_IDS, TINT_IDS, accessorySVG, tintClass, lookOf };
  });
}());
