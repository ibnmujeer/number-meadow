/*
 * questionTypesBand2 (L2, step 10 sub-build A): the band-2 (ages 7 to 9) PLACE VALUE and COUNTING question
 * types and their difficulty families, kept out of question-types.js (and out of the band-1 sibling) to stay
 * under the 400-line limit. question-types.js merges TYPES into its registry and FAMILIES into its family
 * generators exactly as it does for band 1 (Object.assign). The difficulty rows live in data/difficulty.js.
 *
 * Sub-build A concepts (plan 2.5, place value first because it gates every multi-digit add/sub):
 *   count.skip-2-5-10   skip-count   count on by 2s, 5s or 10s and say the next number
 *   place.two-digit     tens-ones    read tens and ones to 99 (both ways), and the tens digit of a number
 *   place.regroup       regroup      trade ten ones for one ten (how many ones are left / made)
 *   place.hundreds      hundreds     read hundreds, tens and ones to 999, and the value of a digit
 *   place.compare-order compare-pv   which of two numbers is bigger (a two-button choice, D10-8); 10/100 more or less
 *   place.round         round-pv     round to the nearest 10 or 100; distance to a ten on a number line
 *   count.to-1000       count-1000   the number just after/before by ones, tens or hundreds (to 1000)
 *
 * All are inputMode "choices", answerType "integer". Every number comes ONLY from the curriculum examples and
 * level sentences in docs/curriculum-data.json (owner decision D10-8 = A): no number, level or input mode is
 * invented. Every level and threshold is a design hypothesis (CLAUDE.md rule 8). Speech never holds a maths
 * symbol; display text is plain numerals and words only (ASCII).
 *   TYPES[id] = { key, size, create, choices? }   same shape as question-types.js, pure.
 *     choices(answer, numbers, rng, makeChoices)   the answer buttons when the plain +-1/+-2 buttons would
 *       leave the curriculum set (hundreds/tens for place value; the two numbers themselves for compare).
 *   FAMILIES[name](params)   every candidate for one difficulty level (params from data/difficulty.js).
 */
