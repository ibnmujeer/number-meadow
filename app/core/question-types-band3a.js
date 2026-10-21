/*
 * questionTypesBand3a (L2, step 11 sub-build A): the band-3 (ages 10 to 12) BIG NUMBERS and FACTS question
 * types and their difficulty families, merged by question-types.js with Object.assign like the band-2 siblings.
 *
 * Sub-build A concepts (every prereq built in bands 1 and 2, or earlier in this sub-build):
 *   place.large           place-big      thousands and millions groups: what a digit is worth, the next number, thousands in
 *   mul.facts-6-9         mul-fact69     the 6, 7, 8 and 9 times tables, shown as an array cut into fives and the rest
 *   add.large             add-big        adding numbers of up to six digits (a sum card), add-big-word the town story
 *   sub.large             sub-big        taking away numbers of up to six digits, sub-big-word the stadium story
 *   div.facts             div-fact       division facts for the 3 and 4 tables, then the 6 to 9 tables, on an array
 *   mul.factors-multiples factors        factors and multiples: five kinds of question (see `mode`)
 *
 * All are inputMode "choices", answerType "integer". Big numbers are written with a comma between groups of three digits
 * (thousands and millions, never lakhs or crores) in the display and on the buttons; the button value (data-value) stays the
 * plain integer and choiceText gives the grouped label. A yes/no question uses the answers 0 (Yes) and 1 (No) with choiceText.
 * Speech spells every number with numberWords, so it never holds a digit run, a comma or a maths symbol. Every number traces to
 * docs/curriculum-data.json (examples and level sentences); the grids around them are design hypotheses (CLAUDE.md rule 8).
 *   TYPES[id] = { key, size, create, choices }      FAMILIES[name](params) = every candidate of one difficulty level.
 */
