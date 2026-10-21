/*
 * questionTypesBand1 (L2, step 9 sub-builds A to F): the band-1 (ages 4 to 6) counting, number-sense,
 * subitizing, part-whole, ten-frame, make-5/make-10, teen-number and fraction question types and their difficulty
 * families, kept out of
 * question-types.js to stay under the 400-line limit. questionTypes.js merges TYPES into its registry and
 * FAMILIES into its family generators; the difficulty rows live in data/difficulty.js like every other family.
 *
 * All are inputMode "choices", answerType "integer". The question numbers come ONLY from the
 * curriculum examples in docs/curriculum-data.json (owner decision D9-5 option A): no number, level or
 * input mode is invented. Every level and threshold is a design hypothesis (CLAUDE.md rule 8).
 *   TYPES[id] = { key, size, create, choices? }   same shape as question-types.js, pure.
 *     choices(answer, numbers, rng, makeChoices)  optional: the answer buttons when the plain +-1/+-2
 *       buttons would leave the curriculum set (tens for count-tens, numerals 0 to 10 for numeral-say).
 *   FAMILIES[name](params)  every candidate for one difficulty level (params from data/difficulty.js).
 * Speech never holds a maths symbol; display text is plain numerals and words only (ASCII).
 */
(function () {
  'use strict';

  NBA.define('questionTypesBand1', ['util'], (util) => {
    const { range, pick, shuffle } = util;

    /* ---------- difficulty families (candidate sets) ---------- */
    // seq-fwd / seq-back: say the number just after / just before a start number.
    //   nMin..nMax = the start numbers; answer = start +1 (fwd) or start -1 (back).
    const FAMILIES = {
      'seq-fwd': (p) => range(p.nMin, p.nMax).map((n) => ({ n: n })),
      'seq-back': (p) => range(p.nMin, p.nMax).map((n) => ({ n: n })),
      // seq-100: the number just after a number to 100 ("What comes after 29?"). Numbers hold only the
      // start n (an integer), so an attempt record stays an all-integer numbers object (schema intObject).
      'seq-100': (p) => range(p.nMin, p.nMax).map((n) => ({ n: n })),
      // tens-100: the next ten after a ten ("after 30 comes 40"). Start n is a multiple of ten.
      'tens-100': (p) => { const out = []; for (let t = p.nMin; t <= p.nMax; t += 10) out.push({ n: t }); return out; },
      // numeral-10: name the numeral n (0 to 10 at the declared level).
      'numeral-10': (p) => range(p.nMin, p.nMax).map((n) => ({ n: n })),
      // match-sort: two sorted groups (named group `a`, other group `b`); the answer is the named count.
      'match-sort': (p) => {
        const out = [];
        for (let a = p.min; a <= p.max; a++) {
          for (let b = p.min; b <= p.max; b++) if (a + b <= p.totalMax) out.push({ a: a, b: b });
        }
        return out;
      },
      // subitize-3 / subitize-5: a small group of n dots to see at a glance; answer = n. One seed per candidate
      // holds the layout index so a run shows different fixed layouts for the same count (chosen in the renderer).
      'subitize-3': (p) => range(p.nMin, p.nMax).map((n) => ({ n: n })),
      'subitize-5': (p) => range(p.nMin, p.nMax).map((n) => ({ n: n })),
      // part-bond: a whole w (p.wMin..p.wMax) joined to two parts, one part shown; the answer is the hidden
      // part. Both parts stay from 0 to the whole, so every candidate traces to the curriculum ("5 is 2 and 3",
      // "8 is 3 and 5"). The shown part is `p` (an integer) and the answer is w - p.
      'part-bond': (q) => {
        const out = [];
        for (let w = q.wMin; w <= q.wMax; w++) {
          for (let p = 1; p < w; p++) out.push({ w: w, p: p });
        }
        return out;
      },
      // ten-frame: a frame with n counters (p.nMin..p.nMax) shown. mode 0 asks how many counters are on the
      // frame (read), mode 1 asks how many boxes are empty (10 - n). Both are checkable curriculum examples;
      // a mode is an integer so the numbers object stays all-integer (schema intObject).
      'ten-frame': (q) => {
        const out = [];
        for (let n = q.nMin; n <= q.nMax; n++) out.push({ n: n, empty: q.mode });
        return out;
      },
      // line-10 (step 9 sub-build D): a point marked on a 0 to 10 number line; the answer is that number.
      // The whole line is shown; only the start s moves so the window stays 0 to 10 (the renderer draws
      // tiles 0 to 10). Numbers stay 0 to 10 (the curriculum range), so a candidate never leaves the line.
      'line-10': (p) => range(p.mMin, p.mMax).map((m) => ({ m: m })),
      // even-odd (step 9 sub-build D): a number n (p.nMin..p.nMax) shown as pairs with one left over when
      // odd; the answer is 0 for even and 1 for odd (an integer, so the numbers object stays all-integer).
      // Numbers stay within the curriculum range (up to 20); nothing larger is a prerequisite.
      'even-odd': (p) => range(p.nMin, p.nMax).map((n) => ({ n: n })),
      // make-5 / make-10 (step 9 sub-build E): a PARTNER question. The whole (p.whole, 5 or 10) is fixed and
      // one part p (pMin..pMax) is shown; the answer is the partner that makes the whole (whole - p). Both the
      // whole and the shown part are integers, so the numbers object stays all-integer (schema intObject).
      // These are partner questions, NOT sums, so they are NOT in the error-engine ADDITION list (see
      // step9-changed-tests.md, sub-build E): the generic quick-wrong / all-choices-tried observations apply.
      'make-5': (q) => range(q.pMin, q.pMax).map((p) => ({ whole: q.whole, p: p })),
      'make-10': (q) => range(q.pMin, q.pMax).map((p) => ({ whole: q.whole, p: p })),
      // teen-ten (step 9 sub-build E): a teen number n (nMin..nMax, 11 to 19) shown as a full ten and some
      // ones; the answer is the ones (n - 10). n is an integer, so the numbers object stays all-integer.
      'teen-ten': (p) => range(p.nMin, p.nMax).map((n) => ({ n: n })),
      // frac-share (step 9 sub-build F): a WHOLE group of counters shared fairly into `parts` equal piles;
      // the answer is how many are in one pile (whole / parts). The candidate list is read straight from the
      // curriculum numbers (p.wholes), so no number is invented: p.parts = 2 (a half) with wholes 2,4,6,8,10,
      // or p.parts = 4 (a quarter) with wholes 4,8. Both the whole and the parts are integers, so the numbers
      // object (whole, parts) stays all-integer (schema intObject). The answer always divides exactly.
      'frac-share': (p) => (p.wholes || []).map((w) => ({ whole: w, parts: p.parts }))
    };

    const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
    const word = (n) => (n >= 0 && n <= 10 ? WORDS[n] : String(n));
    /** Pick up to `want` other values from `pool` (never the answer), for the answer buttons. */
    function others(answer, pool, want, rng) {
      const opts = shuffle(pool.filter((v) => v !== answer), rng).slice(0, want);
      return shuffle([answer].concat(opts), rng);
    }

    /* ---------- the six band-1 question types ---------- */
    const TYPES = {
      // count.rote-20: "What number comes next?" start n, answer n + 1 (within 20).
      'count-next': {
        key: (x) => 'count-next:' + x.n,
        size: (x) => x.n + 1,
        create: (x) => ({
          display: ['What comes next?', x.n + ', ?'],
          speech: 'Count on from ' + x.n + '. What number comes next?',
          answer: x.n + 1
        })
      },

      // count.back-20: "What comes just before?" start n, answer n - 1 (within 20).
      'count-back': {
        key: (x) => 'count-back:' + x.n,
        size: (x) => x.n,
        create: (x) => ({
          display: ['What comes just before?', '?, ' + x.n],
          speech: 'Count back. What number comes just before ' + x.n + '?',
          answer: x.n - 1
        })
      },

      // count.rote-100: the number just after a number to 100.
      'count-on-100': {
        key: (x) => 'count-on-100:' + x.n,
        size: (x) => x.n + 1,
        create: (x) => ({ display: ['What comes after?', x.n + ', ?'], speech: 'What number comes after ' + x.n + '?', answer: x.n + 1 })
      },

      // count.tens-100: the next ten. Buttons are tens only (choices hook), so a child never sees 39 or 41.
      'count-tens': {
        key: (x) => 'count-tens:' + x.n,
        size: (x) => x.n + 10,
        create: (x) => ({ display: ['Count by tens. What comes next?', x.n + ', ?'], speech: 'Count by tens. What comes after ' + x.n + '?', answer: x.n + 10 }),
        choices: (answer, numbers, rng) => others(answer, range(0, 10).map((k) => k * 10), 2, rng)
      },

      // sense.numerals-10: "Find the numeral that says seven." Buttons are numerals 0 to 10.
      'numeral-say': {
        key: (x) => 'numeral-say:' + x.n,
        size: (x) => x.n,
        create: (x) => ({
          display: ['Find the numeral.', 'Which one says ' + word(x.n) + '?'],
          speech: 'Find the numeral that says ' + word(x.n) + '.',
          answer: x.n
        }),
        choices: (answer, numbers, rng) => others(answer, range(0, 10), 2, rng)
      },

      // sense.match-sort: two sorted groups; count the named group (answer = x.a).
      'match-count': {
        key: (x) => 'match-count:' + x.a + '/' + x.b,
        size: (x) => x.a + x.b,
        create: (x) => ({
          display: ['One group is seeds, one is pebbles.', 'How many seeds?'],
          speech: 'Some seeds and some pebbles are sorted into two groups. How many seeds are there?',
          answer: x.a
        })
      },

      // sense.subitize-3: "Take a look. How many dots?" The dot pattern stays on the card (no flash, no
      // timer); the child sees the whole group at a glance and taps the number. Buttons stay 1 to 4.
      'subitize-dots': {
        key: (x) => 'subitize-dots:' + x.n,
        size: (x) => x.n,
        create: (x) => ({
          display: ['Take a look.', 'How many dots?'],
          speech: 'Take a look. How many dots do you see?',
          answer: x.n
        }),
        choices: (answer, numbers, rng) => others(answer, range(1, 4), 2, rng)
      },

      // sense.subitize-5: "Take a look. How many dots?" The dice face stays on the card (no flash, no timer);
      // the child names the face at a glance and taps the number. Buttons stay 1 to 6 (a dice face set).
      'subitize-dice': {
        key: (x) => 'subitize-dice:' + x.n,
        size: (x) => x.n,
        create: (x) => ({
          display: ['Take a look.', 'How many dots?'],
          speech: 'Take a look. How many dots do you see?',
          answer: x.n
        }),
        choices: (answer, numbers, rng) => others(answer, range(1, 6), 2, rng)
      },

      // sense.part-whole-10: a number bond shows the whole x.w with one part x.p; the child says the other
      // part (the answer x.w - x.p). The display names the whole and the known part, never the answer. Buttons
      // stay 0 to 10 (a part can be 0 to the whole), so a choice never leaves the number set.
      'part-bond': {
        key: (x) => 'part-bond:' + x.w + '/' + x.p,
        size: (x) => x.w,
        create: (x) => ({
          display: [x.w + ' is ' + x.p + ' and ?', 'Find the other part.'],
          speech: word(x.w) + ' is ' + word(x.p) + ' and how many more?',
          answer: x.w - x.p
        }),
        choices: (answer, numbers, rng) => others(answer, range(0, 10), 2, rng)
      },

      // sense.ten-frame: a frame of ten boxes with x.n counters. mode 0 (x.empty = 0) asks how many counters
      // are on the frame (answer x.n); mode 1 asks how many boxes are empty (answer 10 - x.n). Buttons stay 0
      // to 10 (a ten-frame holds 0 to 10). The picture carries the task when sound is off.
      'ten-frame': {
        key: (x) => 'ten-frame:' + x.n + ':' + (x.empty ? 'e' : 'f'),
        size: (x) => x.n,
        create: (x) => (x.empty
          ? { display: ['How many boxes are empty?'], speech: 'The ten-frame has ' + word(x.n) + '. How many boxes are empty?', answer: 10 - x.n }
          : { display: ['How many are on the frame?'], speech: 'Take a look at the ten-frame. How many counters do you see?', answer: x.n }),
        choices: (answer, numbers, rng) => others(answer, range(0, 10), 2, rng)
      },

      // sense.line-10: a flag marks a point on a 0 to 10 number line; the child reads the number it stands on.
      // The display names the task, not the number; the picture (the flag on a tile) carries it when sound is
      // off. Buttons stay 0 to 10 (the whole line), so a choice never leaves the line.
      'line-read': {
        key: (x) => 'line-read:' + x.m,
        size: (x) => x.m,
        create: (x) => ({
          display: ['Read the number line.', 'What number is the flag on?'],
          speech: 'Look at the number line. What number is the flag standing on?',
          answer: x.m
        }),
        choices: (answer, numbers, rng) => others(answer, range(0, 10), 2, rng)
      },

      // sense.even-odd: n counters shown in pairs, with one left over when the number is odd; the child says
      // whether it is even or odd. The answer is 0 (even) or 1 (odd); the two buttons show the WORDS "Even" and
      // "Odd" through choiceText (data-value stays the number), so the choice is speakable and never a bare 0/1.
      // The picture (pairs, with or without a leftover) carries the idea when sound is off.
      'even-odd': {
        key: (x) => 'even-odd:' + x.n,
        size: (x) => x.n,
        create: (x) => ({
          display: ['Pair them up.', 'Is this even or odd?'],
          speech: 'Pair up the counters. Is this number even or odd?',
          answer: x.n % 2,
          choiceText: { 0: 'Even', 1: 'Odd' }
        }),
        // The two words only: even (0) and odd (1), always both, order shuffled. No number button appears.
        choices: (answer, numbers, rng) => shuffle([0, 1], rng)
      },

      // add.make-5: a number bond shows the whole 5 with one part; the child says the partner that makes 5
      // (the answer x.whole - x.p). The display names the whole and the known part, never the answer. Buttons
      // stay 0 to 5 (a partner of 5 is 0 to 5), so a choice never leaves the number set.
      'make-5': {
        key: (x) => 'make-5:' + x.p,
        size: (x) => x.whole,
        create: (x) => ({
          display: [x.p + ' and ? make ' + x.whole + '.', 'Find the partner.'],
          speech: word(x.p) + ' and how many more make ' + word(x.whole) + '?',
          answer: x.whole - x.p
        }),
        choices: (answer, numbers, rng) => others(answer, range(0, 5), 2, rng)
      },

      // add.make-10: a ten-frame shows x.p counters; the child says how many MORE make 10 (the answer
      // x.whole - x.p). The display names the task, not the answer; the picture (the part-filled frame) carries
      // it when sound is off. Buttons stay 0 to 10 (a partner of 10 is 0 to 10).
      'make-10': {
        key: (x) => 'make-10:' + x.p,
        size: (x) => x.whole,
        create: (x) => ({
          display: ['Make ' + x.whole + '.', 'How many more?'],
          speech: 'The ten-frame has ' + word(x.p) + '. How many more make ' + word(x.whole) + '?',
          answer: x.whole - x.p
        }),
        choices: (answer, numbers, rng) => others(answer, range(0, 10), 2, rng)
      },

      // place.teen-numbers: a full ten-frame and some loose ones show a teen number x.n; the child says how
      // many ones there are (the answer x.n - 10). The display names the task; the picture (a full ten and the
      // loose ones) carries it when sound is off. Buttons stay 0 to 10 (the ones of a teen number are 0 to 9).
      'teen-ten': {
        key: (x) => 'teen-ten:' + x.n,
        size: (x) => x.n,
        create: (x) => ({
          display: ['A ten and some ones.', 'How many ones?'],
          speech: 'This is a ten and some more. How many ones are there?',
          answer: x.n - 10
        }),
        choices: (answer, numbers, rng) => others(answer, range(0, 10), 2, rng)
      },

      // frac.halves-quarters: a group of x.whole counters is dealt fairly into x.parts equal plates (2 for a
      // half, 4 for a quarter); the child says how many are in one plate (the answer x.whole / x.parts). The
      // display and speech name the whole and the fraction word only, never the answer; the picture (the group
      // dealt into equal plates, beside a shape split into the same equal parts) carries the task when sound is
      // off. Buttons stay 1 to 5 (one plate of a curriculum whole holds 1 to 5), so a choice never leaves the
      // number set. The word "half"/"quarter" is spoken, not written as a symbol (ASCII, no maths signs).
      'frac-share': {
        key: (x) => 'frac-share:' + x.parts + ':' + x.whole,
        size: (x) => x.whole,
        create: (x) => {
          const half = x.parts === 2;
          const fracWord = half ? 'half' : 'a quarter';
          return {
            display: [(half ? 'Half of ' : 'A quarter of ') + x.whole + '.', 'How many in one part?'],
            speech: 'Share ' + word(x.whole) + ' fairly. How many is ' + fracWord + ' of ' + word(x.whole) + '?',
            answer: x.whole / x.parts
          };
        },
        choices: (answer, numbers, rng) => others(answer, range(1, 5), 2, rng)
      }
    };

    return { TYPES, FAMILIES };
  });
}());
