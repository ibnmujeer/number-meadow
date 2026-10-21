/*
 * renderersBand1 (L5, step 9 sub-builds A to F): the pictures for the band-1 counting, number-sense,
 * subitizing, ten-frame, part-whole (number bond), make-5/make-10, teen-number and fraction question types, kept out of renderers.js to stay under
 * the 400-line limit. renderers.js merges this map into its own and attaches every entry with
 * questionTypes.attachRenderer (one place does the attach).
 *   render(stage, q) draws into #stage and returns a fit spec { wu, hu } for counters.fitStage().
 * The counting and numeral types show a plain prompt card (the sequence or the number word); match-count
 * shows the two sorted groups as seeds and pebbles; the two subitizing types (sub-build B) show a NEW way of
 * showing: a fixed dot pattern (subitize-dots) or a dice face (subitize-dice) that STAYS on the card with no
 * flash and no timer, so a pre-reader with sound off still sees the group. No timer, no score, no answer is
 * drawn here; the child taps one of the three answer buttons. The pure art (DOT, DICE, dotsSVG) is exported
 * for the unit test, which proves it holds no hex, no gradient and the right number of dots.
 */
(function () {
  'use strict';

  NBA.define('renderersBand1', ['util', 'counters'], (util, counters) => {
    const { esc, range } = util;
    const { counterHTML, stackHTML, stackW, stackH, colsFor, rowsFor } = counters;

    /** A plain card holding the question's two display lines (big numerals, no maths symbols). */
    function promptCard(stage, q) {
      const lines = q.display.map((t) => '<div class="b1-line">' + esc(t) + '</div>').join('');
      stage.innerHTML = '<div class="scene scene-mid"><div class="b1-card">' + lines + '</div></div>';
      return counters.cardFit(q.display, 2.6, 3.2);
    }

    /*
     * Subitizing art (step 9 sub-build B, STYLE section 7.1): a small group of dots in a FIXED set pattern,
     * drawn on a 100 x 100 grid. Colour comes from CSS (class "pdot" / "pface"), never from the string, so
     * there is no hex, no gradient, no defs/id/url, no filter. The pattern STAYS on the card: there is no
     * flash and no timer (CLAUDE.md rule 3; the dots are drawn once and never animate).
     * Each dot is one position [cx, cy] on the grid; a layout is the list of positions for a count.
     */
    var R = 11; // dot radius on the 100-grid (dots are big, well spaced; a glance, not a count)
    // Dot-pattern layouts (subitize-3, 1 to 3): a dot, a short line, a triangle (the curriculum "line or triangle").
    var DOT = {
      1: [[50, 50]],
      2: [[32, 50], [68, 50]],
      3: [[50, 28], [32, 68], [68, 68]]
    };
    // Dice-pattern layouts (subitize-5, 1 to 6): the familiar pips of a dice face.
    var DICE = {
      1: [[50, 50]],
      2: [[30, 30], [70, 70]],
      3: [[28, 28], [50, 50], [72, 72]],
      4: [[30, 30], [70, 30], [30, 70], [70, 70]],
      5: [[30, 30], [70, 30], [50, 50], [30, 70], [70, 70]],
      6: [[30, 26], [70, 26], [30, 50], [70, 50], [30, 74], [70, 74]]
    };
    function dotsSVG(positions, dotClass) {
      var body = positions.map(function (p) {
        return '<circle class="' + dotClass + '" cx="' + p[0] + '" cy="' + p[1] + '" r="' + R + '"/>';
      }).join('');
      return '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' + body + '</svg>';
    }

    /*
     * Ten-frame art (step 9 sub-build C, STYLE section 7.1): two rows of five boxes on a 110 x 48 grid.
     * The boxes are stroke-only (class "tf-box", no fill) and the filled counters are circles with a deep
     * tone from CSS (class "pdot"). Boxes fill from the top left, so a child sees five in the top row and the
     * rest below (the "five and some more" idea). Colour comes from a CSS class on each shape, never from the
     * string, so there is no hex, no gradient, no defs/id/url and no filter. The frame STAYS on the card (no animation).
     */
    function tenFrameSVG(n) {
      var cells = '', dots = '', filled = Math.max(0, Math.min(10, n));
      for (var i = 0; i < 10; i++) {
        var col = i % 5, rowY = i < 5 ? 2 : 24;
        var x = 2 + col * 21.4;
        cells += '<rect class="tf-box" x="' + x + '" y="' + rowY + '" width="20" height="20" rx="2"/>';
        if (i < filled) dots += '<circle class="pdot" cx="' + (x + 10) + '" cy="' + (rowY + 10) + '" r="7"/>';
      }
      return '<svg viewBox="0 0 110 48" aria-hidden="true" focusable="false">' + cells + dots + '</svg>';
    }

    /*
     * Number-bond art (step 9 sub-build C, STYLE section 7.1): a whole circle at the top joined by two
     * stroke-only lines to two part circles below. The whole and the shown part carry their numeral as text
     * (class "nb-num"); the hidden part shows a soft question mark (class "nb-q"). Circles are stroke-only
     * (class "nb-ring"), lines are stroke-only (class "nb-link"); no fill, no hex, no defs/id/url, no filter.
     * The known part sits on the left, the hidden part on the right.
     */
    function numberBondSVG(whole, part) {
      return '<svg viewBox="0 0 120 90" aria-hidden="true" focusable="false">' +
        '<line class="nb-link" x1="60" y1="22" x2="30" y2="62"/>' +
        '<line class="nb-link" x1="60" y1="22" x2="90" y2="62"/>' +
        '<circle class="nb-ring" cx="60" cy="20" r="18"/>' +
        '<circle class="nb-ring" cx="30" cy="68" r="16"/>' +
        '<circle class="nb-ring" cx="90" cy="68" r="16"/>' +
        '<text class="nb-num" x="60" y="20">' + whole + '</text>' +
        '<text class="nb-num" x="30" y="68">' + part + '</text>' +
        '<text class="nb-q" x="90" y="68">?</text>' +
        '</svg>';
    }
    /*
     * Read-the-line art (step 9 sub-build D, STYLE section 7.1): one row of eleven tiles 0 to 10 (the whole
     * 0 to 10 line the curriculum names), reusing the number-line look (nl-row, nl-tile). A soft flag marks
     * the point the child must read; the marked tile shows "?" so the number is not given away. The flag is a
     * stroke-and-fill picture whose colour comes from CSS (class "b1-flag"), never from the string: no hex, no
     * gradient, no defs/id/url, no filter. The line stays on the card (no animation); the child taps a number.
     */
    function lineReadHTML(m) {
      var tiles = range(0, 10).map(function (n) {
        var marked = n === m;
        return '<span class="nl-tile' + (marked ? ' nl-land' : '') + '" data-n="' + n + '">' +
          (marked ? '?' : n) + '</span>';
      }).join('');
      var flag = '<svg class="b1-flag" viewBox="0 0 20 28" aria-hidden="true" focusable="false">' +
        '<line class="b1-flagpole" x1="4" y1="2" x2="4" y2="26"/>' +
        '<path class="b1-flagcloth" d="M4 3 L17 7 L4 11 Z"/></svg>';
      var flagLeft = (m * 2.2).toFixed(2); // the tile pitch is 2.2u (a 2u tile and a 0.2u gap), like the add-line row
      return '<div class="scene scene-mid"><div class="nl b1-numline"><div class="nl-main">' +
        '<div class="b1-flagrow"><span class="b1-flagcell" style="left:calc(var(--u) * ' + flagLeft + ')">' + flag + '</span></div>' +
        '<div class="nl-row">' + tiles + '</div></div></div></div>';
    }

    /*
     * Even/odd art (step 9 sub-build D, STYLE section 7.1): n counters laid out in pairs, two to a column,
     * so a child can see at a glance whether every counter has a partner (even) or one is left alone (odd).
     * The lone counter of an odd number sits a little apart in its own column, so the "one left over" idea is
     * carried by position, not colour (STYLE 2.4). Counters use the existing counter art and CSS tones.
     */
    function pairsHTML(n) {
      var cells = '', pairs = Math.floor(n / 2), lone = n % 2;
      for (var i = 0; i < pairs; i++) {
        cells += '<span class="b1-pair">' +
          counterHTML('seed', 'moss') + counterHTML('seed', 'moss') + '</span>';
      }
      if (lone) cells += '<span class="b1-pair b1-lone">' + counterHTML('pebble', 'apricot') + '</span>';
      return '<div class="scene scene-mid b1-pairs">' + cells + '</div>';
    }

    /*
     * Shape-fraction art (step 9 sub-build F, STYLE section 7.1): a circle split into `parts` equal wedges
     * with ONE wedge shaded, so the half/quarter idea is shown as equal parts of a shape. The circle outline
     * and the dividing lines are stroke-only (class "frac-line", a deep tone), and the one shaded wedge is a
     * filled sector (class "frac-part", a deep tone like the counters). Colour comes from a CSS class, never
     * from the string: no hex, no gradient, no defs/id/url, no filter. The shaded wedge differs from the rest
     * by POSITION as well as fill, so colour is not the only cue (STYLE 2.4). Two parts = a half; four = a
     * quarter. The shape stays on the card (no animation; CLAUDE.md rule 3).
     */
    function shapeFractionSVG(parts) {
      // Points on a circle of radius 46 about the centre (50,50); angle 0 at the top, clockwise.
      var cx = 50, cy = 50, r = 46;
      var pt = function (frac) {
        var a = (frac * 2 * Math.PI) - Math.PI / 2;
        return [(cx + r * Math.cos(a)).toFixed(2), (cy + r * Math.sin(a)).toFixed(2)];
      };
      var body = '<circle class="frac-line" cx="50" cy="50" r="46" fill="none"/>';
      // The first wedge (from 12 o'clock, clockwise by one part) is the shaded part.
      var p0 = pt(0), p1 = pt(1 / parts);
      body += '<path class="frac-part" d="M50 50 L' + p0[0] + ' ' + p0[1] +
        ' A46 46 0 0 1 ' + p1[0] + ' ' + p1[1] + ' Z"/>';
      // The dividing lines from the centre to each part boundary.
      for (var i = 0; i < parts; i++) {
        var e = pt(i / parts);
        body += '<line class="frac-line" x1="50" y1="50" x2="' + e[0] + '" y2="' + e[1] + '"/>';
      }
      return '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' + body + '</svg>';
    }
    /*
     * The group dealt into equal plates (step 9 sub-build F): `parts` plates (stroke-only wells) side by side,
     * each holding whole / parts counters, so a child reads "share them out, count one plate". The plates and
     * their counters reuse the existing counter art and CSS tones; the plate outline is stroke-only (class
     * "frac-plate"). No animation.
     */
    function platesHTML(whole, parts) {
      var each = Math.floor(whole / parts), plates = '';
      for (var p = 0; p < parts; p++) {
        var dots = '';
        for (var i = 0; i < each; i++) dots += counterHTML('seed', 'moss');
        plates += '<span class="frac-plate">' + dots + '</span>';
      }
      return '<div class="frac-plates">' + plates + '</div>';
    }

    /**
     * Just the pattern card on the stage (the "Take a look. How many dots?" prompt is the question text
     * the mission screen already shows above the stage, so it is not repeated here: one idea per screen).
     * The card carries role="img" with a label that names the picture but NEVER the count.
     */
    function patternCard(stage, inner, aria) {
      stage.innerHTML = '<div class="scene scene-mid b1-pattern">' +
        '<div class="b1-dotcard" role="img" aria-label="' + esc(aria) + '">' + inner + '</div></div>';
      return { wu: 7.5, hu: 7.5 };
    }

    const RENDERERS = {
      'count-next': { render: promptCard },
      'count-back': { render: promptCard },
      'count-on-100': { render: promptCard },
      'count-tens': { render: promptCard },
      'numeral-say': { render: promptCard },

      // Two sorted groups: seeds (named group) and pebbles. Shape and tone both differ, so colour is
      // never the only cue (STYLE 2.4), and the picture carries the task when sound is off.
      'match-count': {
        render(stage, q) {
          const a = q.numbers.a, b = q.numbers.b;
          stage.innerHTML = '<div class="scene b1-sort">' +
            '<div class="b1-group">' + stackHTML(a, { toneAt: () => 'moss', kindAt: () => 'seed' }) + '</div>' +
            '<div class="b1-group">' + stackHTML(b, { toneAt: () => 'apricot', kindAt: () => 'pebble' }) + '</div></div>';
          return { wu: stackW(colsFor(a)) + 2.4 + stackW(colsFor(b)), hu: Math.max(stackH(rowsFor(a)), stackH(rowsFor(b))) + 1 };
        }
      },

      // sense.subitize-3: a fixed dot pattern that stays on the card. The aria-label names the picture
      // (a dot pattern) but NEVER the count, so a screen reader does not give the answer away.
      'subitize-dots': {
        render(stage, q) {
          return patternCard(stage, dotsSVG(DOT[q.numbers.n] || DOT[1], 'pdot'), 'A pattern of dots');
        }
      },

      // sense.subitize-5: a dice face that stays on the card. The aria-label names the picture (a dice
      // face) but NEVER the count, so a screen reader does not give the answer away.
      'subitize-dice': {
        render(stage, q) {
          return patternCard(stage, '<span class="b1-dice">' + dotsSVG(DICE[q.numbers.n] || DICE[1], 'pdot') + '</span>', 'A dice face');
        }
      },

      // sense.ten-frame: a ten-frame with q.numbers.n counters that stays on the card. The aria-label names
      // the picture (a ten-frame) but NEVER the count, so a screen reader does not give the answer away.
      'ten-frame': {
        render(stage, q) {
          stage.innerHTML = '<div class="scene scene-mid b1-pattern">' +
            '<div class="b1-frame" role="img" aria-label="A ten-frame with some counters">' + tenFrameSVG(q.numbers.n) + '</div></div>';
          return { wu: 11, hu: 6 };
        }
      },

      // sense.part-whole-10: a number bond showing the whole and one part. The numerals are drawn in the
      // picture (and spoken in the question), so the aria-label names the picture; the hidden part is a "?".
      'part-bond': {
        render(stage, q) {
          stage.innerHTML = '<div class="scene scene-mid b1-pattern">' +
            '<div class="b1-bond" role="img" aria-label="A number bond: a whole and two parts">' + numberBondSVG(q.numbers.w, q.numbers.p) + '</div></div>';
          return { wu: 8, hu: 7 };
        }
      },

      // sense.line-10: a 0 to 10 number line with a flag on the marked tile (which shows "?"). The picture
      // carries the task when sound is off; the aria-label names the picture but never the marked number.
      'line-read': {
        render(stage, q) {
          stage.innerHTML = lineReadHTML(q.numbers.m);
          var line = stage.querySelector('.nl');
          if (line) line.setAttribute('aria-label', 'A number line from 0 to 10 with a flag');
          return { wu: 24, hu: 6 };
        }
      },

      // sense.even-odd: the number shown as pairs, with one counter left alone when it is odd. The picture
      // (pairs, with or without a leftover) carries the idea; the aria-label names it but never the answer.
      'even-odd': {
        render(stage, q) {
          stage.innerHTML = pairsHTML(q.numbers.n);
          var sc = stage.querySelector('.b1-pairs');
          if (sc) { sc.setAttribute('role', 'img'); sc.setAttribute('aria-label', 'Counters paired up'); }
          var cols = Math.ceil(q.numbers.n / 2);
          return { wu: cols * 2.4 + 1.2, hu: 3.6 };
        }
      },

      // add.make-5: a number bond showing the whole 5 and the shown part. The numerals are drawn in the
      // picture (and spoken in the question); the aria-label names the picture, the hidden part is a "?".
      'make-5': {
        render(stage, q) {
          stage.innerHTML = '<div class="scene scene-mid b1-pattern">' +
            '<div class="b1-bond" role="img" aria-label="A number bond: a whole and two parts">' + numberBondSVG(q.numbers.whole, q.numbers.p) + '</div></div>';
          return { wu: 8, hu: 7 };
        }
      },

      // add.make-10: a ten-frame with the shown part filled; the child says how many MORE make 10. The frame
      // carries the task when sound is off; the aria-label names the picture but never the answer.
      'make-10': {
        render(stage, q) {
          stage.innerHTML = '<div class="scene scene-mid b1-pattern">' +
            '<div class="b1-frame" role="img" aria-label="A ten-frame with some counters">' + tenFrameSVG(q.numbers.p) + '</div></div>';
          return { wu: 11, hu: 6 };
        }
      },

      // place.teen-numbers: a FULL ten-frame (a ten) and some loose ones; the child says how many ones. The
      // picture (a full ten plus the loose ones) carries the "a ten and some ones" idea when sound is off; the
      // aria-label names the picture but never the count of ones.
      'teen-ten': {
        render(stage, q) {
          var ones = Math.max(0, q.numbers.n - 10), loose = '';
          for (var i = 0; i < ones; i++) loose += counterHTML('seed', 'apricot');
          stage.innerHTML = '<div class="scene scene-mid b1-teen" role="img" aria-label="A full ten-frame and some loose counters">' +
            '<div class="b1-frame">' + tenFrameSVG(10) + '</div>' +
            '<div class="b1-ones">' + loose + '</div></div>';
          return { wu: 11 + ones * 1.4 + 1, hu: 6 };
        }
      },

      // frac.halves-quarters: a shape split into equal parts (one shaded) beside the group dealt into the same
      // number of equal plates. The picture carries "a half / a quarter of the group" when sound is off; the
      // aria-label names the picture (equal parts) but NEVER the answer (how many are in one plate).
      'frac-share': {
        render(stage, q) {
          var whole = q.numbers.whole, parts = q.numbers.parts;
          stage.innerHTML = '<div class="scene scene-mid b1-frac" role="img" aria-label="A shape in equal parts and a group shared into equal plates">' +
            '<div class="frac-shape">' + shapeFractionSVG(parts) + '</div>' +
            platesHTML(whole, parts) + '</div>';
          // The shape is 5u wide; each plate is up to 3u; a gap of about 1u between the shape and each plate.
          return { wu: 6 + parts * 3.4 + 2, hu: 8 };
        }
      }
    };

    return { RENDERERS, DOT, DICE, dotsSVG, tenFrameSVG, numberBondSVG, lineReadHTML, pairsHTML, shapeFractionSVG, platesHTML };
  });
}());
