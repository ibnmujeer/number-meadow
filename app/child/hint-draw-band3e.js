/*
 * hintDrawBand3e (L5, step 11 sub-build E): the rung 2 (count together) and rung 3 (model) drawings for the band-3 PERCENT
 * question types, registered into hint-draw.js through hintDraw.register so hint-draw.js stays under the 400-line limit. Rung 1
 * (outline the picture) is handled by hint-draw.js through the shared "pattern" mark (the grid, the percent bar and the cards are
 * already in that mark's selector list from sub-builds C and D, plus the percent bar added here in hint-draw.js).
 *
 * Rung 2 never names the answer: it flashes the shaded squares, the shaded bar part, or the sum. Rung 3 writes the model under the
 * picture as plain lines of text (a hint-ghost, removed by clear): the percent, the matching decimal or the simplest fraction, then
 * the answer. The note reuses the shared .b3-note style and the sequence()/reserve() helpers, so under reduced motion the whole
 * sequence runs at once and the stage refits. Percents are written with the % sign; a fraction note is written "num/den" (ASCII).
 */
(function () {
  'use strict';

  NBA.define('hintDrawBand3e', ['hintDraw'], (hintDraw) => {
    const { sequence, reserveNote } = hintDraw.helpers;
    const all = (stage, sel) => Array.prototype.slice.call(stage.querySelectorAll(sel));

    function decLabel(code) {
      const whole = Math.floor(code / 100), h = code % 100;
      if (h === 0) return String(whole);
      if (h % 10 === 0) return whole + '.' + (h / 10);
      return whole + '.' + (h < 10 ? '0' + h : h);
    }
    const fracLabel = (code) => Math.floor(code / 100) + '/' + (code % 100);

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

    // hint-draw.js calls a model drawer as fn(stage, q), so each one recomputes its answer from q.numbers (the same arithmetic the
    // ladder SPEC uses). One drawer per activity id (the hint kind).
    const MODEL = {
      'pct-meaning': (s, q) => { const x = q.numbers; pctNote(s, x.mode === 0 ? x.x : x.mode === 1 ? x.top * 100 / x.bot : x.x * 100 / x.y); },
      'pct-bench': (s, q) => { const x = q.numbers; wholeNote(s, x.pct / 100 * x.amount); },
      'pct-link': (s, q) => {
        const x = q.numbers;
        if (x.mode === 0) note(s, ['The answer is ' + decLabel(x.top * 100 / x.bot) + '.']);
        else if (x.mode === 1) pctNote(s, x.code);
        else { const g = gcd(x.pct, 100); note(s, ['The answer is ' + fracLabel((x.pct / g) * 100 + 100 / g) + '.']); }
      },
      'pct-of': (s, q) => wholeNote(s, ofAnswer(q.numbers)),
      'pct-of-word': (s, q) => wholeNote(s, ofAnswer(q.numbers))
    };
    const pctNote = (s, pct) => note(s, ['The answer is ' + pct + '%.']);
    const wholeNote = (s, n) => note(s, ['The answer is ' + n + '.']);
    const gcd = (a, b) => (b ? gcd(b, a % b) : a);
    function ofAnswer(x) { const part = x.pct / 100 * x.amount; return x.mode ? x.amount - part : part; }

    // The rung-2 drawer, keyed by the activity id (the hint kind).
    const COUNT = {
      'pct-meaning': flashSel('.b3-gon'),
      'pct-link': flashSel('.b3-gon'),
      'pct-bench': flashSel('.b2-fon'),
      'pct-of': flashSel('.b3-divline'),
      'pct-of-word': flashSel('.b3-storyline')
    };

    hintDraw.register({ count: COUNT, model: MODEL });
    return {};
  });
}());
