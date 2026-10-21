/*
 * hintDrawBand3f (L5, step 11 sub-build F): the rung 2 (count together) and rung 3 (model) drawings for the band-3 NEGATIVE
 * NUMBER, ORDER-OF-OPERATIONS and LETTER question types, registered into hint-draw.js through hintDraw.register so hint-draw.js
 * stays under the 400-line limit. Rung 1 (outline the picture) is handled by hint-draw.js through the shared "pattern" mark (the
 * vertical line, the signed line, the symbolic card and the story card are all in that mark's selector list).
 *
 * Rung 2 never names the answer: it flashes the line ticks or the sum. Rung 3 writes the model under the picture as plain lines of
 * text (a hint-ghost, removed by clear): the number the sum lands on, or the number a letter stands for. The note reuses the
 * shared .b3-note style and the sequence()/reserve() helpers, so under reduced motion the whole sequence runs at once and the stage
 * refits. A negative number is written with the escaped minus sign.
 */
(function () {
  'use strict';

  NBA.define('hintDrawBand3f', ['hintDraw'], (hintDraw) => {
    const { sequence, reserveNote } = hintDraw.helpers;
    const all = (stage, sel) => Array.prototype.slice.call(stage.querySelectorAll(sel));
    const NEG = '\u2212';
    const neg = (n) => (n < 0 ? NEG + Math.abs(n) : String(n));

    /** Text lines under the picture (a hint-ghost, removed by clear); the stage makes room and refits. */
    function note(stage, lines) {
      const el = document.createElement('div');
      el.className = 'hint-ghost b3-note';
      el.innerHTML = lines.map(() => '<div class="b3-noteline"></div>').join('');
      all(el, '.b3-noteline').forEach((n, i) => { n.textContent = lines[i]; });
      stage.appendChild(el);
      stage.classList.add('hint-col');
      const widest = lines.reduce((m, l) => Math.max(m, l.length), 0);
      reserveNote(stage, lines.length, widest);
    }
    const flashEach = (els) => sequence(els.length, (i) => { if (els[i]) els[i].classList.add('hint-flash'); });
    const flashSel = (sel) => (s) => flashEach(all(s, sel));

    // The order-of-operations arithmetic, recomputed here from q.numbers (matching questionTypesBand3f exactly).
    const apply = (x, op, y) => (op === '+' ? x + y : op === '-' ? x - y : op === 'x' ? x * y : x / y);
    function evalTokens(t) {
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
    }
    const OPS = ['+', '-', 'x', '/'];
    const tokens5 = (x) => [x.a, OPS[x.s1], x.b, OPS[x.s2], x.c];
    const tokens9 = (x) => [x.a, OPS[x.s1], x.b, OPS[x.s2], x.c, OPS[x.s3], x.d, OPS[x.s4], x.ee];
    const evalBracketFirst = (e) => apply(apply(e[0], e[1], e[2]), e[3], e[4]);
    const evalBracketLast = (e) => apply(e[0], e[1], apply(e[2], e[3], e[4]));
    const evalPrec = (e) => evalTokens([e[0], e[1], e[2], e[3], e[4]]);
    const evalThree = (e) => evalTokens([apply(e[0], e[1], e[2]), e[3], e[4], e[5], e[6], e[7], e[8]]);
    function letterAnswer(x) {
      if (x.mode === 0) return x.total - x.k;
      if (x.mode === 1) return x.total - x.k;
      if (x.mode === 2) return x.total / x.k;
      if (x.mode === 3) return x.total * x.k;
      return (x.total / x.k) - x.add;
    }

    // hint-draw.js calls a model drawer as fn(stage, q); each one recomputes its answer from q.numbers (keyed by activity id).
    const negAns = (x) => (x.mode === 0 ? -Math.max(x.a, x.b) : x.to - x.from);
    const addsubAns = (x) => { const start = x.mode ? -x.a : x.a; return x.op ? start - x.b : start + x.b; };
    const MODEL = {
      'neg-compare': (s, q) => note(s, ['The answer is ' + neg(negAns(q.numbers)) + '.']),
      'neg-addsub': (s, q) => note(s, ['The answer is ' + neg(addsubAns(q.numbers)) + '.']),
      'ops-brackets': (s, q) => { const x = q.numbers; note(s, ['The answer is ' + (x.mode === 0 ? (x.brk === 1 ? evalBracketLast(tokens5(x)) : evalBracketFirst(tokens5(x))) : Math.min(evalPrec(tokens5(x)), evalBracketLast(tokens5(x)))) + '.']); },
      'ops-order': (s, q) => { const x = q.numbers; note(s, ['The answer is ' + (x.mode ? evalThree(tokens9(x)) : evalPrec(tokens5(x))) + '.']); },
      'ops-order-word': (s, q) => { const x = q.numbers; note(s, ['The answer is ' + (x.loose + x.boxes * x.each) + '.']); },
      'unk-letter': (s, q) => note(s, ['The answer is ' + letterAnswer(q.numbers) + '.']),
      'unk-letter-word': (s, q) => { const x = q.numbers; note(s, ['The answer is ' + (x.total / x.per) + '.']); }
    };

    // The rung-2 drawer, keyed by the activity id (the hint kind). It flashes the picture parts, never the answer.
    const COUNT = {
      'neg-compare': flashSel('.b2-vrow'),
      'neg-addsub': flashSel('.b3-nltick'),
      'ops-brackets': flashSel('.b3-divline'),
      'ops-order': flashSel('.b3-divline'),
      'ops-order-word': flashSel('.b3-storyline'),
      'unk-letter': flashSel('.b3-divline'),
      'unk-letter-word': flashSel('.b3-storyline')
    };

    hintDraw.register({ count: COUNT, model: MODEL });
    return {};
  });
}());
