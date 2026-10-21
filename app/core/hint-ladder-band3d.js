/*
 * hintLadderBand3d (L2, step 11 sub-build D): the hint SPEC rows for the band-3 DECIMAL question types, kept out of hint-ladder.js
 * so it stays under the 400-line limit. hint-ladder.js merges this SPEC into its own with Object.assign.
 *   SPEC[kind](numbers) -> { marks, count, model }
 *     marks   rung 1: what to outline (the picture). Never the answer.
 *     count   rung 2: the steps played one by one. Names no number the question did not already show.
 *     model   rung 3: the whole model, which reveals the answer (the child still taps it). Always carries `answer`.
 * The matching hint TEXT (feedback-lines.js hints) and rung drawings (hint-draw-band3d.js) are keyed by the same kind. A decimal
 * answer is a CODE in hundredths; rung 3 carries that code so the drawing can write the real decimal. Rungs 1 and 2 never carry the
 * answer in text or in drawing data.
 */
(function () {
  'use strict';

  NBA.define('hintLadderBand3d', [], () => {
    const SPEC = {
      // dec-tenths: rung 1 outlines the grid; rung 2 counts the shaded columns of ten (mode 2 the tenths); rung 3 writes the
      // decimal (modes 0 and 1) or the count of tenths (mode 2).
      'dec-tenths': (x) => {
        if (x.mode === 2) {
          return { marks: ['pattern'], count: [{ do: 'count-tenths' }], model: { kind: 'dec-count', answer: x.n } };
        }
        const code = x.mode === 1 ? x.w * 100 + x.t * 10 : x.top * 10;
        return { marks: ['pattern'], count: [{ do: 'count-columns' }], model: { kind: 'dec-value', answer: code } };
      },
      // dec-hundredths: rung 1 outlines the grid; rung 2 counts the columns then the single squares; rung 3 writes the decimal.
      'dec-hundredths': (x) => {
        const code = x.mode === 2 ? x.paise : x.mode === 1 ? x.tenths * 10 + x.hundredths : x.top;
        return { marks: ['pattern'], count: [{ do: 'count-cols-then-cells' }], model: { kind: 'dec-value', answer: code } };
      },
      // dec-compare: rung 1 outlines the line; rung 2 matches the places; rung 3 names the bigger (mode 0), the smallest (mode 1)
      // or the hundredths (mode 2). Rungs 1 and 2 never carry the answer, so the model only.
      'dec-compare': (x) => {
        if (x.mode === 0) {
          return { marks: ['pattern'], count: [{ do: 'match-places' }],
            model: { kind: 'dec-pick', pick: (x.a > x.b ? 0 : 1), answer: (x.a > x.b ? 0 : 1) } };
        }
        if (x.mode === 1) {
          const min = Math.min.apply(null, x.vals), idx = x.vals.indexOf(min);
          return { marks: ['pattern'], count: [{ do: 'match-places' }], model: { kind: 'dec-pick', pick: idx, answer: idx } };
        }
        return { marks: ['pattern'], count: [{ do: 'match-places' }], model: { kind: 'dec-count', answer: x.n } };
      },
      // dec-addsub: rung 1 outlines the two decimals; rung 2 lines up the points; rung 3 writes them lined up, then the answer.
      'dec-addsub': (x) => sumModel(x),
      'dec-addsub-word': (x) => sumModel(x),
      // dec-muldiv: rung 1 outlines the sum; rung 2 works it out as whole numbers; rung 3 writes it, then puts the point back.
      'dec-muldiv': (x) => prodModel(x),
      'dec-muldiv-word': (x) => prodModel(x)
    };

    function sumModel(x) {
      const ans = x.mode ? x.a - x.b : x.a + x.b;
      return { marks: ['pattern'], count: [{ do: 'line-up-points' }], model: { kind: 'dec-value', answer: ans } };
    }
    function prodModel(x) {
      const ans = x.mode ? x.a / x.b : x.a * x.b;
      return { marks: ['pattern'], count: [{ do: 'whole-first' }], model: { kind: 'dec-value', answer: ans } };
    }

    return { SPEC };
  });
}());
