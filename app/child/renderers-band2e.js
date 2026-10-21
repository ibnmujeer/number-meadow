/*
 * renderersBand2e (L5, step 10 sub-build E): the pictures for the band-2 (ages 7 to 9) NEGATIVES,
 * ORDER-OF-OPERATIONS and MISSING-NUMBER question types, kept out of renderers.js (and the band-2 siblings,
 * which are near the 400-line limit). renderers.js merges this map into its own and attaches every entry with
 * questionTypes.attachRenderer.
 *   render(stage, q) draws into #stage and returns a fit spec { wu, hu } for counters.fitStage().
 *
 * ONE new way of showing is introduced here (owner decision D10-2 = A): 'vertical-number-line' (numbers below
 * zero, drawn as a column of ticks going down from 0, the thermometer / floors-below-ground picture of the
 * Step 6 note), placed in representations.order and config.adaptive.concretenessOrder right after 'concrete'
 * (see representations.js / config.js). unk.equals-balance is rendered with a two-pan balance picture under
 * the EXISTING 'symbolic' representation id (a related existing id, NOT a new one, per the plan); the balance
 * art is new but the representation id it reports is 'symbolic'. unk.missing-number and unk.missing-mul-div
 * use the EXISTING 'visual' representation (a plain counters picture, so they do not borrow mul.arrays' array
 * credit). ops.left-to-right uses the EXISTING 'symbolic' representation (a plain prompt card).
 * Colour comes from the CSS token names, never from the HTML string (STYLE 7.1); every shape is flat; no
 * animation, no timer, no score. The picture carries the task when sound is off.
 */
