/*
 * questionTypesBand3d (L2, step 11 sub-build D): the band-3 (ages 10 to 12) DECIMAL question types and their difficulty families,
 * merged by question-types.js with Object.assign like the band-2 and band-3a/b/c siblings.
 *
 * Sub-build D concepts (every prereq built in bands 1 and 2, or earlier in band 3):
 *   dec.tenths           dec-tenths      a tenth as a decimal, on a hundred grid (a coded or whole-number answer)
 *   dec.hundredths       dec-hundredths  a hundredth as a decimal, on a hundred grid (a coded answer)
 *   dec.compare-order    dec-compare     which decimal is bigger / smallest, on a number line (a two-button, index or whole answer)
 *   dec.add-sub          dec-addsub      add or take away two decimals (symbolic, a coded answer); dec-addsub-word the ribbon story
 *   dec.multiply-divide  dec-muldiv      multiply or divide a decimal by a whole number (symbolic, a coded answer); dec-muldiv-word the pens story
 *
 * All are inputMode "choices", answerType "integer". A decimal answer is a CHOICE/integer activity: the button data-value is an
 * integer CODE in HUNDREDTHS (0.3 is 30, 6.25 is 625, 75 is 7500), so no float equality is ever compared, and choiceText shows the
 * real decimal "0.3" / "6.25" / "75". Some modes ask for a plain whole number (how many tenths, which is smallest, fill ?/100): the
 * answer is that whole number with no choiceText (the value is its own label). Speech spells every number through numberWords
 * (D11-10) as "two point seven five", so it never holds a maths sign or a bare long digit. Decimals are written with a point and no
 * trailing hundredth zero ("4.7", not "4.70"); a whole result is written with no point ("75"). Every number traces to
 * docs/curriculum-data.json examples and level sentences; the grids and lines around them are design hypotheses.
 *   TYPES[id] = { key, size, create, choices }      FAMILIES[name](params) = every candidate of one difficulty level.
 */
