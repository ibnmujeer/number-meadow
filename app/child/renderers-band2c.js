/*
 * renderersBand2c (L5, step 10 sub-build C): the pictures for the band-2 (ages 7 to 9) MULTIPLICATION and
 * DIVISION question types, kept out of renderers.js (and the band-2 siblings, which are near the 400-line
 * limit). renderers.js merges this map into its own and attaches every entry with questionTypes.attachRenderer.
 *   render(stage, q) draws into #stage and returns a fit spec { wu, hu } for counters.fitStage().
 *
 * The NEW "array" way of showing (owner decision D10-2 = A), placed in representations.order and
 * config.adaptive.concretenessOrder right after 'concrete' and the band-1 + coder-A ways: counters laid out in
 * equal rows and columns, so a times fact is seen as so many rows of so many. mul-array / mul-fact / mul-fact34
 * / div-inverse all draw an array; div-group (representation "visual", proposedWays empty in the data) draws the
 * counters split into equal groups, like the built div.share picture. Colour comes from the counter CSS class
 * names (c-<tone>), never from the SVG string, so the art holds no hex, no gradient and no defs/id/url
 * (STYLE 7.1), exactly as the band-1 and sub-build A/B art does. No animation, no timer, no score; the picture
 * carries the task when sound is off.
 */
(function () {
  'use strict';

  NBA.define('renderersBand2c', ['util', 'counters'], (util, counters) => {
    const { counterHTML } = counters;

    /*
     * An array of r rows by c columns of seed counters. Each row is a flex row of c seeds; the rows stack. The
     * seeds alternate tone by row so the rows read as separate rows without colour being the only cue. The
     * picture is one labelled image; the display equation (times or repeated adding) sits in the question text.
     */
    function arrayHTML(r, c) {
      let rows = '';
      for (let row = 0; row < r; row++) {
        let seeds = '';
        for (let col = 0; col < c; col++) seeds += counterHTML(row % 2 ? 'pebble' : 'seed', row % 2 ? 'apricot' : 'moss');
        rows += '<div class="b2-arow">' + seeds + '</div>';
      }
      return '<div class="b2-array" role="img" aria-label="An array of ' + r + ' rows of ' + c + '">' + rows + '</div>';
    }
    /** The array fit: c counters wide (2u each plus a small gap), r rows tall (about 1.6u each), plus a margin. */
    function arrayFit(r, c) { return { wu: c * 2.4 + 2, hu: r * 1.8 + 2 }; }

    /*
     * div.group: n counters put into groups of s, so the child can count how many groups there are. Each group
     * is a little plate of s seeds; the plates sit in a row that wraps. The picture carries "make equal groups
     * and count them" when sound is off; the answer (the number of groups) is never written on the plates.
     */
    function groupsHTML(n, s) {
      const groups = n / s;
      let plates = '';
      for (let g = 0; g < groups; g++) {
        let seeds = '';
        for (let i = 0; i < s; i++) seeds += counterHTML('seed', 'moss');
        plates += '<div class="b2-plate">' + seeds + '</div>';
      }
      return '<div class="b2-groups" role="img" aria-label="Counters put into equal groups">' + plates + '</div>';
    }
    function groupsFit(n, s) {
      const groups = n / s;
      const perRow = Math.min(groups, 4);
      return { wu: perRow * (s * 1.5 + 1.4) + 2, hu: Math.ceil(groups / perRow) * 3 + 2 };
    }

    const RENDERERS = {
      // mul.arrays: an array of r rows and c columns. mode 1 (repeated adding) draws the same array; the display
      // shows it as a repeated-adding sum, mode 0 as a times sum. The array carries the quantity when sound is off.
      'mul-array': {
        render(stage, q) {
          const r = q.numbers.r, c = q.numbers.c;
          stage.innerHTML = '<div class="scene scene-mid b2-pattern">' + arrayHTML(r, c) + '</div>';
          return arrayFit(r, c);
        }
      },

      // mul.facts-2-5-10 / mul.facts-3-4: a times fact drawn as an r by c array (r = the first factor, c = the
      // second), so the fact is seen as rows of a group. The display shows the times sum.
      'mul-fact': {
        render(stage, q) {
          const r = q.numbers.r, c = q.numbers.c;
          stage.innerHTML = '<div class="scene scene-mid b2-pattern">' + arrayHTML(r, c) + '</div>';
          return arrayFit(r, c);
        }
      },
      'mul-fact34': {
        render(stage, q) {
          const r = q.numbers.r, c = q.numbers.c;
          stage.innerHTML = '<div class="scene scene-mid b2-pattern">' + arrayHTML(r, c) + '</div>';
          return arrayFit(r, c);
        }
      },

      // div.group: n counters split into groups of s. The child counts the groups; the picture carries the task.
      'div-group': {
        render(stage, q) {
          const n = q.numbers.n, s = q.numbers.s;
          stage.innerHTML = '<div class="scene scene-mid b2-pattern">' + groupsHTML(n, s) + '</div>';
          return groupsFit(n, s);
        }
      },

      // div.inverse: n shared into groups of c, drawn as an array (the division undoes the times fact r rows of
      // c). The array shows r rows of c; the display shows the division sum. The child reads the rows (= answer).
      'div-inverse': {
        render(stage, q) {
          const c = q.numbers.c, r = q.answer; // r rows of c make n
          stage.innerHTML = '<div class="scene scene-mid b2-pattern">' + arrayHTML(r, c) + '</div>';
          return arrayFit(r, c);
        }
      }
    };

    return { RENDERERS, arrayHTML, groupsHTML };
  });
}());
