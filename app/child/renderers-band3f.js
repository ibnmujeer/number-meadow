/*
 * renderersBand3f (L5, step 11 sub-build F): the pictures for the band-3 NEGATIVE NUMBER, ORDER-OF-OPERATIONS and LETTER
 * question types, kept out of renderers.js. renderers.js merges this map into its own and attaches every entry with
 * questionTypes.attachRenderer.
 *   render(stage, q) draws into #stage and returns a fit spec { wu, hu } for counters.fitStage().
 *
 *   neg-compare   vertical-number-line: the stood-up line from +2 down past 0 to the lowest number in the question (reusing the
 *                 band-2 neg.meaning line), so "lower is colder" reads directly. The two colder-choice numbers, or the from/to of
 *                 a step count, are plain on the line; the answer dot is added only by the rung-3 hint.
 *   neg-addsub    number-line (signed): a horizontal line through zero from the lowest to the highest number the question needs,
 *                 the start marked, so a move left or right across zero reads directly. No new rep id (the band-2 'number-line').
 *   ops-brackets  symbolic: the bracket sum on a plain card (the bracket part is outlined by the rung-1 hint).
 *   ops-order     symbolic: the order-of-operations sum on a plain card (the times/divide part is outlined by the rung-1 hint).
 *   ops-order-word word-problem: a short "loose counters and boxes" story card.
 *   unk-letter    symbolic: the letter sum on a plain card.
 *   unk-letter-word word-problem: a short pens story card.
 * The signed horizontal line is a new drawing but reports the EXISTING 'number-line' representation (the signed number line of the
 * plan), so no new rep id is added. Colour comes from token class names in band3.css, never from the HTML string, so the art holds
 * no hex, no gradient and no defs/id/url (STYLE 7.1); every shape is flat. No animation: the picture carries the task with sound
 * off. A negative number is written with the escaped minus sign, never a bare maths sign in speech.
 */
(function () {
  'use strict';

  NBA.define('renderersBand3f', ['util', 'counters', 'renderersBand2e'], (util, counters, band2e) => {
    const { esc } = util;
    const { verticalLineHTML, verticalLineFit } = band2e;
    const NEG = '\u2212';
    const neg = (n) => (n < 0 ? NEG + Math.abs(n) : String(n));
    const stageOf = (html) => '<div class="scene scene-mid b2-pattern">' + html + '</div>';

    /* ---- a horizontal signed number line from `lo` to `hi` (whole numbers), the start value marked ---- */
    function signedLineHTML(lo, hi, startAt, label) {
      let ticks = '';
      for (let v = lo; v <= hi; v++) {
        const isZero = v === 0, on = v === startAt;
        ticks += '<span class="b3-nltick' + (isZero ? ' b3-nlzero' : '') + (on ? ' b3-nlstart' : '') + '">' +
          '<span class="b3-nlmark"></span><span class="b3-nlnum">' + neg(v) + '</span></span>';
      }
      return '<div class="b3-nline" role="img" aria-label="' + label + '"><div class="b3-nltrack"></div>' + ticks + '</div>';
    }
    const signedLineFit = (lo, hi) => ({ wu: (hi - lo + 1) * 2.6 + 2, hu: 7 });

    /* ---- a plain symbolic card (the sum, with the escaped signs already in the text) ---- */
    function cardHTML(text, label) {
      return '<div class="b3-divcard" role="img" aria-label="' + label + '"><span class="b3-divline">' + text + '</span></div>';
    }

    /* ---- a short story card: the key figures as plain lines (the display text states the full story) ---- */
    function storyCardHTML(lines, label) {
      const body = lines.map((l) => '<span class="b3-storyline">' + esc(l) + '</span>').join('');
      return '<div class="b3-storycard" role="img" aria-label="' + label + '">' + body + '</div>';
    }

    // The sum itself for the card face: the first display line with the question words stripped. The letter line reads
    // "n + 8 = 15. What number is n?" so the sentence after the full stop is dropped; the "What is .. ?" wrapper is dropped.
    function sumFace(q) {
      return q.display[0]
        .replace(/^What is\s+/, '')
        .replace(/\.\s*What number is n\?\s*$/, '')
        .replace(/\?\s*$/, '')
        .trim();
    }

    const RENDERERS = {
      'neg-compare': {
        render(stage, q) {
          const x = q.numbers;
          // The line reaches the lowest number the question shows, with a little room above zero.
          const low = x.mode === 0 ? Math.max(x.a, x.b) : Math.max(0, -Math.min(x.from, x.to));
          stage.innerHTML = stageOf(verticalLineHTML(low, null));
          return verticalLineFit(low);
        }
      },
      'neg-addsub': {
        render(stage, q) {
          const x = q.numbers, start = x.mode ? -x.a : x.a, land = x.op ? start - x.b : start + x.b;
          const lo = Math.min(start, land, 0) - 1, hi = Math.max(start, land, 0) + 1;
          stage.innerHTML = stageOf(signedLineHTML(lo, hi, start, 'a number line through zero, starting at ' + neg(start)));
          return signedLineFit(lo, hi);
        }
      },
      'ops-brackets': { render(stage, q) { stage.innerHTML = stageOf(cardHTML(sumFace(q), 'a sum with a bracket')); return counters.textCardFit(sumFace(q), 2.8); } },
      'ops-order': { render(stage, q) { stage.innerHTML = stageOf(cardHTML(sumFace(q), 'an order-of-operations sum')); return counters.textCardFit(sumFace(q), 2.8); } },
      'unk-letter': { render(stage, q) { stage.innerHTML = stageOf(cardHTML(sumFace(q), 'a sum with a letter')); return counters.textCardFit(sumFace(q), 2.8); } },
      'ops-order-word': {
        render(stage, q) {
          const x = q.numbers;
          stage.innerHTML = stageOf(storyCardHTML([x.loose + ' loose counters', x.boxes + ' boxes of ' + x.each], 'a counters story'));
          return { wu: 18, hu: 6 };
        }
      },
      'unk-letter-word': {
        render(stage, q) {
          const x = q.numbers;
          stage.innerHTML = stageOf(storyCardHTML([x.per + ' pens in a pack', 'p packs hold ' + x.total], 'a pens story'));
          return { wu: 18, hu: 6 };
        }
      }
    };

    return { RENDERERS, signedLineHTML };
  });
}());
