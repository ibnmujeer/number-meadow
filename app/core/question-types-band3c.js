/*
 * questionTypesBand3c (L2, step 11 sub-build C): the band-3 (ages 10 to 12) FRACTION question types and their difficulty
 * families, merged by question-types.js with Object.assign like the band-2 and band-3a/b siblings.
 *
 * Sub-build C concepts (every prereq built in bands 1 and 2, or earlier in band 3):
 *   frac.equivalent-compare   frac-equiv       fill the top of an equal fraction (int), compare two fractions (two-button),
 *                                              write a fraction in its simplest form (a fraction code)
 *   frac.of-amount            frac-of          a fraction of an amount: a bar of the bottom number of parts over counters (int)
 *   frac.add-same             frac-addsame     add or take away two fractions with the SAME bottom number (a fraction code)
 *   frac.add-unlike           frac-addunlike   add or take away two fractions with DIFFERENT bottom numbers (a fraction code)
 *   frac.multiply             frac-mul         a fraction of a fraction, and a whole number of a fraction (a fraction code)
 *
 * All are inputMode "choices", answerType "integer". A question whose answer is a fraction is still a CHOICE/integer activity: the
 * button data-value is a numeric CODE (num*100 + den, den 2..99) and choiceText shows the ASCII fraction "num/den"; a two-button
 * compare answers 0 or 1 and its choiceText shows the two fractions only (the band-2 fraction pattern). D11-12: when the answer is
 * an improper fraction, the display SAYS which form to give (for example "in quarters") and every button uses that one form, so no
 * button is a mixed number. Fractions are written as "3/4" (ASCII), never a vulgar-fraction glyph. Speech spells every fraction and
 * number through numberWords (D11-10), so it never holds a maths sign. Every number traces to docs/curriculum-data.json examples and
 * level sentences; the grids around them are design hypotheses. frac-mul uses the area-model way; the rest use the fraction bar.
 *   TYPES[id] = { key, size, create, choices }      FAMILIES[name](params) = every candidate of one difficulty level.
 */
