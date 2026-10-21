/*
 * questionTypesBand3b (L2, step 11 sub-build B): the band-3 (ages 10 to 12) AREA MODEL, REMAINDER and LONG DIVISION question types
 * and their difficulty families, merged by question-types.js with Object.assign like the band-2 and band-3a siblings.
 *
 * Sub-build B concepts (every prereq built in bands 1 and 2, or earlier in band 3):
 *   mul.two-by-one   mul-area1   a two or three digit number times one digit, shown as a rectangle cut into tens and ones (D11-1 A)
 *   mul.two-by-two   mul-area2   a two-digit number times a two-digit number, shown as a four-part rectangle
 *   div.remainder    div-rem     counters shared into piles with a leftover pile; three kinds (mode): full groups, left over, round up
 *   div.multi-digit  div-multi   dividing a number by one digit (the sum, symbolic); div-multi-word the egg-box story (D11-7)
 *   div.long         div-long    dividing by a two-digit number (the sum, symbolic); div-long-word the bus story (D11-7)
 *
 * All are inputMode "choices", answerType "integer". The two division sums are ASKED as the sum ("646 / 19 = ?"); the written
 * long-division layout appears ONLY as the rung-3 hint (D11-6), so there is no new interaction. Area products show the sum on the
 * card and the rectangle in the picture. Speech spells every number with numberWords, so it never holds a digit run or a maths sign.
 * Every number traces to docs/curriculum-data.json (examples and level sentences); the grids around them are design hypotheses.
 *   TYPES[id] = { key, size, create, choices }      FAMILIES[name](params) = every candidate of one difficulty level.
 */
