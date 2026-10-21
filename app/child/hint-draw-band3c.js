/*
 * hintDrawBand3c (L5, step 11 sub-build C): the rung 2 (count together) and rung 3 (model) drawings for the band-3 FRACTION
 * question types, registered into hint-draw.js through hintDraw.register so hint-draw.js stays under the 400-line limit. Rung 1
 * (outline the picture) is handled by hint-draw.js through the shared "pattern" mark.
 *
 * Rung 2 never names the answer: it points at the equal parts, the piles, or the overlap, one by one. Rung 3 writes the model under
 * the picture as plain lines of text (a "note"): the equal fraction, the fraction a part at a time, the tops added over the same
 * bottom number, or the tops multiplied over the bottoms multiplied, then the answer. The note is a hint-ghost, so hintDraw.clear()
 * removes it; reserve() gives the picture its room back to refit. Under reduced motion the shared sequence() runs every step at once.
 * Fractions are written as "num/den" (ASCII); the note never shows a vulgar-fraction glyph.
 */
(function () {
  'use strict';

  NBA.define('hintDrawBand3c', ['hintDraw'], (hintDraw) => {
    const { sequence, reserveNote } = hintDraw.helpers;
    const all = (stage, sel) => Array.prototype.slice.call(stage.querySelectorAll(sel));
    const frac = (top, bot) => top + '/' + bot;

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
      'frac-equiv': flashSel('.b2-fseg'),
      'frac-of': flashSel('.b3-ofcount .counter'),
      'frac-addsame': flashSel('.b2-fseg'),
      'frac-addunlike': flashSel('.b2-fseg'),
      'frac-mul': (s) => flashEach(all(s, '.b3-oon').concat(all(s, '.b3-mulbar')))
    };

    const MODEL = {
      // frac-equiv: mode 0/2 the equal (or simplest) fraction; mode 1 which shaded bar is taller (no number, so a plain line).
      'frac-equiv': (s, q) => drawEquiv(s, q),
      'frac-of': (s, q) => { const x = q.numbers; note(s, ['One part is ' + x.w / x.b, x.t + ' parts: the answer is ' + x.w * x.t / x.b + '.']); },
      'frac-addsame': (s, q) => { const x = q.numbers; drawSum(s, x.mode ? x.t1 - x.t2 : x.t1 + x.t2, x.b); },
      'frac-addunlike': (s, q) => { const x = q.numbers, c = lcm(x.b1, x.b2); drawSum(s, x.mode ? x.t1 * (c / x.b1) - x.t2 * (c / x.b2) : x.t1 * (c / x.b1) + x.t2 * (c / x.b2), c); },
      'frac-mul': (s, q) => {
        const x = q.numbers;
        if (x.mode) note(s, [x.w + ' lots of ' + frac(x.t, x.b), 'The answer is ' + frac(x.w * x.t, x.b) + '.']);
        else note(s, [frac(x.t1, x.b1) + ' of ' + frac(x.t2, x.b2), 'Tops: ' + x.t1 + ' x ' + x.t2 + '. Bottoms: ' + x.b1 + ' x ' + x.b2 + '.', 'The answer is ' + frac(x.t1 * x.t2, x.b1 * x.b2) + '.']);
      }
    };

    /** The equal / compare / simplest model of frac-equiv. */
    function drawEquiv(s, q) {
      const x = q.numbers;
      if (x.mode === 1) { note(s, ['The taller shaded bar is bigger.']); return; }
      if (x.mode === 2) { note(s, [frac(x.p, x.q) + ' is the same as ' + simplestLabel(x.p, x.q) + '.']); return; }
      note(s, [frac(x.a, x.b) + ' is the same as ' + frac(x.a * x.m, x.b * x.m) + '.', 'The top number is ' + x.a * x.m + '.']);
    }
    /** The "tops over the same bottom number" model of frac-addsame / frac-addunlike (the top is computed by the caller). */
    function drawSum(s, top, bot) {
      note(s, ['The bottom number stays ' + bot + '.', 'The answer is ' + frac(top, bot) + '.']);
    }
    const gcd = (a, b) => (b ? gcd(b, a % b) : a);
    const lcm = (a, b) => a / gcd(a, b) * b;
    function simplestLabel(p, q) { const g = gcd(p, q); return frac(p / g, q / g); }

    hintDraw.register({ count: COUNT, model: MODEL });
    return {};
  });
}());
