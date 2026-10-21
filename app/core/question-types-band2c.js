/*
 * questionTypesBand2c (L2, step 10 sub-build C): the band-2 (ages 7 to 9) MULTIPLICATION and DIVISION question
 * types and their difficulty families, kept out of question-types-band2.js / -band2b.js (both near the 400-line
 * limit) and merged by question-types.js with Object.assign exactly like the other band-2 siblings.
 *
 * Sub-build C concepts (plan 2.5 / 9C, every prereq built in sub-build A/B or band 1):
 *   mul.arrays        mul-array     rows and columns, and adding the same number again
 *   mul.facts-2-5-10  mul-fact      times tables for 2, 5 and 10 (Step 6: these tables only)
 *   mul.facts-3-4     mul-fact34    times tables for 3 and 4
 *   div.group         div-group     dividing by making equal groups (how many groups?)
 *   div.inverse       div-inverse   dividing as the opposite of multiplying
 *
 * Step 6 owner decision: the band-2 build covers the tables for 2, 3, 4, 5 and 10 ONLY. mul.facts-6-9 and the
 * division facts (div.facts) stay band 3 (Step 11) and are NOT built here.
 *
 * All are inputMode "choices", answerType "integer". The multiplication types and div.inverse use the NEW
 * representation "array" (rows x columns of counters, D10-2 = A); div.group uses "visual" (its proposedWays is
 * empty in the curriculum data, so it reuses the existing counter picture, like the built div.share). Every
 * number traces to docs/curriculum-data.json examples and level sentences (D10-8/D10-9); nothing is invented,
 * and every level and bound is a design hypothesis (CLAUDE.md rule 8). Speech never holds a maths symbol;
 * display uses the escaped TIMES / DIVIDE constants.
 *   TYPES[id] = { key, size, create, choices? }   same shape as question-types.js, pure.
 *   FAMILIES[name](params)   every candidate for one difficulty level (params from data/difficulty.js).
 */
