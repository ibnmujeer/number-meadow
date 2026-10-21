/*
 * questionTypesBand2b (L2, step 10 sub-build B): the band-2 (ages 7 to 9) MULTI-DIGIT ADD/SUB question
 * types and their difficulty families, kept out of question-types-band2.js (which is near the 400-line
 * limit) and merged by question-types.js with Object.assign exactly like question-types-band2.
 *
 * Sub-build B concepts (plan 2.5 / 9B, every prereq built in sub-build A or band 1):
 *   add.facts-20          add-fact   addition facts to 20 (doubles, doubles plus one, make-ten)
 *   sub.facts-20          sub-fact   taking-away facts to 20 and their link to adding
 *   add.two-digit         add2       add two-digit numbers with NO trade (34 + 20, 32 + 46)
 *   add.two-digit-regroup add2r      add two-digit numbers WITH a trade (27 + 5, 38 + 25)
 *   add.three-digit       add3       add three-digit numbers (240 + 300, 347 + 125)
 *   sub.two-digit         sub2       take a two-digit number with NO trade (74 - 30, 68 - 35)
 *   sub.two-digit-regroup sub2r      take a two-digit number WITH a trade (42 - 5, 52 - 27)
 *   sub.three-digit       sub3       take a three-digit number (580 - 300, 352 - 128)
 *   sub.stories-two-step  two-step   a two-step adding and taking-away story (bar model)
 *
 * All are inputMode "choices", answerType "integer". The representation is "visual" (NOT "symbolic"):
 * question-types.js questionConcept() re-credits a symbolic add/sub to the within-10/20 range concept, which
 * would steal the credit from these band-2 concepts; "visual" credits the activity's own concept, and the
 * "visual" definition allows a short equation under the picture, which is how "shown visually, then with
 * symbols" is met (the base-ten pieces / place-value chart carry the quantity; the column sum shows as the
 * display symbols). two-step is a "visual" bar model. Every number traces to docs/curriculum-data.json
 * (owner decisions D10-8/D10-9); nothing is invented, and every level and bound is a design hypothesis.
 *   TYPES[id] = { key, size, create, choices? }   same shape as question-types.js, pure.
 *   FAMILIES[name](params)   every candidate for one difficulty level (params from data/difficulty.js).
 */
