/*
 * renderersBand3d (L5, step 11 sub-build D): the pictures for the band-3 DECIMAL question types, kept out of renderers.js.
 * renderers.js merges this map into its own and attaches every entry with questionTypes.attachRenderer.
 *   render(stage, q) draws into #stage and returns a fit spec { wu, hu } for counters.fitStage().
 *
 *   dec-tenths       hundred-grid: a 10 x 10 grid with whole shaded columns of ten (tenths) and single shaded squares (hundredths)
 *   dec-hundredths   hundred-grid: the same grid, with the right columns and single squares shaded
 *   dec-compare      number-line: a 0-to-1 (or wider) decimal line with each decimal marked, so a bigger decimal sits further right
 *   dec-addsub       symbolic: the decimal sum on a plain card, the points lined up (the written method is the rung-3 hint, D11-6)
 *   dec-addsub-word  word-problem: a short ribbon story card (a length, a cut, the rest)
 *   dec-muldiv       symbolic: the decimal product or quotient on a plain card
 *   dec-muldiv-word  word-problem: a short pens story card (a price, a count, the total)
 * The hundred grid is the NEW "hundred-grid" way of showing (owner decision D11-1), placed in representations.order and
 * config.adaptive.concretenessOrder right after 'area-model', and added to masteryEngine NON_SYMBOLIC. It cannot reuse 'array'
 * (countable counters) or 'fraction-bar' (a 1-D bar that cannot show tenths and hundredths of one whole together). Colour comes
 * from token class names in band3.css, never from the HTML string, so the art holds no hex, no gradient and no defs/id/url
 * (STYLE 7.1); every shape is flat. No animation: the picture carries the task when sound is off. Decimals are written with a
 * point ("4.7"), never a float with trailing hundredth zeros.
 */
