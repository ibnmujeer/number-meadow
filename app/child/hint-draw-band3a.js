/*
 * hintDrawBand3a (L5, step 11 sub-build A): the rung 2 (count together) and rung 3 (model) drawings for the band-3 BIG NUMBERS and
 * FACTS question types, registered into hint-draw.js through hintDraw.register so hint-draw.js stays under the 400-line limit.
 * Rung 1 (outline the picture) is handled by hint-draw.js through the shared "pattern" mark (the b3-* pictures are in its list).
 *
 * Rung 2 never names the answer: it points at the groups of three digits, the five rows and the rest, the columns from the ones,
 * the parts of a bar, or the rows of an array, one by one (a flash on parts that are already on the stage). Rung 3 writes the model
 * under the picture as plain lines of text (a "note"): the worth, the two partial products, the sum, the groups that fit. The
 * note is a hint-ghost, so hintDraw.clear() removes it again, and reserve() gives the picture its room back to refit.
 * Under reduced motion the shared sequence() runs every step at once.
 */
(function () {
  'use strict';

  NBA.define('hintDrawBand3a', ['hintDraw'], (hintDraw) => {
    const { dotRow, sequence, reserveNote } = hintDraw.helpers;
    const MINUS = ' \u2212 ', TIMES = ' \u00d7 ';
    const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const all = (stage, sel) => Array.prototype.slice.call(stage.querySelectorAll(sel));
    const digitAt = (n, p) => Math.floor(n / Math.pow(10, p)) % 10;
    const gcd = (a, b) => (b ? gcd(b, a % b) : a);

    /** Text lines under the picture (a hint-ghost, removed by clear); the stage makes room and refits. */
    function note(stage, lines) {
      const el = document.createElement('div');
      el.className = 'hint-ghost b3-note';
      el.innerHTML = lines.map((l) => '<div class="b3-noteline"></div>').join('');
      all(el, '.b3-noteline').forEach((n, i) => { n.textContent = lines[i]; });
      stage.appendChild(el);
      stage.classList.add('hint-col');
      const widest = lines.reduce((m, l) => Math.max(m, l.length), 0);
      reserveNote(stage, lines.length, widest);
    }
    /** Flash each element of `els` in turn (the parts are already on the stage). */
    const flashEach = (els) => sequence(els.length, (i) => { if (els[i]) els[i].classList.add('hint-flash'); });
    const flashSel = (sel) => (s) => flashEach(all(s, sel));

    const COUNT = {
      // Point at the groups of three digits, the left one first (thousands, then ones).
      'place-big': flashSel('.b3-group'),
      // Point at the five rows, then at the rest.
      'mul-fact69': flashSel('.b3-top, .b3-rest'),
      // Point at the columns from the ones leftwards (every digit of a column flashes together).
      'add-big': columns,
      'sub-big': columns,
      // Point at the parts of the bar, one by one.
      'add-big-word': flashSel('.b3-parts .b3-bar:last-child .b3-seg'),
      'sub-big-word': flashSel('.b3-parts .b3-bar:last-child .b3-seg'),
      // Count one row (c, already in the question), then point at the rows.
      'div-fact': (s, q) => { dotRow(s, Math.min(20, q.numbers.c), true); flashSel('.b2-arow')(s); },
      // Point at the rows of the array, or at the two numbers; no number is named.
      factors: (s, q) => flashSel(q.numbers.mode === 3 ? '.b3-card .b2-line' : '.b2-arow')(s)
    };
    function columns(stage) {
      const len = all(stage, '.b3-d').reduce((m, d) => Math.max(m, Number(d.getAttribute('data-p')) + 1), 0);
      sequence(len, (i) => all(stage, '.b3-d[data-p="' + i + '"]').forEach((d) => d.classList.add('hint-flash')));
    }

    const eq = (a, b, sign, ans) => fmt(a) + (sign === '+' ? ' + ' : MINUS) + fmt(b) + ' = ' + fmt(ans);
    function groupsLine(n, d) {
      const k = Math.floor(n / d), rem = n - k * d;
      return k + ' groups of ' + d + ' make ' + k * d + (rem ? ', with ' + rem + ' left over' : '');
    }
    function factorsNote(s, x) {
      if (x.mode === 4) return note(s, [x.n + ' counters in ' + x.rows + ' rows', x.n / x.rows + ' in each row']);
      if (x.mode === 0) return note(s, [x.b + TIMES + x.k + ' = ' + x.b * x.k]);
      if (x.mode === 3) {
        const f = (n) => { const out = []; for (let i = 1; i <= n; i++) if (n % i === 0) out.push(i); return out.join(', '); };
        return note(s, ['Factors of ' + x.a + ': ' + f(x.a), 'Factors of ' + x.b + ': ' + f(x.b), 'Biggest in both: ' + gcd(x.a, x.b)]);
      }
      return note(s, [groupsLine(x.n, x.d)]);
    }

    const MODEL = {
      'place-big': (s, q) => {
        const x = q.numbers;
        if (x.mode === 0) note(s, ['The ' + digitAt(x.n, x.p) + ' is worth ' + fmt(digitAt(x.n, x.p) * Math.pow(10, x.p))]);
        else if (x.mode === 1) note(s, [fmt(x.n) + ' + 1 = ' + fmt(x.n + 1)]);
        else note(s, [fmt(x.n) + ' holds ' + fmt(x.n / 1000) + ' thousands']);
      },
      'mul-fact69': (s, q) => {
        const x = q.numbers;
        note(s, ['5' + TIMES + x.c + ' = ' + 5 * x.c, (x.r - 5) + TIMES + x.c + ' = ' + (x.r - 5) * x.c, 5 * x.c + ' + ' + (x.r - 5) * x.c + ' = ' + x.r * x.c]);
      },
      'add-big': (s, q) => note(s, [eq(q.numbers.a, q.numbers.b, '+', q.numbers.a + q.numbers.b)]),
      'sub-big': (s, q) => note(s, [eq(q.numbers.a, q.numbers.b, '-', q.numbers.a - q.numbers.b)]),
      'add-big-word': (s, q) => note(s, [eq(q.numbers.a, q.numbers.b, '+', q.numbers.a + q.numbers.b)]),
      'sub-big-word': (s, q) => note(s, [eq(q.numbers.a, q.numbers.b, '-', q.numbers.a - q.numbers.b)]),
      'div-fact': (s, q) => dotRow(s, Math.min(20, q.numbers.n / q.numbers.c), true),
      factors: (s, q) => factorsNote(s, q.numbers)
    };

    hintDraw.register({ count: COUNT, model: MODEL });
    return {};
  });
}());
