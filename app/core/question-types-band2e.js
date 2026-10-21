/*
 * questionTypesBand2e (L2, step 10 sub-build E): the band-2 (ages 7 to 9) NEGATIVES, ORDER-OF-OPERATIONS and
 * MISSING-NUMBER question types and their difficulty families, kept out of the other band-2 siblings (all near
 * the 400-line limit) and merged by question-types.js with Object.assign exactly like the other band-2 modules.
 *
 * Sub-build E concepts (plan 2.5 / 9E, topological order; unk.missing-mul-div depends on div.inverse, built in
 * sub-build C):
 *   neg.meaning          neg             numbers below zero (a thermometer / floors-below-ground story, or the
 *                                        opposite of a positive number)
 *   ops.left-to-right    ops-steps       several adding/taking-away steps done in order, left to right
 *   unk.missing-number   missing-num     the missing number in 3 + ? = 7, with the box in any position
 *   unk.equals-balance   balance         the equals sign as a two-pan balance: true/false, and a sum on each side
 *   unk.missing-mul-div  missing-muldiv  the missing number in a times or sharing sum (tables 2, 5, 10 only)
 *
 * All are inputMode "choices", answerType "integer". neg.meaning uses the NEW representation
 * "vertical-number-line" (D10-2 = A), placed in representations.order and config.adaptive.concretenessOrder
 * right after 'concrete' and the earlier new ways (D10-2 before this sub-build; see representations.js/
 * config.js). ops.left-to-right uses "symbolic" (plain numerals and signs; its curriculum ways are
 * ["symbolic", "word-problem"]). unk.missing-number and unk.missing-mul-div use "visual" (a counters / array
 * picture that is NOT the new "array" way of showing a times fact, but a plain counter picture, so they do not
 * borrow mul.arrays' credit). unk.equals-balance is rendered with a two-pan balance picture under the EXISTING
 * "symbolic" representation (its curriculum ways are ["concrete", "symbolic"]; the plan asks for a related
 * existing id, NOT a new representation id, so no new way of showing is added for the balance).
 *
 * Every number traces to docs/curriculum-data.json examples and level sentences (D10-8/D10-9): nothing is
 * invented, and every level and bound is a design hypothesis (CLAUDE.md rule 8). Speech never holds a maths
 * symbol; display text uses the escaped MINUS constant. Negative numbers are spoken with the word "minus"
 * (curriculum: "-5 is minus 5"), never the minus sign; display uses the escaped sign.
 *   TYPES[id] = { key, size, create, choices? }   same shape as question-types.js, pure.
 *   FAMILIES[name](params)   every candidate for one difficulty level (params from data/difficulty.js).
 */
