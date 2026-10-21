/*
 * questionTypesBand2d (L2, step 10 sub-build D): the band-2 (ages 7 to 9) FRACTION question types and their
 * difficulty families, kept out of question-types.js and the band-2 siblings (all near the 400-line limit) and
 * merged by question-types.js with Object.assign exactly like the other band-2 siblings.
 *
 * Sub-build D concepts (plan 2.5 / 9D, every prereq built in band 1):
 *   frac.unit          frac-unit      equal parts: thirds, fifths and other unit fractions
 *   frac.non-unit      frac-nonunit   fractions like 3 out of 4
 *   frac.on-line       frac-line      fractions on a number line
 *   frac.compare-wall  frac-wall      comparing fractions with a fraction wall; fractions equal to a half
 *
 * All are inputMode "choices", answerType "integer". The naming activities use the NEW representation
 * "fraction-bar" (a bar split into equal parts, some shaded, D10-2 = A); frac-line uses "number-line" (a 0 to 1
 * line split into equal parts with a marked hop), so fractions appear BOTH on a number line and on bars (prompt);
 * frac-wall uses "fraction-bar" too and is drawn as a STACK of fraction-bars (the wall), not a separate rep id.
 *
 * Fractions are written as "3/4" or words, NEVER a Unicode vulgar-fraction glyph (ASCII rule). A question whose
 * curriculum answer is a fraction (frac-nonunit level 3, frac-line level 2) is still a CHOICE/integer activity:
 * the button data-value is a numeric CODE (num*100 + den) and choiceText shows the ASCII fraction "num/den", the
 * same pattern band-1 even/odd and band-2 compare-pv use for a word/number label. check=None compare questions
 * (D10-8 = A) are two-button choices (answer 0 or 1) whose choiceText shows the two curriculum fractions only.
 * Every number traces to docs/curriculum-data.json examples and level sentences (D10-8/D10-9); nothing is
 * invented, and every level and bound is a design hypothesis (CLAUDE.md rule 8). Speech never holds a maths sign.
 *   TYPES[id] = { key, size, create, choices? }   same shape as question-types.js, pure.
 *   FAMILIES[name](params)   every candidate for one difficulty level (params from data/difficulty.js).
 */