(function () {
  'use strict';

  NBA.define('renderersBand2e', ['util', 'counters'], (util, counters) => {
    const { esc } = util;
    const { counterHTML } = counters;

    /** A plain card holding the question's display lines (reused from the band-2 counting pattern). */
    function promptCard(stage, q) {
      const lines = q.display.map((t) => '<div class="b2-line">' + esc(t) + '</div>').join('');
      stage.innerHTML = '<div class="scene scene-mid"><div class="b2-card">' + lines + '</div></div>';
      return counters.cardFit(q.display, 2.4, 3);
    }

    /*
     * Vertical number line: a column of ticks from +2 at the top down through 0 to -n at the bottom, so "down
     * means below zero" is seen directly (the thermometer / floors-below-ground idea of the Step 6 note). The
     * zero tick is labelled; the marked tick (the answer, shown only at rung 3) carries a dot. Every tick above
     * zero is plain; every tick at or below zero down to -n is drawn, so the line never implies a number that
     * is not part of the question.
     */
    /** A line of more than this many steps shows a label on every second tick (Step 12, owner-visible: the 20-step line did not fit a 320 px phone). */
    const VLINE_ALL_LABELS = 12;
    /** Whether the tick for value v shows its label on a vertical line of n steps with the answer tick at markAt (null when none): every label up to 12 steps;
     *  above that the even ones, plus 0, the lowest tick (the number the question asks about) and the marked tick. Every step keeps its tick. */
    function verticalLabelShown(v, n, markAt) {
      if (n <= VLINE_ALL_LABELS) return true;
      return v === 0 || v === -n || v === markAt || v % 2 === 0;
    }
    function verticalLineHTML(n, markAt) {
      const top = 2; // a little room above zero, so zero does not sit at the very top
      let rows = '';
      for (let v = top; v >= -n; v--) {
        const isZero = v === 0;
        const on = typeof markAt === 'number' && v === markAt;
        // every label stays in the page (the hint finds the answer row by it); a hidden one is only invisible
        rows += '<div class="b2-vrow' + (on ? ' b2-vrow-on' : '') + '">' +
          '<span class="b2-vtick' + (isZero ? ' b2-vzero' : '') + '"></span>' +
          '<span class="b2-vnum' + (verticalLabelShown(v, n, markAt) ? '' : ' b2-vsoft') + '">' + (isZero ? '0' : v) + '</span></div>';
      }
      return '<div class="b2-vline' + (n > VLINE_ALL_LABELS ? ' b2-vthin' : '') + '" role="img" aria-label="A number line standing up, with zero marked">' + rows + '</div>';
    }
    /** Every row is as tall as its label (line-height 1, 11 px at the least, plus a 1 px gap). Below u = 11 the rows keep their 11 px label, so the
     *  rows are counted in px (12 px each) and only the width and the label size follow u. */
    function verticalLineFit(n) {
      const rows = n + 3;
      if (n > VLINE_ALL_LABELS) return { wu: 8, hu: rows + 0.4 }; // thin line: every row is exactly 1u tall (band2.css .b2-vthin)
      return { wu: 8, hu: rows, hpx: rows, prep: (W, H) => ((H - rows) / rows < 11 ? { hu: Math.max(0.5, (H - rows * 12) / 11), hpx: rows * 12 } : {}) };
    }

    /*
     * Missing-number / missing-mul-div counter picture: the two known amounts as groups of seeds and pebbles,
     * with a dashed "mystery" group standing in for the box (never sized to the answer, so it cannot leak it).
     * Used for unk.missing-number (an adding/taking-away sentence) and unk.missing-mul-div (a times/sharing
     * sentence); the second group is drawn as a short array row instead of a single stack for the times/
     * sharing case, so "equal groups" is still readable.
     */
    function mysteryHTML(known, mode, isMul) {
      const group = (n, tone, kind) => { let h = ''; for (let i = 0; i < n; i++) h += counterHTML(kind, tone); return '<div class="b2-fgroup">' + h + '</div>'; };
      const mystery = '<div class="b2-fgroup b2-mystery" aria-hidden="true"><span class="b2-mystery-mark">?</span></div>';
      const parts = known.map((k) => group(k, 'moss', 'seed'));
      // Insert the mystery group where the box sits (mode tells us: 0 = after the first group or at the end,
      // 1 = before the first group, 2/3 = after the first group).
      const ordered = mode === 1 ? [mystery].concat(parts) : parts.concat([mystery]);
      return '<div class="b2-fact" role="img" aria-label="' + (isMul ? 'Equal groups with one hidden' : 'Counters with one group hidden') + '">' +
        ordered.join('<div class="b2-fsign" aria-hidden="true">' + (isMul ? '\u00d7' : '+') + '</div>') + '</div>';
    }

    /*
     * Two-pan balance: a beam on a stand, with the left and right pans each holding a row of seeds (or, for
     * the true/false check, the two SIDES of the sentence as groups). tipTo (-1 left, 1 right, 0 level) tilts
     * the beam only at rung 3 (the model), never before, so the picture never answers early.
     */
    function balanceHTML(leftN, rightN, tipTo) {
      const pan = (n) => { let h = ''; for (let i = 0; i < Math.min(n, 12); i++) h += counterHTML('seed', 'moss'); return '<div class="b2-pan">' + h + '</div>'; };
      const tiltClass = tipTo === -1 ? ' b2-tip-left' : (tipTo === 1 ? ' b2-tip-right' : '');
      // Heavy ink beam (6 px stroke) over two hanging pans, on a solid triangle pivot with a post and base.
      const beam = '<svg class="b2-beam-art" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
        '<line class="b2-beam-bar" x1="0" y1="4" x2="100" y2="4" stroke-width="6" vector-effect="non-scaling-stroke"/></svg>';
      const pivot = '<svg class="b2-pivot" viewBox="0 0 60 100" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">' +
        '<polygon class="b2-pivot-tri" points="30,2 58,66 2,66" stroke-width="4"/>' +
        '<rect class="b2-pivot-post" x="25" y="66" width="10" height="20"/>' +
        '<rect class="b2-pivot-base" x="6" y="86" width="48" height="12" rx="3"/></svg>';
      return '<div class="b2-balance" role="img" aria-label="A balance scale with two pans">' + pivot +
        '<div class="b2-beam' + tiltClass + '">' + beam + '<div class="b2-pans">' + pan(leftN) + pan(rightN) + '</div></div></div>';
    }
    const RENDERERS = {
      // neg.meaning: the vertical number line, drawn from +2 down to -n. The mark (the answer) is added only
      // by the rung-3 hint model; the base picture shows the blank line so the child can read "down from zero".
      'neg': {
        render(stage, q) {
          const n = q.numbers.n;
          stage.innerHTML = '<div class="scene scene-mid b2-pattern">' + verticalLineHTML(n, null) + '</div>';
          return verticalLineFit(n);
        }
      },

      // ops.left-to-right: a plain prompt card with the whole sum. The card carries the task; the hint ladder
      // walks the first step.
      'ops-steps': { render: promptCard },

      // unk.missing-number: the known amount(s) as counters, with a dashed mystery group standing in for the
      // box. The picture never sizes the mystery group to the answer.
      'missing-num': {
        render(stage, q) {
          const x = q.numbers;
          const known = x.mode === 1 ? [x.b] : (x.mode === 2 ? [x.c] : [x.a]);
          stage.innerHTML = '<div class="scene scene-mid b2-pattern">' + mysteryHTML(known, x.mode === 1 ? 1 : 0, false) + '</div>';
          return { wu: 16, hu: 6 };
        }
      },

      // unk.equals-balance: the two-pan balance. mode 0 (true/false) shows the two sides' known totals as pans
      // with no tilt yet (the child decides); modes 1/2 show the known side full and the other side with a
      // mystery group standing in for the box.
      'balance': {
        render(stage, q) {
          const x = q.numbers;
          let left, right;
          if (x.mode === 0) { left = x.a + x.b; right = x.c; }
          else if (x.mode === 1) { left = x.a + x.b; right = x.c; }
          else { left = x.d; right = x.e; }
          stage.innerHTML = '<div class="scene scene-mid b2-pattern">' + balanceHTML(left, Math.max(right, 0), 0) + '</div>';
          // two counters across a pan (5.6u wide): ceil(n / 2) rows of 1.35u, plus the beam, the hangers, the margin and the stand
          return { wu: 16, hu: Math.max(7, Math.ceil(Math.max(left, right, 0) / 2) * 1.35 + 3.6) };
        }
      },

      // unk.missing-mul-div: the known amounts as equal groups, with a dashed mystery group standing in for
      // the box (an array-style row, not the 'array' representation, so no credit is borrowed from mul.arrays).
      'missing-muldiv': {
        render(stage, q) {
          const x = q.numbers;
          const known = x.mode === 1 ? [x.b] : (x.mode === 3 ? [x.b] : [x.a]);
          stage.innerHTML = '<div class="scene scene-mid b2-pattern">' + mysteryHTML(known, x.mode === 1 ? 1 : 0, true) + '</div>';
          return { wu: 16, hu: 6 };
        }
      }
    };

    return { RENDERERS, verticalLineHTML, verticalLineFit, verticalLabelShown, mysteryHTML, balanceHTML };
  });
}());
