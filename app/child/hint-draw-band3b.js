/*
 * hintDrawBand3b (L5, step 11 sub-build B): the rung 2 (count together) and rung 3 (model) drawings for the band-3 AREA MODEL,
 * REMAINDER and LONG DIVISION question types, registered into hint-draw.js through hintDraw.register so hint-draw.js stays under
 * the 400-line limit. Rung 1 (outline the picture) is handled by hint-draw.js through the shared "pattern" mark.
 *
 * Rung 2 never names the answer: it points at the parts of the rectangle, the piles, or each place of the number, one by one.
 * Rung 3 writes the model under the picture as plain lines of text (a "note"): the partial products added, the full piles and the
 * remainder, or the WRITTEN LONG-DIVISION LAYOUT (bring down, subtract) for the two division sums (D11-6: the layout is a hint, not
 * a new interaction). The note is a hint-ghost, so hintDraw.clear() removes it; reserve() gives the picture its room back to refit.
 * Under reduced motion the shared sequence() runs every step at once.
 */
(function () {
  'use strict';

  NBA.define('hintDrawBand3b', ['hintDraw'], (hintDraw) => {
    const { sequence, reserveNote } = hintDraw.helpers;
    const TIMES = ' \u00d7 ';
    const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const all = (stage, sel) => Array.prototype.slice.call(stage.querySelectorAll(sel));
    const tens = (n) => n - (n % 10);
    const ones = (n) => n % 10;

    /** Text lines under the picture (a hint-ghost, removed by clear); the stage makes room and refits. */
    function note(stage, lines) {
      const el = document.createElement('div');
      el.className = 'hint-ghost b3-note';
      el.innerHTML = lines.map(() => '<div class="b3-noteline"></div>').join('');
      all(el, '.b3-noteline').forEach((n, i) => { n.textContent = lines[i]; });
      stage.appendChild(el);
      stage.classList.add('hint-col');
      const widest = lines.reduce((m, l) => Math.max(m, l.length), 0);
      reserveNote(stage, lines.length, widest);
    }
    const flashEach = (els) => sequence(els.length, (i) => { if (els[i]) els[i].classList.add('hint-flash'); });
    const flashSel = (sel) => (s) => flashEach(all(s, sel));

    const COUNT = {
      // Point at the cells of the rectangle, one by one.
      'mul-area1': flashSel('.b3-cell'),
      'mul-area2': flashSel('.b3-cell'),
      // Point at the full piles, then the leftover pile.
      'div-rem': flashSel('.b2-plate'),
      // Point at each place of the number from the left (the digits of the division card), then the story bar parts.
      'div-multi': flashSel('.b3-divline'),
      'div-long': flashSel('.b3-divline'),
      'div-multi-word': flashSel('.b3-parts .b3-bar:last-child .b3-seg'),
      'div-long-word': flashSel('.b3-parts .b3-bar:last-child .b3-seg')
    };

    /** The written long-division layout as plain lines: n, then each (digit brought down, product subtracted), then the answer. */
    function longLines(n, d, answer) {
      const lines = [fmt(n) + ' \u00f7 ' + fmt(d) + ':'];
      const digits = String(n).split('');
      let carry = 0, quotient = '';
      digits.forEach((ch) => {
        const cur = carry * 10 + Number(ch);
        const q = Math.floor(cur / d);
        quotient += q;
        if (q > 0 || quotient.length > 1) lines.push(d + TIMES + q + ' = ' + d * q + ', ' + cur + ' \u2212 ' + d * q + ' = ' + (cur - d * q));
        carry = cur - d * q;
      });
      lines.push('The answer is ' + fmt(answer) + '.');
      return lines.slice(-4);
    }

    const MODEL = {
      'mul-area1': (s, q) => { const x = q.numbers; const lines = [tens(x.a) + TIMES + x.b + ' = ' + tens(x.a) * x.b];
        if (ones(x.a)) lines.push(ones(x.a) + TIMES + x.b + ' = ' + ones(x.a) * x.b);
        lines.push('Total: ' + fmt(x.a * x.b)); note(s, lines); },
      'mul-area2': (s, q) => { const x = q.numbers; const parts = [tens(x.a) * tens(x.b), ones(x.a) * tens(x.b), tens(x.a) * ones(x.b), ones(x.a) * ones(x.b)].filter((v) => v > 0);
        note(s, ['The parts: ' + parts.join(' + '), 'Total: ' + fmt(x.a * x.b)]); },
      'div-rem': (s, q) => {
        const x = q.numbers, full = Math.floor(x.n / x.d), rem = x.n % x.d;
        if (x.mode === 2) note(s, [full + ' vans hold ' + full * x.d, rem ? 'One more van for the last ' + rem : 'Every child has a seat', 'The answer is ' + Math.ceil(x.n / x.d) + '.']);
        else note(s, [full + ' full piles of ' + x.d + ' make ' + full * x.d, rem + ' left over']);
      },
      'div-multi': (s, q) => note(s, longLines(q.numbers.n, q.numbers.d, q.numbers.n / q.numbers.d)),
      'div-long': (s, q) => note(s, longLines(q.numbers.n, q.numbers.d, q.numbers.n / q.numbers.d)),
      'div-multi-word': (s, q) => note(s, [fmt(q.numbers.n) + ' \u00f7 ' + q.numbers.d + ' = ' + fmt(q.numbers.n / q.numbers.d)]),
      'div-long-word': (s, q) => note(s, [fmt(q.numbers.n) + ' \u00f7 ' + q.numbers.d + ' is about ' + Math.floor(q.numbers.n / q.numbers.d), 'The answer is ' + Math.floor(q.numbers.n / q.numbers.d) + '.'])
    };

    hintDraw.register({ count: COUNT, model: MODEL });
    return {};
  });
}());
