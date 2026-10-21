/*
 * hintDrawBand2e (L5, step 10 sub-build E): the rung 2 (count together) and rung 3 (model) drawings for the
 * band-2 (ages 7 to 9) NEGATIVES, ORDER-OF-OPERATIONS and MISSING-NUMBER question types, registered into
 * hint-draw.js through hintDraw.register so hint-draw.js stays under the 400-line limit. Rung 1 (outline the
 * question numbers or the picture) is handled by hint-draw.js through the shared "story-numbers" / "pattern"
 * marks (this module's pattern targets are added to hint-draw.js's TARGETS list), so this module only adds
 * rung 2 and rung 3, keyed by the same kind as the SPEC (hint-ladder-band2e.js) and the hint text
 * (feedback-lines.js hints).
 *
 * Rung 2 never names the answer: it counts down the vertical line to zero (not past it), does the first step
 * of a left-to-right sum, counts the group that is already on the stage, or points at the balance's two pans.
 * Rung 3 shows the answer: a marked tick on the vertical line, a row of counters, or the balance tipped the
 * way the numbers say (the true/false check never shows an animated tip under reduced motion; the class is
 * applied at once, exactly like the sub-build B regroup trade).
 */
(function () {
  'use strict';

  NBA.define('hintDrawBand2e', ['hintDraw'], (hintDraw) => {
    const { dotRow, sequence, mark } = hintDraw.helpers;
    const cap = (n) => Math.max(0, Math.min(20, Math.abs(n)));
    const showAnswer = (answer) => (stage) => dotRow(stage, cap(answer), true);

    // Count down the vertical line's rows, from the top to zero (never past it into the negative rows).
    const countDownToZero = (stage) => {
      const rows = Array.prototype.slice.call(stage.querySelectorAll('.b2-vrow'));
      const zeroIdx = rows.findIndex((r) => r.querySelector('.b2-vzero'));
      sequence(Math.max(0, zeroIdx + 1), (i) => { if (rows[i]) rows[i].classList.add('hint-flash'); });
    };
    // Mark the row at value `v` on the vertical line (the rung-3 answer tick).
    function markVerticalRow(stage, v) {
      const rows = Array.prototype.slice.call(stage.querySelectorAll('.b2-vrow'));
      const row = rows.find((r) => {
        const n = r.querySelector('.b2-vnum');
        return n && Number(n.textContent) === v;
      });
      if (row) { row.classList.add('b2-vrow-on', 'hint-flash'); }
    }
    // Flash the known counter group(s) that are already on the stage (never the dashed mystery group).
    const flashKnown = (stage) => {
      const groups = Array.prototype.slice.call(stage.querySelectorAll('.b2-fgroup')).filter((g) => !g.classList.contains('b2-mystery'));
      sequence(groups.length, (i) => { if (groups[i]) groups[i].classList.add('hint-flash'); });
    };
    // Point at the balance's two pans, one then the other.
    const flashPans = (stage) => {
      const pans = Array.prototype.slice.call(stage.querySelectorAll('.b2-pan'));
      sequence(pans.length, (i) => { if (pans[i]) pans[i].classList.add('hint-flash'); });
    };
    // Fill the dashed mystery group with a row of answer dots, standing in for the box.
    function fillMystery(stage, answer) {
      const m = stage.querySelector('.b2-mystery');
      if (!m) { showAnswer(answer)(stage); return; }
      let html = ''; for (let i = 0; i < cap(answer); i++) html += '<span class="hint-dot on"></span>';
      m.innerHTML = '<div class="hint-ghost hint-dots">' + html + '</div>';
    }

    const COUNT = {
      'neg': (s) => countDownToZero(s),
      // The first step of the left-to-right sum: a dot row of the smaller of a and b (both already shown).
      'ops-steps': (s, q) => dotRow(s, cap(Math.min(q.numbers.a, q.numbers.b)), true),
      'missing-num': (s) => flashKnown(s),
      'balance': (s) => flashPans(s),
      'missing-muldiv': (s) => flashKnown(s)
    };

    const MODEL = {
      'neg': (s, q) => markVerticalRow(s, -q.numbers.n),
      'ops-steps': (s, q) => showAnswer(q.numbers.mode ? q.numbers.a - q.numbers.b + q.numbers.c : q.numbers.a + q.numbers.b + q.numbers.c)(s),
      'missing-num': (s, q) => {
        const n = q.numbers, answer = n.mode === 0 ? n.c - n.a : (n.mode === 1 ? n.c - n.b : n.a - n.c);
        fillMystery(s, answer);
      },
      // balance mode 0 (true/false): tip the beam the way the numbers say (level if the two sides are equal).
      // The class is applied at once (no animated swing), so the result is correct even under reduced motion.
      'balance': (s, q) => {
        const n = q.numbers;
        if (n.mode === 0) {
          const beam = s.querySelector('.b2-beam');
          if (beam) { beam.classList.remove('b2-tip-left', 'b2-tip-right'); if (!n.trueAnswer) beam.classList.add(n.a + n.b > n.c ? 'b2-tip-left' : 'b2-tip-right'); }
        } else {
          const answer = n.mode === 1 ? n.a + n.b - n.c : n.d - n.e;
          fillMystery(s, answer);
        }
      },
      'missing-muldiv': (s, q) => {
        const n = q.numbers;
        const answer = n.mode === 0 ? n.c / n.a : (n.mode === 1 ? n.c / n.b : (n.mode === 2 ? n.c / n.a : n.a * n.b));
        fillMystery(s, answer);
      }
    };

    hintDraw.register({ count: COUNT, model: MODEL });
    return {};
  });
}());
