/*
 * questionTypesBand3e (L2, step 11 sub-build E): the band-3 (ages 10 to 12) PERCENT question types and their difficulty families,
 * merged by question-types.js with Object.assign like the band-2 and band-3a/b/c/d siblings.
 *
 * Sub-build E concepts (every prereq built in bands 1 and 2, or earlier in band 3):
 *   pct.meaning                pct-meaning   percent as parts of 100, on a hundred grid (an integer percent answer)
 *   pct.benchmarks             pct-bench     a half, a quarter and a tenth of an amount, on a percent bar (an integer answer)
 *   pct.fraction-decimal-link  pct-link      move between a fraction, a decimal and a percent, on a hundred grid (a coded or
 *                                            integer answer)
 *   pct.of-amount              pct-of        a percent of an amount (symbolic, an integer answer); pct-of-word the data's own
 *                                            price and bead stories (D11-7 word problem)
 *
 * All are inputMode "choices", answerType "integer". A percent is a whole number, so most answers are plain integer buttons. The
 * link activity (pct-link) can answer with a decimal (a hundredths CODE, 0.75 is 75) or a fraction (a CODE num*100 + den, 9/20 is
 * 920); each question is one kind only, so the codes never collide inside a question, and choiceText shows the real "0.75" / "9/20"
 * form. Speech spells every percent and number through numberWords (D11-10) as "twenty five percent", so it never holds the % sign
 * or a bare digit. Percents are written with the % sign on screen only; the % sign never appears in speech. Every number traces to
 * docs/curriculum-data.json examples and level sentences; the grids and bars around them are design hypotheses. pct-meaning and
 * pct-link draw on the hundred grid (the band-3 sub-build D way, reused); pct-bench draws on a percent bar (the fraction bar reused
 * with a % label); pct-of is symbolic with a bar in the rung-3 hint.
 *   TYPES[id] = { key, size, create, choices }      FAMILIES[name](params) = every candidate of one difficulty level.
 */
