/*
 * hintLadderBand3a (L2, step 11 sub-build A): the hint SPEC rows for the band-3 BIG NUMBERS and FACTS question types, kept out
 * of hint-ladder.js so it stays under the 400-line limit. hint-ladder.js merges this SPEC into its own with Object.assign.
 *   SPEC[kind](numbers) -> { marks, count, model }
 *     marks   rung 1: what to outline (the picture). Never the answer.
 *     count   rung 2: the steps played one by one. Names no number the question did not already show.
 *     model   rung 3: the whole model, which reveals the answer (the child still taps it). Always carries `answer`.
 * The matching hint TEXT (feedback-lines.js hints) and rung drawings (hint-draw-band3a.js) are keyed by the same kind.
 */
(function () {
  'use strict';

  NBA.define('hintLadderBand3a', [], () => {
    const digitAt = (n, p) => Math.floor(n / Math.pow(10, p)) % 10;
    const gcd = (a, b) => (b ? gcd(b, a % b) : a);
    const placeAnswer = (x) => (x.mode === 0 ? digitAt(x.n, x.p) * Math.pow(10, x.p) : (x.mode === 1 ? x.n + 1 : x.n / 1000));
    /** The answer of a factors question: the number, or 0 (Yes) / 1 (No) for the two yes/no kinds. */
    function factorsAnswer(x) {
      if (x.mode === 4) return x.n / x.rows;
      if (x.mode === 0) return x.b * x.k;
      if (x.mode === 3) return gcd(x.a, x.b);
      return x.n % x.d === 0 ? 0 : 1;
    }

    const SPEC = {
      // place-big: rung 1 outlines the chart, rung 2 points at each group of three digits, rung 3 writes the answer.
      'place-big': (x) => ({
        marks: ['pattern'],
        count: [{ do: 'read-groups' }],
        model: { kind: 'worth-answer', mode: x.mode, answer: placeAnswer(x) }
      }),
      // mul-fact69: rung 1 outlines the array, rung 2 points at the five rows then the rest (no product named),
      // rung 3 names the two partial products and the total.
      'mul-fact69': (x) => ({
        marks: ['pattern'],
        count: [{ do: 'five-rows-then-rest' }],
        model: { kind: 'split-answer', top: 5 * x.c, rest: (x.r - 5) * x.c, answer: x.r * x.c }
      }),
      // The two sums: rung 2 points at the columns from the ones leftwards; rung 3 writes the whole sum.
      'add-big': (x) => ({ marks: ['pattern'], count: [{ do: 'columns-from-ones' }], model: { kind: 'sum-answer', answer: x.a + x.b } }),
      'sub-big': (x) => ({ marks: ['pattern'], count: [{ do: 'columns-from-ones' }], model: { kind: 'sum-answer', answer: x.a - x.b } }),
      // The two stories: rung 2 points at the parts of the bar; rung 3 writes the missing number.
      'add-big-word': (x) => ({ marks: ['pattern'], count: [{ do: 'point-at-parts' }], model: { kind: 'whole-answer', answer: x.a + x.b } }),
      'sub-big-word': (x) => ({ marks: ['pattern'], count: [{ do: 'point-at-parts' }], model: { kind: 'whole-answer', answer: x.a - x.b } }),
      // div-fact: rung 1 outlines the array, rung 2 counts one row (c, already in the question), rung 3 shows the answer.
      'div-fact': (x) => ({
        marks: ['pattern'],
        count: [{ do: 'count-row' }],
        model: { kind: 'count-answer', answer: x.n / x.c }
      }),
      // factors: one ladder for the five kinds; rung 2 points at the groups, rung 3 writes the groups check or the lists.
      factors: (x) => ({
        marks: ['pattern'],
        count: [{ do: 'equal-groups', mode: x.mode }],
        model: { kind: 'groups-check', mode: x.mode, answer: factorsAnswer(x) }
      })
    };

    return { SPEC };
  });
}());
