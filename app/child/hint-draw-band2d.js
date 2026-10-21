/*
 * hintDrawBand2d (L5, step 10 sub-build D): the rung 2 (count together) and rung 3 (model) drawings for the
 * band-2 (ages 7 to 9) FRACTION question types, registered into hint-draw.js through hintDraw.register so
 * hint-draw.js stays under the 400-line limit. Rung 1 (outline the fraction bar / line / wall) is handled by
 * hint-draw.js through the shared "pattern" mark (its target list learns the fraction selectors), so this module
 * only adds rung 2 and rung 3, keyed by the same kind as the SPEC (hint-ladder-band2d.js) and the hint text
 * (feedback-lines.js hints).
 *
 * Rung 2 never names the answer: it points at or counts the parts/points that are ALREADY on the stage (the
 * shaded parts, the marked ticks). Rung 3 either shows a whole-number answer as a short row of dots (capped at
 * 20), or - for a fraction answer or a compare - outlines the shaded part / the marked point / the bigger bar,
 * which the picture already holds; the child still taps the answer. Nothing animates under reduced motion: the
 * marks are applied through the shared sequence()/mark helpers, which hint-draw.js collapses to an instant
 * result when prefers-reduced-motion is set.
 */
(function () {
  'use strict';

  NBA.define('hintDrawBand2d', ['hintDraw'], (hintDraw) => {
    const { dotRow, sequence, mark } = hintDraw.helpers;
    const cap = (n) => Math.max(0, Math.min(20, Math.abs(n)));
    const showAnswer = (answer) => (stage) => dotRow(stage, cap(answer), true);
    const all = (stage, sel) => Array.prototype.slice.call(stage.querySelectorAll(sel));

    // Flash the elements matching `sel` that are already on the stage, one by one (adds no new number).
    const flash = (sel) => (stage) => { const els = all(stage, sel); sequence(els.length, (i) => { if (els[i]) els[i].classList.add('hint-flash'); }); };
    // Mark the fraction row (bar) at index i (0 = top). Used by the compare models to outline the bigger bar.
    const markRow = (stage, i) => { const rows = all(stage, '.b2-frow'); mark([rows[i]]); };

    const COUNT = {
      // Count / point at the shaded parts that are already shown (never the answer).
      'frac-unit': (s, q) => (q.numbers.mode ? flash('.b2-frow .b2-fbar')(s) : flash('.b2-fseg.b2-fon')(s)),
      'frac-nonunit': (s) => flash('.b2-fseg.b2-fon')(s),
      // frac-line: mode 0 count the ticks up to the hop (point at the on-ticks); mode 1 point at both marks.
      'frac-line': (s) => flash('.b2-fltick.b2-flon')(s),
      // frac-wall: mode 0 point at the d-part bar strips; mode 1 point at both bars.
      'frac-wall': (s, q) => (q.numbers.mode ? flash('.b2-frow .b2-fbar')(s) : flash('.b2-frow .b2-fseg')(s))
    };

    const MODEL = {
      'frac-unit': (s, q) => (q.numbers.mode ? markRow(s, q.numbers.d1 < q.numbers.d2 ? 0 : 1) : showAnswer(q.numbers.d - q.numbers.c)(s)),
      'frac-nonunit': (s, q) => (q.numbers.mode ? flash('.b2-fseg.b2-fon')(s) : showAnswer(q.numbers.n - q.numbers.p)(s)),
      'frac-line': (s, q) => {
        if (q.numbers.mode) { // compare: mark the tick further along (the bigger top shares the bottom number)
          mark([all(s, '.b2-fltick')[Math.max(q.numbers.k1, q.numbers.k2)]]);
        } else { // name the fraction: outline the marked point (the fraction is the point)
          flash('.b2-fltick.b2-flon')(s);
        }
      },
      'frac-wall': (s, q) => (q.numbers.mode
        ? markRow(s, q.numbers.k1 > q.numbers.k2 ? 0 : 1)
        : showAnswer(q.numbers.d / 2)(s))
    };

    hintDraw.register({ count: COUNT, model: MODEL });
    return {};
  });
}());