(function () {
  'use strict';

  NBA.define('questionTypesBand3e', ['util', 'numberWords'], (util, words) => {
    const { shuffle } = util;
    const sayPct = words.percent;      // 25 -> 'twenty five percent'
    const sayInt = words.integer;      // 80 -> 'eighty'
    const sayDec = words.decimal;      // '0.75' -> 'zero point seven five'
    const sayFrac = words.fraction;    // (3, 4) -> 'three quarters'

    /** A decimal (hundredths code, 0.75 is 75) as its written form "0.75" / "0.6" / "3" (matching questionTypesBand3d.decLabel). */
    function decLabel(code) {
      const whole = Math.floor(code / 100), h = code % 100;
      if (h === 0) return String(whole);
      if (h % 10 === 0) return whole + '.' + (h / 10);
      return whole + '.' + (h < 10 ? '0' + h : h);
    }
    const sayDecCode = (code) => sayDec(decLabel(code));
    /** A fraction num/den as a single integer CODE (den 2..99) and its ASCII "num/den" label. */
    function fracCode(num, den) { return num * 100 + den; }
    function fracLabel(code) { return Math.floor(code / 100) + '/' + (code % 100); }
    const gcd = (a, b) => (b ? gcd(b, a % b) : a);

    /** Up to `want` other values from `pool` (never the answer, all different), then the answer, shuffled. */
    function others(answer, pool, want, rng) {
      const opts = shuffle(pool.filter((v, i) => v !== answer && pool.indexOf(v) === i), rng).slice(0, want);
      return shuffle([answer].concat(opts), rng);
    }
    /** Three tidy whole-number buttons near `answer`, off by a little, kept >= 0 (for a percent or an amount answer). */
    function nearWhole(answer, rng) {
      const step = answer >= 40 ? 5 : 1;
      const pool = [answer - step, answer + step, answer - 2 * step, answer + 2 * step, answer + 3 * step].filter((v) => v >= 0);
      return others(answer, pool, 2, rng);
    }
    /** Near decimal codes for a coded decimal answer: a tenth or a hundredth either way, all a valid non-negative code. */
    function nearDecCodes(code) {
      return [code, code + 10, code - 10, code + 5, code - 5, code + 1, code - 1].filter((v, i, a) => v >= 0 && a.indexOf(v) === i);
    }
    function nearDecChoices(code, rng) { return others(code, nearDecCodes(code), 2, rng); }
    function decLabelsFor(code) { const m = {}; nearDecCodes(code).forEach((c) => { m[c] = decLabel(c); }); return m; }
    /** Near fraction codes for a coded fraction answer, keeping the SAME bottom number: the right top and tops either way. */
    function nearFracCodes(num, den) {
      return [num, num + 1, num - 1, num + 2, num - 2].filter((t) => t >= 1).map((t) => fracCode(t, den));
    }
    function nearFracChoices(num, den, rng) { return others(fracCode(num, den), nearFracCodes(num, den), 2, rng); }
    function fracLabelsFor(num, den) { const m = {}; nearFracCodes(num, den).forEach((c) => { m[c] = fracLabel(c); }); return m; }

    /* ---------- difficulty families (candidate sets) ---------- */
    // Every bound is a design hypothesis; the numbers stay inside the docs/curriculum-data.json examples and level sentences.
    const FAMILIES = {
      // pct-meaning: mode 0 "X of 100 squares are green, what percent" from `grid` X; mode 1 "a fraction 1/d, what percent" from
      // `frac` [top, bot] (bot divides 100); mode 2 "X of Y, what percent" from `part` [x, y] (y is 50/20/25, x/y*100 whole).
      'pct-meaning': (p) => {
        const out = [];
        (p.grid || []).forEach((x) => out.push({ mode: 0, x: x }));
        (p.frac || []).forEach((f) => out.push({ mode: 1, top: f[0], bot: f[1] }));
        (p.part || []).forEach((pr) => out.push({ mode: 2, x: pr[0], y: pr[1] }));
        return out;
      },
      // pct-bench: "P% of A" from `of` [pct, amount], pct a benchmark (50/25/10 at level 2; 75/20/5 added at level 3), the answer
      // pct/100*amount a whole number.
      'pct-bench': (p) => (p.of || []).map((x) => ({ pct: x[0], amount: x[1] })),
      // pct-link: mode 0 "fraction -> decimal" from `toDec` [top, bot] (a coded decimal answer); mode 1 "decimal -> percent" from
      // `toPct` a hundredths code (an integer percent answer); mode 2 "percent -> fraction simplest" from `toFrac` a percent (a
      // coded fraction answer in simplest form).
      'pct-link': (p) => {
        const out = [];
        (p.toDec || []).forEach((f) => out.push({ mode: 0, top: f[0], bot: f[1] }));
        (p.toPct || []).forEach((c) => out.push({ mode: 1, code: c }));
        (p.toFrac || []).forEach((pc) => out.push({ mode: 2, pct: pc }));
        return out;
      },
      // pct-of / pct-of-word: "P% of A" from `of` [pct, amount, mode], mode 0 a plain percent of an amount, mode 1 a take-off
      // ("P% off A", the answer amount - pct/100*amount). The word family uses the data's price (off) and bead (of) stories.
      'pct-of': (p) => (p.of || []).map((x) => ({ pct: x[0], amount: x[1], mode: x[2] || 0 })),
      'pct-of-word': (p) => (p.of || []).map((x) => ({ pct: x[0], amount: x[1], mode: x[2] || 0 }))
    };

    /* ---------- the question types ---------- */
    const TYPES = {
      // pct.meaning. mode 0 "X of 100 squares are green. What percent is green?" mode 1 "A bar is cut into d parts, t coloured.
      // What percent is coloured?" mode 2 "X of Y beads are marked. What percent are marked?" The hundred grid carries the task.
      'pct-meaning': {
        key: (x) => (x.mode === 0 ? 'pct-meaning:grid:' + x.x
          : x.mode === 1 ? 'pct-meaning:frac:' + x.top + '/' + x.bot
            : 'pct-meaning:part:' + x.x + '/' + x.y),
        size: (x) => (x.mode === 0 ? x.x : x.mode === 1 ? x.top * 100 / x.bot : x.x * 100 / x.y),
        create(x) {
          if (x.mode === 0) {
            return {
              display: ['A grid has 100 squares.', x.x + ' squares are green. What percent is green?'],
              speech: 'A grid has one hundred squares. ' + sayInt(x.x) + ' squares are green. What percent is green?',
              answer: x.x
            };
          }
          if (x.mode === 1) {
            const ans = x.top * 100 / x.bot, isare = x.top === 1 ? ' is coloured.' : ' are coloured.';
            return {
              display: ['A bar is cut into ' + x.bot + ' equal parts.', x.top + isare + ' What percent is coloured?'],
              speech: 'A bar is cut into ' + sayInt(x.bot) + ' equal parts. ' + sayInt(x.top) + isare + ' What percent is coloured?',
              answer: ans
            };
          }
          const ans = x.x * 100 / x.y;
          return {
            display: ['There are ' + x.y + ' beads. ' + x.x + ' are marked.', 'What percent are marked?'],
            speech: 'There are ' + sayInt(x.y) + ' beads. ' + sayInt(x.x) + ' are marked. What percent are marked?',
            answer: ans
          };
        },
        choices: (answer, x, rng) => nearWhole(answer, rng)
      },

      // pct.benchmarks. "What is P% of A?" P a benchmark (a half, a quarter, a tenth, and at level 3 three quarters, a fifth, a
      // twentieth). The percent bar shades the P% part. The answer is a whole number.
      'pct-bench': {
        key: (x) => 'pct-bench:' + x.pct + '%of' + x.amount,
        size: (x) => x.pct * x.amount,
        create(x) {
          const ans = x.pct / 100 * x.amount;
          return {
            display: ['What is ' + x.pct + '% of ' + x.amount + '?'],
            speech: 'What is ' + sayPct(x.pct) + ' of ' + sayInt(x.amount) + '?',
            answer: ans
          };
        },
        choices: (answer, x, rng) => nearWhole(answer, rng)
      },

      // pct.fraction-decimal-link. mode 0 "Write t/b as a decimal." (a coded decimal). mode 1 "Write D as a percent." (an integer
      // percent). mode 2 "Write P% as a fraction. Make it as simple as you can." (a coded fraction in simplest form). The hundred
      // grid shows the amount so the three forms read as one picture.
      'pct-link': {
        key: (x) => (x.mode === 0 ? 'pct-link:dec:' + x.top + '/' + x.bot
          : x.mode === 1 ? 'pct-link:pct:' + x.code
            : 'pct-link:frac:' + x.pct),
        size: (x) => (x.mode === 0 ? x.top * 100 / x.bot : x.mode === 1 ? x.code : x.pct),
        create(x) {
          if (x.mode === 0) {
            const code = x.top * 100 / x.bot; // the decimal in hundredths
            return {
              display: ['Write ' + x.top + '/' + x.bot + ' as a decimal.', 'Which decimal is it?'],
              speech: 'Write ' + sayFrac(x.top, x.bot) + ' as a decimal.',
              answer: code, choiceText: decLabelsFor(code)
            };
          }
          if (x.mode === 1) {
            const ans = x.code; // a decimal in hundredths equals that many percent (0.6 is 60 hundredths = 60 percent)
            return {
              display: ['Write ' + decLabel(x.code) + ' as a percent.', 'What percent is it?'],
              speech: 'Write ' + sayDecCode(x.code) + ' as a percent. What percent is it?',
              answer: ans
            };
          }
          const g = gcd(x.pct, 100), num = x.pct / g, den = 100 / g;
          return {
            display: ['Write ' + x.pct + '% as a fraction.', 'Make it as simple as you can.'],
            speech: 'Write ' + sayPct(x.pct) + ' as a fraction. Make it as simple as you can.',
            answer: fracCode(num, den), choiceText: fracLabelsFor(num, den)
          };
        },
        choices(answer, x, rng) {
          if (x.mode === 0) return nearDecChoices(answer, rng);
          if (x.mode === 1) return nearWhole(answer, rng);
          const g = gcd(x.pct, 100);
          return nearFracChoices(x.pct / g, 100 / g, rng);
        }
      },

      // pct.of-amount (symbolic). "What is P% of A?" (mode 0) or the price-off and bead stories (the word activity). The answer is
      // a whole number; a take-off (mode 1) gives the amount that is left (A - P% of A).
      'pct-of': ofType(false),
      'pct-of-word': ofType(true)
    };

    /** The percent-of-an-amount type (symbolic or the price / bead word problem). */
    function ofType(word) {
      return {
        key: (x) => (word ? 'pct-of-word:' : 'pct-of:') + x.pct + '%' + (x.mode ? 'off' : 'of') + x.amount,
        size: (x) => x.pct * x.amount + (x.mode ? 1 : 0),
        create(x) {
          const part = x.pct / 100 * x.amount, ans = x.mode ? x.amount - part : part;
          if (word) {
            const line = x.mode
              ? ['A toy costs ' + x.amount + ' rupees. It is ' + x.pct + '% off.', 'What is the new price in rupees?']
              : ['A bag has ' + x.amount + ' beads. ' + x.pct + '% of the beads are marked.', 'How many beads are marked?'];
            const spk = x.mode
              ? 'A toy costs ' + sayInt(x.amount) + ' rupees. It is ' + sayPct(x.pct) + ' off. What is the new price in rupees?'
              : 'A bag has ' + sayInt(x.amount) + ' beads. ' + sayPct(x.pct) + ' of the beads are marked. How many beads are marked?';
            return { display: line, speech: spk, answer: ans };
          }
          return {
            display: ['What is ' + x.pct + '% of ' + x.amount + '?'],
            speech: 'What is ' + sayPct(x.pct) + ' of ' + sayInt(x.amount) + '?',
            answer: ans
          };
        },
        choices: (answer, x, rng) => nearWhole(answer, rng)
      };
    }

    return { TYPES, FAMILIES, decLabel, fracLabel };
  });
}());
