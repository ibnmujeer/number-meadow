/*
 * renderersBand3c (L5, step 11 sub-build C): the pictures for the band-3 FRACTION question types, kept out of renderers.js.
 * renderers.js merges this map into its own and attaches every entry with questionTypes.attachRenderer.
 *   render(stage, q) draws into #stage and returns a fit spec { wu, hu } for counters.fitStage().
 *
 *   frac-equiv      fraction-bar: a wall of two bars (the two fractions being compared or made equal), each split and shaded
 *   frac-of         fraction-bar: a bar split into the bottom number of parts with the top number shaded, over a row of counters
 *   frac-addsame    fraction-bar: one bar split into the bottom number of parts, the two amounts shaded in two tones
 *   frac-addunlike  fraction-bar: two bars (the two bottom numbers) lined up, each with its amount shaded
 *   frac-mul        area-model: a square cut by both fractions, the overlap shaded (fraction of a fraction), or a row of bars (whole x fraction)
 * frac-equiv / frac-of / frac-addsame / frac-addunlike reuse the band-2 fraction BAR (renderersBand2d.barHTML), so no new rep id and
 * no new art; frac-mul reuses the NEW area-model way (D11-1). Colour comes from token class names (b2-fon shaded, a second tone for
 * the second amount), never from the HTML string, so the art holds no hex, no gradient and no defs/id/url (STYLE 7.1); every shape is
 * flat. No animation: the picture carries the task when sound is off. Fractions are written as "num/den" (ASCII).
 */
