/*
 * freeplayArt (L5): the picture on a Free Play category tile (F3). Only the picture is presentation data here; which tiles exist
 * is read from the real strands by freeplayPick (the list is not written down in this file).
 *   glyph(id)   the round 56 x 56 scene for a strand id or 'mixed': the existing world scenes for adding, taking away, groups,
 *               sharing and mixed, two small new ones for counting and numbers, and a plain round scene for a strand that
 *               has no picture yet (a new category still shows)
 *   toneOf(id)  the colour pair name the tile border takes (a world-* class from home-map.css or fp-tone-* from freeplay.css)
 *   has(id)     true when the strand has its own picture
 * Colours come from CSS (see meadow-art.js): a wrapper <g class="t-<token>"> sets the pair, shapes carry class tb, td or tl.
 */
(function () {
  'use strict';

  NBA.define('freeplayArt', ['meadowArt'], (meadowArt) => {
    const sv = (body) => '<svg class="glyph" viewBox="0 0 56 56" aria-hidden="true" focusable="false">' + body + '</svg>';
    const g = (tone, body) => '<g class="t-' + tone + '">' + body + '</g>';
    const C = (cls, x, y, r) => '<circle class="' + cls + '" cx="' + x + '" cy="' + y + '" r="' + r + '"/>';
    const R = (cls, x, y, w, h) => '<rect class="' + cls + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="2.4"/>';
    const P = (cls, d, w) => '<path class="' + cls + '"' + (w ? ' stroke-width="' + w + '"' : '') + ' d="' + d + '"/>';

    /** Strand id -> the existing world scene it borrows. */
    const BORROWED = { add: 'addition', sub: 'subtraction', mul: 'multiplication', div: 'division', mixed: 'master' };
    /** Strand id -> the class on the tile that sets its colour pair. */
    const TONES = { add: 'world-addition', sub: 'world-subtraction', mul: 'world-multiplication', div: 'world-division', mixed: 'world-master',
      count: 'fp-tone-count', sense: 'fp-tone-sense', place: 'fp-tone-place', frac: 'fp-tone-frac', dec: 'fp-tone-dec', pct: 'fp-tone-pct',
      neg: 'fp-tone-neg', ops: 'fp-tone-ops', unk: 'fp-tone-unk' };
    const OWN = {
      // counting: three counters in a row on a sunny disc, with the line they sit on
      count: g('sunflower', C('tb', 28, 28, 28) + g('moss', C('td', 15, 27, 5.2) + C('td', 28, 27, 5.2) + C('td', 41, 27, 5.2)) +
        g('sand', P('tl', 'M9 37H47', 2.6))),
      // numbers: a short and a tall stack side by side (which is bigger)
      sense: g('mint', C('tb', 28, 28, 28) + g('sand', R('td', 13, 29, 12, 15) + R('td', 31, 15, 12, 29)) + g('moss', P('tl', 'M10 46H46', 2.6))),
      // tens and ones (place value): a full stack of ten and one loose counter beside it (a ten and some ones)
      place: g('teal', C('tb', 28, 28, 28) + g('sand', R('td', 17, 11, 10, 34)) + g('moss', C('tl', 38, 38, 4.4))),
      // fractions: a disc split down the middle with one half shaded (a half of a shape)
      frac: g('plum', C('tb', 28, 28, 28) + g('moss', P('td', 'M28 6 A22 22 0 0 1 28 50 Z')) + g('sand', P('tl', 'M28 6V50', 2.4))),
      // decimals: a square of four parts with one shaded, and a point (a dot) in front (part of a whole and a decimal point)
      dec: g('lavender', C('tb', 28, 28, 28) + g('sand', R('td', 26, 14, 24, 24)) + g('moss', R('tb', 26, 14, 12, 12)) +
        g('sand', P('tl', 'M38 14V38', 2) + P('tl', 'M26 26H50', 2)) + g('moss', C('td', 15, 38, 3.4))),
      // percents: the per-cent sign shape, a dot high left and a dot low right with a slash between (parts out of a hundred)
      pct: g('slateblue', C('tb', 28, 28, 28) + g('sand', P('tl', 'M18 40L38 16', 3)) + g('moss', C('td', 18, 18, 4.4) + C('td', 38, 38, 4.4))),
      // below zero (negatives): a short vertical line with a mark above the middle line and one below it
      neg: g('sky', C('tb', 28, 28, 28) + g('sand', P('tl', 'M28 10V46', 2.6)) + g('moss', C('td', 28, 18, 3.6) + C('td', 28, 38, 3.6))),
      // step by step (order of operations): three dots joined in a row, read left to right
      ops: g('apricot', C('tb', 28, 28, 28) + g('moss', C('td', 16, 28, 4) + C('td', 28, 28, 4) + C('td', 40, 28, 4)) + g('sand', P('tl', 'M20 28H36', 2.4))),
      // missing number: a disc with a gap, standing for the box in a number sentence
      unk: g('rose', C('tb', 28, 28, 28) + g('sand', R('td', 19, 19, 18, 18)) + g('moss', P('tl', 'M24 28H32', 2.6)))
    };
    const PLAIN = g('sand', C('tb', 28, 28, 28) + C('td', 28, 28, 7));

    const has = (id) => Object.prototype.hasOwnProperty.call(BORROWED, id) || Object.prototype.hasOwnProperty.call(OWN, id);
    function glyph(id) {
      if (Object.prototype.hasOwnProperty.call(BORROWED, id)) return meadowArt.worldGlyph(BORROWED[id]);
      return sv(Object.prototype.hasOwnProperty.call(OWN, id) ? OWN[id] : PLAIN);
    }
    const toneOf = (id) => (Object.prototype.hasOwnProperty.call(TONES, id) ? TONES[id] : 'fp-tone-plain');

    return { glyph, toneOf, has };
  });
}());