(function () {
  'use strict';

  NBA.define('questionTypesBand2b', ['util'], (util) => {
    const { shuffle } = util;

    /** Up to `want` other values from `pool` (never the answer), kept distinct, for the answer buttons. */
    function others(answer, pool, want, rng) {
      const opts = shuffle(pool.filter((v, i) => v !== answer && pool.indexOf(v) === i), rng).slice(0, want);
      return shuffle([answer].concat(opts), rng);
    }
    /** Three tidy buttons near `answer`: off by one, off by two, and off by ten (a common slip), kept >= 0. */
    function nearAns(answer, rng) {
      const pool = [answer - 1, answer + 1, answer - 2, answer + 2, answer - 10, answer + 10].filter((v) => v >= 0);
      return others(answer, pool, 2, rng);
    }
    /** The signed sum of a two or three step expression, e.g. [15, -6, 4] -> 13. */
    const sumOf = (steps) => steps.reduce((m, s) => m + s, 0);

    /* ---------- difficulty families (candidate sets) ---------- */
    // Each family lists [a, b] (or step lists) that come straight from the curriculum examples and level
    // sentences; the generator walks a small grid inside those bounds so a run has variety without inventing
    // a number outside the data. "trade" marks whether the ones (and tens) cross a ten/hundred.
    const FAMILIES = {
      // add-fact: a + b within 20. Level 2 = doubles and doubles plus one to 20 (the curriculum examples
      // 6 + 6, 6 + 7); level 3 = make-ten/near-ten facts (9 + 4, 8 + 7). The answer stays <= 20.
      'add-fact': (p) => {
        const out = [];
        if (p.kind === 'double') { for (let a = p.min; a <= p.max; a++) { out.push({ a: a, b: a }); if (a + (a + 1) <= 20) out.push({ a: a, b: a + 1 }); } }
        else { for (let a = p.min; a <= p.max; a++) for (let b = p.bMin; b <= p.bMax; b++) if (a + b >= 11 && a + b <= 20) out.push({ a: a, b: b }); }
        return out;
      },
      // sub-fact: a - b within 20, a from 11..20 (the curriculum facts 15 - 6, 15 - 9, 17 - 9). The answer
      // (a - b) stays 1..9 so it is a real fact family partner of an adding fact.
      'sub-fact': (p) => {
        const out = [];
        for (let a = p.aMin; a <= p.aMax; a++) for (let b = p.bMin; b <= p.bMax; b++) if (a - b >= p.leftMin && a - b <= 9) out.push({ a: a, b: b });
        return out;
      },
      // col-add: a + b, both multiples/sizes drawn from the level bounds. trade = whether the ones (level 2/3)
      // or the tens (level 4) cross. a and b are integers; the answer stays within the level's cap.
      'col-add': (p) => {
        const out = [];
        for (let a = p.aMin; a <= p.aMax; a += p.aStep) {
          for (let b = p.bMin; b <= p.bMax; b += p.bStep) {
            const ones = (a % 10) + (b % 10), trade = ones >= 10;
            if (p.trade === trade && a + b <= p.cap) out.push({ a: a, b: b });
          }
        }
        return out;
      },
      // col-sub: a - b, b taken from a. trade = whether the ones of b are more than the ones of a (a borrow).
      // a and b are integers; the answer (a - b) stays >= p.leftMin.
      'col-sub': (p) => {
        const out = [];
        for (let a = p.aMin; a <= p.aMax; a += p.aStep) {
          for (let b = p.bMin; b <= p.bMax && b < a; b += p.bStep) {
            const borrow = (b % 10) > (a % 10);
            if (p.trade === borrow && a - b >= p.leftMin) out.push({ a: a, b: b });
          }
        }
        return out;
      },
      // two-step: a story of two steps on a start s. steps are [+/-x, +/-y] with the start; the answer is the
      // running total. Numbers stay within the curriculum (within 20 at level 2, a two-digit start at level 3).
      // s, x and y are integers; the model is part-part-whole bars.
      'two-step': (p) => {
        const out = [];
        (p.cases || []).forEach((c) => out.push({ s: c[0], x: c[1], y: c[2] }));
        return out;
      }
    };
    // The trade and no-trade column families share the same generator (the `trade` flag in the params picks
    // which pairs are kept), so the regroup variants alias the base generators. Keeping four family names
    // lets data/difficulty.js give the trade and no-trade cases their own bounds.
    FAMILIES['col-add-regroup'] = FAMILIES['col-add'];
    FAMILIES['col-sub-regroup'] = FAMILIES['col-sub'];
    // The three-digit column families reuse the same generators; data/difficulty.js gives them the 100 to 999
    // bounds (two-digit families keep the 0 to 99 bounds), so add3/sub3 never produce a two-digit number.
    FAMILIES['col-add3'] = FAMILIES['col-add'];
    FAMILIES['col-sub3'] = FAMILIES['col-sub'];

    const PLUS = ' + ', MINUS = ' \u2212 '; // display only; speech says the words

    /* ---------- the nine band-2 add/sub question types ---------- */
    const TYPES = {
      // add.facts-20: a recall fact to 20, shown as a short sum under a picture (the "visual" way). The buttons
      // are tidy near numbers; the sum is spoken in words. The way-of-showing picture (a ten-frame-like model)
      // carries make-ten when sound is off.
      'add-fact': {
        key: (x) => 'add-fact:' + x.a + '+' + x.b,
        size: (x) => x.a + x.b,
        create: (x) => ({
          display: [x.a + PLUS + x.b + ' = ?'],
          speech: 'What is ' + x.a + ' plus ' + x.b + '?',
          answer: x.a + x.b
        }),
        choices: (answer, numbers, rng) => nearAns(answer, rng)
      },

      // sub.facts-20: a taking-away fact to 20, shown as a short sum under a picture. The buttons are tidy near
      // numbers; the fact is spoken in words (the link to adding is in the hint ladder, not the buttons).
      'sub-fact': {
        key: (x) => 'sub-fact:' + x.a + '-' + x.b,
        size: (x) => x.a,
        create: (x) => ({
          display: [x.a + MINUS + x.b + ' = ?'],
          speech: 'What is ' + x.a + ' take away ' + x.b + '?',
          answer: x.a - x.b
        }),
        choices: (answer, numbers, rng) => nearAns(answer, rng)
      },

      // add.two-digit: add two two-digit numbers with no trade, shown with base-ten pieces and the column sum.
      // The pieces carry the "add tens to tens, ones to ones" idea; the display shows the sum in symbols.
      'add2': {
        key: (x) => 'add2:' + x.a + '+' + x.b,
        size: (x) => x.a + x.b,
        create: (x) => ({ display: [x.a + PLUS + x.b + ' = ?'], speech: 'What is ' + x.a + ' plus ' + x.b + '?', answer: x.a + x.b }),
        choices: (answer, numbers, rng) => nearAns(answer, rng)
      },

      // add.two-digit-regroup: add two two-digit numbers where the ones make ten, so a ten is traded. The trade
      // (ten ones for one ten) is the rung-3 model and the renderer flourish; the display shows the column sum.
      'add2r': {
        key: (x) => 'add2r:' + x.a + '+' + x.b,
        size: (x) => x.a + x.b,
        create: (x) => ({ display: [x.a + PLUS + x.b + ' = ?'], speech: 'What is ' + x.a + ' plus ' + x.b + '?', answer: x.a + x.b }),
        choices: (answer, numbers, rng) => nearAns(answer, rng)
      },

      // add.three-digit: add three-digit numbers (to 999). The place-value chart carries hundreds/tens/ones;
      // any trade is the rung-3 model. The display shows the column sum in symbols.
      'add3': {
        key: (x) => 'add3:' + x.a + '+' + x.b,
        size: (x) => x.a + x.b,
        create: (x) => ({ display: [x.a + PLUS + x.b + ' = ?'], speech: 'What is ' + x.a + ' plus ' + x.b + '?', answer: x.a + x.b }),
        choices: (answer, numbers, rng) => nearAns(answer, rng)
      },

      // sub.two-digit: take a two-digit number with no borrow, shown with base-ten pieces and the column sum.
      'sub2': {
        key: (x) => 'sub2:' + x.a + '-' + x.b,
        size: (x) => x.a,
        create: (x) => ({ display: [x.a + MINUS + x.b + ' = ?'], speech: 'What is ' + x.a + ' take away ' + x.b + '?', answer: x.a - x.b }),
        choices: (answer, numbers, rng) => nearAns(answer, rng)
      },

      // sub.two-digit-regroup: take a two-digit number where a ten must be traded for ten ones (a borrow). The
      // trade is the rung-3 model and the renderer flourish; the display shows the column sum.
      'sub2r': {
        key: (x) => 'sub2r:' + x.a + '-' + x.b,
        size: (x) => x.a,
        create: (x) => ({ display: [x.a + MINUS + x.b + ' = ?'], speech: 'What is ' + x.a + ' take away ' + x.b + '?', answer: x.a - x.b }),
        choices: (answer, numbers, rng) => nearAns(answer, rng)
      },

      // sub.three-digit: take a three-digit number (to 999). The place-value chart carries the places; any
      // trade is the rung-3 model. The display shows the column sum in symbols.
      'sub3': {
        key: (x) => 'sub3:' + x.a + '-' + x.b,
        size: (x) => x.a,
        create: (x) => ({ display: [x.a + MINUS + x.b + ' = ?'], speech: 'What is ' + x.a + ' take away ' + x.b + '?', answer: x.a - x.b }),
        choices: (answer, numbers, rng) => nearAns(answer, rng)
      },

      // sub.stories-two-step: a two-step story shown as a part-part-whole bar model (the "visual" way; a bar
      // model is a related existing picture, D10-2, not a new representation id). The display tells the two
      // steps; the answer is the running total. The bar model carries the "do this step, then that step" idea
      // when sound is off. speech == display joined, so the spoken story matches what is shown.
      'two-step': {
        key: (x) => 'two-step:' + x.s + ':' + x.x + ':' + x.y,
        size: (x) => Math.max(x.s, x.s + x.x, x.s + x.x + x.y),
        create: (x) => {
          const line = (v) => (v < 0 ? 'take away ' + (-v) : 'add ' + v);
          const display = ['Start with ' + x.s + '.', 'Then ' + line(x.x) + ', then ' + line(x.y) + '.', 'How many now?'];
          return { display: display, speech: display.join(' '), answer: sumOf([x.s, x.x, x.y]) };
        },
        choices: (answer, numbers, rng) => nearAns(answer, rng)
      }
    };

    return { TYPES, FAMILIES };
  });
}());
