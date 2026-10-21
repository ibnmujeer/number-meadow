/*
 * renderersBand2d (L5, step 10 sub-build D): the pictures for the band-2 (ages 7 to 9) FRACTION question
 * types, kept out of renderers.js (and the band-2 siblings, which are near the 400-line limit). renderers.js
 * merges this map into its own and attaches every entry with questionTypes.attachRenderer.
 *   render(stage, q) draws into #stage and returns a fit spec { wu, hu } for counters.fitStage().
 *
 * The NEW "fraction-bar" way of showing (owner decision D10-2 = A), placed in representations.order and
 * config.adaptive.concretenessOrder right after 'concrete' and the earlier new ways (after 'place-value-chart',
 * before 'visual'): a bar split into equal parts, some shaded. frac-unit and frac-nonunit draw one bar;
 * frac-wall draws the fraction WALL as a STACK of fraction-bars (not a separate rep id); frac-line (rep
 * 'number-line') draws a 0 to 1 line split into equal parts with a marked hop, so fractions appear BOTH on a
 * number line and on bars (prompt). Colour comes from the token palette through CSS class names, never from
 * the HTML string, so the art holds no hex, no gradient and no defs/id/url (STYLE 7.1); every shape is flat.
 * No animation: the picture carries the task when sound is off. Fractions are written as "num/den" (ASCII).
 */
(function () {
  'use strict';

  NBA.define('renderersBand2d', [], () => {
    /** A single fraction bar: d equal segments, with the segment indices in `onSet` shaded. Labelled for a11y. */
    function barHTML(d, onSet, label) {
      let segs = '';
      for (let i = 0; i < d; i++) {
        segs += '<span class="b2-fseg' + (onSet.indexOf(i) >= 0 ? ' b2-fon' : '') + '"></span>';
      }
      return '<div class="b2-fbar" role="img" aria-label="' + label + '">' + segs + '</div>';
    }
    /** The indices 0..k-1 (the first k segments), for "k parts shaded from the left". */
    function firstK(k) { const out = []; for (let i = 0; i < k; i++) out.push(i); return out; }

    /** A 0 to 1 number line split into d equal parts: d equal tiles on a baseline, with the tick at hop `k`
     *  marked by a dot above it (and k1/k2 for a compare). Tiles are --u sized (like the add/sub number line),
     *  so counters.fitStage() scales the whole line to the stage. 0 and 1 sit under the first and last ticks. */
    function lineHTML(d, marks, label) {
      let tiles = '';
      for (let i = 0; i < d; i++) tiles += '<span class="b2-fltile"></span>';
      let ticks = '';
      for (let i = 0; i <= d; i++) {
        const on = marks.indexOf(i) >= 0;
        const num = i === 0 ? '0' : (i === d ? '1' : '');
        ticks += '<span class="b2-fltick' + (on ? ' b2-flon' : '') + '">' +
          (num ? '<b class="b2-flnum">' + num + '</b>' : '') + '</span>';
      }
      return '<div class="b2-fline" role="img" aria-label="' + label + '">' +
        '<div class="b2-flrow">' + tiles + '</div><div class="b2-flticks">' + ticks + '</div></div>';
    }

    /** One row of the fraction wall: a plain word label and a bar of d parts with `onSet` shaded. */
    function wallRow(d, onSet, word) {
      return '<div class="b2-frow"><span class="b2-flabel">' + word + '</span>' + barHTML(d, onSet, word + ' bar') + '</div>';
    }
    const DENWORD = { 2: 'halves', 3: 'thirds', 4: 'quarters', 5: 'fifths', 6: 'sixths', 7: 'sevenths', 8: 'eighths' };
    const denWord = (d) => DENWORD[d] || (d + 'ths');

    const RENDERERS = {
      // frac.unit: mode 0 a bar of d parts with c shaded (count the parts not shaded); mode 1 two unit-fraction
      // bars (one part shaded of d1, one of d2) to compare which part is bigger.
      'frac-unit': {
        render(stage, q) {
          const x = q.numbers;
          if (x.mode) {
            stage.innerHTML = '<div class="scene scene-mid b2-pattern b2-fstack">' +
              wallRow(x.d1, [0], 'one ' + oneWord(x.d1)) + wallRow(x.d2, [0], 'one ' + oneWord(x.d2)) + '</div>';
            return { wu: 24, hu: 7 };
          }
          stage.innerHTML = '<div class="scene scene-mid b2-pattern">' +
            barHTML(x.d, firstK(x.c), x.c + ' of ' + x.d + ' parts shaded') + '</div>';
          return { wu: 24, hu: 5 };
        }
      },

      // frac.non-unit: mode 0 a bar of n equal parts with p shaded (how many are left); mode 1 a bar of d parts
      // with p shaded (what fraction is shaded).
      'frac-nonunit': {
        render(stage, q) {
          const x = q.numbers;
          const d = x.mode ? x.d : x.n, on = x.mode ? x.p : x.p;
          stage.innerHTML = '<div class="scene scene-mid b2-pattern">' +
            barHTML(d, firstK(on), on + ' of ' + d + ' parts shaded') + '</div>';
          return { wu: 24, hu: 5 };
        }
      },

      // frac.on-line: a 0 to 1 line split into d equal parts. mode 0 marks the hop k (what fraction is that);
      // mode 1 marks both k1 and k2 (which is further along the line).
      'frac-line': {
        render(stage, q) {
          const x = q.numbers;
          const marks = x.mode ? [x.k1, x.k2] : [x.k];
          const label = x.mode
            ? 'A line from 0 to 1 split into ' + x.d + ' parts, two points marked'
            : 'A line from 0 to 1 split into ' + x.d + ' parts, a hop of ' + x.k + ' marked';
          stage.innerHTML = '<div class="scene scene-mid b2-pattern">' + lineHTML(x.d, marks, label) + '</div>';
          return { wu: x.d * 2.4 + 3, hu: 5 };
        }
      },

      // frac.compare-wall: the fraction WALL as a stack of fraction-bars. mode 0 shows a half bar over the
      // d-part bar fully shaded (how many d-parts cover a half). mode 1 shows the d-part bar with k1 shaded over
      // the same bar with k2 shaded (which is bigger). The wall is a stack of bars, not a separate rep id.
      'frac-wall': {
        render(stage, q) {
          const x = q.numbers;
          let rows;
          if (x.mode) {
            rows = wallRow(x.d, firstK(x.k1), x.k1 + ' ' + denWord(x.d)) + wallRow(x.d, firstK(x.k2), x.k2 + ' ' + denWord(x.d));
          } else {
            rows = wallRow(2, [0], 'one half') + wallRow(x.d, firstK(x.d / 2), denWord(x.d));
          }
          stage.innerHTML = '<div class="scene scene-mid b2-pattern b2-fwall">' + rows + '</div>';
          return { wu: 26, hu: 8 };
        }
      }
    };

    /** The singular part word for a unit fraction label (3 -> third), spoken-safe plain words only. */
    function oneWord(d) {
      const w = { 2: 'half', 3: 'third', 4: 'quarter', 5: 'fifth', 6: 'sixth', 7: 'seventh', 8: 'eighth' };
      return w[d] || (d + 'th');
    }

    return { RENDERERS, barHTML, lineHTML };
  });
}());
