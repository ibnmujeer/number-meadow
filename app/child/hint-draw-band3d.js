/*
 * hintDrawBand3d (L5, step 11 sub-build D): the rung 2 (count together) and rung 3 (model) drawings for the band-3 DECIMAL
 * question types, registered into hint-draw.js through hintDraw.register so hint-draw.js stays under the 400-line limit. Rung 1
 * (outline the picture) is handled by hint-draw.js through the shared "pattern" mark (the grid, the line and the cards are added
 * to that mark's selector list in hint-draw.js).
 *
 * Rung 2 never names the answer: it flashes the shaded columns and squares, or the marks on the line, one by one. Rung 3 writes
 * the model under the picture as plain lines of text (a hint-ghost, removed by clear): the decimal the grid shows, the count of
 * tenths, or which decimal is bigger / smallest. The note reuses the shared .b3-note style and the sequence()/reserve() helpers,
 * so under reduced motion the whole sequence runs at once and the stage refits. Decimals are written with a point ("4.7").
 */
(function () {
  'use strict';

  NBA.define('hintDrawBand3d', ['hintDraw'], (hintDraw) => {
    const { sequence, reserveNote } = hintDraw.helpers;
    const all = (stage, sel) => Array.prototype.slice.call(stage.querySelectorAll(sel));

    function decLabel(code) {
      const whole = Math.floor(code / 100), h = code % 100;
      if (h === 0) return String(whole);
      if (h % 10 === 0) return whole + '.' + (h / 10);
      return whole + '.' + (h < 10 ? '0' + h : h);
    }

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

    // hint-draw.js calls a model drawer as fn(stage, q), so each one recomputes its answer from q.numbers (the same arithmetic
    // the ladder SPEC uses). One drawer per activity id (the hint kind), so the right note is written whatever the mode.
    const MODEL = {
      'dec-tenths': (s, q) => { const x = q.numbers; if (x.mode === 2) wholeNote(s, x.n); else valueNote(s, x.mode === 1 ? x.w * 100 + x.t * 10 : x.top * 10); },
      'dec-hundredths': (s, q) => { const x = q.numbers; valueNote(s, x.mode === 2 ? x.paise : x.mode === 1 ? x.tenths * 10 + x.hundredths : x.top); },
      'dec-compare': (s, q) => {
        const x = q.numbers;
        if (x.mode === 2) wholeNote(s, x.n);
        else note(s, ['The marked one is the answer.']);
      },
      'dec-addsub': (s, q) => valueNote(s, q.numbers.mode ? q.numbers.a - q.numbers.b : q.numbers.a + q.numbers.b),
      'dec-addsub-word': (s, q) => valueNote(s, q.numbers.mode ? q.numbers.a - q.numbers.b : q.numbers.a + q.numbers.b),
      'dec-muldiv': (s, q) => valueNote(s, q.numbers.mode ? q.numbers.a / q.numbers.b : q.numbers.a * q.numbers.b),
      'dec-muldiv-word': (s, q) => valueNote(s, q.numbers.mode ? q.numbers.a / q.numbers.b : q.numbers.a * q.numbers.b)
    };
    const valueNote = (s, code) => note(s, ['The answer is ' + decLabel(code) + '.']);
    const wholeNote = (s, n) => note(s, ['The answer is ' + n + '.']);

    // The rung-2 drawer, keyed by the activity id (the hint kind), so hint-draw.js finds a COUNT entry per kind.
    const COUNT = {
      'dec-tenths': flashSel('.b3-gon'),
      'dec-hundredths': flashSel('.b3-gon'),
      'dec-compare': flashSel('.b3-dtick'),
      'dec-addsub': flashSel('.b3-divline'),
      'dec-addsub-word': flashSel('.b3-storyline'),
      'dec-muldiv': flashSel('.b3-divline'),
      'dec-muldiv-word': flashSel('.b3-storyline')
    };

    hintDraw.register({ count: COUNT, model: MODEL });
    return {};
  });
}());
