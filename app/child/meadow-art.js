/*
 * meadowArt (L5): scenery drawn in code (docs/STYLE.md sections 7.1, 10 and 11). Every shape takes its
 * colour from CSS: a wrapper <g class="t-<token>"> sets --tb and --td, shapes carry class tb (base),
 * td (deep) or tl (a stroke-only line in the deep tone). No outline, no gradient, no id.
 *   basketHTML(extraClass)  the take-away basket: a 3.2u by 2.2u box with one SVG (viewBox 32 x 22) and
 *                           the .basket-load box the counters land in
 *   mapSVG()                the landscape behind the world stops: meadow, river, hill, forest, garden
 *   pathSVG()               the winding path joining the stops (one <path class="trail">) and its centre line
 *   layoutTrail(map)        re-lay that path through the free strip beside each stop, as laid out
 *   watchTrail(map)         layoutTrail now and on every size change of the map (one ResizeObserver)
 *   worldGlyph(worldId)     a round scene for one world (stop, story banner, mission)
 *   homeMapHTML(opts)       the five world stops on the map (opts below)
 */
(function () {
  'use strict';

  NBA.define('meadowArt', ['util', 'catalog', 'art'], (util, catalog, art) => {
    const { esc } = util;
    const { WORLDS } = catalog;
    const sv = (cls, vb, body, extra) => '<svg class="' + cls + '" viewBox="' + vb + '" aria-hidden="true" focusable="false"' + (extra || '') + '>' + body + '</svg>';
    const g = (tone, body) => '<g class="t-' + tone + '">' + body + '</g>';
    const C = (cls, x, y, r) => '<circle class="' + cls + '" cx="' + x + '" cy="' + y + '" r="' + r + '"/>';
    const P = (cls, d, w) => '<path class="' + cls + '"' + (w ? ' stroke-width="' + w + '"' : '') + ' d="' + d + '"/>';

    const BASKET = sv('basket-art', '0 0 32 22', g('sand',
      P('td', 'M1 4H31L28.6 20.4Q28.2 22 26.6 22H5.4Q3.8 22 3.4 20.4Z') +
      P('tb', 'M3 5H29L27 18.6Q26.7 20 25.3 20H6.7Q5.3 20 5 18.6Z') +
      '<rect class="td" x="0.5" y="2" width="31" height="4" rx="2"/>' +
      P('tl', 'M9 8.5L9.8 17.5M14 8.5L14.3 18M18 8.5L17.7 18M23 8.5L22.2 17.5M6.2 12.6H25.8', 1)));

    /** An empty basket; counters land in its .basket-load box. */
    function basketHTML(extraClass) {
      return '<div class="basket' + (extraClass ? ' ' + esc(extraClass) : '') + '">' + BASKET + '<div class="basket-load"></div></div>';
    }

    /** The winding path (stroke in --sand) and its dotted centre line (--sand-deep), top to bottom. */
    function pathSVG() {
      const d = 'M30 6C78 20 82 44 50 60S16 96 50 110S86 146 52 162S20 186 64 196';
      return g('sand', '<path class="trail tb-line" vector-effect="non-scaling-stroke" d="' + d + '"/>' +
        '<path class="trail-dots tl" vector-effect="non-scaling-stroke" stroke-dasharray="2 6" d="' + d + '"/>');
    }
    /**
     * Lay the trail along the stops as drawn (STYLE 11): down the strip each stop leaves free (odd stops sit
     * left, even stops right) and across the gap to the next stop, in the map SVG's 0 0 100 200 units. Layout
     * offsets, not client rects, so the screen's enter motion does not skew it.
     */
    function layoutTrail(map) {
      const svg = map && map.querySelector('.map-art');
      const w = map ? map.clientWidth : 0, h = map ? map.clientHeight : 0;
      const tiles = map ? Array.prototype.filter.call(map.children, (el) => el.classList.contains('world-tile')) : [];
      if (!svg || !w || !h || !tiles.length) return;
      const X = (px) => (px / w * 100).toFixed(2), Y = (py) => (py / h * 200).toFixed(2);
      const pts = tiles.map((t) => {
        const left = t.offsetLeft, right = w - t.offsetLeft - t.offsetWidth;
        return { x: left > right ? left / 2 : w - right / 2, top: t.offsetTop, bottom: t.offsetTop + t.offsetHeight };
      });
      let d = 'M' + X(pts[0].x) + ' 0';
      pts.forEach((p, i) => {
        d += 'L' + X(p.x) + ' ' + Y(p.bottom);
        const n = pts[i + 1];
        if (n) { const mid = Y((p.bottom + n.top) / 2); d += 'C' + X(p.x) + ' ' + mid + ' ' + X(n.x) + ' ' + mid + ' ' + X(n.x) + ' ' + Y(n.top); }
      });
      svg.querySelectorAll('.trail, .trail-dots').forEach((el) => el.setAttribute('d', d));
    }
    let watcher = null;
    /** Lay the trail now and again whenever the map changes size (fonts, rotation, window size). */
    function watchTrail(map) {
      if (!map) return;
      layoutTrail(map);
      if (typeof ResizeObserver !== 'function') return;
      if (!watcher) watcher = new ResizeObserver((entries) => entries.forEach((e) => layoutTrail(e.target)));
      watcher.disconnect();
      watcher.observe(map);
    }
    /** The landscape: flat tinted shapes only (decoration; the stops are the content). */
    function mapSVG() {
      return sv('map-art', '0 0 100 200',
        '<g class="scene-meadow">' + g('moss', P('tb', 'M0 0H100V34Q70 46 40 36T0 40Z') + C('td', 14, 18, 2.4) + C('td', 82, 12, 2.2)) + '</g>' +
        '<g class="scene-river">' + g('teal', P('tb', 'M0 70Q30 62 55 74T100 72V86Q72 80 48 90T0 86Z')) + '</g>' +
        '<g class="scene-hill">' + g('apricot', P('tb', 'M-10 132Q30 98 70 120T110 128V140H-10Z')) + '</g>' +
        '<g class="scene-forest">' + g('mint', C('tb', 12, 156, 9) + C('tb', 26, 150, 11) + C('tb', 88, 160, 9)) + '</g>' +
        '<g class="scene-garden">' + g('rose', P('tb', 'M0 182Q50 172 100 182V200H0Z') + C('td', 30, 188, 2.6) + C('td', 74, 190, 2.6)) + '</g>' +
        pathSVG(), ' preserveAspectRatio="none"');
    }

    /** One round scene per world (a 56 x 56 viewBox). */
    const GLYPHS = {
      addition: g('moss', C('tb', 28, 28, 28) + P('td', 'M0 38Q28 30 56 38V56H0Z') +
        P('tl', 'M28 40V24', 2.4) + g('rose', C('td', 28, 20, 4) + C('td', 23, 23, 3.4) + C('td', 33, 23, 3.4))),
      subtraction: g('sky', C('tb', 28, 28, 28) + P('td', 'M0 30Q14 24 28 30T56 30V40Q42 34 28 40T0 40Z') +
        g('sand', C('td', 16, 34, 3.4) + C('td', 30, 35, 3.2) + C('td', 42, 34, 3.4))),
      multiplication: g('apricot', C('tb', 28, 28, 28) + g('moss', P('tb', 'M0 46Q28 14 56 46V56H0Z') +
        P('tl', 'M18 38V32M28 34V28M38 38V32', 2.4))),
      division: g('teal', C('tb', 28, 28, 28) + g('sand', P('td', 'M15 44V36M28 44V32M41 44V36', 3)) +
        g('moss', C('td', 15, 30, 7) + C('td', 28, 25, 8.5) + C('td', 41, 30, 7))),
      master: g('rose', C('tb', 28, 28, 28) + g('sand', '<rect class="td" x="10" y="36" width="36" height="9" rx="3"/>') +
        g('sunflower', C('td', 20, 28, 4) + C('td', 36, 28, 4)) + g('moss', P('tl', 'M20 32V36M36 32V36', 2.2)) + C('td', 28, 24, 4.4))
    };
    /** The round scene glyph of a world (the first world's for an unknown id). */
    function worldGlyph(worldId) {
      return sv('glyph', '0 0 56 56', Object.prototype.hasOwnProperty.call(GLYPHS, worldId) ? GLYPHS[worldId] : GLYPHS[WORLDS[0].id]);
    }

    /**
     * The five world stops on the map, in WORLDS order. opts: { done(worldId) -> finished, suggested: worldId or null,
     * extra: html of extra tiles placed first, listClass }. A finished world carries a quiet check leaf (no count, no star).
     */
    function homeMapHTML(opts) {
      const o = opts || {};
      const tiles = WORLDS.map((w, i) => {
        const finished = !!(o.done && o.done(w.id));
        const isNext = w.id === o.suggested;
        return '<button type="button" class="world-tile world-' + w.id + (isNext ? ' suggested' : '') +
          '" data-action="world" data-world="' + w.id + '" aria-label="' + esc(w.name + (finished ? ', finished' : '')) + '">' +
          '<span class="tile-glyph">' + worldGlyph(w.id) + (w.symbol ? '<span class="tile-symbol">' + esc(w.symbol) + '</span>' : '') + '</span>' +
          '<span class="tile-text"><span class="tile-name">' + esc(w.name) + '</span>' +
          '<span class="tile-op">World ' + (i + 1) + ': ' + esc(w.op) + '</span></span>' +
          (finished ? '<span class="done-leaf" role="img" aria-label="Finished">' + art.ICONS.leaf + '</span>' : '') +
          (isNext ? '<span class="badge">Next!</span>' : '') + '</button>';
      }).join('');
      return '<div class="map world-list' + (o.listClass || '') + '">' + mapSVG() + (o.extra || '') + tiles + '</div>';
    }

    return { basketHTML, mapSVG, pathSVG, layoutTrail, watchTrail, worldGlyph, homeMapHTML };
  });
}());
