/*
 * hintDrawBand2c (L5, step 10 sub-build C): the rung 2 (count together) and rung 3 (model) drawings for the
 * band-2 (ages 7 to 9) MULTIPLICATION and DIVISION question types, registered into hint-draw.js through
 * hintDraw.register so hint-draw.js stays under the 400-line limit. Rung 1 (outline the array / groups picture)
 * is handled by hint-draw.js through the shared "pattern" mark, so this module only adds rung 2 and rung 3,
 * keyed by the same type id as the SPEC (hint-ladder-band2c.js) and the hint text (feedback-lines.js hints).
 *
 * Rung 2 never names the answer: for the arrays it counts ONE row (the second factor, a number already in the
 * question), for div.group it counts ONE group (the group size, already in the question). Rung 3 shows the
 * answer as a row of dots the child can count (capped at 20 so a count to a big product never floods the stage;
 * the picture is a help, not the whole number). The child still taps the answer button.
 */
(function () {
  'use strict';

  NBA.define('hintDrawBand2c', ['hintDraw'], (hintDraw) => {
    const { dotRow, sequence } = hintDraw.helpers;
    const cap = (n) => Math.max(0, Math.min(20, Math.abs(n)));
    const showAnswer = (answer) => (stage) => dotRow(stage, cap(answer), true);
    // Count up to a number the child already sees in the question (one row / one group), as a row of dots.
    const countTo = (to) => (stage) => dotRow(stage, cap(to), true);

    // Flash each row of the array (or each group plate) that is already on the stage, one by one. It points at
    // the parts without adding any number the picture did not already show.
    const flashParts = (sel) => (stage) => {
      const parts = Array.prototype.slice.call(stage.querySelectorAll(sel));
      sequence(parts.length, (i) => { if (parts[i]) parts[i].classList.add('hint-flash'); });
    };

    const COUNT = {
      // Arrays: count one row (c counters, a number already in the question), then point at the other rows.
      'mul-array': (s, q) => { countTo(q.numbers.c)(s); flashParts('.b2-arow')(s); },
      'mul-fact': (s, q) => { countTo(q.numbers.c)(s); flashParts('.b2-arow')(s); },
      'mul-fact34': (s, q) => { countTo(q.numbers.c)(s); flashParts('.b2-arow')(s); },
      // div.inverse: count one row of the array (c, already in the question), then point at the rows.
      'div-inverse': (s, q) => { countTo(q.numbers.c)(s); flashParts('.b2-arow')(s); },
      // div.group: count one group (s counters, already in the question), then point at every group plate.
      'div-group': (s, q) => { countTo(q.numbers.s)(s); flashParts('.b2-plate')(s); }
    };

    const MODEL = {
      'mul-array': (s, q) => showAnswer(q.numbers.r * q.numbers.c)(s),
      'mul-fact': (s, q) => showAnswer(q.numbers.r * q.numbers.c)(s),
      'mul-fact34': (s, q) => showAnswer(q.numbers.r * q.numbers.c)(s),
      'div-group': (s, q) => showAnswer(q.numbers.n / q.numbers.s)(s),
      'div-inverse': (s, q) => showAnswer(q.numbers.n / q.numbers.c)(s)
    };

    hintDraw.register({ count: COUNT, model: MODEL });
    return {};
  });
}());
