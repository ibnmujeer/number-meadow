/*
 * hintLadderBand2e (L2, step 10 sub-build E): the hint SPEC rows for the band-2 (ages 7 to 9) NEGATIVES,
 * ORDER-OF-OPERATIONS and MISSING-NUMBER question types, kept out of hint-ladder.js (and the band-2 siblings)
 * to stay under the 400-line limit. hint-ladder.js merges this SPEC into its own with Object.assign, so the
 * ladder machinery (rungFor, say, ladder) is unchanged.
 *   SPEC[kind](numbers) -> { marks, count, model }
 *     marks   rung 1: what to outline (the picture, or the numbers already in the question). Never the answer.
 *     count   rung 2: steps played one by one. Never names the answer unless that number is already shown.
 *     model   rung 3: the whole model, which may reveal the answer (the child still taps it).
 * The matching hint TEXT (feedback-lines.js hints) and the matching rung-2/3 DRAWINGS (hint-draw-band2e.js)
 * are keyed by the same kind. Every number used is already in the question, except the rung-3 model answer.
 */
(function () {
  'use strict';

  NBA.define('hintLadderBand2e', [], () => {
    const SPEC = {
      // neg.meaning: rung 1 marks the story number (already shown); rung 2 counts down from zero to that same
      // number, on the vertical line (never naming the signed answer as a number); rung 3 shows the negative
      // number as a marked tick on the line.
      'neg': (x) => ({
        marks: ['story-numbers'],
        count: [{ do: 'count-down' }],
        model: { kind: 'line-answer', answer: -x.n }
      }),
      // ops.left-to-right: rung 1 marks the three numbers; rung 2 does the FIRST step only (a and b, both
      // already in the question), never the final answer; rung 3 shows the running total as counters.
      'ops-steps': (x) => ({
        marks: ['story-numbers'],
        count: [{ do: 'first-step' }],
        model: { kind: 'count-answer', answer: x.mode ? x.a - x.b + x.c : x.a + x.b + x.c }
      }),
      // unk.missing-number: rung 1 marks the two numbers already in the sentence; rung 2 counts the group that
      // is already shown (never the hidden one); rung 3 shows the hidden amount as a row of counters.
      'missing-num': (x) => ({
        marks: ['story-numbers'],
        count: [{ do: 'count-known' }],
        model: { kind: 'count-answer', answer: x.mode === 0 ? x.c - x.a : (x.mode === 1 ? x.c - x.b : x.a - x.c) }
      }),
      // unk.equals-balance: rung 1 outlines the balance picture; rung 2 points at each pan, one then the
      // other (names no number the balance does not already show); rung 3 tips the balance to show which way
      // it settles (true/false) or shows the missing amount as counters.
      'balance': (x) => ({
        marks: ['pattern'],
        count: [{ do: 'point-pans' }],
        model: x.mode === 0 ? { kind: 'balance-answer', trueAnswer: x.trueAnswer }
          : { kind: 'count-answer', answer: x.mode === 1 ? x.a + x.b - x.c : x.d - x.e }
      }),
      // unk.missing-mul-div: rung 1 outlines the array/group picture; rung 2 counts one row or one group
      // (already in the question), never the hidden factor; rung 3 shows the missing number as counters.
      'missing-muldiv': (x) => ({
        marks: ['pattern'],
        count: [{ do: 'count-one-row' }],
        model: { kind: 'count-answer', answer: x.mode === 0 ? x.c / x.a : (x.mode === 1 ? x.c / x.b : (x.mode === 2 ? x.c / x.a : x.a * x.b)) }
      })
    };

    return { SPEC };
  });
}());