(function () {
  'use strict';

  NBA.define('questionTypesBand2d', ['util'], (util) => {
    const { shuffle } = util;

    /** A fraction num/den as a single integer CODE (den is 2..99, so num*100 + den never collides). */
    function fracCode(num, den) { return num * 100 + den; }
    /** The ASCII "num/den" label for a fraction code (choiceText only; never a vulgar-fraction glyph). */
    function fracLabel(code) { return Math.floor(code / 100) + '/' + (code % 100); }

    /** Up to `want` other values from `pool` (never the answer), kept distinct, for the answer buttons. */
    function others(answer, pool, want, rng) {
      const opts = shuffle(pool.filter((v, i) => v !== answer && pool.indexOf(v) === i), rng).slice(0, want);
      return shuffle([answer].concat(opts), rng);
    }
    /** Three tidy whole-number buttons near `answer`, off by one and two, kept >= 0. */
    function nearWhole(answer, rng) {
      const pool = [answer - 1, answer + 1, answer - 2, answer + 2, answer + 3].filter((v) => v >= 0);
      return others(answer, pool, 2, rng);
    }
    /** Three fraction-code buttons with the SAME denominator as the answer: the right top and two near tops. */
    function nearFracSameDen(num, den, rng) {
      const tops = [num, num - 1, num + 1, num - 2, num + 2].filter((t) => t >= 1 && t <= den);
      return others(fracCode(num, den), tops.map((t) => fracCode(t, den)), 2, rng);
    }

    /* ---------- difficulty families (candidate sets) ---------- */
    // Every bound is a design hypothesis; the numbers stay inside the docs/curriculum-data.json examples and
    // level sentences. d = parts of the whole, c = coloured/eaten part, k = hop along the line.
    const FAMILIES = {
      // frac-unit: mode 0 "a bar of d parts, c coloured, how many parts are NOT coloured" (answer d - c, a
      // whole number); mode 1 compare two unit fractions 1/d1 and 1/d2 "which is bigger" (two-button choice).
      'frac-unit': (p) => {
        const out = [];
        if (p.mode === 0) {
          (p.parts || []).forEach((d) => { for (let c = 1; c < d; c++) out.push({ d: d, c: c, mode: 0 }); });
        } else {
          (p.pairs || []).forEach((pr) => out.push({ d1: pr[0], d2: pr[1], mode: 1 }));
        }
        return out;
      },
      // frac-nonunit: mode 0 "whole of n, p taken, how many are left/not" (answer n - p, a whole number); mode 1
      // "p of d equal parts are coloured, what fraction is coloured" (answer the fraction code p/d).
      'frac-nonunit': (p) => {
        const out = [];
        if (p.mode === 0) {
          (p.wholes || []).forEach((w) => { for (let t = 1; t < w; t++) out.push({ n: w, p: t, mode: 0 }); });
        } else {
          (p.parts || []).forEach((d) => { for (let k = 1; k < d; k++) out.push({ p: k, d: d, mode: 1 }); });
        }
        return out;
      },
      // frac-line: mode 0 "a 0 to 1 line split into d equal parts, hop k from 0, what fraction" (answer the
      // fraction code k/d); mode 1 compare two fractions k1/d and k2/d with the SAME bottom number d "which is
      // further along the line" (two-button choice). Both come straight from the curriculum examples.
      'frac-line': (p) => {
        const out = [];
        if (p.mode === 0) {
          (p.parts || []).forEach((d) => { for (let k = 1; k < d; k++) out.push({ k: k, d: d, mode: 0 }); });
        } else {
          (p.pairs || []).forEach((pr) => out.push({ k1: pr[0], k2: pr[1], d: pr[2], mode: 1 }));
        }
        return out;
      },
      // frac-wall: mode 0 "half equals how many of d parts: 1/2 = ?/d, fill in the top" (answer d / 2, a whole
      // number, d even); mode 1 compare two fractions k1/d and k2/d with the same bottom number on the wall
      // "which is bigger" (two-button choice). Numbers from the examples (1/2 = ?/8, 3/8 or 5/8).
      'frac-wall': (p) => {
        const out = [];
        if (p.mode === 0) {
          (p.dens || []).forEach((d) => out.push({ d: d, mode: 0 }));
        } else {
          (p.pairs || []).forEach((pr) => out.push({ k1: pr[0], k2: pr[1], d: pr[2], mode: 1 }));
        }
        return out;
      }
    };

    /* ---------- the four band-2 fraction question types ---------- */
    const TYPES = {
      // frac.unit: a bar split into d equal parts with c shaded. mode 0 asks how many parts are not coloured
      // (a whole number d - c). mode 1 asks which unit fraction is bigger, a two-button choice whose labels are
      // the two unit fractions written as 1/d (D10-8). The bar picture carries the task when sound is off.
      'frac-unit': {
        key: (x) => (x.mode
          ? 'frac-unit:cmp:' + x.d1 + '-' + x.d2
          : 'frac-unit:' + x.d + '/' + x.c),
        size: (x) => (x.mode ? Math.max(x.d1, x.d2) : x.d),
        create: (x) => (x.mode
          ? {
            display: ['Which is bigger?', fracLabel(fracCode(1, x.d1)) + ' or ' + fracLabel(fracCode(1, x.d2)) + '?'],
            speech: 'Which is bigger: one ' + wordDen(x.d1) + ' or one ' + wordDen(x.d2) + '?',
            // The bigger unit fraction has the SMALLER bottom number (fewer, bigger parts). answer 0 = left.
            answer: x.d1 < x.d2 ? 0 : 1,
            choiceText: { 0: fracLabel(fracCode(1, x.d1)), 1: fracLabel(fracCode(1, x.d2)) }
          }
          : {
            display: ['A bar is cut into ' + x.d + ' equal parts.', x.c + ' are coloured. How many are not?'],
            speech: 'A bar is cut into ' + x.d + ' equal parts. ' + x.c + ' are coloured. How many parts are not coloured?',
            answer: x.d - x.c
          }),
        choices: (answer, numbers, rng) => (numbers.mode ? shuffle([0, 1], rng) : nearWhole(answer, rng))
      },

      // frac.non-unit: mode 0 "a group/bar of n, p are taken, how many are left" (a whole number n - p). mode 1
      // "p of d parts are coloured, what fraction" (the fraction code p/d, shown through choiceText as "p/d").
      // The bar picture carries the task when sound is off.
      'frac-nonunit': {
        key: (x) => (x.mode
          ? 'frac-nonunit:frac:' + x.p + '/' + x.d
          : 'frac-nonunit:' + x.n + '-' + x.p),
        size: (x) => (x.mode ? x.d : x.n),
        create: (x) => (x.mode
          ? {
            display: [x.p + ' of ' + x.d + ' equal parts are coloured.', 'What fraction is coloured?'],
            speech: x.p + ' of ' + x.d + ' equal parts are coloured. What fraction is coloured?',
            answer: fracCode(x.p, x.d),
            choiceText: fracLabels(x.d)
          }
          : {
            display: ['There are ' + x.n + ' equal parts.', x.p + ' are taken. How many are left?'],
            speech: 'There are ' + x.n + ' equal parts. ' + x.p + ' are taken. How many are left?',
            answer: x.n - x.p
          }),
        choices: (answer, numbers, rng) => (numbers.mode
          ? nearFracSameDen(numbers.p, numbers.d, rng)
          : nearWhole(answer, rng))
      },

      // frac.on-line: mode 0 "a 0 to 1 line split into d equal parts, hop k from 0, what fraction" (the fraction
      // code k/d). mode 1 "which fraction is further along the line, k1/d or k2/d" (two-button choice, same
      // bottom number, so the bigger top is further). The number line carries the task when sound is off.
      'frac-line': {
        key: (x) => (x.mode
          ? 'frac-line:cmp:' + x.k1 + '-' + x.k2 + '/' + x.d
          : 'frac-line:' + x.k + '/' + x.d),
        size: (x) => x.d,
        create: (x) => (x.mode
          ? {
            display: ['Which is further along the line?', fracLabel(fracCode(x.k1, x.d)) + ' or ' + fracLabel(fracCode(x.k2, x.d)) + '?'],
            speech: 'Which is further along the line: ' + x.k1 + ' ' + wordDen(x.d) + 's or ' + x.k2 + ' ' + wordDen(x.d) + 's?',
            answer: x.k1 > x.k2 ? 0 : 1,
            choiceText: { 0: fracLabel(fracCode(x.k1, x.d)), 1: fracLabel(fracCode(x.k2, x.d)) }
          }
          : {
            display: ['A line from 0 to 1 is split into ' + x.d + ' equal parts.', 'You hop ' + x.k + ' parts. What fraction?'],
            speech: 'A line from 0 to 1 is split into ' + x.d + ' equal parts. You hop ' + x.k + ' parts from zero. What fraction is that?',
            answer: fracCode(x.k, x.d),
            choiceText: fracLabels(x.d)
          }),
        choices: (answer, numbers, rng) => (numbers.mode
          ? shuffle([0, 1], rng)
          : nearFracSameDen(numbers.k, numbers.d, rng))
      },

      // frac.compare-wall: mode 0 "a half equals how many of d parts: 1/2 = ?/d" (answer d / 2, a whole number).
      // mode 1 "which is bigger on the wall, k1/d or k2/d" (two-button choice, same bottom number). The wall
      // (a stack of fraction-bars) carries the task when sound is off.
      'frac-wall': {
        key: (x) => (x.mode
          ? 'frac-wall:cmp:' + x.k1 + '-' + x.k2 + '/' + x.d
          : 'frac-wall:half/' + x.d),
        size: (x) => x.d,
        create: (x) => (x.mode
          ? {
            display: ['Which is bigger on the wall?', fracLabel(fracCode(x.k1, x.d)) + ' or ' + fracLabel(fracCode(x.k2, x.d)) + '?'],
            speech: 'Which is bigger on the fraction wall: ' + x.k1 + ' ' + wordDen(x.d) + 's or ' + x.k2 + ' ' + wordDen(x.d) + 's?',
            answer: x.k1 > x.k2 ? 0 : 1,
            choiceText: { 0: fracLabel(fracCode(x.k1, x.d)), 1: fracLabel(fracCode(x.k2, x.d)) }
          }
          : {
            display: ['Use the fraction wall.', 'One half is the same as how many ' + wordDen(x.d) + 's?'],
            speech: 'Use the fraction wall. One half covers the same length as how many ' + wordDen(x.d) + 's?',
            answer: x.d / 2
          }),
        choices: (answer, numbers, rng) => (numbers.mode ? shuffle([0, 1], rng) : nearWhole(answer, rng))
      }
    };

    /** The word for a bottom number so speech never shows a maths sign (2 = half, 3 = third ...). */
    function wordDen(d) {
      const words = { 2: 'half', 3: 'third', 4: 'quarter', 5: 'fifth', 6: 'sixth', 8: 'eighth' };
      return words[d] || (d + 'th');
    }
    /** choiceText covering EVERY fraction with bottom number d (tops 1..d): code -> ASCII "top/d". The choices()
     *  pool only ever returns same-denominator codes in this range, so whichever buttons it picks are labelled
     *  (the generator's rng picks the buttons; create() cannot see it, so the map must cover the whole range). */
    function fracLabels(d) {
      const out = {};
      for (let t = 1; t <= d; t++) out[fracCode(t, d)] = fracLabel(fracCode(t, d));
      return out;
    }

    return { TYPES, FAMILIES };
  });
}());
