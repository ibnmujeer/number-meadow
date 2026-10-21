/*
 * hintDrawBand1 (L5, step 9 sub-builds A to F): the rung 2 (count together) and rung 3 (model) drawings for
 * the band-1 counting, number-sense, subitizing, part-whole, ten-frame, make-5/make-10, teen-number and
 * fraction question types, registered into
 * hint-draw.js through
 * hintDraw.register so hint-draw.js stays under the 400-line limit. Rung 1 (outline the question numbers, or
 * the subitizing pattern card) is handled by hint-draw.js through the shared "story-numbers" / "pattern" marks,
 * so this module only adds rung 2 and rung 3.
 *
 * Counting types: rung 2 counts up to a number the child already sees (never the answer); rung 3 shows the
 * answer as a row of dots the child can count. Subitizing types: rung 2 points at the dots that are ALREADY on
 * the card, one by one (it adds no number the group did not already show); rung 3 lays the same group out as a
 * counted row. Dot rows are capped at 20 so a count to 100 never floods the stage; the picture is a help.
 */
(function () {
  'use strict';

  NBA.define('hintDrawBand1', ['hintDraw'], (hintDraw) => {
    const { dotRow, sequence } = hintDraw.helpers;
    const cap = (n) => Math.max(0, Math.min(20, n));

    // Count up to the number already in the question (the start), with ordinals, never the answer.
    const countTo = (to) => (stage) => dotRow(stage, cap(to), true);
    // The answer as a row of dots, numbered, so the child can count to it (rung 3 may reveal).
    const showAnswer = (answer) => (stage) => dotRow(stage, cap(answer), true);
    // Flash each dot already drawn on the subitizing card, one by one (points at what is shown, adds no number).
    const flashPattern = (stage) => {
      const dots = Array.prototype.slice.call(stage.querySelectorAll('.pdot'));
      sequence(dots.length, (i) => { if (dots[i]) dots[i].classList.add('hint-flash'); });
    };
    // Flash each pair box already on the even/odd scene, one by one (points at what is shown, adds no number).
    const flashPairs = (stage) => {
      const pairs = Array.prototype.slice.call(stage.querySelectorAll('.b1-pair'));
      sequence(pairs.length, (i) => { if (pairs[i]) pairs[i].classList.add('hint-flash'); });
    };

    const COUNT = {
      'count-next': (s, q) => countTo(q.numbers.n)(s),
      'count-back': (s, q) => countTo(q.numbers.n)(s),
      'count-on-100': (s, q) => countTo(Math.min(q.numbers.n, 10))(s),
      'count-tens': (s) => dotRow(s, 10, true),
      'numeral-say': (s, q) => dotRow(s, cap(q.numbers.n), true),
      'match-count': (s, q) => dotRow(s, cap(q.numbers.a), true),
      'subitize-dots': (s) => flashPattern(s),
      'subitize-dice': (s) => flashPattern(s),
      // part-bond: count up to the whole (a number the child already sees), never the hidden part.
      'part-bond': (s, q) => dotRow(s, cap(q.numbers.w), true),
      // ten-frame: point at the counters already on the frame, one by one (adds no number the frame did not show).
      'ten-frame': (s) => flashPattern(s),
      // line-read: count the tiles 0 up to the marked one as a row of dots (every tile is already on screen).
      'line-read': (s, q) => dotRow(s, cap(q.numbers.m), true),
      // even-odd: point at each pair already on screen, one by one (adds no number the picture did not show).
      'even-odd': (s) => flashPairs(s),
      // make-5: count up from the shown part to the whole (both numbers are already in the question), never
      // the partner. A row of dots to the whole lets the child count up to it.
      'make-5': (s, q) => dotRow(s, cap(q.numbers.whole), true),
      // make-10: point at the counters already on the ten-frame, one by one (adds no number the frame did not show).
      'make-10': (s) => flashPattern(s),
      // teen-ten: count the full ten as a row of dots first (the ten is on the card as a full frame); the
      // ones are then what is left over, so this adds no number the child cannot already see.
      'teen-ten': (s) => dotRow(s, 10, true),
      // frac-share: count the WHOLE group as a row of dots (the whole is in the question), so the child counts
      // all of them before sharing; it names no number the question did not already give.
      'frac-share': (s, q) => dotRow(s, cap(q.numbers.whole), true)
    };
    const MODEL = {
      'count-next': (s, q) => showAnswer(q.numbers.n + 1)(s),
      'count-back': (s, q) => showAnswer(q.numbers.n - 1)(s),
      'count-on-100': (s, q) => showAnswer(q.numbers.n + 1)(s),
      'count-tens': (s) => dotRow(s, 10, true),
      'numeral-say': (s, q) => dotRow(s, cap(q.numbers.n), true),
      'match-count': (s, q) => dotRow(s, cap(q.numbers.a), true),
      'subitize-dots': (s, q) => showAnswer(q.numbers.n)(s),
      'subitize-dice': (s, q) => showAnswer(q.numbers.n)(s),
      // part-bond: the hidden part as a row of dots to count (the whole minus the shown part).
      'part-bond': (s, q) => showAnswer(q.numbers.w - q.numbers.p)(s),
      // ten-frame: the answer as a row of dots - the counters shown, or the empty boxes left to fill.
      'ten-frame': (s, q) => showAnswer(q.numbers.empty ? 10 - q.numbers.n : q.numbers.n)(s),
      // line-read: the marked number as a row of dots the child can count up to (the number is already in view).
      'line-read': (s, q) => showAnswer(q.numbers.m)(s),
      // even-odd: the number as a row of dots so the child can pair them and see even or odd for themselves
      // (the drawing never names the answer in words; it shows the counters, capped like every other row).
      'even-odd': (s, q) => showAnswer(q.numbers.n)(s),
      // make-5: the partner that makes 5, as a row of dots the child can count (the whole minus the shown part).
      'make-5': (s, q) => showAnswer(q.numbers.whole - q.numbers.p)(s),
      // make-10: how many more make 10, as a row of dots (the whole minus the counters already on the frame).
      'make-10': (s, q) => showAnswer(q.numbers.whole - q.numbers.p)(s),
      // teen-ten: the ones as a row of dots the child can count (the number is already in view as loose counters).
      'teen-ten': (s, q) => showAnswer(q.numbers.n - 10)(s),
      // frac-share: one plate (the share) as a row of dots the child can count (the group dealt into equal
      // parts is already on the card, so the model only lays out one share to count).
      'frac-share': (s, q) => showAnswer(q.numbers.whole / q.numbers.parts)(s)
    };

    hintDraw.register({ count: COUNT, model: MODEL });
    return {};
  });
}());
