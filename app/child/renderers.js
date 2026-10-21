/*
 * renderers (L5): render(stage, q) and afterShow(stage, q) for every question type
 * (moved from v1 section 8; P3 adds the V2 representations of DESIGN 16.3), attached to
 * questionTypes with attachRenderer(). render() draws the picture into #stage and returns a
 * fit spec { wu, hu, wpx?, hpx?, prep? } for counters.fitStage(). Every render first clears
 * stage.dataset.takeaway (#stage can outlive a question, so a stale 'done' never carries over).
 */
(function () {
  'use strict';

  NBA.define('renderers', ['config', 'util', 'catalog', 'dom', 'audio', 'art', 'counters', 'meadowArt', 'takeAway', 'screens', 'questionTypes', 'renderersBand1', 'renderersBand2', 'renderersBand2c', 'renderersBand2d', 'renderersBand2e', 'renderersBand3a', 'renderersBand3b', 'renderersBand3c', 'renderersBand3d', 'renderersBand3e', 'renderersBand3f'],
    (config, util, catalog, dom, audio, art, counters, meadowArt, takeAway, screens, questionTypes, renderersBand1, renderersBand2, renderersBand2c, renderersBand2d, renderersBand2e, renderersBand3a, renderersBand3b, renderersBand3c, renderersBand3d, renderersBand3e, renderersBand3f) => {
      const { GROUP_COLOURS, SHARE_ROW, SHARE_FACE_GAP, SIZE } = config;
      const { clamp, range, repeat } = util;
      const { BUDDIES } = catalog;
      const { $, $all } = dom;
      const { faceHTML } = art;
      const { bandTone, bandKind, counterHTML, stackHTML, stackW, stackH, colsFor, rowsFor } = counters;

      /** Fit spec for counter stacks (counters have no outline, so rows simply add up). */
      function stackFit(wu, rows) { return { wu: wu, hu: stackH(rows), hpx: 0 }; }

      /** The chosen buddy first, then the next buddies in BUDDIES order (skipping the chosen one). */
      function teamIds(k) {
        const chosen = screens.currentBuddyId();
        return [chosen].concat(BUDDIES.map((b) => b.id).filter((id) => id !== chosen)).slice(0, k);
      }
      /** Two bands of one stack: tone a then b every 5 counters; the shape alternates with the band. */
      const twoBands = (a, b) => ({ toneAt: (i) => (Math.floor(i / 5) % 2 ? b : a), kindAt: bandKind });

      const RENDERERS = {
        build: {
          render(stage, q) {
            // Empty columns sized for the full capacity, so counters never resize while building.
            stage.innerHTML = '<div class="scene">' + stackHTML(0, { cols: colsFor(q.cap) }, 'build-stack') + '</div>';
            return stackFit(stackW(colsFor(q.cap)), rowsFor(q.cap));
          }
        },

        add: {
          render(stage, q) {
            const a = q.numbers.a, b = q.numbers.b;
            // Group one is moss seeds, group two apricot pebbles: shape and tone both differ.
            stage.innerHTML = '<div class="scene">' + stackHTML(a, { toneAt: () => 'moss', kindAt: () => 'seed' }) +
              '<div class="plus" aria-hidden="true">+</div>' + stackHTML(b, { toneAt: () => 'apricot', kindAt: () => 'pebble' }) + '</div>';
            // The "+" is 1.5u wide with 0.6u of space on each side.
            return stackFit(stackW(colsFor(a)) + 2.7 + stackW(colsFor(b)), Math.max(rowsFor(a), rowsFor(b)));
          }
        },

        more: {
          render(stage, q) {
            const t = q.numbers.total;
            stage.innerHTML = '<div class="scene">' + stackHTML(t, { dashedFrom: q.numbers.have }) + '</div>';
            return stackFit(stackW(colsFor(t)), rowsFor(t));
          }
        },

        bigger: {
          render(stage, q) {
            const x = q.numbers;
            const tower = (h, v, opt, label) =>
              '<button class="tower" type="button" data-action="tower" data-value="' + v + '" aria-label="' + label + '">' +
              stackHTML(h, Object.assign({ rows: h }, opt)) + '</button>';
            stage.innerHTML = '<div class="scene towers">' + tower(x.left, 0, twoBands('moss', 'teal'), 'Left stack') +
              tower(x.right, 1, twoBands('apricot', 'plum'), 'Right stack') + '</div>';
            // Two single stacks of 3u-wide counters (3.5u with the mat), plus each
            // button's 0.5rem padding and 3px borders, and the 1.25rem gap between them.
            const fit = stackFit(7, Math.max(x.left, x.right));
            fit.prep = (W, H, rem) => ({ wpx: 2 * (rem + 6) + 1.25 * rem, hpx: fit.hpx + rem + 6 });
            return fit;
          }
        },

        knock: {
          render(stage, q) {
            const a = q.numbers.a;
            stage.innerHTML = '<div class="scene knock-scene">' + stackHTML(a, {}, 'knock-tower') + meadowArt.basketHTML() + '</div>';
            // Stack, 1.5u gap, the 3.2u basket and its 0.5rem right margin; 1u of headroom for the lift.
            return { wu: stackW(colsFor(a)) + SIZE.TAKE_GAP + SIZE.BASKET_W, hu: SIZE.TAKE_HEAD + stackH(rowsFor(a)), hpx: 0,
              prep: (W, H, rem) => ({ wpx: 0.5 * rem }) };
          },
          /** The top B counters float into the basket (takeAway); the counters that stay never move. */
          afterShow(stage, q) {
            const a = q.numbers.a, b = q.numbers.b;
            const top = $all('.knock-tower .counter', stage).filter((el) => Number(el.getAttribute('data-i')) >= a - b)
              .sort((p, r) => Number(r.getAttribute('data-i')) - Number(p.getAttribute('data-i')));
            takeAway.run({ stage: stage, from: top, basket: $('.basket-load', stage) });
          }
        },

        groups: {
          render(stage, q) {
            const g = q.numbers.g, s = q.numbers.s;
            let html = '';
            for (let k = 0; k < g; k++) {
              html += stackHTML(s, { toneAt: () => GROUP_COLOURS[k % GROUP_COLOURS.length], kindAt: () => (k % 2 ? 'pebble' : 'seed') }, 'group');
            }
            stage.innerHTML = '<div class="scene groups-scene">' + html + '</div>';
            // g stacks of one column (2.5u each) with 1.25u between groups.
            return stackFit(g * stackW(1) + (g - 1) * 1.25, s);
          }
        },

        share: {
          render(stage, q) {
            const n = q.numbers.n, k = q.numbers.k;
            const rows = Math.ceil(n / SHARE_ROW);
            let wall = '';
            for (let r = 0; r < rows; r++) {
              const inRow = Math.min(SHARE_ROW, n - r * SHARE_ROW);
              wall += '<div class="row">' + repeat(r % 2 ? counterHTML('pebble', 'apricot') : counterHTML('seed', 'sand'), inRow).join('') + '</div>';
            }
            const team = teamIds(k).map((id) => faceHTML(id, 'share-face')).join('');
            stage.innerHTML = '<div class="scene share-scene"><div class="stack treasure"><div class="wall">' + wall +
              '</div><div class="mat"></div></div><div class="team">' + team + '</div></div>';
            const fit = stackFit(SHARE_ROW * 2 + (SHARE_ROW - 1) * 0.15 + 0.5, rows);
            // Faces get the width they need first; the counters fit into what is left.
            fit.prep = (W, H, rem) => {
              const f = clamp(Math.floor((W - (k - 1) * SIZE.FACE_GAP) / k), SIZE.FACE_MIN, SIZE.FACE_MAX_REM * rem);
              stage.style.setProperty('--face', f + 'px');
              return { hpx: fit.hpx + f + SHARE_FACE_GAP };
            };
            return fit;
          }
        }
      };

      /* ---------- V2 representations (DESIGN 16.3) ---------- */

      /** Tone of counter i on a build stage: add-build shows the A start counters in moss, the added ones apricot. */
      function counterTone(q, i) {
        if (q && q.typeId === 'add-build') return i < q.start ? 'moss' : 'apricot';
        return bandTone(i);
      }
      function counterKind(q, i) {
        if (q && q.typeId === 'add-build') return i < q.start ? 'seed' : 'pebble';
        return bandKind(i);
      }
      /** Counter i of a build stage (mission-ui's +1 draws the next one with this). */
      function counterAt(q, i, extraClass, attrs) { return counterHTML(counterKind(q, i), counterTone(q, i), extraClass, attrs); }

      /** The v1 build stage with colsFor(cap) columns of 10, pre-filled with q.start counters. */
      function buildStage(stage, q) {
        const cols = colsFor(q.cap);
        stage.innerHTML = '<div class="scene">' +
          stackHTML(q.start || 0, { cols: cols, toneAt: (i) => counterTone(q, i), kindAt: (i) => counterKind(q, i) }, 'build-stack') + '</div>';
        return stackFit(stackW(cols), rowsFor(q.cap));
      }

      const NL_PITCH = 2.2; // tile 2u plus a 0.2u gap
      /** Small arrow showing that the line continues past a cut end (or an empty slot of the same width). */
      function lineEnd(show, dir) {
        if (!show) return '<span class="nl-end" aria-hidden="true"></span>';
        const d = dir < 0 ? 'M9 2 3 6l6 4' : 'M3 2l6 4-6 4';
        return '<span class="nl-end" aria-hidden="true"><svg viewBox="0 0 12 12" focusable="false"><path d="' + d +
          '" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
      }

      /**
       * One row of 11 numbered tiles: 0 to 10 at tier 10; the window [s, s + 10] of 0 to 20 at tier 20,
       * s = clamp(min(start, landing) - 1, 0, 10). Arcs show each hop of 1 (staggered in CSS, so reduced
       * motion and the test speed-up both apply); the buddy face marks the start; the landing shows "?".
       */
      function numberLine(stage, q, dir) {
        const a = q.numbers.a, land = q.answer;
        const s = q.max > 10 ? clamp(Math.min(a, land) - 1, 0, 10) : 0;
        const tiles = range(s, s + 10).map((n) => '<span class="nl-tile' + (n === a ? ' nl-start' : '') + (n === land ? ' nl-land' : '') +
          '" data-n="' + n + '">' + (n === land ? '?' : n) + '</span>').join('');
        let arcs = '';
        for (let k = 0; k < Math.abs(land - a); k++) {
          const x1 = (a + dir * k - s) * NL_PITCH + 1, x2 = x1 + dir * NL_PITCH;
          arcs += '<path d="M' + x1.toFixed(2) + ' 1.9Q' + ((x1 + x2) / 2).toFixed(2) + ' -.5 ' + x2.toFixed(2) + ' 1.9" style="animation-delay:' +
            (150 + k * 120) + 'ms"/>';
        }
        const faceLeft = ((a - s) * NL_PITCH).toFixed(2);
        stage.innerHTML = '<div class="scene scene-mid"><div class="nl' + (dir < 0 ? ' nl-back' : '') + '">' + lineEnd(s > 0, -1) +
          '<div class="nl-main"><svg class="nl-arcs" viewBox="0 0 24 2" focusable="false" aria-hidden="true">' + arcs + '</svg>' +
          '<div class="nl-row">' + tiles + '</div>' +
          '<div class="nl-marks">' + faceHTML(screens.currentBuddyId(), 'nl-face', ' style="left:calc(var(--u) * ' + faceLeft + ')"') + '</div></div>' +
          lineEnd(q.max > 10 && s + 10 < 20, 1) + '</div></div>';
        // 1u arrow slot + 0.2u gap on each side of the 24u row; arcs 2u, tiles 2u, face 2u, two 0.2u gaps.
        // The face is never below SIZE.FACE_MIN px (STYLE 8): when 2u would be smaller, its row is reserved in px.
        const fit = { wu: 26.4, hu: 6.4 };
        fit.prep = (W, H) => (2 * Math.min(W / fit.wu, H / fit.hu) * SIZE.FIT_SAFETY < SIZE.FACE_MIN ? { hu: 4.4, hpx: SIZE.FACE_MIN } : {});
        return fit;
      }

      /** Numerals and signs only, on a plain card (font never below 28 px, in CSS). */
      function symCard(stage, q) {
        const text = q.display[0];
        stage.innerHTML = '<div class="scene scene-mid"><div class="sym-card">' + util.esc(text) + '</div></div>';
        return { wu: text.length * 1.85 + 2.4, hu: 5.2 };
      }

      /** The story's scene: the buddy, one object counter, and the friend (or the basket when some go in it). */
      function wordScene(stage, q) {
        const s = q.scene || {};
        const other = s.basket ? meadowArt.basketHTML('ws-basket') : faceHTML(s.friendId || BUDDIES[1].id, 'ws-face');
        stage.innerHTML = '<div class="scene scene-mid word-scene">' + faceHTML(s.buddyId || screens.currentBuddyId(), 'ws-face') +
          '<div class="ws-object">' + counterHTML(s.object === 'pebble' ? 'pebble' : 'seed', s.object === 'pebble' ? 'apricot' : 'moss') + '</div>' + other + '</div>';
        // Two 4u faces, a 2u counter, and 1u gaps.
        return { wu: 12, hu: 4.4 };
      }

      Object.assign(RENDERERS, {
        'add-build': { render: buildStage },
        'sub-build': { render: buildStage },
        'add-line': { render: (stage, q) => numberLine(stage, q, 1) },
        'sub-line': { render: (stage, q) => numberLine(stage, q, -1) },
        'add-sym': { render: symCard },
        'sub-sym': { render: symCard },
        'add-word': { render: wordScene },
        'sub-word': { render: wordScene }
      });

      // The band-1 renderers (step 9 sub-build A) merge in before the shared attach loop.
      Object.assign(RENDERERS, renderersBand1.RENDERERS);
      // The band-2 place-value and counting renderers (step 10 sub-build A) merge in here.
      Object.assign(RENDERERS, renderersBand2.RENDERERS);
      // The band-2 multiplication / division renderers (step 10 sub-build C) merge in here.
      Object.assign(RENDERERS, renderersBand2c.RENDERERS);
      // The band-2 fraction renderers (step 10 sub-build D) merge in here.
      Object.assign(RENDERERS, renderersBand2d.RENDERERS);
      // The band-2 negatives / order / missing-number renderers (step 10 sub-build E) merge in here.
      Object.assign(RENDERERS, renderersBand2e.RENDERERS);
      // The band-3 big-number and fact renderers (step 11 sub-build A) merge in here.
      Object.assign(RENDERERS, renderersBand3a.RENDERERS);
      Object.assign(RENDERERS, renderersBand3b.RENDERERS);
      Object.assign(RENDERERS, renderersBand3c.RENDERERS);
      // The band-3 decimal renderers (step 11 sub-build D) merge in here.
      Object.assign(RENDERERS, renderersBand3d.RENDERERS);
      // The band-3 percent renderers (step 11 sub-build E) merge in here.
      Object.assign(RENDERERS, renderersBand3e.RENDERERS);
      // The band-3 negative-number, order-of-operations and letter renderers (step 11 sub-build F) merge in here.
      Object.assign(RENDERERS, renderersBand3f.RENDERERS);

      // The shared render entry: clear the take-away end marker before any new picture (P5).
      Object.keys(RENDERERS).forEach((id) => {
        const R = RENDERERS[id];
        questionTypes.attachRenderer(id, Object.assign({}, R, { render(stage, q) { delete stage.dataset.takeaway; return R.render(stage, q); } }));
      });
      const missing = questionTypes.ids().filter((id) => !RENDERERS[id]);
      if (missing.length) throw new Error('[NBA] no renderer for ' + missing.join(', '));

      return { teamIds, stackFit, counterTone, counterKind, counterAt };
    });
}());
