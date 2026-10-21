/*
 * questionTypesBand3f (L2, step 11 sub-build F): the band-3 (ages 10 to 12) NEGATIVE NUMBER, ORDER-OF-OPERATIONS and LETTER
 * question types and their difficulty families, merged by question-types.js with Object.assign like the band-2 and band-3a-e
 * siblings.
 *
 * Sub-build F concepts (every prereq built in bands 1 and 2, or earlier in band 3):
 *   neg.compare-order   neg-compare   which of two negative numbers is colder, and how many steps between two numbers, on the
 *                                     vertical number line (a two-button choice, or a whole-number step count)
 *   neg.add-sub         neg-addsub    adding and taking away with negative numbers on a horizontal signed number line (the answer
 *                                     may be negative)
 *   ops.brackets        ops-brackets  do the bracket first (symbolic). No story in the data, so this concept has only a symbolic
 *                                     way and mastery keeps it at Practising (D11-7 ceiling, said in the adult text).
 *   ops.mul-before-add  ops-order     multiply and divide before add and take away (symbolic); ops-order-word the data's own
 *                                     "loose items and boxes of counters" story (D11-7 word problem)
 *   unk.letter          unk-letter    find the number a letter stands for (symbolic); unk-letter-word the data's pens story
 *                                     (D11-7 word problem)
 *
 * All are inputMode "choices", answerType "integer". Negative numbers are written with the escaped minus sign on screen; speech
 * spells every number through numberWords ("minus five", never the sign), and a letter is spoken as "the number n" (D11-10). The
 * display never holds a bare maths symbol in speech. Every number traces to docs/curriculum-data.json examples and level sentences;
 * the number lines and step counts are design hypotheses (CLAUDE.md rule 8).
 *   TYPES[id] = { key, size, create, choices }      FAMILIES[name](params) = every candidate of one difficulty level.
 */
