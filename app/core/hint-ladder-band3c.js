/*
 * hintLadderBand3c (L2, step 11 sub-build C): the hint SPEC rows for the band-3 FRACTION question types, kept out of
 * hint-ladder.js so it stays under the 400-line limit. hint-ladder.js merges this SPEC into its own with Object.assign.
 *   SPEC[kind](numbers) -> { marks, count, model }
 *     marks   rung 1: what to outline (the picture). Never the answer.
 *     count   rung 2: the steps played one by one. Names no number the question did not already show.
 *     model   rung 3: the whole model, which reveals the answer (the child still taps it). Always carries `answer`.
 * The matching hint TEXT (feedback-lines.js hints) and rung drawings (hint-draw-band3c.js) are keyed by the same kind. A fraction
 * answer is a CODE (num*100 + den); rung 3 carries the plain fraction so the drawing can write it. Rungs 1 and 2 never carry the
 * answer in text or in drawing data.
 */
(function () {
  'use strict';

  NBA.define('hintLadderBand3c', [], () => {
    const fracCode = (num, den) => num * 100 + den;
    const gcd = (a, b) => (b ? gcd(b, a % b) : a);
    const lcm = (a, b) => a / gcd(a, b) * b;

    const SPEC = {
      // frac-equiv: rung 1 outlines the bar(s); rung 2 points at the equal parts; rung 3 shows the matching shading (mode 0 the
      // equal fraction, mode 1 the taller shaded bar, mode 2 the simplest bar).
      'frac-equiv': (x) => {
        if (x.mode === 1) {
          return { marks: ['pattern'], count: [{ do: 'point-parts' }],
            model: { kind: 'frac-pick', pick: (x.a1 * x.b2 > x.a2 * x.b1 ? 0 : 1), answer: (x.a1 * x.b2 > x.a2 * x.b1 ? 0 : 1) } };
        }
        if (x.mode === 2) {
          const g = gcd(x.p, x.q);
          return { marks: ['pattern'], count: [{ do: 'point-parts' }],
            model: { kind: 'frac-form', top: x.p / g, bot: x.q / g, answer: fracCode(x.p / g, x.q / g) } };
        }
        return { marks: ['pattern'], count: [{ do: 'point-parts' }],
          model: { kind: 'frac-form', top: x.a * x.m, bot: x.b * x.m, answer: x.a * x.m } };
      },
      // frac-of: rung 1 outlines the bar over the counters; rung 2 shares the counters into the bottom number of piles; rung 3
      // writes one part and the taken parts, then the answer.
      'frac-of': (x) => ({
        marks: ['pattern'], count: [{ do: 'share-into-parts' }],
        model: { kind: 'frac-of-answer', one: x.w / x.b, taken: x.t, answer: x.w * x.t / x.b }
      }),
      // frac-addsame: rung 1 outlines the shaded parts; rung 2 counts the parts of each amount; rung 3 writes the top numbers
      // added (or taken away) over the same bottom number.
      'frac-addsame': (x) => ({
        marks: ['pattern'], count: [{ do: 'count-shaded' }],
        model: { kind: 'frac-sum', top: (x.mode ? x.t1 - x.t2 : x.t1 + x.t2), bot: x.b, answer: fracCode(x.mode ? x.t1 - x.t2 : x.t1 + x.t2, x.b) }
      }),
      // frac-addunlike: rung 1 outlines the two bars; rung 2 cuts both bars to the common bottom number (the lowest common
      // multiple); rung 3 writes both fractions in the common bottom number, then the answer.
      'frac-addunlike': (x) => {
        const c = lcm(x.b1, x.b2), top = x.mode ? x.t1 * (c / x.b1) - x.t2 * (c / x.b2) : x.t1 * (c / x.b1) + x.t2 * (c / x.b2);
        return { marks: ['pattern'], count: [{ do: 'match-the-parts' }],
          model: { kind: 'frac-sum', top: top, bot: c, answer: fracCode(top, c) } };
      },
      // frac-mul: rung 1 outlines the square (or the bars); rung 2 points at the overlap (or each bar); rung 3 writes the tops
      // multiplied over the bottoms multiplied, then the answer.
      'frac-mul': (x) => {
        if (x.mode) {
          return { marks: ['pattern'], count: [{ do: 'count-bars' }],
            model: { kind: 'frac-prod', top: x.w * x.t, bot: x.b, answer: fracCode(x.w * x.t, x.b) } };
        }
        const top = x.t1 * x.t2, bot = x.b1 * x.b2;
        return { marks: ['pattern'], count: [{ do: 'count-overlap' }],
          model: { kind: 'frac-prod', top: top, bot: bot, answer: fracCode(top, bot) } };
      }
    };

    return { SPEC };
  });
}());