(function () {
  'use strict';

  NBA.define('questionTypesBand3b', ['util', 'numberWords'], (util, words) => {
    const { shuffle } = util;
    const TIMES = ' \u00d7 ', DIVIDE = ' \u00f7 ';
    const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const say = words.integer;

    /** Up to `want` other values from `pool` (never the answer, all different), then the answer, shuffled. */
    function others(answer, pool, want, rng) {
      const opts = shuffle(pool.filter((v, i) => v !== answer && v >= 0 && pool.indexOf(v) === i), rng).slice(0, want);
      return shuffle([answer].concat(opts), rng);
    }
    /** choiceText for a list of values: the grouped label of each. */
    function labels(values) { const m = {}; values.forEach((v) => { m[v] = fmt(v); }); return m; }
    /** A small spread of near misses around a product, used as the distractor pool. */
    const near = (answer, steps) => steps.map((s) => answer + s).filter((v) => v > 0);

    const tens = (n) => n - (n % 10);
    const ones = (n) => n % 10;

    /* ---------- difficulty families (candidate sets) ---------- */
    const FAMILIES = {
      // area1: a two or three digit number a times a one-digit number b. `pairs` are the data's own products; the grid walks a
      // and b by their steps, each product inside min..max. mul.two-by-one is one digit, so b stays 3 to 8.
      area1: (p) => {
        const out = (p.pairs || []).map((x) => ({ a: x[0], b: x[1] }));
        for (let a = p.aMin; a <= p.aMax; a += p.aStep) for (let b = p.bMin; b <= p.bMax; b += p.bStep) {
          if (a >= p.min && a <= p.max && b >= 2) out.push({ a: a, b: b });
        }
        return out;
      },
      // area2: a two-digit number times a two-digit number. `tens` are times-a-whole-ten pairs (level 2); `pairs` the data's
      // own products; the grid walks a and b by their steps (both at least two digits), under `max` where given.
      area2: (p) => {
        const out = (p.pairs || []).map((x) => ({ a: x[0], b: x[1] }));
        (p.tens || []).forEach((x) => out.push({ a: x[0], b: x[1] }));
        for (let a = p.aMin; a <= p.aMax; a += p.aStep) for (let b = p.bMin; b <= p.bMax; b += p.bStep) {
          if (a >= 11 && b >= 11 && (!p.max || (a <= p.max && b <= p.max))) out.push({ a: a, b: b });
        }
        return out;
      },
      // div-rem: n shared into piles of d. Three kinds (mode): 0 the full piles (floor), 1 the left over (mod), 2 a round-up
      // van story (vans: total shared into vans that each hold c, so ceil). `pairs` seed it; the grid builds n = d * q + r.
      'div-rem': (p) => {
        const out = [];
        (p.pairs || []).forEach((x) => { out.push({ mode: 0, n: x[0], d: x[1] }); out.push({ mode: 1, n: x[0], d: x[1] }); });
        for (let d = p.dMin; d <= p.dMax; d++) for (let q = p.qMin; q <= p.qMax; q++) for (let r = p.rMin; r < d; r++) {
          const n = d * q + r;
          if (n <= 80 && r > 0) { out.push({ mode: 0, n: n, d: d }); out.push({ mode: 1, n: n, d: d }); }
        }
        (p.vans || []).forEach((x) => out.push({ mode: 2, n: x[0], d: x[1] }));
        for (let total = p.vMin; total <= p.vMax; total += 1) for (let c = p.cMin; c <= p.cMax; c++) {
          if (total % c !== 0) out.push({ mode: 2, n: total, d: c });
        }
        return out;
      },
      // div-multi / div-multi-word: n divided by d exactly (n = q * d). `pairs` seed it; the grid walks q and the divisor so n
      // divides exactly and stays under `max`.
      'div-multi': (p) => {
        const out = (p.pairs || []).map((x) => ({ n: x[0], d: x[1] }));
        p.divs.forEach((d) => { for (let q = p.qMin; q <= p.qMax; q++) { const n = q * d; if (n <= p.max) out.push({ n: n, d: d }); } });
        return out;
      },
      // div-long / div-long-word: n divided by a two-digit divisor (or a whole ten) exactly, except the word story asks for the
      // FULL buses of a total that need not divide (floor). `pairs` seed it; the grid walks q and the divisor.
      'div-long': (p) => {
        const out = (p.pairs || []).map((x) => ({ n: x[0], d: x[1] }));
        (p.divs || []).forEach((d) => { for (let q = p.qMin; q <= p.qMax; q++) { const n = q * d; if (n <= p.max) out.push({ n: n, d: d }); } });
        (p.tens || []).forEach((d) => { for (let q = p.qMin; q <= p.qMax; q++) { const n = q * d; if (n <= p.max) out.push({ n: n, d: d }); } });
        return out;
      }
    };
    FAMILIES['div-multi-word'] = FAMILIES['div-multi'];
    FAMILIES['div-long-word'] = FAMILIES['div-long'];

    /* ---------- create helpers ---------- */
    // The partial products of an area model: tens and ones of each factor cross-multiplied (two parts for one digit, four for two).
    function parts1(a, b) { return [tens(a) * b, ones(a) * b]; }

    // The answer and the distractor pool of a remainder question, shared by create (choiceText) and choices so they always agree.
    function remPool(x) {
      if (x.mode === 2) { const ans = Math.ceil(x.n / x.d); return { ans: ans, pool: near(ans, [-1, 1, -2, 2]) }; }
      if (x.mode === 0) { const ans = Math.floor(x.n / x.d); return { ans: ans, pool: near(ans, [-1, 1, -2, 2]) }; }
      const rem = x.n % x.d; // the left over is 0 to d-1; offer other possible remainders
      return { ans: rem, pool: [0, 1, 2, 3, 4, 5].filter((v) => v < x.d && v !== rem) };
    }

    function areaType(id, label, answerOf, partsOf) {
      const pool = (x) => near(answerOf(x), [-partsOf(x)[0], partsOf(x)[0], -partsOf(x)[1] || -1, 10, -10]);
      return {
        key: (x) => id + ':' + x.a + 'x' + x.b,
        size: (x) => answerOf(x),
        create: (x) => ({
          display: [fmt(x.a) + TIMES + fmt(x.b) + ' = ?'],
          speech: 'What is ' + say(x.a) + ' times ' + say(x.b) + '?',
          answer: answerOf(x),
          choiceText: labels(pool(x).concat([answerOf(x)]))
        }),
        choices: (answer, x, rng) => others(answer, pool(x), 2, rng)
      };
    }

    const TYPES = {
      'mul-area1': areaType('mul-area1', 'tens and ones', (x) => x.a * x.b, (x) => parts1(x.a, x.b)),
      'mul-area2': areaType('mul-area2', 'four parts', (x) => x.a * x.b, (x) => [tens(x.a) * tens(x.b), ones(x.a) * tens(x.b)]),

      'div-rem': {
        key: (x) => 'div-rem:' + x.mode + ':' + x.n + '/' + x.d,
        size: (x) => x.n,
        create(x) {
          const ans = remPool(x).ans, pool = remPool(x).pool;
          if (x.mode === 2) {
            return { display: [fmt(x.n) + ' children go on a trip.', 'A van holds ' + x.d + '. How many vans?'], answer: ans,
              choiceText: labels(pool.concat([ans])),
              speech: say(x.n) + ' children go on a trip. A van holds ' + say(x.d) + '. How many vans are needed?' };
          }
          const isFull = x.mode === 0;
          return {
            display: isFull ? ['Share ' + x.n + ' into piles of ' + x.d + '.', 'How many full piles?']
              : ['Share ' + x.n + ' into piles of ' + x.d + '.', 'How many are left over?'],
            answer: ans,
            choiceText: labels(pool.concat([ans])),
            speech: say(x.n) + ' shared into piles of ' + say(x.d) + '. ' + (isFull ? 'How many full piles?' : 'How many are left over?')
          };
        },
        choices: (answer, x, rng) => others(answer, remPool(x).pool, 2, rng)
      },

      'div-multi': divSym('div-multi', (x) => x.n / x.d),
      'div-multi-word': {
        key: (x) => 'div-multi-word:' + x.n + '/' + x.d,
        size: (x) => x.n,
        create(x) {
          const ans = x.n / x.d;
          return { display: ['A farmer packs ' + fmt(x.n) + ' eggs', 'into boxes of ' + x.d + '. How many boxes?'], answer: ans,
            choiceText: labels(near(ans, [-1, 1, -2, 2, 10]).concat([ans])),
            speech: 'A farmer packs ' + say(x.n) + ' eggs into boxes of ' + say(x.d) + '. How many boxes?' };
        },
        choices: (answer, x, rng) => others(answer, near(answer, [-1, 1, -2, 2, 10]), 2, rng)
      },

      'div-long': divSym('div-long', (x) => x.n / x.d),
      'div-long-word': {
        key: (x) => 'div-long-word:' + x.n + '/' + x.d,
        size: (x) => x.n,
        create(x) {
          const ans = Math.floor(x.n / x.d);
          return { display: ['A bus carries ' + x.d + ' children.', 'How many full buses for ' + fmt(x.n) + '?'], answer: ans,
            choiceText: labels(near(ans, [-1, 1, -2, 2, 3]).concat([ans])),
            speech: 'A bus carries ' + say(x.d) + ' children. How many full buses are filled by ' + say(x.n) + ' children?' };
        },
        choices: (answer, x, rng) => others(answer, near(answer, [-1, 1, -2, 2, 3]), 2, rng)
      }
    };

    /** The two symbolic division sums (div-multi, div-long): the sum on a plain card, the answer the exact quotient. */
    function divSym(id, answerOf) {
      const pool = (x) => near(answerOf(x), [-1, 1, -2, 2, 10, -10]);
      return {
        key: (x) => id + ':' + x.n + '/' + x.d,
        size: (x) => x.n,
        create: (x) => ({
          display: [fmt(x.n) + DIVIDE + fmt(x.d) + ' = ?'],
          speech: 'What is ' + say(x.n) + ' divided by ' + say(x.d) + '?',
          answer: answerOf(x),
          choiceText: labels(pool(x).concat([answerOf(x)]))
        }),
        choices: (answer, x, rng) => others(answer, pool(x), 2, rng)
      };
    }

    return { TYPES, FAMILIES, fmt };
  });
}());
