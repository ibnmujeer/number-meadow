/*
 * renderersBand2 (L5, step 10 sub-build A): the pictures for the band-2 (ages 7 to 9) PLACE VALUE and
 * COUNTING question types, kept out of renderers.js (and out of the band-1 sibling) to stay under the
 * 400-line limit. renderers.js merges this map into its own and attaches every entry with
 * questionTypes.attachRenderer (one place does the attach).
 *   render(stage, q) draws into #stage and returns a fit spec { wu, hu } for counters.fitStage().
 *
 * Two NEW ways of showing are introduced here (owner decision D10-2 = A), placed in representations.order
 * and config.adaptive.concretenessOrder right after 'concrete' and the band-1 ways:
 *   base-ten-blocks   the Meadow place-value pieces STYLE H5 defines (D10-1 = A): single seeds for ones,
 *                     bead rods for tens (counters.rodHTML, ten beads on a line) and flat tiles for hundreds
 *                     (counters.tileHTML, a scored flat), laid out in hundreds / tens / ones columns.
 *   place-value-chart H / T / O columns with a digit under each, so a number is seen as what each digit is
 *                     worth; two charts side by side for a compare question.
 * Colour comes from the counter CSS class names (c-<tone>), never from the SVG string, so the pieces hold
 * no hex, no gradient and no defs/id/url (STYLE 7.1), exactly as the band-1 art does. No animation, no timer,
 * no score; the picture carries the task when sound is off. The skip-count, count-1000 and round pictures
 * reuse a plain prompt card (the sequence or the number), like the band-1 counting types.
 */
