/*
 * hintLadderBand2 (L2, step 10 sub-build A): the hint SPEC rows for the band-2 (ages 7 to 9) PLACE VALUE and
 * COUNTING question types, kept out of hint-ladder.js (and the band-1 SPEC that sits inline there) to stay
 * under the 400-line limit. hint-ladder.js merges this SPEC into its own with Object.assign, so the ladder
 * machinery (rungFor, say, ladder) is unchanged.
 *   SPEC[kind](numbers) -> { marks, count, model }
 *     marks   rung 1: what to outline (the numbers already in the question, or the picture). Never the answer.
 *     count   rung 2: steps played one by one (count-up / count on by a size). Never names the answer unless
 *             that number is already in the question.
 *     model   rung 3: the whole model, which may reveal the answer (the child still taps it).
 * The matching hint TEXT (feedback-lines-band2.js) and the matching rung-2/3 DRAWINGS (hint-draw-band2.js)
 * are keyed by the same kind. Every number used is already in the question, except the rung-3 model answer.
 */
(function () {
  'use strict';

  NBA.define('hintLadderBand2', [], () => {
    const SPEC = {
      // count.skip-2-5-10: rung 1 marks the start number already shown; rung 2 counts on in steps up to the
      // start number the child already sees (never past it, so the answer is not named); rung 3 shows the
      // next number as a row of counters. The count op carries no number (the drawing counts to the start n
      // from q.numbers), so it can never name the answer.
      'skip-count': (x) => ({
        marks: ['story-numbers'],
        count: [{ do: 'count-step' }],
        model: { kind: 'count-answer', answer: x.n + x.by }
      }),
      // count.to-1000: rung 1 marks the start number; rung 2 counts one step toward the start (not past it);
      // rung 3 shows the answer number. The count op carries no number.
      'count-1000': (x) => ({
        marks: ['story-numbers'],
        count: [{ do: 'count-step' }],
        model: { kind: 'count-answer', answer: x.n + x.dir }
      }),
      // place.two-digit: rung 1 outlines the pieces; rung 2 counts the tens, then the ones, that are ALREADY
      // on the stage (adds no number the pieces did not show); rung 3 names the number as a row of counters.
      'tens-ones': (x) => ({
        marks: ['pattern'],
        count: [{ do: 'count-pieces' }],
        model: { kind: 'count-answer', answer: x.mode ? x.t : x.t * 10 + x.o }
      }),
      // place.regroup: rung 1 outlines the pieces; rung 2 counts the ones that are on the stage; rung 3 shows
      // the pieces after the trade (the answer: ones left, or ones made).
      'regroup': (x) => ({
        marks: ['pattern'],
        count: [{ do: 'count-pieces' }],
        model: { kind: 'count-answer', answer: x.mode ? x.o + 10 : x.o - 10 }
      }),
      // place.hundreds: rung 1 outlines the pieces; rung 2 counts the hundreds, tens and ones on the stage;
      // rung 3 shows the number (or the tens-digit value) as a row of counters.
      'hundreds': (x) => ({
        marks: ['pattern'],
        count: [{ do: 'count-pieces' }],
        model: { kind: 'count-answer', answer: x.mode ? x.t * 10 : x.h * 100 + x.t * 10 + x.o }
      }),
      // place.compare-order (compare): rung 1 outlines both charts; rung 2 points at the biggest place of
      // each chart, one then the other (names no number the charts do not show); rung 3 marks the bigger
      // chart (the child still taps the matching number button).
      'compare-pv': (x) => ({
        marks: ['pattern'],
        count: [{ do: 'point-charts' }],
        model: { kind: 'compare-answer', bigger: x.l > x.r ? 0 : 1 }
      }),
      // place.compare-order (more/less): rung 1 marks the start number; rung 2 points at the digit that will
      // change; rung 3 shows the answer number as a chart. The count op carries no number.
      'more-less': (x) => ({
        marks: ['story-numbers'],
        count: [{ do: 'point-change' }],
        model: { kind: 'count-answer', answer: x.n + x.d }
      }),
      // place.round: rung 1 marks the number; rung 2 marks the deciding digit of the number itself (the ones
      // digit when rounding to ten, the tens digit to a hundred) - a digit the question already shows, so no
      // new number is named; rung 3 shows the nearer tidy number as the answer. The count op carries no number.
      'round-pv': (x) => ({
        marks: ['story-numbers'],
        count: [{ do: 'mark-digit' }],
        model: { kind: 'count-answer', answer: Math.round(x.n / x.to) * x.to }
      }),
      /* ---------- sub-build B: multi-digit add/sub ---------- */
      // add.facts-20: rung 1 marks the two numbers; rung 2 counts up from the bigger number by the smaller (a
      // number already in the question), never saying the answer; rung 3 shows the total as counters.
      'add-fact': (x) => ({
        marks: ['story-numbers'],
        count: [{ do: 'count-on' }],
        model: { kind: 'count-answer', answer: x.a + x.b }
      }),
      // sub.facts-20: rung 1 marks the two numbers; rung 2 counts the ones taken away (already in the question);
      // rung 3 shows what is left as counters.
      'sub-fact': (x) => ({
        marks: ['story-numbers'],
        count: [{ do: 'count-take' }],
        model: { kind: 'count-answer', answer: x.a - x.b }
      }),
      // Column add (no trade): rung 1 outlines the chart; rung 2 points at the ones column, then the tens
      // (a part the chart already shows); rung 3 shows the total as counters.
      'add2': (x) => ({ marks: ['pattern'], count: [{ do: 'point-places' }], model: { kind: 'count-answer', answer: x.a + x.b } }),
      'add3': (x) => ({ marks: ['pattern'], count: [{ do: 'point-places' }], model: { kind: 'count-answer', answer: x.a + x.b } }),
      // Column add with a trade: rung 3 shows the TRADE (ten ones carried as one ten) before the total, so the
      // child sees the regroup "then with symbols". The trade step is instant under reduced motion.
      'add2r': (x) => ({ marks: ['pattern'], count: [{ do: 'point-places' }], model: { kind: 'trade-answer', answer: x.a + x.b, trade: 'carry' } }),
      // Column take (no trade): rung 1 outlines the chart; rung 2 points at the ones then the tens; rung 3
      // shows what is left as counters.
      'sub2': (x) => ({ marks: ['pattern'], count: [{ do: 'point-places' }], model: { kind: 'count-answer', answer: x.a - x.b } }),
      'sub3': (x) => ({ marks: ['pattern'], count: [{ do: 'point-places' }], model: { kind: 'count-answer', answer: x.a - x.b } }),
      // Column take with a trade: rung 3 shows the TRADE (a ten opened into ten ones) before the answer.
      'sub2r': (x) => ({ marks: ['pattern'], count: [{ do: 'point-places' }], model: { kind: 'trade-answer', answer: x.a - x.b, trade: 'borrow' } }),
      // sub.stories-two-step: rung 1 marks the story numbers; rung 2 does the FIRST step only (a number already
      // in the question), not the final answer; rung 3 shows the running total as counters.
      'two-step': (x) => ({
        marks: ['story-numbers'],
        count: [{ do: 'first-step' }],
        model: { kind: 'count-answer', answer: x.s + x.x + x.y }
      })
    };

    return { SPEC };
  });
}());