(function () {
  'use strict';

  NBA.define('questionTypesBand3d', ['util', 'numberWords'], (util, words) => {
    const { shuffle } = util;
    const sayInt = words.integer;      // 12 -> 'twelve'
    const sayDec = words.decimal;      // '2.75' -> 'two point seven five'

    /** A decimal (hundredths code, 0.3 is 30) as its real written form: "0.3", "6.25", "75" (no trailing hundredth zero, no
     *  point for a whole result). Used for choiceText and inside the display sentence. */
    function decLabel(code) {
      const whole = Math.floor(code / 100), h = code % 100;
      if (h === 0) return String(whole);
      if (h % 10 === 0) return whole + '.' + (h / 10);
      return whole + '.' + (h < 10 ? '0' + h : h);
    }
    /** The speakable form of a hundredths code: numberWords.decimal of the same written form, so "6.25" speaks as
     *  "six point two five" and "75" as "seventy five". */
    const sayCode = (code) => sayDec(decLabel(code));

    /** Up to `want` other values from `pool` (never the answer, all different), then the answer, shuffled. */
    function others(answer, pool, want, rng) {
      const opts = shuffle(pool.filter((v, i) => v !== answer && pool.indexOf(v) === i), rng).slice(0, want);
      return shuffle([answer].concat(opts), rng);
    }
    /** Three tidy whole-number buttons near `answer`, off by one and two, kept >= 0 (for a count or fill answer). */
    function nearWhole(answer, rng) {
      const pool = [answer - 1, answer + 1, answer - 2, answer + 2, answer + 3].filter((v) => v >= 0);
      return others(answer, pool, 2, rng);
    }
    /** Near decimal codes for a coded answer: the right code and wrong codes a tenth or a hundredth away (a "place slip"), all a
     *  valid non-negative code. The answer is always first, so the pool and the choiceText always include it. */
    function nearDec(code) {
      return [code, code + 10, code - 10, code + 1, code - 1, code + 100, code - 100].filter((v, i, a) => v >= 0 && a.indexOf(v) === i);
    }
    /** choiceText covering every near code of a coded answer (plus any extras), code -> real decimal label. create() cannot see the
     *  rng, so the map must cover the whole pool choices() could pick. */
    function decLabelsFor(code, extra) {
      const m = {};
      nearDec(code).forEach((c) => { m[c] = decLabel(c); });
      (extra || []).forEach((c) => { m[c] = decLabel(c); });
      return m;
    }
    /** Three decimal-code buttons: the right code and two near codes (a place slip). */
    function nearDecChoices(code, rng) { return others(code, nearDec(code), 2, rng); }

    /* ---------- difficulty families (candidate sets) ---------- */
    // Every bound is a design hypothesis; the numbers stay inside the docs/curriculum-data.json examples and level sentences.
    const FAMILIES = {
      // dec-tenths: mode 0 "what decimal is top/10" from `frac` [top, 10]; mode 1 "write W and t tenths as a decimal" from
      // `whole` [W, t]; mode 2 "how many tenths in a one-place decimal" from `count` (the decimal is count tenths, so count/10).
      'dec-tenths': (p) => {
        const out = [];
        (p.frac || []).forEach((x) => out.push({ mode: 0, top: x[0] }));
        (p.whole || []).forEach((x) => out.push({ mode: 1, w: x[0], t: x[1] }));
        (p.count || []).forEach((n) => out.push({ mode: 2, n: n }));
        return out;
      },
      // dec-hundredths: mode 0 "what decimal is top/100" from `frac` [top, 100]; mode 1 "T tenths and H hundredths as a decimal"
      // from `parts` [T, H]; mode 2 "P paise is how many rupees" from `paise` (P paise is P/100 rupees).
      'dec-hundredths': (p) => {
        const out = [];
        (p.frac || []).forEach((x) => out.push({ mode: 0, top: x[0] }));
        (p.parts || []).forEach((x) => out.push({ mode: 1, tenths: x[0], hundredths: x[1] }));
        (p.paise || []).forEach((n) => out.push({ mode: 2, paise: n }));
        return out;
      },
      // dec-compare: mode 0 "which is bigger" two codes from `cmp` [a, b] (a two-button answer, never equal); mode 1 "which is
      // smallest" of three codes from `small` [a, b, c] (the index of the smallest, D11-8); mode 2 "a one-place decimal = ?/100"
      // from `fill` (a one-place decimal in hundredths; the answer is that number of hundredths, a whole number).
      'dec-compare': (p) => {
        const out = [];
        (p.cmp || []).forEach((x) => out.push({ mode: 0, a: x[0], b: x[1] }));
        (p.small || []).forEach((x) => out.push({ mode: 1, vals: x.slice() }));
        (p.fill || []).forEach((n) => out.push({ mode: 2, n: n }));
        return out;
      },
      // dec-addsub / dec-addsub-word: two decimals a and b in hundredths. mode 0 add, mode 1 take away (a > b). `pairs` seed the
      // data's own sums; the grid walks a and b by their steps, the result kept positive and under cap.
      'dec-addsub': (p) => addsub(p),
      'dec-addsub-word': (p) => (p.pairs || []).map((x) => ({ mode: x[2], a: x[0], b: x[1] })),
      // dec-muldiv / dec-muldiv-word: mode 0 a decimal a (hundredths) times a whole number b from `mul` [a, b]; mode 1 a decimal a
      // divided by a whole number b from `div` [a, b] (a divides exactly by b in hundredths). `mul`/`div` seed the data's own ones.
      'dec-muldiv': (p) => {
        const out = [];
        (p.mul || []).forEach((x) => out.push({ mode: 0, a: x[0], b: x[1] }));
        (p.div || []).forEach((x) => out.push({ mode: 1, a: x[0], b: x[1] }));
        return out;
      },
      'dec-muldiv-word': (p) => (p.mul || []).map((x) => ({ mode: 0, a: x[0], b: x[1] }))
    };

    function addsub(p) {
      const out = [];
      (p.pairs || []).forEach((x) => out.push({ mode: x[2], a: x[0], b: x[1] }));
      for (let a = p.aMin; a <= p.aMax; a += p.aStep) for (let b = p.bMin; b <= p.bMax; b += p.bStep) {
        if (a + b <= p.cap) out.push({ mode: 0, a: a, b: b });
        if (a > b) out.push({ mode: 1, a: a, b: b });
      }
      return out;
    }

    /* ---------- the question types ---------- */
    const TYPES = {
      // dec.tenths. mode 0 "What decimal is top/10?" (coded). mode 1 "Write W and t tenths as a decimal." (coded, an instruction).
      // mode 2 "How many tenths are there in X.Y?" (a whole number). The hundred grid carries the task.
      'dec-tenths': {
        key: (x) => (x.mode === 0 ? 'dec-tenths:frac:' + x.top + '/10'
          : x.mode === 1 ? 'dec-tenths:whole:' + x.w + '+' + x.t + '/10'
            : 'dec-tenths:count:' + x.n),
        size: (x) => (x.mode === 2 ? x.n : x.mode === 1 ? x.w * 100 + x.t * 10 : x.top * 10),
        create(x) {
          if (x.mode === 2) {
            return {
              display: ['How many tenths are there in ' + decLabel(x.n * 10) + '?'],
              speech: 'How many tenths are there in ' + sayCode(x.n * 10) + '?',
              answer: x.n
            };
          }
          if (x.mode === 1) {
            const code = x.w * 100 + x.t * 10;
            return {
              display: ['Write ' + x.w + ' and ' + x.t + ' tenths as a decimal.', 'Which decimal is it?'],
              speech: 'Write ' + sayInt(x.w) + ' and ' + sayInt(x.t) + ' tenths as a decimal.',
              answer: code, choiceText: decLabelsFor(code)
            };
          }
          const code = x.top * 10;
          return {
            display: ['What decimal is ' + x.top + '/10?'],
            speech: 'What decimal is ' + words.fraction(x.top, 10) + '?',
            answer: code, choiceText: decLabelsFor(code)
          };
        },
        choices: (answer, x, rng) => (x.mode === 2 ? nearWhole(answer, rng) : nearDecChoices(answer, rng))
      },

      // dec.hundredths. mode 0 "What decimal is top/100?" (coded). mode 1 "T tenths and H hundredths as a decimal" (coded). mode 2
      // "P paise is how many rupees?" (coded). The hundred grid shades the right squares.
      'dec-hundredths': {
        key: (x) => (x.mode === 0 ? 'dec-hundredths:frac:' + x.top + '/100'
          : x.mode === 1 ? 'dec-hundredths:parts:' + x.tenths + 't' + x.hundredths + 'h'
            : 'dec-hundredths:paise:' + x.paise),
        size: (x) => (x.mode === 0 ? x.top : x.mode === 1 ? x.tenths * 10 + x.hundredths : x.paise),
        create(x) {
          if (x.mode === 2) {
            const code = x.paise;
            return {
              display: ['A pencil costs ' + x.paise + ' paise.', 'How many rupees is that?'],
              speech: 'A pencil costs ' + sayInt(x.paise) + ' paise. How many rupees is that?',
              answer: code, choiceText: decLabelsFor(code)
            };
          }
          if (x.mode === 1) {
            const code = x.tenths * 10 + x.hundredths;
            return {
              display: ['What decimal is ' + x.tenths + ' tenths and ' + x.hundredths + ' hundredths?'],
              speech: 'What decimal is ' + sayInt(x.tenths) + ' tenths and ' + sayInt(x.hundredths) + ' hundredths?',
              answer: code, choiceText: decLabelsFor(code)
            };
          }
          const code = x.top;
          return {
            display: ['What decimal is ' + x.top + '/100?'],
            speech: 'What decimal is ' + words.fraction(x.top, 100) + '?',
            answer: code, choiceText: decLabelsFor(code)
          };
        },
        choices: (answer, x, rng) => nearDecChoices(answer, rng)
      },

      // dec.compare-order. mode 0 "Which is bigger?" two decimals (two-button). mode 1 "Which is smallest?" three decimals (the
      // index of the smallest; the "put in order" task becomes a single pick, D11-8). mode 2 "a one-place decimal = ?/100" (a whole
      // number). The number line carries the task.
      'dec-compare': {
        key: (x) => (x.mode === 0 ? 'dec-compare:cmp:' + x.a + 'v' + x.b
          : x.mode === 1 ? 'dec-compare:small:' + x.vals.join('-')
            : 'dec-compare:fill:' + x.n),
        size: (x) => (x.mode === 1 ? Math.max.apply(null, x.vals) : x.mode === 0 ? Math.max(x.a, x.b) : x.n),
        create(x) {
          if (x.mode === 0) {
            const ans = x.a > x.b ? 0 : 1;
            return {
              display: ['Which is bigger?', decLabel(x.a) + ' or ' + decLabel(x.b) + '?'],
              speech: 'Which is bigger: ' + sayCode(x.a) + ' or ' + sayCode(x.b) + '?',
              answer: ans, choiceText: { 0: decLabel(x.a), 1: decLabel(x.b) }
            };
          }
          if (x.mode === 1) {
            const min = Math.min.apply(null, x.vals), ans = x.vals.indexOf(min);
            const ct = {}; x.vals.forEach((v, i) => { ct[i] = decLabel(v); });
            return {
              display: ['Which is smallest?', x.vals.map(decLabel).join(', ') + '?'],
              speech: 'Which is smallest? ' + x.vals.map(sayCode).join(', ') + '.',
              answer: ans, choiceText: ct
            };
          }
          return {
            display: [decLabel(x.n) + ' = ?/100.', 'What is the top number?'],
            speech: 'How many hundredths make ' + sayCode(x.n) + '?',
            answer: x.n
          };
        },
        choices(answer, x, rng) {
          if (x.mode === 0) return shuffle([0, 1], rng);
          if (x.mode === 1) return shuffle(x.vals.map((v, i) => i), rng);
          return nearWhole(answer, rng);
        }
      },

      // dec.add-sub (symbolic). mode 0 add, mode 1 take away. Two decimals lined up at the point; the answer is a coded decimal.
      'dec-addsub': addSubType(false),
      // dec.add-sub (word problem, D11-7): the data's own ribbon story, a take-away of two lengths in metres.
      'dec-addsub-word': addSubType(true),

      // dec.multiply-divide (symbolic). mode 0 a decimal times a whole number, mode 1 a decimal divided by a whole number. The
      // answer is a coded decimal.
      'dec-muldiv': mulDivType(false),
      // dec.multiply-divide (word problem, D11-7): the data's own pens story, a price times a count of pens (a whole-rupee answer).
      'dec-muldiv-word': mulDivType(true)
    };

    /** The add / take-away type (symbolic or the ribbon word problem). */
    function addSubType(word) {
      return {
        key: (x) => (word ? 'dec-addsub-word:' : 'dec-addsub:') + x.mode + ':' + x.a + (x.mode ? '-' : '+') + x.b,
        size: (x) => (x.mode ? x.a - x.b : x.a + x.b),
        create(x) {
          const ans = x.mode ? x.a - x.b : x.a + x.b;
          if (word) {
            // The ribbon is x.a hundredths of a metre long; x.b is cut off (a take-away) or added (a join).
            const line = x.mode
              ? ['A ribbon is ' + decLabel(x.a) + ' metres long.', decLabel(x.b) + ' metres are cut off. How long is the rest?']
              : ['A ribbon is ' + decLabel(x.a) + ' metres long.', decLabel(x.b) + ' more metres are added. How long is it now?'];
            const spk = x.mode
              ? 'A ribbon is ' + sayCode(x.a) + ' metres long. ' + sayCode(x.b) + ' metres are cut off. How long is the rest?'
              : 'A ribbon is ' + sayCode(x.a) + ' metres long. ' + sayCode(x.b) + ' more metres are added. How long is it now?';
            return { display: line, speech: spk, answer: ans, choiceText: decLabelsFor(ans) };
          }
          const sum = decLabel(x.a) + (x.mode ? ' - ' : ' + ') + decLabel(x.b);
          return {
            display: [sum + ' = ?'],
            speech: (x.mode ? sayCode(x.a) + ' take away ' + sayCode(x.b) : sayCode(x.a) + ' and ' + sayCode(x.b)) + '. What is the answer?',
            answer: ans, choiceText: decLabelsFor(ans)
          };
        },
        choices: (answer, x, rng) => nearDecChoices(answer, rng)
      };
    }

    /** The multiply / divide type (symbolic or the pens word problem). A product or quotient of a decimal (hundredths) and a whole
     *  number: multiply keeps the hundredths, divide splits them exactly, so the code stays an integer. */
    function mulDivType(word) {
      return {
        key: (x) => (word ? 'dec-muldiv-word:' : 'dec-muldiv:') + x.mode + ':' + x.a + (x.mode ? '/' : 'x') + x.b,
        size: (x) => (x.mode ? x.a / x.b : x.a * x.b),
        create(x) {
          const ans = x.mode ? x.a / x.b : x.a * x.b;
          if (word) {
            return {
              display: ['One pen costs ' + decLabel(x.a) + ' rupees.', 'How much do ' + x.b + ' pens cost?'],
              speech: 'One pen costs ' + sayCode(x.a) + ' rupees. How much do ' + sayInt(x.b) + ' pens cost?',
              answer: ans, choiceText: decLabelsFor(ans)
            };
          }
          const sum = x.mode ? decLabel(x.a) + ' \u00f7 ' + x.b : decLabel(x.a) + ' \u00d7 ' + x.b;
          return {
            display: [sum + ' = ?'],
            speech: (x.mode ? sayCode(x.a) + ' divided by ' + sayInt(x.b) : sayCode(x.a) + ' times ' + sayInt(x.b)) + '. What is the answer?',
            answer: ans, choiceText: decLabelsFor(ans)
          };
        },
        choices: (answer, x, rng) => nearDecChoices(answer, rng)
      };
    }

    return { TYPES, FAMILIES, decLabel };
  });
}());
