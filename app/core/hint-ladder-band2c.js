/*
 * hintLadderBand2c (L2, step 10 sub-build C): the hint SPEC rows for the band-2 (ages 7 to 9) MULTIPLICATION
 * and DIVISION question types, kept out of hint-ladder.js (and the band-2 siblings) to stay under the 400-line
 * limit. hint-ladder.js merges this SPEC into its own with Object.assign, so the ladder machinery is unchanged.
 *   SPEC[kind](numbers) -> { marks, count, model }
 *     marks   rung 1: what to outline (the array / groups picture, or the numbers in the question). Never the answer.
 *     count   rung 2: steps played one by one (skip-count a row / point at the groups). Never names the answer.
 *     model   rung 3: the whole model, which reveals the answer (the child still taps it).
 * The matching hint TEXT (feedback-lines.js hints) and rung drawings (hint-draw-band2c.js) are keyed by the same
 * kind. Every number used is already in the question, except the rung-3 model answer.
 */
(function () {
  'use strict';

  NBA.define('hintLadderBand2c', [], () => {
    const SPEC = {
      // mul.arrays: rung 1 outlines the array; rung 2 counts ONE row (c, a number already in the question),
      // never the total; rung 3 shows the total (r x c) as a row of counters.
      'mul-array': (x) => ({
        marks: ['pattern'],
        count: [{ do: 'count-row' }],
        model: { kind: 'count-answer', answer: x.r * x.c }
      }),
      // mul.facts-2-5-10: rung 1 outlines the array; rung 2 skip-counts the rows that are on the stage (adds no
      // number the array did not show); rung 3 shows the product as counters.
      'mul-fact': (x) => ({
        marks: ['pattern'],
        count: [{ do: 'skip-count-rows' }],
        model: { kind: 'count-answer', answer: x.r * x.c }
      }),
      // mul.facts-3-4: same shape as mul-fact (the 3 and 4 tables).
      'mul-fact34': (x) => ({
        marks: ['pattern'],
        count: [{ do: 'skip-count-rows' }],
        model: { kind: 'count-answer', answer: x.r * x.c }
      }),
      // div.group: rung 1 outlines the groups; rung 2 counts the group size s (a number already in the
      // question) by pointing at one group, never the number of groups; rung 3 shows the groups counted.
      'div-group': (x) => ({
        marks: ['pattern'],
        count: [{ do: 'count-one-group' }],
        model: { kind: 'count-answer', answer: x.n / x.s }
      }),
      // div.inverse: rung 1 outlines the array; rung 2 counts ONE row (c, already in the question), never the
      // number of rows; rung 3 shows the number of rows (the answer) as counters.
      'div-inverse': (x) => ({
        marks: ['pattern'],
        count: [{ do: 'count-row' }],
        model: { kind: 'count-answer', answer: x.n / x.c }
      })
    };

    return { SPEC };
  });
}());