(function () {
  'use strict';

  NBA.define('questionTypesBand3a', ['util', 'numberWords'], (util, words) => {
    const { shuffle } = util;
    const MINUS = ' \u2212 ', TIMES = ' \u00d7 ', DIVIDE = ' \u00f7 ';
    const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); // 1,000 and 1,000,000
    const say = words.integer;
    const digitAt = (n, p) => Math.floor(n / Math.pow(10, p)) % 10;

    /** Up to `want` other values from `pool` (never the answer, all different), then the answer, shuffled. */
    function others(answer, pool, want, rng) {
      const opts = shuffle(pool.filter((v, i) => v !== answer && pool.indexOf(v) === i), rng).slice(0, want);
      return shuffle([answer].concat(opts), rng);
    }
    /** choiceText for a list of values: the grouped label of each (so any button the pool gives is labelled). */
    function labels(values) { const m = {}; values.forEach((v) => { m[v] = fmt(v); }); return m; }
    const YES_NO = { 0: 'Yes', 1: 'No' };
    const yesNo = (answer, numbers, rng) => shuffle([0, 1], rng);
    const near = (answer, rng, steps) => others(answer, steps.map((s) => answer + s).filter((v) => v > 0), 2, rng);

    /* ---------- place.large ---------- */
    function placeAnswer(x) { return x.mode === 0 ? digitAt(x.n, x.p) * Math.pow(10, x.p) : (x.mode === 1 ? x.n + 1 : x.n / 1000); }
    function placePool(x) {
      const ans = placeAnswer(x);
      if (x.mode === 0) {
        const d = digitAt(x.n, x.p), pool = [];
        for (let q = 0; q < String(x.n).length; q++) if (q !== x.p) pool.push(d * Math.pow(10, q));
        return pool;
      }
      return x.mode === 1 ? [x.n, ans / 10, ans / 100] : [ans * 10, ans / 10, ans * 100];
    }
    /** The addition carries (or subtraction borrows) of a column sum: how many places trade. */
    function carries(a, b) { let c = 0, k = 0; while (a > 0 || b > 0 || k > 0) { k = (a % 10 + b % 10 + k) >= 10 ? 1 : 0; c += k; a = Math.floor(a / 10); b = Math.floor(b / 10); } return c; }
    function borrows(a, b) { let c = 0, k = 0; while (a > 0 || b > 0) { k = (a % 10 - k) < (b % 10) ? 1 : 0; c += k; a = Math.floor(a / 10); b = Math.floor(b / 10); } return c; }
    const gcd = (a, b) => (b ? gcd(b, a % b) : a);
    const factorsOf = (n) => { const f = []; for (let i = 1; i <= n; i++) if (n % i === 0) f.push(i); return f; };

    /* ---------- difficulty families (candidate sets) ---------- */
    const FAMILIES = {
      // place-big: mode 0 the worth of a digit that appears once (positions pMin..pMax from the right), mode 1 the number just
      // after each n of `after`, mode 2 how many thousands are in each n of `thousands`.
      'place-big': (p) => {
        const out = [], w = p.worth;
        if (w) {
          const nums = (w.nums || []).slice();
          for (let n = w.nMin; n <= w.nMax; n += w.step) nums.push(n);
          nums.forEach((n) => { for (let q = w.pMin; q <= w.pMax; q++) {
            const d = digitAt(n, q);
            if (d > 0 && String(n).split(String(d)).length === 2) out.push({ mode: 0, n: n, p: q });
          } });
        }
        (p.after || []).forEach((n) => out.push({ mode: 1, n: n }));
        (p.thousands || []).forEach((n) => out.push({ mode: 2, n: n }));
        return out;
      },
      // mul-fact69: a table r (6 to 9) times c; the data's own facts (6 x 7, 9 x 8, 7 x 8) are inside the grid.
      'mul-fact69': (p) => { const out = []; p.rows.forEach((r) => { for (let c = p.cMin; c <= p.cMax; c++) out.push({ r: r, c: c }); }); return out; },
      // big-add / big-add-word: a + b with the carries between cMin and cMax, a sum under `cap`; `zero` wants a zero digit.
      'big-add': (p) => {
        const out = (p.pairs || []).map((x) => ({ a: x[0], b: x[1] }));
        for (let a = p.aMin; a <= p.aMax; a += p.aStep) for (let b = p.bMin; b <= p.bMax; b += p.bStep) {
          const c = carries(a, b);
          if (a + b <= p.cap && c >= p.cMin && c <= p.cMax && (!p.zero || /0/.test(String(a) + String(b)))) out.push({ a: a, b: b });
        }
        return out;
      },
      // big-sub / big-sub-word: a - b with the borrows between cMin and cMax; `zero` wants a zero digit in the top number.
      'big-sub': (p) => {
        const out = (p.pairs || []).map((x) => ({ a: x[0], b: x[1] }));
        for (let a = p.aMin; a <= p.aMax; a += p.aStep) for (let b = p.bMin; b <= p.bMax && b < a; b += p.bStep) {
          const c = borrows(a, b);
          if (c >= p.cMin && c <= p.cMax && (!p.zero || /0/.test(String(a)))) out.push({ a: a, b: b });
        }
        return out;
      },
      // div-fact: n = r x c shared by c, c one of `cols`, the answer r from rMin to rMax.
      'div-fact': (p) => { const out = []; p.cols.forEach((c) => { for (let r = p.rMin; r <= p.rMax; r++) out.push({ n: r * c, c: c }); }); return out; },
      // factors: mode 4 rows of an array, 1 is d a factor of n, 0 the k-th multiple, 2 is n a multiple of d, 3 the biggest common factor.
      factors: (p) => {
        const out = [];
        (p.arrays || []).forEach((x) => out.push({ mode: 4, n: x[0], rows: x[1] }));
        (p.ns || []).forEach((n) => { for (let d = p.dMin; d <= p.dMax; d++) out.push({ mode: 1, d: d, n: n }); });
        (p.bases || []).forEach((b) => { for (let k = p.kMin; k <= p.kMax; k++) out.push({ mode: 0, b: b, k: k }); });
        (p.ds || []).forEach((d) => { for (let k = p.mMin; k <= p.mMax; k++) { out.push({ mode: 2, d: d, n: d * k }); out.push({ mode: 2, d: d, n: d * k + (k % 2 ? -1 : 1) }); } });
        (p.pairs || []).forEach((x) => out.push({ mode: 3, a: x[0], b: x[1] }));
        return out;
      }
    };
    FAMILIES['big-add-word'] = FAMILIES['big-add'];
    FAMILIES['big-sub-word'] = FAMILIES['big-sub'];

    /* ---------- create helpers ---------- */
    function sumType(id, sign, word, answerOf) {
      const pool = (x) => [10, 100, 1000].reduce((m, s) => m.concat([answerOf(x) - s, answerOf(x) + s]), []).filter((v) => v > 0);
      return {
        key: (x) => id + ':' + x.a + sign + x.b,
        size: (x) => Math.max(x.a, x.b, answerOf(x)),
        create: (x) => ({
          display: [fmt(x.a) + (sign === '+' ? ' + ' : MINUS) + fmt(x.b) + ' = ?'],
          speech: say(x.a) + '. ' + word + ' ' + say(x.b) + '. ' + (sign === '+' ? 'What is the total?' : 'How many are left?'),
          answer: answerOf(x),
          choiceText: labels(pool(x).concat([answerOf(x)]))
        }),
        choices: (answer, x, rng) => others(answer, pool(x), 2, rng)
      };
    }
    function storyType(id, sign, answerOf, lines) {
      const base = sumType(id, sign, '', answerOf);
      return {
        key: base.key, size: base.size, choices: base.choices,
        create(x) {
          const display = lines(x);
          const q = base.create(x);
          return { display: display, speech: display.join(' ').replace(/[\d,]+/g, (m) => say(Number(m.replace(/,/g, '')))), answer: q.answer, choiceText: q.choiceText };
        }
      };
    }

    const TYPES = {
      'place-big': {
        key: (x) => 'place-big:' + x.mode + ':' + x.n + ':' + (x.p === undefined ? '' : x.p),
        size: (x) => x.n + 1,
        create(x) {
          const ans = placeAnswer(x);
          const text = labels(placePool(x).concat([ans]));
          if (x.mode === 0) {
            const d = digitAt(x.n, x.p);
            return { display: ['In ' + fmt(x.n) + ',', 'what is the ' + d + ' worth?'], answer: ans, choiceText: text,
              speech: 'Look at this number. ' + say(x.n) + '. What is the digit ' + say(d) + ' worth?' };
          }
          return x.mode === 1
            ? { display: ['What number comes', 'right after ' + fmt(x.n) + '?'], answer: ans, choiceText: text, speech: 'What number comes right after ' + say(x.n) + '?' }
            : { display: ['How many thousands', 'are there in ' + fmt(x.n) + '?'], answer: ans, choiceText: text, speech: 'Look at this number. ' + say(x.n) + '. How many thousands are in it?' };
        },
        choices: (answer, x, rng) => others(answer, placePool(x), 2, rng)
      },

      'mul-fact69': {
        key: (x) => 'mul-fact69:' + x.r + 'x' + x.c,
        size: (x) => x.r * x.c,
        create: (x) => ({ display: [x.r + TIMES + x.c + ' = ?'], speech: 'What is ' + x.r + ' times ' + x.c + '?', answer: x.r * x.c }),
        choices: (answer, x, rng) => others(answer, [answer - x.r, answer + x.r, answer - x.c, answer + x.c, answer - 1, answer + 1].filter((v) => v > 0), 2, rng)
      },

      'add-big': sumType('add-big', '+', 'Plus', (x) => x.a + x.b),
      'sub-big': sumType('sub-big', '-', 'Take away', (x) => x.a - x.b),
      // The data's own stories (D11-7): a town and its people, a stadium and its seats. Each line is one short sentence.
      'add-big-word': storyType('add-big-word', '+', (x) => x.a + x.b,
        (x) => ['A town has ' + fmt(x.a) + ' people.', fmt(x.b) + ' more move in.', 'How many now?']),
      'sub-big-word': storyType('sub-big-word', '-', (x) => x.a - x.b,
        (x) => ['A stadium has ' + fmt(x.a) + ' seats.', fmt(x.b) + ' are sold.', 'How many are free?']),

      'div-fact': {
        key: (x) => 'div-fact:' + x.n + '/' + x.c,
        size: (x) => x.n,
        create: (x) => ({ display: [x.n + DIVIDE + x.c + ' = ?'], speech: 'What is ' + x.n + ' divided by ' + x.c + '?', answer: x.n / x.c }),
        choices: (answer, x, rng) => near(answer, rng, [-1, 1, -2, 2, 3])
      },

      factors: {
        key: (x) => 'factors:' + x.mode + ':' + [x.n, x.d, x.b, x.k, x.a, x.rows].filter((v) => v !== undefined).join('-'),
        size: (x) => Math.max(x.n || 0, x.a || 0, x.b || 0, x.b * x.k || 0),
        create(x) {
          if (x.mode === 4) return { display: [x.n + ' counters in ' + x.rows + ' rows.', 'How many in each row?'], answer: x.n / x.rows,
            speech: say(x.n) + ' counters in ' + x.rows + ' rows. How many in each row?' };
          if (x.mode === 0) return { display: ['Count by ' + x.b + 's: ' + x.b + ', ' + 2 * x.b + ', ' + 3 * x.b + ' and on.', 'What is the ' + x.k + 'th multiple of ' + x.b + '?'],
            answer: x.b * x.k, speech: 'Count by ' + x.b + 's. What is the ' + words.ordinal(x.k) + ' multiple of ' + x.b + '?' };
          if (x.mode === 3) return { display: ['Which is the biggest', 'factor of both ' + x.a + ' and ' + x.b + '?'], answer: gcd(x.a, x.b),
            speech: 'Which is the biggest factor of both ' + x.a + ' and ' + x.b + '?' };
          const isFactor = x.mode === 1;
          return { display: [isFactor ? 'Is ' + x.d + ' a factor of ' + x.n + '?' : 'Is ' + x.n + ' a multiple of ' + x.d + '?'],
            answer: x.n % x.d === 0 ? 0 : 1, choiceText: YES_NO,
            speech: (isFactor ? 'Is ' + x.d + ' a factor of ' + x.n : 'Is ' + x.n + ' a multiple of ' + x.d) + '? Say yes or no.' };
        },
        choices(answer, x, rng) {
          if (x.mode === 1 || x.mode === 2) return yesNo(answer, x, rng);
          if (x.mode === 3) {
            const g = gcd(x.a, x.b);
            return others(g, factorsOf(x.a).concat(factorsOf(x.b)).filter((v) => v > 1 && v !== g), 2, rng);
          }
          return x.mode === 0 ? others(answer, [answer - x.b, answer + x.b, answer - 1, answer + 1], 2, rng) : near(answer, rng, [-1, 1, -2, 2, 3]);
        }
      }
    };

    return { TYPES, FAMILIES, fmt };
  });
}());