(function () {
  'use strict';

  NBA.define('questionTypesBand2c', ['util'], (util) => {
    const { shuffle } = util;
    const TIMES = ' \u00d7 ', DIVIDE = ' \u00f7 '; // display only; speech says the words

    /** Up to `want` other values from `pool` (never the answer), kept distinct, for the answer buttons. */
    function others(answer, pool, want, rng) {
      const opts = shuffle(pool.filter((v, i) => v !== answer && pool.indexOf(v) === i), rng).slice(0, want);
      return shuffle([answer].concat(opts), rng);
    }
    /** Three tidy buttons near a product: off by the smaller factor each way, and off by one group, kept >= 0. */
    function nearProduct(answer, step, rng) {
      const pool = [answer - step, answer + step, answer - 2 * step, answer + 2 * step, answer - 1, answer + 1].filter((v) => v >= 0);
      return others(answer, pool, 2, rng);
    }
    /** Three tidy buttons near a quotient (a small whole number): off by one and off by two, kept >= 1. */
    function nearQuotient(answer, rng) {
      const pool = [answer - 1, answer + 1, answer - 2, answer + 2, answer + 3].filter((v) => v >= 1);
      return others(answer, pool, 2, rng);
    }

    /* ---------- difficulty families (candidate sets) ---------- */
    // Each family walks a small grid of factor pairs that come straight from the curriculum tables and the
    // level sentences. r = rows, c = columns (a factor), n = total, s = group size. Products stay within the
    // curriculum ("up to 5 x 5" for arrays, "up to 10 groups" for the tables).
    const FAMILIES = {
      // mul-array: an array of r rows and c columns. mode 0 asks the total (r x c); mode 1 asks the repeated
      // adding total (c + c + ... r times = r x c). Rows and columns stay 2..maxR / 2..maxC (arrays up to
      // 5 x 5, the curriculum top). r and c are integers (schema intObject).
      'mul-array': (p) => {
        const out = [];
        for (let r = p.rMin; r <= p.rMax; r++) for (let c = p.cMin; c <= p.cMax; c++) out.push({ r: r, c: c, mode: p.mode });
        return out;
      },
      // mul-fact / mul-fact34: a times fact `table` x k, with the table one of `tables` and k 1..kMax. The
      // answer is table x k. mode 1 also offers the turn-around (k x table), shown as the same array turned
      // round; both have the same total. table and k are integers.
      'mul-fact': (p) => {
        const out = [];
        (p.tables || []).forEach((table) => {
          for (let k = p.kMin; k <= p.kMax; k++) {
            out.push({ r: table, c: k });
            if (p.turn && table !== k) out.push({ r: k, c: table });
          }
        });
        return out;
      },
      // div-group: how many groups of `s` are in `n`, with n a multiple of s and n/s the number of groups.
      // The pairs come from the curriculum examples (12 in 3s, 20 in 4s, 18 in 3s). n and s are integers.
      'div-group': (p) => {
        const out = [];
        (p.sizes || []).forEach((s) => {
          for (let g = p.gMin; g <= p.gMax; g++) if (g * s <= p.nMax) out.push({ n: g * s, s: s });
        });
        return out;
      },
      // div-inverse: a division n / c that undoes a times fact r x c = n, with c one of the 2/5/10 tables (and
      // 3/4 at the harder level) and r 1..rMax. The answer is r. n, c and r are integers.
      'div-inverse': (p) => {
        const out = [];
        (p.cols || []).forEach((c) => {
          for (let r = p.rMin; r <= p.rMax; r++) out.push({ n: r * c, c: c });
        });
        return out;
      }
    };
    // mul-fact34 reuses the mul-fact generator; data/difficulty.js gives it the 3 and 4 tables, so the two
    // activities build different facts from the one family shape.
    FAMILIES['mul-fact34'] = FAMILIES['mul-fact'];

    /* ---------- the five band-2 multiplication / division question types ---------- */
    const TYPES = {
      // mul.arrays: an array of r rows and c columns. mode 0 asks the total; mode 1 asks the repeated-adding
      // total (c added r times). The array picture carries "so many rows of so many" when sound is off; the
      // display shows the array as a times sum (mode 0) or a repeated-adding sum (mode 1).
      'mul-array': {
        key: (x) => 'mul-array:' + x.r + 'x' + x.c + ':' + x.mode,
        size: (x) => x.r * x.c,
        create: (x) => (x.mode
          ? { display: ['Add the same number again.', Array(x.r).fill(x.c).join(' + ') + ' = ?'],
              speech: 'Add ' + x.c + ' again, ' + x.r + ' times. What is the total?', answer: x.r * x.c }
          : { display: [x.r + ' rows of ' + x.c + '.', x.r + TIMES + x.c + ' = ?'],
              speech: x.r + ' rows of ' + x.c + '. How many in all?', answer: x.r * x.c }),
        choices: (answer, numbers, rng) => nearProduct(answer, numbers.c, rng)
      },

      // mul.facts-2-5-10: a times fact for the 2, 5 or 10 table, shown as an array. The buttons are tidy near
      // products on the same table step, so a choice is always a sensible multiple. The fact is spoken in words.
      'mul-fact': {
        key: (x) => 'mul-fact:' + x.r + 'x' + x.c,
        size: (x) => x.r * x.c,
        create: (x) => ({
          display: [x.r + TIMES + x.c + ' = ?'],
          speech: 'What is ' + x.r + ' times ' + x.c + '?',
          answer: x.r * x.c
        }),
        choices: (answer, numbers, rng) => nearProduct(answer, Math.min(numbers.r, numbers.c), rng)
      },

      // mul.facts-3-4: a times fact for the 3 or 4 table, shown as an array. Same shape as mul-fact; the table
      // comes from the 3/4 family in data/difficulty.js.
      'mul-fact34': {
        key: (x) => 'mul-fact34:' + x.r + 'x' + x.c,
        size: (x) => x.r * x.c,
        create: (x) => ({
          display: [x.r + TIMES + x.c + ' = ?'],
          speech: 'What is ' + x.r + ' times ' + x.c + '?',
          answer: x.r * x.c
        }),
        choices: (answer, numbers, rng) => nearProduct(answer, Math.min(numbers.r, numbers.c), rng)
      },

      // div.group: how many groups of s are in n. The picture (n counters put into groups of s) carries the
      // "make equal groups and count them" idea when sound is off; the buttons are tidy near the group count.
      'div-group': {
        key: (x) => 'div-group:' + x.n + '/' + x.s,
        size: (x) => x.n,
        create: (x) => ({
          display: [x.n + ' in groups of ' + x.s + '.', 'How many groups?'],
          speech: x.n + ' put into groups of ' + x.s + '. How many groups are there?',
          answer: x.n / x.s
        }),
        choices: (answer, numbers, rng) => nearQuotient(answer, rng)
      },

      // div.inverse: a division that undoes a times fact, shown as an array (r rows of c make n, so n shared
      // into rows of c gives r rows). The array carries "division undoes multiplying"; the fact is spoken.
      'div-inverse': {
        key: (x) => 'div-inverse:' + x.n + '/' + x.c,
        size: (x) => x.n,
        create: (x) => ({
          display: [x.n + DIVIDE + x.c + ' = ?'],
          speech: 'What is ' + x.n + ' shared into groups of ' + x.c + '?',
          answer: x.n / x.c
        }),
        choices: (answer, numbers, rng) => nearQuotient(answer, rng)
      }
    };

    return { TYPES, FAMILIES };
  });
}());