(function () {
  'use strict';

  NBA.define('renderersBand3c', ['renderersBand2d', 'counters'], (band2d, counters) => {
    const { barHTML } = band2d;
    const { counterHTML } = counters;
    const gcd = (a, b) => (b ? gcd(b, a % b) : a);
    const lcm = (a, b) => a / gcd(a, b) * b;
    const stageOf = (html) => '<div class="scene scene-mid b2-pattern">' + html + '</div>';
    const firstK = (k) => { const out = []; for (let i = 0; i < k; i++) out.push(i); return out; };

    /** A bar of d parts with the first `on` parts shaded (reusing the band-2 fraction bar). Returned bare so it sits directly in the
     *  stretch wall column and fills the width (band-2 wall rows reserve a left label column; these have no label). */
    function barRow(d, on, label) {
      return barHTML(d, firstK(on), label);
    }

    /** A bar of d parts with two blocks shaded in two tones: the first `t1` in the main tone, the next `t2` in a second tone (for
     *  an add on one bar). The parts over d (an improper total) are not drawn; the sum text carries the answer. */
    function twoToneBar(d, t1, t2, mode, label) {
      let segs = '';
      const second = mode ? 0 : t2; // on a take-away, only the first amount is shaded, then part of it is marked to remove
      for (let i = 0; i < d; i++) {
        const cls = i < t1 ? ' b2-fon' : (i < t1 + second ? ' b2-fon b3-fon2' : '');
        segs += '<span class="b2-fseg' + cls + '"></span>';
      }
      return '<div class="b2-fbar" role="img" aria-label="' + label + '">' + segs + '</div>';
    }

    /* ---- frac-mul: a unit square cut into b1 columns and b2 rows, the overlap (t1 columns by t2 rows) shaded ---- */
    function overlapHTML(t1, b1, t2, b2, label) {
      let rows = '';
      for (let r = 0; r < b2; r++) {
        let cells = '';
        for (let c = 0; c < b1; c++) {
          const on = c < t1 && r < t2;
          cells += '<span class="b3-ocell' + (on ? ' b3-oon' : '') + '"></span>';
        }
        rows += '<div class="b3-orow">' + cells + '</div>';
      }
      return '<div class="b3-overlap" role="img" aria-label="' + label + '">' + rows + '</div>';
    }
    /* ---- frac-mul whole x fraction: w bars, each split into b parts with t shaded ---- */
    function barsHTML(w, t, b, label) {
      let bars = '';
      for (let i = 0; i < w; i++) bars += '<div class="b3-mulbar">' + barHTML(b, firstK(t), 'a bar') + '</div>';
      return '<div class="b3-mulrow" role="img" aria-label="' + label + '">' + bars + '</div>';
    }

    const RENDERERS = {
      // frac.equivalent-compare: mode 0 one bar of b parts with a shaded (the fraction to match); mode 1 two bars (the two fractions
      // to compare); mode 2 one bar of q parts with p shaded (the fraction to simplify). The bars carry the task with sound off.
      'frac-equiv': {
        render(stage, q) {
          const x = q.numbers;
          let rows;
          if (x.mode === 1) {
            rows = barRow(x.b1, x.a1, x.a1 + ' of ' + x.b1 + ' parts shaded') + barRow(x.b2, x.a2, x.a2 + ' of ' + x.b2 + ' parts shaded');
          } else if (x.mode === 2) {
            rows = barRow(x.q, x.p, x.p + ' of ' + x.q + ' parts shaded');
          } else {
            rows = barRow(x.b, x.a, x.a + ' of ' + x.b + ' parts shaded');
          }
          stage.innerHTML = stageOf('<div class="b3-fwall">' + rows + '</div>');
          return { wu: 26, hu: x.mode === 1 ? 7 : 5 };
        }
      },

      // frac.of-amount: a bar of b parts with t shaded, over a row of w counters, so a fraction OF an amount is one picture.
      'frac-of': {
        render(stage, q) {
          const x = q.numbers;
          let seeds = '';
          for (let i = 0; i < x.w; i++) seeds += counterHTML('seed', 'moss');
          stage.innerHTML = stageOf('<div class="b3-ofwrap">' +
            barHTML(x.b, firstK(x.t), x.t + ' of ' + x.b + ' parts shaded') +
            '<div class="b3-ofcount" role="img" aria-label="' + x.w + ' counters">' + seeds + '</div></div>');
          return { wu: 24, hu: 7 };
        }
      },

      // frac.add-same: one bar of b parts; the first amount shaded in the main tone, the second amount in a second tone (an add),
      // or the first amount shaded with a part marked to remove (a take-away). The sum on the card carries the answer.
      'frac-addsame': {
        render(stage, q) {
          const x = q.numbers;
          const label = (x.mode ? x.t1 + ' parts shaded, ' + x.t2 + ' to take away' : x.t1 + ' and ' + x.t2 + ' parts shaded') + ' of ' + x.b;
          stage.innerHTML = stageOf('<div class="b3-fwall">' + twoToneBar(x.b, x.t1, x.t2, x.mode, label) + '</div>');
          return { wu: 24, hu: 5 };
        }
      },

      // frac.add-unlike: a fraction wall of three bars the same length. The top two are the two fractions as they are given (b1
      // parts with t1 shaded, b2 parts with t2 shaded). The third is cut into the common bottom number (the lowest common multiple)
      // with both amounts shaded in two tones, so a half and a third read as 3 sixths and 2 sixths. The sum card carries the answer.
      'frac-addunlike': {
        render(stage, q) {
          const x = q.numbers, c = lcm(x.b1, x.b2);
          const u1 = c / x.b1, u2 = c / x.b2, top1 = x.t1 * u1, top2 = x.t2 * u2;
          const common = x.mode
            ? barRow(c, top1 - top2, (top1 - top2) + ' of ' + c + ' parts left')
            : twoToneBar(c, top1, top2, 0, top1 + ' and ' + top2 + ' of ' + c + ' parts shaded');
          const rows = barRow(x.b1, x.t1, x.t1 + ' of ' + x.b1 + ' parts shaded') + barRow(x.b2, x.t2, x.t2 + ' of ' + x.b2 + ' parts shaded') + common;
          stage.innerHTML = stageOf('<div class="b3-fwall">' + rows + '</div>');
          return { wu: 26, hu: 9 };
        }
      },

      // frac.multiply: mode 0 a unit square cut both ways with the overlap shaded (a fraction OF a fraction); mode 1 a row of w bars
      // each with t of b parts shaded (a whole number of a fraction). The product on the card carries the answer.
      'frac-mul': {
        render(stage, q) {
          const x = q.numbers;
          if (x.mode) {
            stage.innerHTML = stageOf(barsHTML(x.w, x.t, x.b, x.w + ' bars, each with ' + x.t + ' of ' + x.b + ' shaded'));
            return { wu: Math.min(x.w, 6) * 6 + 2, hu: 6 };
          }
          stage.innerHTML = stageOf(overlapHTML(x.t1, x.b1, x.t2, x.b2, 'a square cut into ' + x.b1 + ' by ' + x.b2 + ', the overlap shaded'));
          return { wu: 12, hu: 12 };
        }
      }
    };

    return { RENDERERS, overlapHTML, twoToneBar };
  });
}());
