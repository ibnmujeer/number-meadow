/*
 * hintLadderBand3e (L2, step 11 sub-build E): the hint SPEC rows for the band-3 PERCENT question types, kept out of hint-ladder.js
 * so it stays under the 400-line limit. hint-ladder.js merges this SPEC into its own with Object.assign.
 *   SPEC[kind](numbers) -> { marks, count, model }
 *     marks   rung 1: what to outline (the picture). Never the answer.
 *     count   rung 2: the steps played one by one. Names no number the question did not already show.
 *     model   rung 3: the whole model, which reveals the answer (the child still taps it). Always carries `answer`.
 * The matching hint TEXT (feedback-lines.js hints) and rung drawings (hint-draw-band3e.js) are keyed by the same kind. A percent is
 * a whole number; the link activity can answer with a decimal CODE (hundredths) or a fraction CODE (num*100 + den). Rung 3 carries
 * that code so the drawing can write the real form. Rungs 1 and 2 never carry the answer in text or in drawing data.
 */
(function () {
  'use strict';

  NBA.define('hintLadderBand3e', [], () => {
    const fracCode = (num, den) => num * 100 + den;
    const gcd = (a, b) => (b ? gcd(b, a % b) : a);

    const SPEC = {
      // pct-meaning: rung 1 outlines the grid; rung 2 counts the shaded squares out of 100; rung 3 writes the percent.
      'pct-meaning': (x) => {
        const ans = x.mode === 0 ? x.x : x.mode === 1 ? x.top * 100 / x.bot : x.x * 100 / x.y;
        return { marks: ['pattern'], count: [{ do: 'count-of-hundred' }], model: { kind: 'pct-value', answer: ans } };
      },
      // pct-bench: rung 1 outlines the bar; rung 2 halves or divides by ten; rung 3 writes the amount.
      'pct-bench': (x) => ({ marks: ['pattern'], count: [{ do: 'use-the-benchmark' }], model: { kind: 'pct-value', answer: x.pct / 100 * x.amount } }),
      // pct-link: rung 1 outlines the grid; rung 2 makes the bottom number 100; rung 3 writes the matching form (a decimal, a
      // percent or a simplest fraction). The answer code is carried so the drawing can write "0.75" or "9/20".
      'pct-link': (x) => {
        if (x.mode === 0) { const code = x.top * 100 / x.bot; return { marks: ['pattern'], count: [{ do: 'make-hundredths' }], model: { kind: 'pct-dec', answer: code } }; }
        if (x.mode === 1) return { marks: ['pattern'], count: [{ do: 'make-hundredths' }], model: { kind: 'pct-value', answer: x.code } };
        const g = gcd(x.pct, 100), num = x.pct / g, den = 100 / g;
        return { marks: ['pattern'], count: [{ do: 'make-hundredths' }], model: { kind: 'pct-frac', answer: fracCode(num, den) } };
      },
      // pct-of: rung 1 outlines the sum; rung 2 finds one percent (or ten percent) first; rung 3 writes the answer.
      'pct-of': (x) => ofModel(x),
      'pct-of-word': (x) => ofModel(x)
    };

    function ofModel(x) {
      const part = x.pct / 100 * x.amount, ans = x.mode ? x.amount - part : part;
      return { marks: ['pattern'], count: [{ do: 'find-one-percent' }], model: { kind: 'pct-value', answer: ans } };
    }

    return { SPEC };
  });
}());
