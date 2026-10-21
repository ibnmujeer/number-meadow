/*
 * renderersBand3e (L5, step 11 sub-build E): the pictures for the band-3 PERCENT question types, kept out of renderers.js.
 * renderers.js merges this map into its own and attaches every entry with questionTypes.attachRenderer.
 *   render(stage, q) draws into #stage and returns a fit spec { wu, hu } for counters.fitStage().
 *
 *   pct-meaning   hundred-grid: a 10 x 10 grid with the percent-many squares shaded (so a percent reads as parts of 100)
 *   pct-bench     percent bar: a fraction bar of 20 parts (each 5%), the P% part shaded, with a "P%" label
 *   pct-link      hundred-grid: the same grid shaded to the amount, so the fraction, the decimal and the percent read as one picture
 *   pct-of        symbolic: the percent sum on a plain card (the bar working is the rung-3 hint)
 *   pct-of-word   word-problem: a short price / bead story card
 * pct-meaning and pct-link reuse the NEW hundred grid (sub-build D, D11-1) through renderersBand3d.gridHTML; pct-bench reuses the
 * band-2 fraction BAR (renderersBand2d.barHTML) as a percent bar, so no new rep id and no new art. Colour comes from token class
 * names (the shaded squares and segments), never from the HTML string, so the art holds no hex, no gradient and no defs/id/url
 * (STYLE 7.1); every shape is flat. No animation: the picture carries the task when sound is off. Percents are written with the %
 * sign; the picture holds no bare long digit.
 */
(function () {
  'use strict';

  NBA.define('renderersBand3e', ['renderersBand3d', 'renderersBand2d'], (band3d, band2d) => {
    const { gridHTML } = band3d;
    const { barHTML } = band2d;
    const stageOf = (html) => '<div class="scene scene-mid b2-pattern">' + html + '</div>';
    const firstK = (k) => { const out = []; for (let i = 0; i < k; i++) out.push(i); return out; };

    /** The percent (parts of 100) that a question shades on the grid: the percent answer, or the given amount. */
    function gridShade(x, typeId) {
      if (typeId === 'pct-meaning') return x.mode === 0 ? x.x : x.mode === 1 ? x.top * 100 / x.bot : x.x * 100 / x.y;
      // pct-link: mode 0 the decimal as hundredths (0.75 -> 75), mode 1 the percent, mode 2 the percent
      return x.mode === 0 ? x.top * 100 / x.bot : x.mode === 1 ? x.code : x.pct;
    }

    /* ---- a percent bar: a fraction bar of 20 equal parts (each 5%), the first (pct/5) parts shaded, labelled with the percent ---- */
    function barPercent(pct, label) {
      return '<div class="b3-pctbar"><span class="b3-pctlabel">' + pct + '%</span>' + barHTML(20, firstK(pct / 5), label) + '</div>';
    }

    /* ---- a percent sum on a plain card (the bar working is the rung-3 hint) ---- */
    function sumCardHTML(text, label) {
      return '<div class="b3-divcard" role="img" aria-label="' + label + '"><span class="b3-divline">' + text + '</span></div>';
    }

    /* ---- a short story card: the key figures as plain lines (the display text states the full story) ---- */
    function storyCardHTML(lines, label) {
      const body = lines.map((l) => '<span class="b3-storyline">' + l + '</span>').join('');
      return '<div class="b3-storycard" role="img" aria-label="' + label + '">' + body + '</div>';
    }

    const RENDERERS = {
      'pct-meaning': {
        render(stage, q) {
          const n = gridShade(q.numbers, 'pct-meaning');
          stage.innerHTML = stageOf(gridHTML(n, n + ' of 100 squares shaded on a hundred grid'));
          return { wu: 14, hu: 14 };
        }
      },
      'pct-link': {
        render(stage, q) {
          const n = gridShade(q.numbers, 'pct-link');
          stage.innerHTML = stageOf(gridHTML(n, n + ' of 100 squares shaded on a hundred grid'));
          return { wu: 14, hu: 14 };
        }
      },
      'pct-bench': {
        render(stage, q) {
          const x = q.numbers;
          stage.innerHTML = stageOf(barPercent(x.pct, x.pct + '% of the bar shaded'));
          return { wu: 24, hu: 6 };
        }
      },
      'pct-of': {
        render(stage, q) {
          const x = q.numbers;
          stage.innerHTML = stageOf(sumCardHTML(x.pct + '% of ' + x.amount, 'the percent sum'));
          return { wu: 18, hu: 5.8, hpx: 4 };
        }
      },
      'pct-of-word': {
        render(stage, q) {
          const x = q.numbers;
          const lines = x.mode ? [x.amount + ' rupee toy', x.pct + '% off'] : [x.amount + ' beads', x.pct + '% marked'];
          stage.innerHTML = stageOf(storyCardHTML(lines, 'a percent story')); return { wu: 18, hu: 6 };
        }
      }
    };

    return { RENDERERS, barPercent };
  });
}());