(function () {
  'use strict';

  NBA.define('renderersBand2', ['util', 'counters'], (util, counters) => {
    const { esc } = util;
    const { counterHTML, rodHTML, tileHTML } = counters;

    /** A plain card holding the question's two display lines (big numerals, no maths symbols). */
    function promptCard(stage, q) {
      const lines = q.display.map((t) => '<div class="b2-line">' + esc(t) + '</div>').join('');
      stage.innerHTML = '<div class="scene scene-mid"><div class="b2-card">' + lines + '</div></div>';
      return counters.cardFit(q.display, 2.4, 3);
    }

    /*
     * Base-ten pieces (STYLE H5, section 9): hundreds as flat tiles, tens as bead rods, ones as seeds, laid
     * out left to right in three columns under their labels. Each kind reuses the shared counter art, so the
     * colour comes from a CSS class and the string holds no hex (STYLE 7.1). A column with no pieces is left
     * out, so a two-digit number shows only tens and ones. The labels name the columns in plain words.
     */
    function piecesColumn(label, piecesHTML, kindClass) {
      return '<div class="b2-pvcol b2-' + kindClass + '"><div class="b2-pieces">' + piecesHTML +
        '</div><div class="b2-plabel">' + label + '</div></div>';
    }
    function baseTenHTML(h, t, o) {
      let cols = '';
      if (h) {
        let tiles = ''; for (let i = 0; i < h; i++) tiles += tileHTML('plum');
        cols += piecesColumn('hundreds', tiles, 'tiles');
      }
      if (t) {
        let rods = ''; for (let i = 0; i < t; i++) rods += rodHTML('teal');
        cols += piecesColumn('tens', rods, 'rods');
      }
      // Ones column: show the seeds (0 ones still shows an empty labelled column so the place is clear only
      // when there are tens or hundreds beside it; a lone 0 would never occur in these questions).
      let seeds = ''; for (let i = 0; i < o; i++) seeds += counterHTML('seed', 'moss');
      cols += piecesColumn('ones', seeds || '<span class="b2-none">0</span>', 'seeds');
      return '<div class="b2-blocks" role="img" aria-label="Place value pieces: hundreds, tens and ones">' + cols + '</div>';
    }

    /** The base-ten picture's fit. The pieces wrap inside their column (CSS .b2-pieces caps: tiles 32u, rods 13u, seeds 7u wide), so the
     *  fit counts the wrapped rows: tiles 10u square, rods 2u by 12.4u, seeds 2u by 1.2u, 0.3u between pieces, a label under each column. */
    function baseTenFit(h, t, o) {
      const GAP = 0.3;
      const col = (n, w, ht, cap) => {
        const per = Math.max(1, Math.floor((cap + GAP) / (w + GAP))), across = Math.min(n, per), rows = Math.ceil(n / per);
        return { w: across * w + (across - 1) * GAP, h: rows * ht + (rows - 1) * GAP };
      };
      const cols = [];
      if (h) cols.push(col(h, 10, 10, 32));
      if (t) cols.push(col(t, 2, 12.4, 13));
      cols.push(o ? col(o, 2, 1.2, 7) : { w: 2, h: 1.6 });
      const wu = cols.reduce((s, c) => s + c.w, 0) + (cols.length - 1) + 3;
      const hu = Math.max.apply(null, cols.map((c) => c.h)) + 3;
      return { wu: wu, hu: hu };
    }

    /*
     * Place value chart (two or three columns, a digit under each). Used for the compare and the more/less
     * questions: a number is shown as its hundreds / tens / ones digits so the biggest place can be read off.
     * The digits are ink text; the columns are stroke-only wells (CSS). For a two-digit number the hundreds
     * column is left out. A compare question draws two charts side by side with the word "or" between them.
     */
    function digitsOf(num) {
      const h = Math.floor(num / 100), t = Math.floor((num % 100) / 10), o = num % 10;
      return num >= 100 ? [['H', h], ['T', t], ['O', o]] : [['T', t], ['O', o]];
    }
    function chartHTML(num) {
      const cells = digitsOf(num).map((d) =>
        '<div class="b2-chartcol"><div class="b2-chead">' + d[0] + '</div><div class="b2-cdigit">' + d[1] + '</div></div>').join('');
      return '<div class="b2-chart">' + cells + '</div>';
    }

    /*
     * Sub-build B pictures (multi-digit add/sub). Each one carries the task when sound is off and shows the
     * sum in symbols under the picture (the "visual" way of showing lets a short equation sit under the
     * picture): "shown visually, then with symbols" (the Step 10 prompt).
     */

    /* Facts (add.facts-20 / sub.facts-20): two groups of seeds for an adding fact, or one group with the
     * taken-away ones ringed for a taking-away fact, with the sum shown underneath. The seeds carry the
     * make-ten / count-back idea; colour comes from the counter CSS class. */
    function factHTML(a, b, take) {
      let g1 = ''; for (let i = 0; i < a; i++) g1 += counterHTML('seed', 'moss');
      let g2 = '';
      if (take) { for (let i = 0; i < a; i++) g2 += '<span class="b2-fc' + (i >= a - b ? ' b2-ring' : '') + '">' + counterHTML('seed', 'moss') + '</span>'; }
      else { for (let i = 0; i < b; i++) g2 += counterHTML('pebble', 'apricot'); }
      const sign = take ? '\u2212' : '+';
      const groups = take
        ? '<div class="b2-fgroup">' + g2 + '</div>'
        : '<div class="b2-fgroup">' + g1 + '</div><div class="b2-fsign" aria-hidden="true">' + sign + '</div><div class="b2-fgroup">' + g2 + '</div>';
      return '<div class="b2-fact" role="img" aria-label="Counters for the fact">' + groups + '</div>';
    }

    /* Column add/sub (add2/add2r/add3/sub2/sub2r/sub3): two place value charts, one over the other, with the
     * operation sign on the left and the sum written as symbols below. The top number also shows its base-ten
     * pieces, so the quantity is seen as well as the digits. */
    function columnHTML(a, b, take) {
      const sign = take ? '\u2212' : '+';
      return '<div class="b2-col" role="img" aria-label="A place value chart for the sum">' +
        '<div class="b2-colrow">' + chartHTML(a) + '</div>' +
        '<div class="b2-colrow"><span class="b2-colsign" aria-hidden="true">' + sign + '</span>' + chartHTML(b) + '</div>' +
        '</div>';
    }

    /* Bar model (sub.stories-two-step): a whole bar split into part segments for each step, so the two steps
     * are seen as parts of a whole. Added parts sit beside the start; taken-away parts are shown ringed. The
     * segments are stroke-only wells; colour comes from CSS. The answer is never written on the bar. */
    function barModelHTML(s, x, y) {
      const seg = (n, cls) => '<span class="b2-bar-seg ' + cls + '" style="flex-grow:' + Math.max(1, Math.abs(n)) + '"><span class="b2-bar-num">' + Math.abs(n) + '</span></span>';
      const stepSeg = (v) => seg(v, v < 0 ? 'b2-bar-take' : 'b2-bar-add');
      return '<div class="b2-bars" role="img" aria-label="A bar model of the story">' +
        '<div class="b2-bar">' + seg(s, 'b2-bar-start') + stepSeg(x) + stepSeg(y) + '</div></div>';
    }

    const RENDERERS = {
      // count.skip-2-5-10, count.to-1000, place.round: a plain prompt card (the sequence or the number). The
      // card carries the task; the buttons carry the answer. No animation, no timer (CLAUDE.md rule 3).
      'skip-count': { render: promptCard },
      'count-1000': { render: promptCard },
      'round-pv': { render: promptCard },

      // place.two-digit: tens and ones as bead rods and seeds. mode 1 (name the tens digit) shows the whole
      // number's pieces too, so the child can see and count the tens. The picture carries the task.
      'tens-ones': {
        render(stage, q) {
          const t = q.numbers.t, o = q.numbers.o;
          stage.innerHTML = '<div class="scene scene-mid b2-pattern">' + baseTenHTML(0, t, o) + '</div>';
          return baseTenFit(0, t, o);
        }
      },

      // place.regroup: the trade of ten ones. mode 0 starts with o loose seeds (the child trades 10 away);
      // mode 1 shows t tens and o ones (the child trades one ten for ten ones). The picture shows the pieces
      // before the trade; the hint ladder walks the trade. No animation here (CLAUDE.md rule 3).
      'regroup': {
        render(stage, q) {
          const x = q.numbers;
          const html = x.mode ? baseTenHTML(0, x.t, x.o) : baseTenHTML(0, 0, x.o);
          stage.innerHTML = '<div class="scene scene-mid b2-pattern">' + html + '</div>';
          return x.mode ? baseTenFit(0, x.t, x.o) : baseTenFit(0, 0, x.o);
        }
      },

      // place.hundreds: hundreds, tens and ones as flat tiles, bead rods and seeds. mode 1 (value of the tens
      // digit) shows the whole number's pieces so the child can see the tens column. The picture carries it.
      'hundreds': {
        render(stage, q) {
          const x = q.numbers;
          stage.innerHTML = '<div class="scene scene-mid b2-pattern">' + baseTenHTML(x.h, x.t, x.o) + '</div>';
          return baseTenFit(x.h, x.t, x.o);
        }
      },

      // place.compare-order: two place value charts side by side with the word "or" between them. The child
      // reads the biggest place and taps the bigger number (the two buttons show the two numbers). The picture
      // carries the task when sound is off; neither chart is marked as the answer.
      'compare-pv': {
        render(stage, q) {
          const l = q.numbers.l, r = q.numbers.r;
          stage.innerHTML = '<div class="scene scene-mid b2-compare" role="img" aria-label="Two place value charts to compare">' +
            chartHTML(l) + '<div class="b2-or" aria-hidden="true">or</div>' + chartHTML(r) + '</div>';
          return { wu: 23, hu: 8 };
        }
      },

      // place.compare-order (10/100 more or less): one place value chart of the start number, so the child
      // sees the digit that changes. The picture carries the task; the buttons carry the answer.
      'more-less': {
        render(stage, q) {
          stage.innerHTML = '<div class="scene scene-mid b2-pattern" role="img" aria-label="A place value chart">' +
            chartHTML(q.numbers.n) + '</div>';
          return { wu: 12, hu: 8 };
        }
      },

      // add.facts-20: two groups of seeds and pebbles with the sum shown under them. The picture carries the
      // "put the groups together" idea when sound is off; the display equation is in the question text.
      'add-fact': {
        render(stage, q) {
          const a = q.numbers.a, b = q.numbers.b;
          stage.innerHTML = '<div class="scene scene-mid b2-pattern">' + factHTML(a, b, false) + '</div>';
          return { wu: Math.min(a + b, 20) * 1.5 + 4, hu: 6 };
        }
      },

      // sub.facts-20: one group with the taken-away ones ringed; the child counts what is left. The picture
      // carries the "take some away" idea when sound is off.
      'sub-fact': {
        render(stage, q) {
          const a = q.numbers.a;
          stage.innerHTML = '<div class="scene scene-mid b2-pattern">' + factHTML(a, q.numbers.b, true) + '</div>';
          return { wu: Math.min(a, 20) * 1.5 + 3, hu: 6 };
        }
      },

      // add.two-digit / add.three-digit (no trade): two place value charts, one over the other, with a plus.
      'add2': { render(stage, q) { stage.innerHTML = '<div class="scene scene-mid b2-pattern">' + columnHTML(q.numbers.a, q.numbers.b, false) + '</div>'; return { wu: 9.5, hu: 12.4 }; } },
      'add3': { render(stage, q) { stage.innerHTML = '<div class="scene scene-mid b2-pattern">' + columnHTML(q.numbers.a, q.numbers.b, false) + '</div>'; return { wu: 12, hu: 12.4 }; } },
      // add.two-digit-regroup (trade): the same chart; the trade (ten ones for a ten) is the rung-3 model.
      'add2r': { render(stage, q) { stage.innerHTML = '<div class="scene scene-mid b2-pattern">' + columnHTML(q.numbers.a, q.numbers.b, false) + '</div>'; return { wu: 9.5, hu: 12.4 }; } },
      // sub.two-digit / sub.three-digit (no trade): two place value charts with a take-away sign.
      'sub2': { render(stage, q) { stage.innerHTML = '<div class="scene scene-mid b2-pattern">' + columnHTML(q.numbers.a, q.numbers.b, true) + '</div>'; return { wu: 9.5, hu: 12.4 }; } },
      'sub3': { render(stage, q) { stage.innerHTML = '<div class="scene scene-mid b2-pattern">' + columnHTML(q.numbers.a, q.numbers.b, true) + '</div>'; return { wu: 12, hu: 12.4 }; } },
      // sub.two-digit-regroup (trade): the same chart; the trade (a ten for ten ones) is the rung-3 model.
      'sub2r': { render(stage, q) { stage.innerHTML = '<div class="scene scene-mid b2-pattern">' + columnHTML(q.numbers.a, q.numbers.b, true) + '</div>'; return { wu: 9.5, hu: 12.4 }; } },

      // sub.stories-two-step: a bar model of the start and the two steps. The bars carry the "part, part,
      // whole" idea when sound is off; the two steps are told in the question text.
      'two-step': {
        render(stage, q) {
          stage.innerHTML = '<div class="scene scene-mid b2-pattern">' + barModelHTML(q.numbers.s, q.numbers.x, q.numbers.y) + '</div>';
          return { wu: 20, hu: 7 };
        }
      }
    };

    return { RENDERERS, baseTenHTML, chartHTML, digitsOf, factHTML, columnHTML, barModelHTML };
  });
}());
