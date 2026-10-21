/*
 * renderersBand3b (L5, step 11 sub-build B): the pictures for the band-3 AREA MODEL, REMAINDER and LONG DIVISION question types,
 * kept out of renderers.js. renderers.js merges this map into its own and attaches every entry with questionTypes.attachRenderer.
 *   render(stage, q) draws into #stage and returns a fit spec { wu, hu } for counters.fitStage().
 *
 *   mul-area1    area-model: a rectangle whose width is split into tens and ones, each cell labelled with its partial product
 *   mul-area2    area-model: a rectangle split into four cells (tens and ones each way), each labelled
 *   div-rem      counters shared into equal piles, with the leftover counters in a short pile in another tone
 *   div-multi    the division sum on a plain card (the written layout is the rung-3 hint, D11-6)
 *   div-long     the same card for a two-digit divisor
 * This is the NEW "area-model" way of showing (owner decision D11-1 = A), placed in representations.order and
 * config.adaptive.concretenessOrder right after 'array', and added to masteryEngine NON_SYMBOLIC. The area model is a partitioned
 * rectangle of numbers, not countable counters, so it cannot reuse 'array'. Colour comes from the counter c-<tone> class names and
 * the token palette in band3.css, never from the SVG string, so the art holds no hex, no gradient and no defs/id/url (STYLE 7.1).
 * No animation, no timer, no score; the picture carries the task with sound off.
 */
(function () {
  'use strict';

  NBA.define('renderersBand3b', ['util', 'counters', 'renderersBand2c'], (util, counters, band2c) => {
    const { counterHTML } = counters;
    const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const stageOf = (html) => '<div class="scene scene-mid b2-pattern">' + html + '</div>';
    const tens = (n) => n - (n % 10);
    const ones = (n) => n % 10;

    /* ---- the area model: a rectangle cut into tens and ones (two parts for one digit, four for two) ---- */
    function cell(wWeight, hWeight, label) {
      return '<div class="b3-cell" style="flex-grow:' + wWeight + '">' +
        '<span class="b3-cellsize">' + hWeight + '</span><span class="b3-cellval">' + label + '</span></div>';
    }
    // A row of the rectangle: the full height weight hWeight, split across the columns (tens then ones of a).
    function areaRow(a, factor, hWeight) {
      const cells = [cell(tens(a) || 1, hWeight, '?')];
      if (ones(a)) cells.push(cell(ones(a), hWeight, '?'));
      return '<div class="b3-arow">' + cells.join('') + '</div>';
    }
    function areaHTML(a, b, label) {
      const rows = [areaRow(a, b, tens(b) || b)];
      if (tens(b) && ones(b)) rows.push(areaRow(a, b, ones(b)));
      const topLabels = '<div class="b3-xlabels"><span>' + tens(a) + '</span>' + (ones(a) ? '<span>' + ones(a) + '</span>' : '') + '</div>';
      return '<div class="b3-area" role="img" aria-label="An area model for ' + a + ' times ' + b + ', ' + label + '">' +
        topLabels + '<div class="b3-arows">' + rows.join('') + '</div></div>';
    }
    const areaFit = (a, b) => ({ wu: 16, hu: tens(b) && ones(b) ? 11.6 : 6.8 });

    /* ---- counters shared into piles of d, with the leftover counters in a short pile in another tone ---- */
    function pilesHTML(n, d) {
      const full = Math.floor(n / d), rem = n % d;
      let plates = '';
      for (let g = 0; g < full; g++) {
        let seeds = '';
        for (let i = 0; i < d; i++) seeds += counterHTML('seed', 'moss');
        plates += '<div class="b2-plate">' + seeds + '</div>';
      }
      if (rem) {
        let left = '';
        for (let i = 0; i < rem; i++) left += counterHTML('pebble', 'apricot');
        plates += '<div class="b2-plate b3-leftpile">' + left + '</div>';
      }
      return '<div class="b3-piles" role="img" aria-label="' + n + ' counters shared into piles of ' + d + ', with ' + rem + ' left over">' + plates + '</div>';
    }
    /** A plate holds two counters across (CSS .b2-plate), so it is ceil(d / 2) counter rows high; three plates make a row at the least. */
    function pilesFit(n, d) {
      const plates = Math.ceil(n / d), perRow = Math.min(plates, 3), rows = Math.ceil(plates / perRow);
      return { wu: perRow * 5 + (perRow - 1) * 0.6 + 2, hu: rows * (Math.ceil(d / 2) * 1.4 + 1) + 1, wpx: perRow * 4, hpx: rows * 4 };
    }

    /* ---- the division sum on a plain card (the written long-division layout is the rung-3 hint, D11-6) ---- */
    function divCardHTML(n, d) {
      return '<div class="b3-divcard" role="img" aria-label="' + fmt(n) + ' divided by ' + fmt(d) + '">' +
        '<span class="b3-divline">' + fmt(n) + ' \u00f7 ' + fmt(d) + '</span></div>';
    }

    /* ---- the story bar: a whole bar (the total) over a bar split into equal groups of d, the number of groups unknown (?) ---- */
    function storyBarHTML(n, d) {
      const seg = (text, grow, unknown) => '<span class="b3-seg' + (unknown ? ' b3-unknown' : '') + '" style="flex-grow:' + grow + '"><span class="b3-segnum">' + text + '</span></span>';
      return '<div class="b3-parts b3-story" role="img" aria-label="A bar model: a whole of ' + fmt(n) + ' split into groups of ' + d + '">' +
        '<div class="b3-bar b3-wholebar">' + seg(fmt(n), 1, false) + '</div>' +
        '<div class="b3-bar">' + seg(d, 2, false) + seg(d, 2, false) + seg('?', 1, true) + '</div></div>';
    }

    const RENDERERS = {
      'mul-area1': { render(stage, q) { stage.innerHTML = stageOf(areaHTML(q.numbers.a, q.numbers.b, 'split into tens and ones')); return areaFit(q.numbers.a, q.numbers.b); } },
      'mul-area2': { render(stage, q) { stage.innerHTML = stageOf(areaHTML(q.numbers.a, q.numbers.b, 'split into four parts')); return areaFit(q.numbers.a, q.numbers.b); } },
      'div-rem': {
        render(stage, q) {
          const x = q.numbers;
          if (x.mode === 2) { stage.innerHTML = stageOf(band2c.groupsHTML(x.n - (x.n % x.d), x.d)); return pilesFit(x.n, x.d); }
          stage.innerHTML = stageOf(pilesHTML(x.n, x.d));
          return pilesFit(x.n, x.d);
        }
      },
      'div-multi': { render(stage, q) { stage.innerHTML = stageOf(divCardHTML(q.numbers.n, q.numbers.d)); return { wu: 18, hu: 6 }; } },
      'div-multi-word': { render(stage, q) { stage.innerHTML = stageOf(storyBarHTML(q.numbers.n, q.numbers.d)); return { wu: 22, hu: 7 }; } },
      'div-long': { render(stage, q) { stage.innerHTML = stageOf(divCardHTML(q.numbers.n, q.numbers.d)); return { wu: 18, hu: 6 }; } },
      'div-long-word': { render(stage, q) { stage.innerHTML = stageOf(storyBarHTML(q.numbers.n, q.numbers.d)); return { wu: 22, hu: 7 }; } }
    };

    return { RENDERERS, areaHTML, pilesHTML, divCardHTML, storyBarHTML };
  });
}());
