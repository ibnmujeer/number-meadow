/*
 * hintLadderBand3f (L2, step 11 sub-build F): the hint SPEC rows for the band-3 NEGATIVE NUMBER, ORDER-OF-OPERATIONS and LETTER
 * question types, kept out of hint-ladder.js so it stays under the 400-line limit. hint-ladder.js merges this SPEC into its own
 * with Object.assign.
 *   SPEC[kind](numbers) -> { marks, count, model }
 *     marks   rung 1: what to outline (the picture). Never the answer.
 *     count   rung 2: the steps played one by one. Names no number the question did not already show.
 *     model   rung 3: the whole model, which reveals the answer (the child still taps it). Always carries `answer`.
 * The matching hint TEXT (feedback-lines-band3.js hints) and rung drawings (hint-draw-band3f.js) are keyed by the same kind. A
 * step count and a letter value are whole numbers; a signed sum answer may be negative. Rung 3 carries that answer so the drawing
 * can write it; rungs 1 and 2 never carry the answer in text or in drawing data. The arithmetic here matches
 * questionTypesBand3f exactly (bracket first, then times and divide before add and take away).
 */
(function () {
  'use strict';

  NBA.define('hintLadderBand3f', ['questionTypesBand3f'], (qt) => {
    const { letterAnswer } = qt;
    const OPS = ['+', '-', 'x', '/'];
    const tokens5 = (x) => [x.a, OPS[x.s1], x.b, OPS[x.s2], x.c];
    const tokens9 = (x) => [x.a, OPS[x.s1], x.b, OPS[x.s2], x.c, OPS[x.s3], x.d, OPS[x.s4], x.ee];
    const apply = (x, op, y) => (op === '+' ? x + y : op === '-' ? x - y : op === 'x' ? x * y : x / y);
    const evalTokens = (t) => { // x and / before + and -, each pass left to right
      const nums = [], ops = [];
      t.forEach((v, i) => { if (i % 2 === 0) nums.push(v); else ops.push(v); });
      const n2 = [nums[0]], o2 = [];
      for (let i = 0; i < ops.length; i++) {
        if (ops[i] === 'x' || ops[i] === '/') n2[n2.length - 1] = apply(n2[n2.length - 1], ops[i], nums[i + 1]);
        else { o2.push(ops[i]); n2.push(nums[i + 1]); }
      }
      let acc = n2[0];
      for (let i = 0; i < o2.length; i++) acc = apply(acc, o2[i], n2[i + 1]);
      return acc;
    };
    const evalBracketFirst = (e) => apply(apply(e[0], e[1], e[2]), e[3], e[4]);
    const evalPrecedence = (e) => evalTokens([e[0], e[1], e[2], e[3], e[4]]);
    const evalBracketLast = (e) => apply(e[0], e[1], apply(e[2], e[3], e[4]));
    const evalThree = (e) => evalTokens([apply(e[0], e[1], e[2]), e[3], e[4], e[5], e[6], e[7], e[8]]);

    const SPEC = {
      // neg.compare-order: rung 1 outlines the line; rung 2 counts down (colder) or counts the steps across zero; rung 3 writes
      // the colder number, or the number of steps. The step count is a whole number already derivable from the question.
      'neg-compare': (x) => {
        if (x.mode === 0) {
          const lo = -Math.max(x.a, x.b);
          return { marks: ['pattern'], count: [{ do: 'go-lower-is-colder' }], model: { kind: 'neg-note', answer: lo } };
        }
        return { marks: ['pattern'], count: [{ do: 'count-steps' }], model: { kind: 'neg-note', answer: x.to - x.from } };
      },
      // neg.add-sub: rung 1 outlines the line; rung 2 moves from the start (right to add, left to take away); rung 3 writes the
      // number the move lands on, which may be below zero.
      'neg-addsub': (x) => {
        const start = x.mode ? -x.a : x.a, ans = x.op ? start - x.b : start + x.b;
        return { marks: ['pattern'], count: [{ do: 'move-on-the-line' }], model: { kind: 'neg-note', answer: ans } };
      },
      // ops.brackets: rung 1 outlines the sum; rung 2 does the bracket first; rung 3 writes the answer. mode 1 (compare) writes
      // the smaller of the two values.
      'ops-brackets': (x) => {
        if (x.mode === 0) return { marks: ['pattern'], count: [{ do: 'bracket-first' }], model: { kind: 'whole-note', answer: x.brk === 1 ? evalBracketLast(tokens5(x)) : evalBracketFirst(tokens5(x)) } };
        return { marks: ['pattern'], count: [{ do: 'both-ways' }], model: { kind: 'whole-note', answer: Math.min(evalPrecedence(tokens5(x)), evalBracketLast(tokens5(x))) } };
      },
      // ops.mul-before-add: rung 1 outlines the sum; rung 2 does the times and divide first; rung 3 writes the answer.
      'ops-order': (x) => ({ marks: ['pattern'], count: [{ do: 'times-divide-first' }], model: { kind: 'whole-note', answer: x.mode ? evalThree(tokens9(x)) : evalPrecedence(tokens5(x)) } }),
      'ops-order-word': (x) => ({ marks: ['pattern'], count: [{ do: 'boxes-then-loose' }], model: { kind: 'whole-note', answer: x.loose + x.boxes * x.each } }),
      // unk.letter: rung 1 outlines the sum; rung 2 does the opposite step to free the letter; rung 3 writes the number the letter
      // stands for.
      'unk-letter': (x) => ({ marks: ['pattern'], count: [{ do: 'undo-to-find-the-letter' }], model: { kind: 'whole-note', answer: letterAnswer(x) } }),
      'unk-letter-word': (x) => ({ marks: ['pattern'], count: [{ do: 'undo-to-find-the-letter' }], model: { kind: 'whole-note', answer: x.total / x.per } })
    };

    return { SPEC };
  });
}());
