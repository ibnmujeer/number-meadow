/*
 * hintDrawBand2 (L5, step 10 sub-build A): the rung 2 (count together) and rung 3 (model) drawings for the
 * band-2 (ages 7 to 9) PLACE VALUE and COUNTING question types, registered into hint-draw.js through
 * hintDraw.register so hint-draw.js stays under the 400-line limit. Rung 1 (outline the question numbers or
 * the picture) is handled by hint-draw.js through the shared "story-numbers" / "pattern" marks, so this
 * module only adds rung 2 and rung 3, keyed by the same kind as the SPEC (hint-ladder-band2.js) and the
 * hint text (feedback-lines-band2.js).
 *
 * Rung 2 never names the answer: for the counting types it counts up to a number ALREADY in the question
 * (the start), for the piece types it points at the pieces that are ALREADY on the stage, and for compare it
 * points at the two charts. Rung 3 shows the answer as a row of dots the child can count (capped at 20 so a
 * count to a big number never floods the stage; the picture is a help, not the whole number). The band-2
 * answers can be large (435, 500): the capped dot row stands for "here is how many", and the child still
 * taps the answer button.
 */
(function () {
  'use strict';

  NBA.define('hintDrawBand2', ['hintDraw'], (hintDraw) => {
    const { dotRow, sequence, mark, counterEls } = hintDraw.helpers;
    const cap = (n) => Math.max(0, Math.min(20, Math.abs(n)));
    const showAnswer = (answer) => (stage) => dotRow(stage, cap(answer), true);

    // Flash every base-ten piece (seed, rod, tile) that is already on the stage, one by one.
    const flashPieces = (stage) => {
      const pieces = Array.prototype.slice.call(stage.querySelectorAll('.counter, .rod, .tile'));
      sequence(pieces.length, (i) => { if (pieces[i]) pieces[i].classList.add('hint-flash'); });
    };
    // Flash the two place-value charts, one then the other (points at them, names no number).
    const flashCharts = (stage) => {
      const charts = Array.prototype.slice.call(stage.querySelectorAll('.b2-chart'));
      sequence(charts.length, (i) => { if (charts[i]) charts[i].classList.add('hint-flash'); });
    };
    // Count up to a number the child already sees in the question (the start n), as a row of dots.
    const countTo = (to) => (stage) => dotRow(stage, cap(to), true);

    // Flash the place-value charts / fact groups that are already on the stage (points, names no number).
    const flashColumns = (stage) => {
      const parts = Array.prototype.slice.call(stage.querySelectorAll('.b2-chartcol, .b2-fgroup, .b2-bar-seg'));
      sequence(parts.length, (i) => { if (parts[i]) parts[i].classList.add('hint-flash'); });
    };

    const COUNT = {
      // The start number is already in the question; count up to it (never past it, so the answer is unseen).
      'skip-count': (s, q) => countTo(q.numbers.n)(s),
      'count-1000': (s, q) => countTo(q.numbers.n)(s),
      'more-less': (s, q) => countTo(q.numbers.n)(s),
      'round-pv': (s, q) => countTo(q.numbers.n)(s),
      // The pieces are already on the stage; point at each one, one by one.
      'tens-ones': (s) => flashPieces(s),
      'regroup': (s) => flashPieces(s),
      'hundreds': (s) => flashPieces(s),
      // The two charts; point at each one.
      'compare-pv': (s) => flashCharts(s),
      /* ---------- sub-build B ---------- */
      // Facts: count the smaller group / the taken-away ones that are already in the question (never the
      // answer). The dot row stands for a number the child can already see in the sum.
      'add-fact': (s, q) => countTo(Math.min(q.numbers.a, q.numbers.b))(s),
      'sub-fact': (s, q) => countTo(q.numbers.b)(s),
      // Columns: point at each place column, one by one (adds no number the chart did not show).
      'add2': (s) => flashColumns(s), 'add3': (s) => flashColumns(s), 'add2r': (s) => flashColumns(s),
      'sub2': (s) => flashColumns(s), 'sub3': (s) => flashColumns(s), 'sub2r': (s) => flashColumns(s),
      // Two-step story: do the first step only, counting to the start number (already in the question).
      'two-step': (s, q) => countTo(q.numbers.s)(s)
    };

    const MODEL = {
      'skip-count': (s, q) => showAnswer(q.numbers.n + q.numbers.by)(s),
      'count-1000': (s, q) => showAnswer(q.numbers.n + q.numbers.dir)(s),
      'more-less': (s, q) => showAnswer(q.numbers.n + q.numbers.d)(s),
      'round-pv': (s, q) => showAnswer(Math.round(q.numbers.n / q.numbers.to) * q.numbers.to)(s),
      'tens-ones': (s, q) => showAnswer(q.numbers.mode ? q.numbers.t : q.numbers.t * 10 + q.numbers.o)(s),
      'regroup': (s, q) => showAnswer(q.numbers.mode ? q.numbers.o + 10 : q.numbers.o - 10)(s),
      'hundreds': (s, q) => showAnswer(q.numbers.mode ? q.numbers.t * 10 : q.numbers.h * 100 + q.numbers.t * 10 + q.numbers.o)(s),
      // compare: mark the bigger chart (the child still taps the matching number button). It does not add a
      // number; it outlines the chart that is already on the stage.
      'compare-pv': (s, q) => {
        const charts = Array.prototype.slice.call(s.querySelectorAll('.b2-chart'));
        mark([charts[q.numbers.l > q.numbers.r ? 0 : 1]]);
      },
      /* ---------- sub-build B ---------- */
      'add-fact': (s, q) => showAnswer(q.numbers.a + q.numbers.b)(s),
      'sub-fact': (s, q) => showAnswer(q.numbers.a - q.numbers.b)(s),
      'add2': (s, q) => showAnswer(q.numbers.a + q.numbers.b)(s),
      'add3': (s, q) => showAnswer(q.numbers.a + q.numbers.b)(s),
      'sub2': (s, q) => showAnswer(q.numbers.a - q.numbers.b)(s),
      'sub3': (s, q) => showAnswer(q.numbers.a - q.numbers.b)(s),
      // The regroup models show the TRADE first (ten ones carried as one ten, or a ten opened into ten ones),
      // then the answer as a row of dots. tradeFlash marks the ones column that trades; under reduced motion
      // the mark is applied at once (sequence() collapses), so the result is instant (the reduced-motion path).
      'add2r': (s, q) => { tradeFlash(s, 'carry'); showAnswer(q.numbers.a + q.numbers.b)(s); },
      'sub2r': (s, q) => { tradeFlash(s, 'borrow'); showAnswer(q.numbers.a - q.numbers.b)(s); },
      'two-step': (s, q) => showAnswer(q.numbers.s + q.numbers.x + q.numbers.y)(s)
    };

    // The trade flourish: flash the ones column of the chart to show where the regroup happens. A class names
    // whether a ten is carried (add) or a ten is opened (sub); the CSS gives the pulse, which does not play
    // under prefers-reduced-motion (motion.css), so the result still appears instantly.
    function tradeFlash(stage, kind) {
      // The ones column is the last column of each place-value chart; mark it on both rows of the sum.
      const ones = Array.prototype.slice.call(stage.querySelectorAll('.b2-chart')).map((chart) => {
        const cols = chart.querySelectorAll('.b2-chartcol');
        return cols[cols.length - 1];
      }).filter(Boolean);
      // The trade marker is applied at once (so the picture is correct even under reduced motion, which plays
      // no pulse); the hint-flash pulse is the only animated part, and motion.css stills it under reduced motion.
      ones.forEach((c) => c.classList.add('b2-trade-' + kind, 'hint-flash'));
    }
    return {};
  });
}());