(function () {
  'use strict';

  NBA.define('questionTypesBand2', ['util'], (util) => {
    const { range, pick, shuffle } = util;

    /** Pick up to `want` other values from `pool` (never the answer), for the answer buttons. */
    function others(answer, pool, want, rng) {
      const opts = shuffle(pool.filter((v) => v !== answer), rng).slice(0, want);
      return shuffle([answer].concat(opts), rng);
    }
    /** Three tidy buttons near `answer` on a `step` grid (10 or 100): answer, answer+-step, kept 0 to 1000
     *  (the curriculum domain), so a choice is always a sensible number on the same grid. */
    function nearStep(answer, step, rng) {
      const pool = [answer - 2 * step, answer - step, answer + step, answer + 2 * step].filter((v) => v >= 0 && v <= 1000);
      return others(answer, pool, 2, rng);
    }

    /* ---------- difficulty families (candidate sets) ---------- */
    const FAMILIES = {
      // skip-count: count on by `by` (2, 5 or 10) from a start `n` that is a multiple of `by`; the answer is
      // n + by. The candidate list walks every start in the level's range on the step grid, so every question
      // is a real step of that count (5, 10, 15 ...). by and n are integers (schema intObject).
      'skip-count': (p) => {
        const out = [];
        (p.steps || []).forEach((by) => {
          for (let n = by; n <= p.max - by; n += by) out.push({ by: by, n: n });
        });
        return out;
      },
      // count-1000: the number `dir` (+1, +10, +100 or -100) away from a start `n` on that step grid, within
      // 0 to 1000. The start is a multiple of the step size for the tens/hundreds counts, and any number for
      // the by-ones count. n and dir are integers.
      'count-1000': (p) => {
        const out = [];
        (p.jumps || []).forEach((dir) => {
          const mag = Math.abs(dir);
          const lo = Math.max(p.nMin, dir < 0 ? mag : 0), hi = Math.min(p.nMax, 1000 - (dir > 0 ? dir : 0));
          for (let n = lo; n <= hi; n += mag) if (n + dir >= 0 && n + dir <= 1000) out.push({ n: n, dir: dir });
        });
        return out;
      },
      // tens-ones: a two-digit number shown as tens and ones. mode 0 asks the number from t tens and o ones
      // (answer 10t + o); mode 1 asks how many tens are in the number 10t + o (answer t). t and o are integers.
      'tens-ones': (p) => {
        const out = [];
        for (let t = p.tMin; t <= p.tMax; t++) {
          for (let o = p.oMin; o <= p.oMax; o++) out.push({ t: t, o: o, mode: p.mode });
        }
        return out;
      },
      // regroup: a trade of ten ones. mode 0: start with `o` seeds (o from oMin..oMax, at least 10),
      // trade 10 for a bead rod, how many seeds are left (answer o - 10). mode 1: a number t tens and
      // o ones trades one ten for ten ones, how many ones now (answer o + 10). All integers.
      'regroup': (p) => {
        const out = [];
        if (p.mode === 0) { for (let o = p.oMin; o <= p.oMax; o++) out.push({ o: o, mode: 0 }); }
        else { for (let t = p.tMin; t <= p.tMax; t++) for (let o = p.oMin; o <= p.oMax; o++) out.push({ t: t, o: o, mode: 1 }); }
        return out;
      },
      // hundreds: three-digit place value. mode 0 asks the number from h hundreds, t tens, o ones (answer
      // 100h + 10t + o); mode 1 asks the VALUE of the tens digit t of 100h+10t+o (answer 10t). All integers.
      'hundreds': (p) => {
        const out = [];
        for (let h = p.hMin; h <= p.hMax; h++) {
          for (let t = p.tMin; t <= p.tMax; t++) {
            for (let o = p.oMin; o <= p.oMax; o++) out.push({ h: h, t: t, o: o, mode: p.mode });
          }
        }
        return out;
      },
      // compare-pv: two different numbers lo..hi; the answer is 0 when the LEFT is bigger, 1 when the right is
      // (a two-button choice, D10-8). Both numbers are kept as `l` and `r` integers, so the picture and the
      // choiceText can name them without inventing anything.
      'compare-pv': (p) => {
        const out = [];
        for (let l = p.lo; l <= p.hi; l += p.stepL) {
          for (let r = p.lo; r <= p.hi; r += p.stepR) if (l !== r) out.push({ l: l, r: r });
        }
        return out;
      },
      // more-less: a start number n (nMin..nMax) and a signed change `d` of +-10 or +-100; the answer is n + d
      // (10/100 more or less, within 0 to 1000). n and d are integers.
      'more-less': (p) => {
        const out = [];
        (p.changes || []).forEach((d) => {
          const lo = Math.max(p.nMin, d < 0 ? -d : 0), hi = Math.min(p.nMax, 1000 - (d > 0 ? d : 0));
          for (let n = lo; n <= hi; n += p.stepN) if (n + d >= 0) out.push({ n: n, d: d });
        });
        return out;
      },
      // round-pv: round a number n to the nearest `to` (10 or 100). The answer is Math.round(n / to) * to with
      // halves going up (the curriculum rule: 5 to 9 go up). n and `to` are integers; n is never an exact
      // multiple of `to` (so there is always something to round).
      'round-pv': (p) => {
        const out = [];
        for (let n = p.nMin; n <= p.nMax; n += p.step) if (n % p.to !== 0) out.push({ n: n, to: p.to });
        return out;
      }
    };

    /* ---------- the seven band-2 question types ---------- */
    const TYPES = {
      // count.skip-2-5-10: "Count by 5s: ... what comes next?" The buttons are near steps of the same count,
      // so a choice is always a sensible multiple (never 24 or 26 when counting by fives). The step is spoken.
      'skip-count': {
        key: (x) => 'skip-count:' + x.by + ':' + x.n,
        size: (x) => x.n + x.by,
        create: (x) => ({
          display: ['Count by ' + x.by + 's. What comes next?', x.n + ', ?'],
          speech: 'Count by ' + x.by + 's. What number comes after ' + x.n + '?',
          answer: x.n + x.by
        }),
        choices: (answer, numbers, rng) => nearStep(answer, numbers.by, rng)
      },

      // count.to-1000: the number just after/before by ones, tens or hundreds. The buttons step by the same
      // amount, so a choice is never off the count grid. The jump size and direction are spoken in words.
      'count-1000': {
        key: (x) => 'count-1000:' + x.n + ':' + x.dir,
        size: (x) => Math.max(x.n, x.n + x.dir),
        create: (x) => {
          const mag = Math.abs(x.dir), fwd = x.dir > 0;
          const unit = mag === 1 ? 'ones' : (mag === 10 ? 'tens' : 'hundreds');
          return {
            display: [fwd ? 'What comes after?' : 'What comes before?', fwd ? x.n + ', ?' : '?, ' + x.n],
            speech: 'Count by ' + unit + '. What number comes ' + (fwd ? 'after ' : 'before ') + x.n + '?',
            answer: x.n + x.dir
          };
        },
        choices: (answer, numbers, rng) => nearStep(answer, Math.abs(numbers.dir), rng)
      },

      // place.two-digit: tens and ones. mode 0 reads the number from the pieces; mode 1 names the tens digit.
      // The picture (base-ten blocks) carries the task when sound is off; the buttons are tidy numbers.
      'tens-ones': {
        key: (x) => 'tens-ones:' + x.t + '/' + x.o + ':' + x.mode,
        size: (x) => x.t * 10 + x.o,
        create: (x) => (x.mode
          ? { display: ['How many tens?', 'The number is ' + (x.t * 10 + x.o) + '.'],
              speech: 'In ' + (x.t * 10 + x.o) + ', how many tens are there?', answer: x.t }
          : { display: [x.t + ' tens and ' + x.o + ' ones.', 'What number is it?'],
              speech: x.t + ' tens and ' + x.o + ' ones. What number is it?', answer: x.t * 10 + x.o }),
        choices: (answer, numbers, rng) => (numbers.mode
          ? others(answer, range(1, 9), 2, rng)
          : others(answer, range(10, 99), 2, rng))
      },

      // place.regroup: trade ten ones for a ten. mode 0: how many seeds are left after trading 10 away.
      // mode 1: how many ones after trading one ten for ten ones. The picture shows the trade; buttons are ones.
      'regroup': {
        key: (x) => 'regroup:' + (x.mode ? x.t + '/' + x.o + ':t' : x.o + ':s'),
        size: (x) => (x.mode ? x.o + 10 : x.o),
        create: (x) => (x.mode
          ? { display: ['Trade 1 bead rod for 10 seeds.', (x.t) + ' tens and ' + x.o + ' ones. How many ones now?'],
              speech: 'Trade one bead rod for ten seeds. You have ' + x.t + ' tens and ' + x.o + ' ones. How many ones are there now?', answer: x.o + 10 }
          : { display: ['Trade 10 seeds for a bead rod.', 'You start with ' + x.o + ' seeds. How many are left?'],
              speech: 'You have ' + x.o + ' seeds. Trade ten seeds for a bead rod. How many seeds are left?',
              answer: x.o - 10 }),
        choices: (answer, numbers, rng) => others(answer, range(0, 19), 2, rng)
      },

      // place.hundreds: hundreds, tens and ones. mode 0 reads the number from the pieces; mode 1 names the
      // value of the tens digit. The picture (flat tiles, bead rods, seeds) carries the task when sound is off.
      'hundreds': {
        key: (x) => 'hundreds:' + x.h + '/' + x.t + '/' + x.o + ':' + x.mode,
        size: (x) => x.h * 100 + x.t * 10 + x.o,
        create: (x) => {
          const num = x.h * 100 + x.t * 10 + x.o;
          return (x.mode
            ? { display: ['What is the tens digit worth?', 'The number is ' + num + '.'],
                speech: 'In ' + num + ', what is the value of the tens digit?', answer: x.t * 10 }
            : { display: [x.h + ' hundreds, ' + x.t + ' tens and ' + x.o + ' ones.', 'What number is it?'],
                speech: x.h + ' hundreds, ' + x.t + ' tens and ' + x.o + ' ones. What number is it?', answer: num });
        },
        choices: (answer, numbers, rng) => (numbers.mode
          ? others(answer, range(0, 9).map((k) => k * 10), 2, rng)
          : nearStep(answer, 10, rng))
      },

      // place.compare-order: which of two numbers is bigger? A two-button choice (D10-8): the buttons show the
      // two curriculum numbers themselves (choiceText), the answer is 0 (left bigger) or 1 (right bigger). The
      // speech names both numbers; the picture (two place-value charts) carries it when sound is off.
      'compare-pv': {
        key: (x) => 'compare-pv:' + Math.min(x.l, x.r) + '-' + Math.max(x.l, x.r),
        size: (x) => Math.max(x.l, x.r),
        // No bigger number in the speech beyond the two choices themselves (they are the question).
        create: (x) => ({
          display: ['Which is bigger?', x.l + ' or ' + x.r + '?'],
          speech: 'Which is bigger: ' + x.l + ' or ' + x.r + '?',
          answer: x.l > x.r ? 0 : 1,
          choiceText: { 0: String(x.l), 1: String(x.r) }
        }),
        // The two values only (0 = left, 1 = right), always both, order shuffled. No number button appears.
        choices: (answer, numbers, rng) => shuffle([0, 1], rng)
      },

      // place.compare-order (second activity): 10 or 100 more or less than a number. The buttons step by the
      // same amount (10 or 100), so a choice stays a tidy number. The change is spoken in words.
      'more-less': {
        key: (x) => 'more-less:' + x.n + ':' + x.d,
        size: (x) => Math.max(x.n, x.n + x.d),
        create: (x) => {
          const mag = Math.abs(x.d), word = mag === 10 ? '10' : '100', dir = x.d > 0 ? 'more than' : 'less than';
          return {
            display: [word + ' ' + dir + '?', 'The number is ' + x.n + '.'],
            speech: 'What is ' + word + ' ' + dir + ' ' + x.n + '?',
            answer: x.n + x.d
          };
        },
        choices: (answer, numbers, rng) => nearStep(answer, Math.abs(numbers.d), rng)
      },

      // place.round: round to the nearest 10 or 100. The buttons are the two tidy numbers the value sits
      // between, plus one more step, so a choice is always a multiple of `to`. The target is spoken in words.
      'round-pv': {
        key: (x) => 'round-pv:' + x.n + ':' + x.to,
        size: (x) => x.n,
        create: (x) => {
          const to = x.to, ans = Math.round(x.n / to) * to;
          return {
            display: ['Round to the nearest ' + to + '.', 'The number is ' + x.n + '.'],
            speech: 'Round ' + x.n + ' to the nearest ' + to + '.',
            answer: ans
          };
        },
        choices: (answer, numbers, rng) => {
          const to = numbers.to, lower = Math.floor(numbers.n / to) * to;
          return others(answer, [lower, lower + to, lower - to, lower + 2 * to].filter((v) => v >= 0 && v <= 1000), 2, rng);
        }
      }
    };

    return { TYPES, FAMILIES };
  });
}());