(function () {
  'use strict';

  NBA.define('questionTypesBand3f', ['util', 'numberWords'], (util, words) => {
    const { shuffle } = util;
    const MINUS = ' \u2212 ', TIMES = ' \u00d7 ', DIVIDE = ' \u00f7 ';
    const NEG = '\u2212';                 // the bare minus sign for a negative label, like "-5"
    const say = words.integer;
    const sayLetter = words.letter;       // 'n' -> 'the number n'
    const neg = (n) => (n < 0 ? NEG + Math.abs(n) : String(n)); // "-5" with the escaped minus; a non-negative stays plain

    /** Up to `want` other values from `pool` (never the answer, all different), then the answer, shuffled. */
    function others(answer, pool, want, rng) {
      const opts = shuffle(pool.filter((v, i) => v !== answer && pool.indexOf(v) === i), rng).slice(0, want);
      return shuffle([answer].concat(opts), rng);
    }
    /** Three tidy buttons near a (possibly negative) answer: off by one and two, no range floor. */
    function nearSigned(answer, rng) {
      const pool = [answer - 1, answer + 1, answer - 2, answer + 2, answer + 3];
      return others(answer, pool, 2, rng);
    }
    /** Three tidy non-negative buttons near a whole-number answer. */
    function nearWhole(answer, rng) {
      const pool = [answer - 1, answer + 1, answer - 2, answer + 2, answer + 3].filter((v) => v >= 0);
      return others(answer, pool, 2, rng);
    }
    /** choiceText for the two colder-choice values, so the buttons read "-3" / "-7" with the escaped minus. */
    function negLabels(values) { const m = {}; values.forEach((v) => { m[v] = neg(v); }); return m; }

    /* ---- order-of-operations expressions. An operator is stored as an integer CODE (so `numbers` stays an int object): + is 0,
       - is 1, x is 2, / is 3. A difficulty row writes the operators as the strings "+", "-", "x", "/"; the FAMILIES turn them into
       codes. The TYPES turn a candidate's flat integer fields back into a token list [a, '+', b, ...] to work out and to display. ---- */
    const OPS = ['+', '-', 'x', '/'];
    const OPC = { '+': 0, '-': 1, 'x': 2, '/': 3 };
    // flat5 keeps a bracket position `brk` (0 = the bracket is the first pair "(a s1 b) s2 c", 1 = the second pair "a s1 (b s2 c)")
    // so the data's own shapes "(3 + 2) x 4" and "20 - (6 + 4)" are both built. ops-order has no bracket, so it ignores brk.
    const flat5 = (mode, e) => ({ mode: mode, a: e[0], s1: OPC[e[1]], b: e[2], s2: OPC[e[3]], c: e[4], brk: e[5] || 0 });
    const flat9 = (e) => ({ mode: 1, a: e[0], s1: OPC[e[1]], b: e[2], s2: OPC[e[3]], c: e[4], s3: OPC[e[5]], d: e[6], s4: OPC[e[7]], ee: e[8] });
    const tokens5 = (x) => [x.a, OPS[x.s1], x.b, OPS[x.s2], x.c];
    const tokens9 = (x) => [x.a, OPS[x.s1], x.b, OPS[x.s2], x.c, OPS[x.s3], x.d, OPS[x.s4], x.ee];
    const apply = (x, op, y) => (op === '+' ? x + y : op === '-' ? x - y : op === 'x' ? x * y : x / y);
    const SIGN = { '+': ' + ', '-': MINUS, 'x': TIMES, '/': DIVIDE };
    function evalBracketFirst(e) { // bracket is always the first pair: (a s1 b) s2 c
      return apply(apply(e[0], e[1], e[2]), e[3], e[4]);
    }
    // A flat token list [n0, op0, n1, op1, n2, ...] evaluated with x and / before + and -, each pass left to right.
    function evalTokens(tokens) {
      const nums = [], ops = [];
      tokens.forEach((t, i) => { if (i % 2 === 0) nums.push(t); else ops.push(t); });
      const n2 = [nums[0]], o2 = [];
      for (let i = 0; i < ops.length; i++) {
        if (ops[i] === 'x' || ops[i] === '/') n2[n2.length - 1] = apply(n2[n2.length - 1], ops[i], nums[i + 1]);
        else { o2.push(ops[i]); n2.push(nums[i + 1]); }
      }
      let acc = n2[0];
      for (let i = 0; i < o2.length; i++) acc = apply(acc, o2[i], n2[i + 1]);
      return acc;
    }
    function evalPrecedence(e) { return evalTokens([e[0], e[1], e[2], e[3], e[4]]); } // the five-token flat sum
    const evalBracketLast = (e) => apply(e[0], e[1], apply(e[2], e[3], e[4])); // a s1 (b s2 c)
    const bracketText = (e) => '(' + e[0] + SIGN[e[1]] + e[2] + ')' + SIGN[e[3]] + e[4];
    const bracketLastText = (e) => e[0] + SIGN[e[1]] + '(' + e[2] + SIGN[e[3]] + e[4] + ')';
    const flatText = (e) => e[0] + SIGN[e[1]] + e[2] + SIGN[e[3]] + e[4];
    const SPEAK = { '+': ' plus ', '-': ' take away ', 'x': ' times ', '/': ' divided by ' };
    const bracketSpeech = (e) => 'bracket ' + say(e[0]) + SPEAK[e[1]] + say(e[2]) + ' bracket' + SPEAK[e[3]] + say(e[4]);
    const bracketLastSpeech = (e) => say(e[0]) + SPEAK[e[1]] + 'bracket ' + say(e[2]) + SPEAK[e[3]] + say(e[4]) + ' bracket';
    const flatSpeech = (e) => say(e[0]) + SPEAK[e[1]] + say(e[2]) + SPEAK[e[3]] + say(e[4]);

    /* ---------- difficulty families (candidate sets) ---------- */
    const FAMILIES = {
      // neg-compare: mode 0 "which is colder, -a or -b" from `colder` [a, b]; mode 1 "steps from `from` up to `to`" from `steps`.
      'neg-compare': (p) => {
        const out = [];
        (p.colder || []).forEach((c) => out.push({ mode: 0, a: c[0], b: c[1] }));
        (p.steps || []).forEach((s) => out.push({ mode: 1, from: s[0], to: s[1] }));
        return out;
      },
      // neg-addsub: a signed add/take-away from `sums` [a, b, op, mode]; op 0 add, op 1 take away; mode 1 starts below zero.
      'neg-addsub': (p) => (p.sums || []).map((s) => ({ a: s[0], b: s[1], op: s[2] || 0, mode: s[3] || 0 })),
      // ops-brackets: mode 0 do the bracket first from `exprs`; level 4 `pairs` asks which of (flat, bracket) is smaller. The
      // five-token sum is flattened to integer fields a, s1, b, s2, c (operators as codes), so numbers stays an int object.
      'ops-brackets': (p) => {
        const out = (p.exprs || []).map((e) => flat5(0, e));
        (p.pairs || []).forEach((e) => out.push(flat5(1, e)));
        return out;
      },
      // ops-order: a precedence sum from `exprs`; level 3 adds the longer `three` sums (with a bracket and all four signs). The
      // short sum is flat5; the long sum is flat9 (a, s1, b, s2, c, s3, d, s4, ee), all integers.
      'ops-order': (p) => {
        const out = (p.exprs || []).map((e) => flat5(0, e));
        (p.three || []).forEach((e) => out.push(flat9(e)));
        return out;
      },
      // ops-order-word: the "loose items and boxes of counters" story from `boxes` [loose, boxes, each] (loose + boxes x each).
      'ops-order-word': (p) => (p.boxes || []).map((b) => ({ loose: b[0], boxes: b[1], each: b[2] })),
      // unk-letter: mode 0 "n + k = total" (add); mode 1 "total - n = k" shape; mode 2 "k x n = total"; mode 3 "n / k = total";
      // level 4 mode 4 "k x (n + add) = total".
      'unk-letter': (p) => {
        const out = [];
        (p.add || []).forEach((a) => out.push({ mode: 0, k: a[0], total: a[1] }));
        (p.sub || []).forEach((s) => out.push({ mode: 1, total: s[0], k: s[1] }));
        (p.mul || []).forEach((m) => out.push({ mode: 2, k: m[0], total: m[1] }));
        (p.div || []).forEach((d) => out.push({ mode: 3, k: d[0], total: d[1] }));
        (p.brk || []).forEach((b) => out.push({ mode: 4, k: b[0], add: b[1], total: b[2] }));
        return out;
      },
      // unk-letter-word: the pens story from `packs` [per, total]: per x p = total, so p = total / per.
      'unk-letter-word': (p) => (p.packs || []).map((k) => ({ per: k[0], total: k[1] }))
    };

    /* ---------- the question types ---------- */
    const TYPES = {
      // neg.compare-order. mode 0: "Which is colder, -a or -b?" a two-button choice (the colder value, the lower one). mode 1:
      // "How many steps from `from` up to `to`?" a whole-number answer (to - from), which may cross zero. The vertical number
      // line carries "lower is colder / further down" when sound is off.
      'neg-compare': {
        key: (x) => (x.mode === 0 ? 'neg-compare:colder:' + x.a + '/' + x.b : 'neg-compare:steps:' + x.from + '/' + x.to),
        size: (x) => (x.mode === 0 ? x.a + x.b : x.to - x.from),
        create(x) {
          if (x.mode === 0) {
            const lo = -Math.max(x.a, x.b), hi = -Math.min(x.a, x.b); // the colder (lower) value is lo
            return {
              display: ['Which is colder, ' + neg(-x.a) + ' or ' + neg(-x.b) + '?'],
              speech: 'Which is colder, ' + say(-x.a) + ' or ' + say(-x.b) + '?',
              answer: lo, choiceText: negLabels([lo, hi])
            };
          }
          const ans = x.to - x.from;
          return {
            display: ['How many steps from ' + neg(x.from) + ' up to ' + neg(x.to) + '?'],
            speech: 'How many steps from ' + say(x.from) + ' up to ' + say(x.to) + '?',
            answer: ans
          };
        },
        choices: (answer, x, rng) => (x.mode === 0 ? shuffle([-Math.max(x.a, x.b), -Math.min(x.a, x.b)], rng) : nearWhole(answer, rng))
      },

      // neg.add-sub (symbolic sum on a signed line). "What is a + b?" or "a - b?" where the start or the answer may be below zero.
      // The signed number line shows the start and the hops; speech says "minus", never the sign.
      'neg-addsub': {
        key: (x) => 'neg-addsub:' + startOf(x) + ':' + (x.op ? '-' : '+') + x.b,
        size: (x) => Math.abs(startOf(x)) + x.b,
        create(x) {
          const start = startOf(x), ans = x.op ? start - x.b : start + x.b;
          return {
            display: ['What is ' + neg(start) + (x.op ? MINUS : ' + ') + x.b + '?'],
            speech: 'What is ' + say(start) + (x.op ? ' take away ' : ' plus ') + say(x.b) + '?',
            answer: ans
          };
        },
        choices: (answer, x, rng) => nearSigned(answer, rng)
      },

      // ops.brackets. mode 0 "What is (a s1 b) s2 c?" do the bracket first. mode 1 (level 4) "Which is smaller, flat or bracket?"
      // a two-button choice between the two values of the same numbers (D11-8: the "put a bracket" shape has no number answer).
      'ops-brackets': {
        key: (x) => (x.mode === 0 ? 'ops-brackets:' + tokens5(x).join('') + 'brk' + (x.brk || 0) : 'ops-brackets:cmp:' + tokens5(x).join('')),
        size: (x) => x.a + x.b + x.c + (x.mode ? 1 : 0),
        create(x) {
          const e = tokens5(x);
          if (x.mode === 0) {
            const last = x.brk === 1;
            return {
              display: ['What is ' + (last ? bracketLastText(e) : bracketText(e)) + '?'],
              speech: 'What is ' + (last ? bracketLastSpeech(e) : bracketSpeech(e)) + '? Do the bracket first.',
              answer: last ? evalBracketLast(e) : evalBracketFirst(e)
            };
          }
          const flat = evalPrecedence(e), brk = evalBracketLast(e); // the same numbers with and without a bracket (D11-8)
          const smaller = Math.min(flat, brk);
          return {
            display: ['Which sum is smaller?', flatText(e) + ' or ' + bracketLastText(e)],
            // Two short sentences keep each under the 14-word speech limit (the compare spells both sums out).
            speech: 'One sum is ' + flatSpeech(e) + '. The other is ' + bracketLastSpeech(e) + '. Which is smaller?',
            answer: smaller, choiceText: twoLabels(flat, brk)
          };
        },
        choices: (answer, x, rng) => (x.mode === 0 ? nearSigned(answer, rng)
          : shuffle([evalPrecedence(tokens5(x)), evalBracketLast(tokens5(x))], rng))
      },

      // ops.mul-before-add (symbolic). "What is a s1 b s2 c?" multiply and divide before add and take away. mode 1 is the longer
      // bracket-and-four-signs sum (level 3). The answer is a whole number.
      'ops-order': {
        key: (x) => (x.mode === 0 ? 'ops-order:' + tokens5(x).join('') : 'ops-order:three:' + tokens9(x).join('')),
        size: (x) => (x.mode === 1 ? x.a + x.b + x.c + x.d + x.ee : x.a + x.b + x.c),
        create(x) {
          if (x.mode === 1) {
            const e = tokens9(x);
            // Two short sentences keep each under the 14-word speech limit (the long sum spells every number and sign).
            return { display: ['What is ' + threeText(e) + '?'],
              speech: 'Start with bracket ' + say(e[0]) + SPEAK[e[1]] + say(e[2]) + ' bracket. Then' + SPEAK[e[3]] + say(e[4])
                + SPEAK[e[5]] + say(e[6]) + SPEAK[e[7]] + say(e[8]) + '. What is the whole sum?',
              answer: evalThree(e) };
          }
          const e = tokens5(x);
          return {
            display: ['What is ' + flatText(e) + '?'],
            speech: 'What is ' + flatSpeech(e) + '? Do the times and divide first.',
            answer: evalPrecedence(e)
          };
        },
        choices: (answer, x, rng) => nearWhole(answer, rng)
      },

      // ops.mul-before-add word problem (D11-7): the data's "loose items and boxes of counters" story. loose + boxes x each.
      'ops-order-word': {
        key: (x) => 'ops-order-word:' + x.loose + '+' + x.boxes + 'x' + x.each,
        size: (x) => x.loose + x.boxes * x.each,
        create(x) {
          const ans = x.loose + x.boxes * x.each;
          return {
            display: ['There are ' + x.loose + ' loose counters and ' + x.boxes + ' boxes of ' + x.each + '.', 'How many counters in all?'],
            speech: 'There are ' + say(x.loose) + ' loose counters and ' + say(x.boxes) + ' boxes of ' + say(x.each) + '. How many counters in all?',
            answer: ans
          };
        },
        choices: (answer, x, rng) => nearWhole(answer, rng)
      },

      // unk.letter (symbolic). A one-step letter sum (modes 0-3) or a bracket letter sum (mode 4, level 4). The display writes the
      // letter n and the signs; speech says "the number n". The answer is the number the letter stands for.
      'unk-letter': {
        key: (x) => 'unk-letter:' + x.mode + ':' + letterKey(x),
        size: (x) => letterAnswer(x) + x.mode,
        create(x) {
          const ans = letterAnswer(x);
          return { display: [letterText(x)], speech: letterSpeech(x), answer: ans };
        },
        choices: (answer, x, rng) => nearWhole(answer, rng)
      },

      // unk.letter word problem (D11-7): the data's pens story. per x p = total, so p = total / per.
      'unk-letter-word': {
        key: (x) => 'unk-letter-word:' + x.per + '/' + x.total,
        size: (x) => x.total,
        create(x) {
          const ans = x.total / x.per;
          return {
            display: ['A pack has ' + x.per + ' pens. p packs hold ' + x.total + ' pens.', 'What number is p?'],
            speech: 'A pack has ' + say(x.per) + ' pens. ' + sayLetter('p') + ' packs hold ' + say(x.total) + ' pens. What number is ' + sayLetter('p') + '?',
            answer: ans
          };
        },
        choices: (answer, x, rng) => nearWhole(answer, rng)
      }
    };

    /* ---- helpers for the signed sum (so the start and the land both sit on the drawn line) ---- */
    function startOf(x) { return x.mode ? -x.a : x.a; } // mode 1 starts below zero (-a); mode 0 starts at +a

    /* ---- helpers for ops-order mode 1: the longer sum (a s1 b) s2 c s3 d s4 e. Do the bracket first, then precedence
       (x and / before + and -) over bracketValue, c, d, e with signs s2, s3, s4. ---- */
    function evalThree(e) {
      const head = apply(e[0], e[1], e[2]); // the bracket value
      return evalTokens([head, e[3], e[4], e[5], e[6], e[7], e[8]]);
    }
    function threeText(e) { return '(' + e[0] + SIGN[e[1]] + e[2] + ')' + SIGN[e[3]] + e[4] + SIGN[e[5]] + e[6] + SIGN[e[7]] + e[8]; }

    /* ---- helpers for the letter sum ---- */
    function letterAnswer(x) {
      if (x.mode === 0) return x.total - x.k;       // n + k = total
      if (x.mode === 1) return x.total - x.k;       // total - n = k  -> n = total - k
      if (x.mode === 2) return x.total / x.k;       // k x n = total  -> n = total / k
      if (x.mode === 3) return x.total * x.k;        // n / k = total  -> n = total x k
      return (x.total / x.k) - x.add;               // k x (n + add) = total -> n = total/k - add
    }
    function letterKey(x) {
      if (x.mode === 0) return 'n+' + x.k + '=' + x.total;
      if (x.mode === 1) return x.total + '-n=' + x.k;
      if (x.mode === 2) return x.k + 'xn=' + x.total;
      if (x.mode === 3) return 'n/' + x.k + '=' + x.total;
      return x.k + 'x(n+' + x.add + ')=' + x.total;
    }
    function letterText(x) {
      if (x.mode === 0) return 'n + ' + x.k + ' = ' + x.total + '. What number is n?';
      if (x.mode === 1) return x.total + MINUS + 'n = ' + x.k + '. What number is n?';
      if (x.mode === 2) return x.k + TIMES + 'n = ' + x.total + '. What number is n?';
      if (x.mode === 3) return 'n' + DIVIDE + x.k + ' = ' + x.total + '. What number is n?';
      return x.k + TIMES + '(n + ' + x.add + ') = ' + x.total + '. What number is n?';
    }
    function letterSpeech(x) {
      const n = sayLetter('n');
      if (x.mode === 0) return n + ' plus ' + say(x.k) + ' equals ' + say(x.total) + '. What number is ' + n + '?';
      if (x.mode === 1) return say(x.total) + ' take away ' + n + ' equals ' + say(x.k) + '. What number is ' + n + '?';
      if (x.mode === 2) return say(x.k) + ' times ' + n + ' equals ' + say(x.total) + '. What number is ' + n + '?';
      if (x.mode === 3) return n + ' divided by ' + say(x.k) + ' equals ' + say(x.total) + '. What number is ' + n + '?';
      return say(x.k) + ' times bracket ' + n + ' plus ' + say(x.add) + ' bracket equals ' + say(x.total) + '. What number is ' + n + '?';
    }

    /** choiceText for a two-value compare, each shown with the escaped minus when negative. */
    function twoLabels(a, b) { const m = {}; [a, b].forEach((v) => { m[v] = neg(v); }); return m; }

    return { TYPES, FAMILIES, evalBracketFirst, evalPrecedence, letterAnswer };
  });
}());
