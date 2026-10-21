/*
 * hintLadderBand3b (L2, step 11 sub-build B): the hint SPEC rows for the band-3 AREA MODEL, REMAINDER and LONG DIVISION question
 * types, kept out of hint-ladder.js so it stays under the 400-line limit. hint-ladder.js merges this SPEC into its own with
 * Object.assign.
 *   SPEC[kind](numbers) -> { marks, count, model }
 *     marks   rung 1: what to outline (the picture). Never the answer.
 *     count   rung 2: the steps played one by one. Names no number the question did not already show.
 *     model   rung 3: the whole model, which reveals the answer (the child still taps it). Always carries `answer`.
 * The matching hint TEXT (feedback-lines.js hints) and rung drawings (hint-draw-band3b.js) are keyed by the same kind. The long
 * division layout (bring down, subtract) is the rung-3 model of div-long and div-long-word (D11-6: no new interaction).
 */
(function () {
  'use strict';

  NBA.define('hintLadderBand3b', [], () => {
    const tens = (n) => n - (n % 10);
    const ones = (n) => n % 10;

    const SPEC = {
      // mul-area1: rung 1 outlines the rectangle, rung 2 points at the tens part then the ones part, rung 3 writes the two
      // partial products and their total.
      'mul-area1': (x) => ({
        marks: ['pattern'],
        count: [{ do: 'point-parts' }],
        model: { kind: 'area-answer', cells: [tens(x.a) * x.b, ones(x.a) * x.b], answer: x.a * x.b }
      }),
      // mul-area2: rung 2 points at the four parts; rung 3 writes the four partial products and their total.
      'mul-area2': (x) => ({
        marks: ['pattern'],
        count: [{ do: 'point-parts' }],
        model: {
          kind: 'area-answer',
          cells: [tens(x.a) * tens(x.b), ones(x.a) * tens(x.b), tens(x.a) * ones(x.b), ones(x.a) * ones(x.b)],
          answer: x.a * x.b
        }
      }),
      // div-rem: rung 1 outlines the piles, rung 2 counts the full piles then points at the leftover pile; rung 3 writes the
      // whole part and the remainder (and the round-up for the van story).
      'div-rem': (x) => ({
        marks: ['pattern'],
        count: [{ do: 'count-piles' }],
        model: { kind: 'rem-answer', mode: x.mode, full: Math.floor(x.n / x.d), rem: x.n % x.d, answer: remAnswer(x) }
      }),
      // The two division sums: rung 2 points at each place of the number from the left; rung 3 writes the long-division layout.
      'div-multi': (x) => ({ marks: ['pattern'], count: [{ do: 'share-places' }], model: { kind: 'long-answer', n: x.n, d: x.d, answer: x.n / x.d } }),
      'div-multi-word': (x) => ({ marks: ['pattern'], count: [{ do: 'point-story' }], model: { kind: 'long-answer', n: x.n, d: x.d, answer: x.n / x.d } }),
      'div-long': (x) => ({ marks: ['pattern'], count: [{ do: 'share-places' }], model: { kind: 'long-answer', n: x.n, d: x.d, answer: x.n / x.d } }),
      'div-long-word': (x) => ({ marks: ['pattern'], count: [{ do: 'point-story' }], model: { kind: 'long-answer', n: x.n, d: x.d, answer: Math.floor(x.n / x.d) } })
    };

    /** The answer of a remainder question: full piles (floor), left over (mod), or vans needed (ceil). */
    function remAnswer(x) {
      if (x.mode === 2) return Math.ceil(x.n / x.d);
      return x.mode === 0 ? Math.floor(x.n / x.d) : x.n % x.d;
    }

    return { SPEC };
  });
}());