(function () {
  'use strict';

  NBA.define('questionTypesBand3c', ['util', 'numberWords'], (util, words) => {
    const { shuffle } = util;
    const say = words.fraction;        // (num, den) -> 'three quarters'
    const sayInt = words.integer;      // 12 -> 'twelve'

    /** A fraction num/den as a single integer CODE (den 2..99, so num*100 + den never collides). */
    function fracCode(num, den) { return num * 100 + den; }
    /** The ASCII "num/den" label for a fraction code (choiceText only; never a vulgar-fraction glyph). */
    function fracLabel(code) { return Math.floor(code / 100) + '/' + (code % 100); }
    const gcd = (a, b) => (b ? gcd(b, a % b) : a);
    const lcm = (a, b) => a / gcd(a, b) * b;

    /** Up to `want` other values from `pool` (never the answer, all different), then the answer, shuffled. */
    function others(answer, pool, want, rng) {
      const opts = shuffle(pool.filter((v, i) => v !== answer && pool.indexOf(v) === i), rng).slice(0, want);
      return shuffle([answer].concat(opts), rng);
    }
    /** The near-top pool for a fraction answer num/den: tops within two of num, kept >= 1 (an improper top is allowed, so the cap
     *  follows the answer top). The answer top itself is always first, so the pool and the choiceText always include it. */
    function nearTops(num, den) {
      const cap = Math.max(num, den) + 3;
      return [num].concat([num - 1, num + 1, num - 2, num + 2, num + 3].filter((t) => t >= 1 && t <= cap && t !== num));
    }
    /** Three tidy whole-number buttons near `answer`, off by one and two, kept >= 0. */
    function nearWhole(answer, rng) {
      const pool = [answer - 1, answer + 1, answer - 2, answer + 2, answer + 3].filter((v) => v >= 0);
      return others(answer, pool, 2, rng);
    }
    /** Three fraction-code buttons with the SAME bottom number as the answer: the right top and two near tops. */
    function nearFracSameDen(num, den, rng) {
      return others(fracCode(num, den), nearTops(num, den).map((t) => fracCode(t, den)), 2, rng);
    }
    /** choiceText covering EVERY near-top button with bottom number den (the choices() pool only draws from this range), plus
     *  any extra codes passed in. create() cannot see the rng, so the map must cover the whole pool it could pick. */
    function fracLabelsFor(num, den, extra) {
      const m = {};
      nearTops(num, den).forEach((t) => { m[fracCode(t, den)] = fracLabel(fracCode(t, den)); });
      (extra || []).forEach((c) => { m[c] = fracLabel(c); });
      return m;
    }
    /** choiceText covering a fixed list of fraction codes: code -> ASCII "top/bottom". */
    function fracLabels(codes) { const m = {}; codes.forEach((c) => { m[c] = fracLabel(c); }); return m; }

    /* ---------- difficulty families (candidate sets) ---------- */
    // Every bound is a design hypothesis; the numbers stay inside the docs/curriculum-data.json examples and level sentences.
    const FAMILIES = {
      // frac-equiv: a level may hold any of three kinds (like div-rem holds three). mode 0 "a/b = ?/(b*m), fill the top" (a whole
      // number) from `fill` [a,b,m]; mode 1 compare two fractions (two-button) from `cmp` [a1,b1,a2,b2]; mode 2 "write p/q in its
      // simplest form" (a fraction code) from `simp` [p,q]. The three arrays seed the candidates; nothing is invented.
      'frac-equiv': (p) => {
        const out = [];
        (p.fill || []).forEach((x) => out.push({ mode: 0, a: x[0], b: x[1], m: x[2] }));
        (p.cmp || []).forEach((x) => out.push({ mode: 1, a1: x[0], b1: x[1], a2: x[2], b2: x[3] }));
        (p.simp || []).forEach((x) => out.push({ mode: 2, p: x[0], q: x[1] }));
        return out;
      },
      // frac-of: "a fraction t/b of a whole w" (answer w * t / b, a whole number). The grid keeps b dividing w so the answer is tidy.
      'frac-of': (p) => {
        const out = (p.pairs || []).map((x) => ({ t: x[0], b: x[1], w: x[2] }));
        (p.wholes || []).forEach((w) => (p.bots || []).forEach((b) => {
          if (w % b === 0) for (let t = 1; t < b; t++) out.push({ t: t, b: b, w: w });
        }));
        return out;
      },
      // frac-addsame: two fractions t1/b and t2/b, same bottom number b. mode 0 add, mode 1 take away (t1 >= t2). The answer top may
      // be above b (an improper fraction kept in b-ths, D11-12). `pairs` seed it; the grid walks b and the two tops.
      'frac-addsame': (p) => {
        const out = [];
        (p.pairs || []).forEach((x) => out.push({ mode: x[3], b: x[2], t1: x[0], t2: x[1] }));
        (p.bots || []).forEach((b) => { for (let t1 = 1; t1 < b; t1++) for (let t2 = 1; t2 < b; t2++) {
          out.push({ mode: 0, b: b, t1: t1, t2: t2 });
          if (t1 > t2) out.push({ mode: 1, b: b, t1: t1, t2: t2 });
        } });
        return out;
      },
      // frac-addunlike: two fractions t1/b1 and t2/b2 with DIFFERENT bottom numbers. The common bottom number is the lowest common
      // multiple of b1 and b2 (so a half and a third become sixths, 3/6 and 2/6), the band's own fraction-wall idea. mode 0 add,
      // mode 1 take away (the first is the larger). `pairs` seed it; the grid walks the two bottom numbers and the tops, keeping the
      // common bottom number at most 12 (the data's range).
      'frac-addunlike': (p) => {
        const out = [];
        (p.pairs || []).forEach((x) => out.push({ mode: x[4], b1: x[1], t1: x[0], b2: x[3], t2: x[2] }));
        (p.bots || []).forEach((pair) => { const b1 = pair[0], b2 = pair[1];
          if (b1 === b2 || lcm(b1, b2) > 12) return;
          for (let t1 = 1; t1 < b1; t1++) for (let t2 = 1; t2 < b2; t2++) {
            const v1 = t1 / b1, v2 = t2 / b2;
            out.push({ mode: 0, b1: b1, t1: t1, b2: b2, t2: t2 });
            if (v1 > v2) out.push({ mode: 1, b1: b1, t1: t1, b2: b2, t2: t2 });
          }
        });
        return out;
      },
      // frac-mul: a level may hold both kinds. mode 0 a fraction of a fraction (t1/b1 of t2/b2) from `pairs` [t1,b1,t2,b2] and a
      // small grid over `bots` x `bots2`; mode 1 a whole number w of a fraction (w x t/b) from `wholes` [w,t,b] and a grid over
      // `bots`. The answer top may be above the bottom number (improper, kept as a fraction, D11-12). Nothing is invented.
      'frac-mul': (p) => {
        const out = [];
        (p.pairs || []).forEach((x) => out.push({ mode: 0, t1: x[0], b1: x[1], t2: x[2], b2: x[3] }));
        (p.wholes || []).forEach((x) => out.push({ mode: 1, w: x[0], t: x[1], b: x[2] }));
        (p.bots || []).forEach((b1) => (p.bots2 || []).forEach((b2) => {
          for (let t1 = 1; t1 < b1; t1++) for (let t2 = 1; t2 < b2; t2++) out.push({ mode: 0, t1: t1, b1: b1, t2: t2, b2: b2 });
        }));
        (p.wbots || []).forEach((b) => { for (let w = 2; w <= 6; w++) for (let t = 1; t < b; t++) out.push({ mode: 1, w: w, t: t, b: b }); });
        return out;
      }
    };

    /* ---------- create helpers ---------- */
    // Compare two fractions by cross-multiplying; returns 0 if the first is bigger, 1 if the second is (never equal in the data).
    const biggerIndex = (a1, b1, a2, b2) => (a1 * b2 > a2 * b1 ? 0 : 1);
    // The simplest-form code of a fraction (divide top and bottom by their highest common factor).
    function simplest(num, den) { const g = gcd(num, den); return fracCode(num / g, den / g); }

    const TYPES = {
      // frac.equivalent-compare. mode 0 "a/b = ?/(b*m), fill the top" (a whole number). mode 1 "which is bigger" (two-button,
      // labels the two fractions). mode 2 "write p/q in its simplest form" (a fraction code). The bar wall carries the task.
      'frac-equiv': {
        key: (x) => (x.mode === 0 ? 'frac-equiv:fill:' + x.a + '/' + x.b + '*' + x.m
          : x.mode === 1 ? 'frac-equiv:cmp:' + x.a1 + '/' + x.b1 + '-' + x.a2 + '/' + x.b2
            : 'frac-equiv:simp:' + x.p + '/' + x.q),
        size: (x) => (x.mode === 0 ? x.b * x.m : x.mode === 1 ? Math.max(x.b1, x.b2) : x.q),
        create(x) {
          if (x.mode === 1) {
            const ans = biggerIndex(x.a1, x.b1, x.a2, x.b2);
            return {
              display: ['Which is bigger?', fracLabel(fracCode(x.a1, x.b1)) + ' or ' + fracLabel(fracCode(x.a2, x.b2)) + '?'],
              speech: 'Which is bigger: ' + say(x.a1, x.b1) + ' or ' + say(x.a2, x.b2) + '?',
              answer: ans, choiceText: { 0: fracLabel(fracCode(x.a1, x.b1)), 1: fracLabel(fracCode(x.a2, x.b2)) }
            };
          }
          if (x.mode === 2) {
            const ans = simplest(x.p, x.q);
            return {
              display: ['Write ' + fracLabel(fracCode(x.p, x.q)) + ' in its simplest form.', 'Which fraction is the same but smaller?'],
              speech: 'Write ' + say(x.p, x.q) + ' in its simplest form.',
              answer: ans, choiceText: fracLabels(simpChoices(x.p, x.q))
            };
          }
          const ans = x.a * x.m, big = x.b * x.m;
          return {
            display: [fracLabel(fracCode(x.a, x.b)) + ' = ?/' + big + '.', 'What is the top number?'],
            speech: 'How many ' + partWord(big, true) + ' make ' + say(x.a, x.b) + '?',
            answer: ans
          };
        },
        choices: (answer, x, rng) => (x.mode === 1 ? shuffle([0, 1], rng)
          : x.mode === 2 ? others(simplest(x.p, x.q), simpChoices(x.p, x.q), 2, rng)
            : nearWhole(answer, rng))
      },

      // frac.of-amount: "What is t/b of w?" (a whole number). The bar is split into b parts with t shaded, over a row of w counters.
      'frac-of': {
        key: (x) => 'frac-of:' + x.t + '/' + x.b + ' of ' + x.w,
        size: (x) => x.w,
        create: (x) => ({
          display: ['What is ' + fracLabel(fracCode(x.t, x.b)) + ' of ' + x.w + '?'],
          speech: 'What is ' + say(x.t, x.b) + ' of ' + sayInt(x.w) + '?',
          answer: x.w * x.t / x.b
        }),
        choices: (answer, x, rng) => nearWhole(answer, rng)
      },

      // frac.add-same: "t1/b + t2/b" or "t1/b - t2/b" (a fraction code, kept in b-ths; D11-12 says the form in the question).
      'frac-addsame': {
        key: (x) => 'frac-addsame:' + x.mode + ':' + x.t1 + (x.mode ? '-' : '+') + x.t2 + '/' + x.b,
        size: (x) => x.b,
        create(x) {
          const top = x.mode ? x.t1 - x.t2 : x.t1 + x.t2, ans = fracCode(top, x.b);
          const sum = fracLabel(fracCode(x.t1, x.b)) + (x.mode ? ' - ' : ' + ') + fracLabel(fracCode(x.t2, x.b));
          return {
            display: [sum + ' = ?', 'Give the answer in ' + partWord(x.b, true) + '.'],
            speech: (x.mode ? say(x.t1, x.b) + ' take away ' + say(x.t2, x.b) : say(x.t1, x.b) + ' and ' + say(x.t2, x.b))
              + '. How many ' + partWord(x.b, true) + '?',
            answer: ans, choiceText: fracLabelsFor(top, x.b)
          };
        },
        choices: (answer, x, rng) => nearFracSameDen(x.mode ? x.t1 - x.t2 : x.t1 + x.t2, x.b, rng)
      },

      // frac.add-unlike: "t1/b1 + t2/b2" with different bottom numbers. The common bottom number is the lowest common multiple of
      // b1 and b2; both fractions are re-cut to it (a half and a third become 3/6 and 2/6), then the tops add or take away. The
      // answer is kept in the common bottom number (D11-12 states the form in the question).
      'frac-addunlike': {
        key: (x) => 'frac-addunlike:' + x.mode + ':' + x.t1 + '/' + x.b1 + (x.mode ? '-' : '+') + x.t2 + '/' + x.b2,
        size: (x) => lcm(x.b1, x.b2),
        create(x) {
          const c = lcm(x.b1, x.b2), top = x.mode ? x.t1 * (c / x.b1) - x.t2 * (c / x.b2) : x.t1 * (c / x.b1) + x.t2 * (c / x.b2), ans = fracCode(top, c);
          const sum = fracLabel(fracCode(x.t1, x.b1)) + (x.mode ? ' - ' : ' + ') + fracLabel(fracCode(x.t2, x.b2));
          return {
            display: [sum + ' = ?', 'Give the answer in ' + partWord(c, true) + '.'],
            speech: (x.mode ? say(x.t1, x.b1) + ' take away ' + say(x.t2, x.b2) : say(x.t1, x.b1) + ' and ' + say(x.t2, x.b2))
              + '. How many ' + partWord(c, true) + '?',
            answer: ans, choiceText: fracLabelsFor(top, c)
          };
        },
        choices(answer, x, rng) {
          const c = lcm(x.b1, x.b2), top = x.mode ? x.t1 * (c / x.b1) - x.t2 * (c / x.b2) : x.t1 * (c / x.b1) + x.t2 * (c / x.b2);
          return nearFracSameDen(top, c, rng);
        }
      },

      // frac.multiply: mode 0 "t1/b1 of t2/b2" (the tops multiplied over the bottoms multiplied); mode 1 "w x t/b" (w times the top
      // over the bottom). The answer is a fraction code (kept unsimplified in the product's bottom number, so no mixed number).
      'frac-mul': {
        key: (x) => (x.mode ? 'frac-mul:whole:' + x.w + 'x' + x.t + '/' + x.b
          : 'frac-mul:' + x.t1 + '/' + x.b1 + 'of' + x.t2 + '/' + x.b2),
        size: (x) => (x.mode ? x.b : x.b1 * x.b2),
        create(x) {
          if (x.mode) {
            const top = x.w * x.t, ans = fracCode(top, x.b);
            return {
              display: [x.w + ' \u00d7 ' + fracLabel(fracCode(x.t, x.b)) + ' = ?', 'Give the answer in ' + partWord(x.b, true) + '.'],
              speech: sayInt(x.w) + ' times ' + say(x.t, x.b) + '. How many ' + partWord(x.b, true) + '?',
              answer: ans, choiceText: fracLabelsFor(top, x.b)
            };
          }
          const top = x.t1 * x.t2, bot = x.b1 * x.b2, ans = fracCode(top, bot);
          return {
            display: [fracLabel(fracCode(x.t1, x.b1)) + ' of ' + fracLabel(fracCode(x.t2, x.b2)) + ' = ?', 'Give the answer in ' + partWord(bot, true) + '.'],
            speech: say(x.t1, x.b1) + ' of ' + say(x.t2, x.b2) + '. How many ' + partWord(bot, true) + '?',
            answer: ans, choiceText: fracLabelsFor(top, bot)
          };
        },
        choices: (answer, x, rng) => (x.mode
          ? nearFracSameDen(x.w * x.t, x.b, rng)
          : nearFracSameDen(x.t1 * x.t2, x.b1 * x.b2, rng))
      }
    };

    /** The pool for a simplest-form question p/q: the right simplest fraction, the unsimplified fraction (a "did not simplify"
     *  wrong answer), a half-simplified form if there is one, and a near wrong bottom. All kept to a valid fraction code. */
    function simpChoices(p, q) {
      const g = gcd(p, q), right = fracCode(p / g, q / g);
      const pool = [right, fracCode(p, q)];
      if (g >= 4 && p % 2 === 0 && q % 2 === 0) pool.push(fracCode(p / 2, q / 2)); // halfway, still not simplest
      pool.push(fracCode(p / g, q / g + 1));                                       // a near wrong bottom
      pool.push(fracCode(p / g + 1, q / g + 1));                                   // a near wrong form
      return pool.filter((v, i) => (v % 100) >= 2 && Math.floor(v / 100) >= 1 && pool.indexOf(v) === i);
    }

    /** The part word for a bottom number, so the display and speech never show a maths sign. true = plural. */
    function partWord(d, plural) {
      const one = { 2: 'half', 3: 'third', 4: 'quarter', 5: 'fifth', 6: 'sixth', 7: 'seventh', 8: 'eighth', 9: 'ninth',
        10: 'tenth', 12: 'twelfth' };
      const w = one[d] || (words.ordinal(d));
      if (!plural) return w;
      return d === 2 ? 'halves' : w + 's';
    }

    return { TYPES, FAMILIES, fracCode, fracLabel };
  });
}());