(function () {
  'use strict';

  NBA.define('questionTypesBand2e', ['util'], (util) => {
    const { shuffle } = util;
    const MINUS = '\u2212'; // display only; speech always says the word "minus"

    /** Up to `want` other values from `pool` (never the answer), kept distinct, for the answer buttons. */
    function others(answer, pool, want, rng) {
      const opts = shuffle(pool.filter((v, i) => v !== answer && pool.indexOf(v) === i), rng).slice(0, want);
      return shuffle([answer].concat(opts), rng);
    }
    /** Three tidy buttons near a (possibly negative) answer: off by one and two, no range floor. */
    function nearSigned(answer, rng) {
      const pool = [answer - 1, answer + 1, answer - 2, answer + 2, answer + 3];
      return others(answer, pool, 2, rng);
    }
    /** Three tidy whole-number buttons near `answer`, off by one and two, kept >= 0. */
    function nearWhole(answer, rng) {
      const pool = [answer - 1, answer + 1, answer - 2, answer + 2, answer + 3].filter((v) => v >= 0);
      return others(answer, pool, 2, rng);
    }

    /* ---------- difficulty families (candidate sets) ---------- */
    // Every bound is a design hypothesis; numbers stay inside the docs/curriculum-data.json examples and level
    // sentences. n = a positive magnitude (metres, steps); mode picks the story shape.
    const FAMILIES = {
      // neg: mode 0 "n [unit] below zero / to the left of zero", answer -n (the diver, the number line step);
      // mode 1 "the opposite of n", answer -n (same arithmetic, a different story so both curriculum shapes
      // are covered). n stays within the curriculum fluency range (1 to 20, "minus 20 to 0").
      'neg': (p) => {
        const out = [];
        for (let n = p.nMin; n <= p.nMax; n++) { out.push({ n: n, mode: 0 }); if (p.opposite) out.push({ n: n, mode: 1 }); }
        return out;
      },
      // ops-steps: three numbers a, b, c done strictly left to right. mode 0 = a + b + c (all adding); mode 1 =
      // a - b + c (take away then add). Every triple comes from `cases` (the curriculum examples and their
      // shape), so no sum ever goes below zero at the middle step by accident.
      'ops-steps': (p) => {
        const out = [];
        (p.cases || []).forEach((c) => out.push({ a: c[0], b: c[1], c: c[2], mode: c[3] }));
        return out;
      },
      // missing-num: a + ? = c (mode 0, answer c - a), ? + b = c (mode 1, answer c - b), a - ? = c (mode 2,
      // answer a - c). The triples come from `cases` (the curriculum examples 3+?=7, ?+4=9, 8-?=5) walked over
      // a small grid within `max` (the level's total), so a run has variety without inventing a new shape.
      'missing-num': (p) => {
        const out = [];
        (p.cases || []).forEach((c) => {
          const mode = c[0];
          for (let k = c[1]; k <= c[2]; k++) {
            if (mode === 0) { for (let a = 1; a < k; a++) if (a + (k - a) <= p.max) out.push({ a: a, b: k - a, c: k, mode: 0 }); }
            else if (mode === 1) { for (let b = 1; b < k; b++) if (k - b + b <= p.max) out.push({ a: k - b, b: b, c: k, mode: 1 }); }
            else { for (let a = k + 1; a <= p.max; a++) out.push({ a: a, b: a - k, c: k, mode: 2 }); }
          }
        });
        return out;
      },
      // balance: mode 0 a true/false equation (4 + 3 = 7, or 4 + 3 = 8), a two-button choice (D10-8). mode 1 a
      // sum on each side with the box on the right (a + b = ? + c, answer a + b - c). mode 2 one number on one
      // side and a sum on the other (d = e + ?, answer d - e). Triples come straight from the curriculum
      // examples; d10-8 keeps the true/false numbers to exactly the data's own pair.
      'balance': (p) => {
        const out = [];
        (p.trueFalse || []).forEach((tf) => out.push({ a: tf[0], b: tf[1], c: tf[2], trueAnswer: tf[2] === tf[0] + tf[1] ? 1 : 0, mode: 0 }));
        (p.sides || []).forEach((s) => out.push({ a: s[0], b: s[1], c: s[2], mode: 1 }));
        (p.single || []).forEach((s) => out.push({ d: s[0], e: s[1], mode: 2 }));
        return out;
      },
      // missing-muldiv: a x ? = c (mode 0, answer c / a), ? x b = c (mode 1, answer c / b), c / ? = a (mode 2,
      // answer c / a), ? / b = a (mode 3, answer a * b). `tables` restricts the known factor/divisor to 2, 5
      // or 10 (Step 6); the other side (k, the number of groups) walks 1..kMax, matching div.inverse's shape.
      'missing-muldiv': (p) => {
        const out = [];
        (p.tables || []).forEach((t) => {
          for (let k = p.kMin; k <= p.kMax; k++) {
            out.push({ a: t, b: k, c: t * k, mode: 0 });
            out.push({ a: k, b: t, c: t * k, mode: 1 });
            out.push({ a: k, b: t, c: t * k, mode: 2 });
            out.push({ a: k, b: t, c: t * k, mode: 3 });
          }
        });
        return out;
      }
    };

    /* ---------- the five band-2 question types ---------- */
    const TYPES = {
      // neg.meaning: a story (below zero / opposite) whose answer is a negative number. The vertical number
      // line picture carries "down means below zero" when sound is off; speech always says "minus", never the
      // sign (the curriculum rule: "-5 is minus 5").
      'neg': {
        key: (x) => 'neg:' + x.n + ':' + x.mode,
        size: (x) => x.n,
        create: (x) => (x.mode
          ? { display: ['What is the opposite of ' + x.n + '?'], speech: 'What is the opposite of ' + x.n + '?', answer: -x.n }
          : { display: [x.n + ' below zero.', 'Write that as a number.'],
              speech: x.n + ' below zero. Write that as a number.', answer: -x.n }),
        choices: (answer, numbers, rng) => nearSigned(answer, rng)
      },

      // ops.left-to-right: three numbers done strictly left to right. The display shows the whole sum; speech
      // says "do the first part first", matching the curriculum's own left-to-right instruction.
      'ops-steps': {
        key: (x) => 'ops-steps:' + x.a + ':' + (x.mode ? MINUS : '+') + x.b + '+' + x.c,
        size: (x) => Math.max(x.a, x.a + x.b, x.a + x.b + x.c),
        create: (x) => {
          const sign = x.mode ? MINUS : '+', word = x.mode ? 'take away' : 'plus';
          return {
            display: [x.a + ' ' + sign + ' ' + x.b + ' + ' + x.c + ' = ?'],
            speech: 'What is ' + x.a + ' ' + word + ' ' + x.b + ' plus ' + x.c + '? Go left to right.',
            answer: x.mode ? x.a - x.b + x.c : x.a + x.b + x.c
          };
        },
        choices: (answer, numbers, rng) => nearWhole(answer, rng)
      },

      // unk.missing-number: the box in any position of an adding/taking-away sentence within 20. The picture
      // (counters with a gap for the hidden amount) carries the task; speech names the sentence in words.
      'missing-num': {
        key: (x) => 'missing-num:' + x.a + '/' + x.b + '/' + x.c + ':' + x.mode,
        size: (x) => x.c,
        create: (x) => {
          if (x.mode === 0) return { display: [x.a + ' + ? = ' + x.c + '.', 'What number is missing?'], speech: x.a + ' plus what number makes ' + x.c + '?', answer: x.c - x.a };
          if (x.mode === 1) return { display: ['? + ' + x.b + ' = ' + x.c + '.', 'What number is missing?'], speech: 'What number plus ' + x.b + ' makes ' + x.c + '?', answer: x.c - x.b };
          return { display: [x.a + ' ' + MINUS + ' ? = ' + x.c + '.', 'What number is missing?'], speech: x.a + ' take away what number leaves ' + x.c + '?', answer: x.a - x.c };
        },
        choices: (answer, numbers, rng) => nearWhole(answer, rng)
      },

      // unk.equals-balance: mode 0 asks true or false (a two-button choice, D10-8); mode 1 and 2 find the
      // number that makes both sides equal. The balance picture (two pans) carries "both sides are the same"
      // when sound is off; speech never uses the words true or false as a button label (choiceText does).
      'balance': {
        key: (x) => (x.mode === 0 ? 'balance:tf:' + x.a + '+' + x.b + '=' + x.c
          : (x.mode === 1 ? 'balance:sides:' + x.a + '+' + x.b + '=?+' + x.c : 'balance:single:' + x.d + '=' + x.e + '+?')),
        size: (x) => (x.mode === 2 ? x.d : x.c),
        create: (x) => {
          if (x.mode === 0) {
            return {
              display: ['Is ' + x.a + ' + ' + x.b + ' = ' + x.c + ' true?'],
              speech: 'Is ' + x.a + ' plus ' + x.b + ' equal to ' + x.c + '? Say yes or no.',
              answer: x.trueAnswer === 1 ? 0 : 1,
              choiceText: { 0: 'Yes', 1: 'No' }
            };
          }
          if (x.mode === 1) {
            return {
              display: [x.a + ' + ' + x.b + ' = ? + ' + x.c + '.', 'What number is missing?'],
              speech: x.a + ' plus ' + x.b + ' equals what number plus ' + x.c + '?',
              answer: x.a + x.b - x.c
            };
          }
          return {
            display: [x.d + ' = ' + x.e + ' + ?.', 'What number is missing?'],
            speech: x.d + ' equals ' + x.e + ' plus what number?',
            answer: x.d - x.e
          };
        },
        choices: (answer, numbers, rng) => (numbers.mode === 0 ? shuffle([0, 1], rng) : nearWhole(answer, rng))
      },

      // unk.missing-mul-div: the box in any position of a times or sharing sum, tables 2, 5 and 10 only (Step
      // 6). The array/group picture carries the task; speech thinks of the opposite sum, as the criteria say.
      'missing-muldiv': {
        key: (x) => 'missing-muldiv:' + x.a + '/' + x.b + '/' + x.c + ':' + x.mode,
        size: (x) => x.c,
        create: (x) => {
          if (x.mode === 0) return { display: [x.a + ' ' + '\u00d7' + ' ? = ' + x.c + '.', 'What number is missing?'], speech: x.a + ' times what number makes ' + x.c + '?', answer: x.c / x.a };
          if (x.mode === 1) return { display: ['? ' + '\u00d7' + ' ' + x.b + ' = ' + x.c + '.', 'What number is missing?'], speech: 'What number times ' + x.b + ' makes ' + x.c + '?', answer: x.c / x.b };
          if (x.mode === 2) return { display: [x.c + ' ' + '\u00f7' + ' ? = ' + x.a + '.', 'What number is missing?'], speech: x.c + ' shared by what number makes ' + x.a + ' each?', answer: x.c / x.a };
          return { display: ['? ' + '\u00f7' + ' ' + x.b + ' = ' + x.a + '.', 'What number is missing?'], speech: 'What number shared by ' + x.b + ' makes ' + x.a + ' each?', answer: x.a * x.b };
        },
        choices: (answer, numbers, rng) => nearWhole(answer, rng)
      }
    };

    return { TYPES, FAMILIES };
  });
}());
