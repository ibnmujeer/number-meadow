/*
 * hintLadderBand2d (L2, step 10 sub-build D): the hint SPEC rows for the band-2 (ages 7 to 9) FRACTION
 * question types, kept out of hint-ladder.js (and the band-2 siblings) to stay under the 400-line limit.
 * hint-ladder.js merges this SPEC into its own with Object.assign, so the ladder machinery is unchanged.
 *   SPEC[kind](numbers) -> { marks, count, model }
 *     marks   rung 1: outline the fraction bar / line / wall picture (never the answer).
 *     count   rung 2: steps played one by one on the picture (count the parts, point at the marked points).
 *             Never names the answer unless that number is already in the question.
 *     model   rung 3: the whole model, which may reveal the answer (the child still taps it).
 * The matching hint TEXT (feedback-lines.js hints) and rung-2/3 DRAWINGS (hint-draw-band2d.js) are keyed by
 * the same kind. For the two-button compare questions (mode 1) the model marks the bigger picture; for the
 * fraction-answer questions it marks the shaded parts / the marked point; for the whole-number questions it
 * shows the answer as a short row of dots.
 */
(function () {
  'use strict';

  NBA.define('hintLadderBand2d', [], () => {
    const SPEC = {
      // frac.unit: mode 0 "how many parts are not coloured" (answer d - c, a whole number): rung 2 counts the
      // coloured parts that are already shown (c), rung 3 shows the parts not coloured as dots. mode 1 compare
      // two unit fractions: rung 3 marks the bigger bar (the one cut into fewer, bigger parts).
      'frac-unit': (x) => (x.mode
        ? { marks: ['pattern'], count: [{ do: 'point-bars' }], model: { kind: 'frac-compare', bigger: x.d1 < x.d2 ? 0 : 1 } }
        : { marks: ['pattern'], count: [{ do: 'count-shaded' }], model: { kind: 'frac-whole', answer: x.d - x.c } }),
      // frac.non-unit: mode 0 "how many are left" (answer n - p): rung 2 counts the taken parts (p, shown),
      // rung 3 shows the parts left as dots. mode 1 "what fraction is coloured" (answer p/d): rung 2 counts the
      // shaded parts (p), rung 3 outlines the shaded part of the bar (the fraction is the picture).
      'frac-nonunit': (x) => (x.mode
        ? { marks: ['pattern'], count: [{ do: 'count-shaded' }], model: { kind: 'frac-shaded' } }
        : { marks: ['pattern'], count: [{ do: 'count-shaded' }], model: { kind: 'frac-whole', answer: x.n - x.p } }),
      // frac.on-line: mode 0 "what fraction is the hop" (answer k/d): rung 2 counts the parts from 0 to the
      // hop (k, shown), rung 3 marks the point (the fraction is the marked tick). mode 1 compare two points:
      // rung 3 marks the point further along (the bigger top, as both share a bottom number).
      'frac-line': (x) => (x.mode
        ? { marks: ['pattern'], count: [{ do: 'point-marks' }], model: { kind: 'frac-further', bigger: x.k1 > x.k2 ? 0 : 1 } }
        : { marks: ['pattern'], count: [{ do: 'count-ticks' }], model: { kind: 'frac-point' } }),
      // frac.compare-wall: mode 0 "a half is how many parts" (answer d / 2, a whole number): rung 2 points at
      // the d-part bar strips, rung 3 shows the answer as dots. mode 1 compare on the wall: rung 3 marks the
      // bigger bar (the one with more shaded strips).
      'frac-wall': (x) => (x.mode
        ? { marks: ['pattern'], count: [{ do: 'point-bars' }], model: { kind: 'frac-compare', bigger: x.k1 > x.k2 ? 0 : 1 } }
        : { marks: ['pattern'], count: [{ do: 'count-strips' }], model: { kind: 'frac-whole', answer: x.d / 2 } })
    };

    return { SPEC };
  });
}());
