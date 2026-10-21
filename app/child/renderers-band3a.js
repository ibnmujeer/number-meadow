/*
 * renderersBand3a (L5, step 11 sub-build A): the pictures for the band-3 (ages 10 to 12) BIG NUMBERS and FACTS question types,
 * kept out of renderers.js. renderers.js merges this map into its own and attaches every entry with questionTypes.attachRenderer.
 *   render(stage, q) draws into #stage and returns a fit spec { wu, hu } for counters.fitStage().
 *
 *   place-big       the place value chart with GROUPS of three columns (ones, thousands, millions) and a comma between them
 *   mul-fact69      an array cut after five rows: the first five rows are seeds, the rest are pebbles
 *   add-big/sub-big a column sum card: the numbers right-aligned, the sign on the left, a rule, then the open answer row
 *   *-word          a bar model: one whole bar over its parts, the unknown one dashed (the story's own numbers)
 *   div-fact        an array of c columns whose rows are the answer
 *   factors         arrays (rows of a number, with the leftover counters in another tone), or a card with the two numbers
 * Colour comes from the counter c-<tone> class names and the token palette in band3.css, never from the SVG string, so the art holds
 * no hex, no gradient and no defs/id/url (STYLE 7.1). No animation, no timer, no score; the picture carries the task with sound off.
 */