(function () {
  'use strict';

  NBA.define('renderersBand3d', [], () => {
    const stageOf = (html) => '<div class="scene scene-mid b2-pattern">' + html + '</div>';

    /** A decimal (hundredths code) as its written form, matching questionTypesBand3d.decLabel. */
    function decLabel(code) {
      const whole = Math.floor(code / 100), h = code % 100;
      if (h === 0) return String(whole);
      if (h % 10 === 0) return whole + '.' + (h / 10);
      return whole + '.' + (h < 10 ? '0' + h : h);
    }

    /* ---- the hundred grid: 10 rows of 10 squares, the first `shaded` of 100 small squares shaded (whole columns of ten first,
       then single squares in the next column), so tenths read as full columns and hundredths as the single squares at the end ---- */
    function gridHTML(shaded, label) {
      let rows = '';
      for (let r = 0; r < 10; r++) {
        let cells = '';
        for (let c = 0; c < 10; c++) {
          // Fill column by column (a tenth is a full column of ten); cell index down the column c is c*10 + r.
          const on = (c * 10 + r) < shaded;
          cells += '<span class="b3-gcell' + (on ? ' b3-gon' : '') + '"></span>';
        }
        rows += '<div class="b3-grow">' + cells + '</div>';
      }
      return '<div class="b3-grid" role="img" aria-label="' + label + '">' + rows + '</div>';
    }

    /* ---- a decimal number line: a strip from 0 to `top` (a whole number of tenths or 1), each value marked with a tick ---- */
    function lineHTML(codes, top, label) {
      const span = top * 100 || 100; // in hundredths
      // Mark in ascending order and stagger the labels (odd ranks sit below the track) so two near decimals, like 0.6 and 0.66,
      // never run their labels together. The rank, not the array order, decides the stagger, so neighbours always alternate.
      const order = codes.map((c, i) => i).sort((a, b) => codes[a] - codes[b]);
      const rank = []; order.forEach((idx, r) => { rank[idx] = r; });
      let ticks = '';
      codes.forEach((code, i) => {
        const pos = Math.max(0, Math.min(100, code / span * 100));
        const low = rank[i] % 2 === 1 ? ' b3-dlow' : '';
        ticks += '<span class="b3-dtick" style="left:' + pos.toFixed(2) + '%"><span class="b3-dlabel' + low + '">' + decLabel(code) + '</span></span>';
      });
      return '<div class="b3-dline" role="img" aria-label="' + label + '"><div class="b3-dtrack"></div>' + ticks + '</div>';
    }

    /* ---- a decimal sum / product on a plain card (the written lined-up method is the rung-3 hint, D11-6) ---- */
    function sumCardHTML(text, label) {
      return '<div class="b3-divcard" role="img" aria-label="' + label + '"><span class="b3-divline">' + text + '</span></div>';
    }

    /* ---- a short story card: the key figures as plain lines (the display text states the full story) ---- */
    function storyCardHTML(lines, label) {
      const body = lines.map((l) => '<span class="b3-storyline">' + l + '</span>').join('');
      return '<div class="b3-storycard" role="img" aria-label="' + label + '">' + body + '</div>';
    }

    const RENDERERS = {
      'dec-tenths': {
        render(stage, q) {
          const x = q.numbers;
          if (x.mode === 2) { stage.innerHTML = stageOf(gridHTML(x.n * 10, decLabel(x.n * 10) + ' shaded on a hundred grid')); return gridFit(); }
          const code = x.mode === 1 ? x.w * 100 + x.t * 10 : x.top * 10;
          const within = code % 100; // the fractional part shown on one grid (the whole part is a full grid, not drawn here)
          stage.innerHTML = stageOf(gridHTML(within, decLabel(within) + ' shaded on a hundred grid'));
          return gridFit();
        }
      },
      'dec-hundredths': {
        render(stage, q) {
          const x = q.numbers;
          const code = x.mode === 2 ? x.paise : x.mode === 1 ? x.tenths * 10 + x.hundredths : x.top;
          stage.innerHTML = stageOf(gridHTML(code % 100, decLabel(code % 100) + ' shaded on a hundred grid'));
          return gridFit();
        }
      },
      'dec-compare': {
        render(stage, q) {
          const x = q.numbers;
          const codes = x.mode === 0 ? [x.a, x.b] : x.mode === 1 ? x.vals.slice() : [x.n];
          const hi = Math.max.apply(null, codes);
          const top = hi <= 100 ? 1 : Math.ceil(hi / 100);
          stage.innerHTML = stageOf(lineHTML(codes, top, 'a number line with ' + codes.map(decLabel).join(', ') + ' marked'));
          return { wu: 26, hu: 7.6 };
        }
      },
      'dec-addsub': { render(stage, q) { const x = q.numbers; stage.innerHTML = stageOf(sumCardHTML(decLabel(x.a) + (x.mode ? ' \u2212 ' : ' + ') + decLabel(x.b), 'the decimal sum')); return { wu: 18, hu: 5 }; } },
      'dec-muldiv': { render(stage, q) { const x = q.numbers; stage.innerHTML = stageOf(sumCardHTML(decLabel(x.a) + (x.mode ? ' \u00f7 ' : ' \u00d7 ') + x.b, 'the decimal sum')); return { wu: 18, hu: 5 }; } },
      'dec-addsub-word': {
        render(stage, q) {
          const x = q.numbers;
          const lines = x.mode ? [decLabel(x.a) + ' m ribbon', decLabel(x.b) + ' m cut off'] : [decLabel(x.a) + ' m ribbon', decLabel(x.b) + ' m added'];
          stage.innerHTML = stageOf(storyCardHTML(lines, 'a ribbon story')); return { wu: 18, hu: 6 };
        }
      },
      'dec-muldiv-word': {
        render(stage, q) {
          const x = q.numbers;
          stage.innerHTML = stageOf(storyCardHTML([decLabel(x.a) + ' rupees each', x.b + ' pens'], 'a pens story')); return { wu: 18, hu: 6 };
        }
      }
    };
    const gridFit = () => ({ wu: 14, hu: 14 });

    return { RENDERERS, gridHTML, lineHTML };
  });
}());