(function () {
  'use strict';

  NBA.define('renderersBand3a', ['util', 'counters', 'renderersBand2c'], (util, counters, band2c) => {
    const { counterHTML } = counters;
    const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const SIGN = { '+': '+', '-': '\u2212' };
    const stageOf = (html) => '<div class="scene scene-mid b2-pattern">' + html + '</div>';
    const arrayFit = (r, c, extra) => ({ wu: c * 2.4 + 2, hu: r * 1.8 + 2 + (extra || 0) });
    const GROUP_NAMES = ['ones', 'thousands', 'millions'];

    /* ---- place value chart in groups of three columns (ones, thousands, millions) ---- */
    function chartHTML(n, pick) {
      const digits = String(n).split('').reverse(); // digits[0] is the ones
      const groups = [];
      for (let g = 0; g * 3 < digits.length; g++) groups.push(g);
      const html = groups.reverse().map((g) => {
        const cols = [];
        for (let p = Math.min(g * 3 + 2, digits.length - 1); p >= g * 3; p--) {
          cols.push('<div class="b2-chartcol b3-col' + (p === pick ? ' b3-pick' : '') + '"><div class="b2-chead">' + 'OTH'.charAt(p % 3) +
            '</div><div class="b2-cdigit">' + digits[p] + '</div></div>');
        }
        return '<div class="b3-group"><div class="b3-cols">' + cols.join('') + '</div><div class="b3-gname">' + GROUP_NAMES[g] + '</div></div>';
      }).join('<span class="b3-comma" aria-hidden="true">,</span>');
      return '<div class="b3-chart" role="img" aria-label="A place value chart for ' + fmt(n) + ', in groups of three digits">' + html + '</div>';
    }
    const chartFit = (n) => { const len = String(n).length; return { wu: len * 3.3 + Math.ceil(len / 3) * 1.6, hu: 8.5 }; };

    /* ---- the array cut after five rows (mul.facts-6-9): 5 rows of seeds, then the rest as pebbles ---- */
    function rowHTML(kind, tone, c) {
      let s = '';
      for (let i = 0; i < c; i++) s += counterHTML(kind, tone);
      return '<div class="b2-arow">' + s + '</div>';
    }
    function splitHTML(r, c) {
      let top = '', rest = '';
      for (let i = 0; i < r; i++) { if (i < 5) top += rowHTML('seed', 'moss', c); else rest += rowHTML('pebble', 'apricot', c); }
      return '<div class="b2-array b3-split" role="img" aria-label="An array of ' + r + ' rows of ' + c + ', cut after five rows">' +
        '<div class="b3-top">' + top + '</div><div class="b3-rest">' + rest + '</div></div>';
    }

    /* ---- n counters in rows of d; the leftover counters (if any) sit in the last, short row in another tone ---- */
    function leftoverHTML(n, d) {
      let rows = '';
      for (let r = 0; r < Math.floor(n / d); r++) rows += rowHTML('seed', 'moss', d);
      if (n % d) rows += rowHTML('pebble', 'apricot', n % d);
      return '<div class="b2-array" role="img" aria-label="' + n + ' counters in rows of ' + d + '">' + rows + '</div>';
    }

    /* ---- the column sum card ---- */
    // Every digit is its own span (data-p counts from the ones), so the hint can point at one column at a time.
    function digitsHTML(n) {
      const s = String(n);
      return s.split('').map((d, i) => { const p = s.length - 1 - i; return (p % 3 === 2 && i > 0 ? '<span class="b3-sep">,</span>' : '') + '<span class="b3-d" data-p="' + p + '">' + d + '</span>'; }).join('');
    }
    function sumHTML(a, b, sign) {
      return '<div class="b3-sum" role="img" aria-label="A column sum: ' + fmt(a) + (sign === '+' ? ' plus ' : ' take away ') + fmt(b) + '">' +
        '<span class="b3-ssign"></span><span class="b3-snum">' + digitsHTML(a) + '</span>' +
        '<span class="b3-ssign" aria-hidden="true">' + SIGN[sign] + '</span><span class="b3-snum">' + digitsHTML(b) + '</span>' +
        '<span class="b3-rule"></span>' +
        '<span class="b3-ssign"></span><span class="b3-snum b3-q">?</span></div>';
    }
    const sumFit = (a, b) => ({ wu: (fmt(Math.max(a, b)).length + 2) * 1.5 + 2, hu: 13.6 });

    /* ---- the bar model for the two stories: the whole over its parts, the unknown one dashed ---- */
    function partsHTML(a, b, sign) {
      const seg = (text, weight, unknown) => '<span class="b3-seg' + (unknown ? ' b3-unknown' : '') + '" style="flex-grow:' + weight + '"><span class="b3-segnum">' + text + '</span></span>';
      const add = sign === '+';
      const whole = add ? seg('?', 1, true) : seg(fmt(a), 1, false);
      const parts = add ? seg(fmt(a), a, false) + seg(fmt(b), b, false) : seg(fmt(b), b, false) + seg('?', a - b, true);
      return '<div class="b3-parts" role="img" aria-label="A bar model: a whole bar over its two parts">' +
        '<div class="b3-bar b3-wholebar">' + whole + '</div><div class="b3-bar">' + parts + '</div></div>';
    }

    const RENDERERS = {
      'place-big': {
        render(stage, q) {
          const x = q.numbers;
          stage.innerHTML = stageOf(chartHTML(x.n, x.mode === 0 ? x.p : -1));
          return chartFit(x.n);
        }
      },
      'mul-fact69': {
        render(stage, q) { stage.innerHTML = stageOf(splitHTML(q.numbers.r, q.numbers.c)); return arrayFit(q.numbers.r, q.numbers.c, 1); }
      },
      'add-big': { render(stage, q) { stage.innerHTML = stageOf(sumHTML(q.numbers.a, q.numbers.b, '+')); return sumFit(q.numbers.a, q.numbers.b); } },
      'sub-big': { render(stage, q) { stage.innerHTML = stageOf(sumHTML(q.numbers.a, q.numbers.b, '-')); return sumFit(q.numbers.a, q.numbers.b); } },
      'add-big-word': { render(stage, q) { stage.innerHTML = stageOf(partsHTML(q.numbers.a, q.numbers.b, '+')); return { wu: 22, hu: 7 }; } },
      'sub-big-word': { render(stage, q) { stage.innerHTML = stageOf(partsHTML(q.numbers.a, q.numbers.b, '-')); return { wu: 22, hu: 7 }; } },
      'div-fact': {
        render(stage, q) { stage.innerHTML = stageOf(band2c.arrayHTML(q.answer, q.numbers.c)); return arrayFit(q.answer, q.numbers.c); }
      },
      factors: {
        render(stage, q) {
          const x = q.numbers;
          if (x.mode === 3) {
            stage.innerHTML = stageOf('<div class="b2-card b3-card" role="img" aria-label="The numbers ' + x.a + ' and ' + x.b + '"><div class="b2-line">' + x.a + ' and ' + x.b + '</div></div>');
            return { wu: 18, hu: 6 };
          }
          if (x.mode === 4) { stage.innerHTML = stageOf(band2c.arrayHTML(x.rows, x.n / x.rows)); return arrayFit(x.rows, x.n / x.rows); }
          if (x.mode === 0) { stage.innerHTML = stageOf(band2c.arrayHTML(3, x.b)); return arrayFit(3, x.b); }
          stage.innerHTML = stageOf(leftoverHTML(x.n, x.d));
          return arrayFit(Math.ceil(x.n / x.d), x.d);
        }
      }
    };

    return { RENDERERS, chartHTML, splitHTML, leftoverHTML, sumHTML, partsHTML };
  });
}());
