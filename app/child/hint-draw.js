/*
 * hintDraw (L5): draws the hint ladder (core/hint-ladder.js) into #stage, in the way of showing the child is using.
 * Everything it adds is removed again by clear() and by the next question (the stage is drawn afresh).
 *   draw(stage, q, rung, lad)   rung 1 outlines what matters, rung 2 counts together one step at a time, rung 3
 *                               draws the whole model; lad = hintLadder.ladder(q)
 *   clear(stage)                removes marks, numerals, helper counters and the extra room again
 *   numberNew(stage)            number a counter that was just added in a build question while counting together
 * Marks are a soft background tint (never a red, never an X); numerals are small and plain; counting steps run
 * 450 ms apart with dom.later (all at once under reduced motion). The tapped answer button is not touched here.
 */
(function () {
  'use strict';

  NBA.define('hintDraw', ['dom', 'counters'], (dom, counters) => {
    const { $, $all, later, reducedMotion } = dom;
    const { counterHTML, stackHTML, stackW, stackH, colsFor, rowsFor, fitStage } = counters;
    const STEP = 450, ROW = 10;
    let pending = [];

    /* ---------- small pieces ---------- */
    const mark = (els) => els.forEach((el) => el && el.classList.add('hint-mark'));
    function label(el, text, extra) {
      if (!el) return;
      const s = document.createElement('span');
      s.className = 'hint-n' + (extra ? ' ' + extra : '');
      s.textContent = text;
      s.setAttribute('aria-hidden', 'true');
      el.appendChild(s);
    }
    /** Run fn(i) for i = 0..n-1, 450 ms apart (250 ms for long runs); all at once under reduced motion. */
    function sequence(n, fn) {
      const gap = n > 12 ? 250 : STEP;
      for (let i = 0; i < n; i++) {
        if (reducedMotion()) fn(i);
        else pending.push(later(() => fn(i), i * gap));
      }
    }
    /** Number the elements 1, 2, 3 ... (or the given texts), one by one. */
    function numberEls(els, texts) { sequence(els.length, (i) => label(els[i], texts ? texts[i] : String(i + 1))); }
    function flash(els) { els.forEach((el) => el && el.classList.add('hint-flash')); }
    const counterEls = (root) => $all('.counter', root);
    const stacks = (stage) => $all('.stack', stage);

    /** Wrap the numerals of an element's text (the question line or the card) that are in `nums` in a soft mark. */
    function markNumerals(root, nums) {
      if (!root) return;
      if (root._hintOrig === undefined) root._hintOrig = root.innerHTML;
      const walk = (node) => {
        Array.prototype.slice.call(node.childNodes).forEach((c) => {
          if (c.nodeType === 3) {
            if (!/\d/.test(c.nodeValue)) return;
            const frag = document.createDocumentFragment();
            c.nodeValue.split(/(\d+)/).forEach((part) => {
              if (nums.indexOf(Number(part)) >= 0 && /^\d+$/.test(part)) {
                const s = document.createElement('span'); s.className = 'hint-mark'; s.textContent = part; frag.appendChild(s);
              } else if (part) frag.appendChild(document.createTextNode(part));
            });
            node.replaceChild(frag, c);
          } else if (c.nodeType === 1 && !c.classList.contains('hint-mark')) walk(c);
        });
      };
      walk(root);
    }
    const numbersOf = (q) => Object.keys(q.numbers).map((k) => q.numbers[k]);

    /* ---------- room: the picture is refitted when something is added ---------- */
    function reserve(stage, grow) {
      if (!stage._fit) return;
      const base = stage._fitBase || (stage._fitBase = stage._fit);
      const g = grow(base);
      stage._fit = Object.assign({}, base, { wu: g.wu, hu: g.hu, prep: base.prep && ((W, H, rem) => {
        const r = base.prep(W, H, rem);
        return Object.assign({}, r, r.hu !== undefined ? { hu: r.hu + (g.hu - base.hu) } : {}, r.wu !== undefined ? { wu: r.wu + (g.wu - base.wu) } : {});
      }) });
    }

    /* ---------- helper counters ---------- */
    /** items: [{ kind, tone, outline }]; beside: columns of ten next to the picture; below: rows of ten under it. */
    function ghost(stage, items, where, host) {
      const el = document.createElement('div');
      el.className = 'hint-ghost ' + (where === 'beside' ? 'scene hint-beside' : 'hint-rows');
      const mk = (it, i) => counterHTML(it.kind, it.tone, 'hint-c' + (it.outline ? ' hint-outline' : ''), ' data-g="' + i + '"');
      if (where === 'beside') {
        el.innerHTML = stackHTML(items.length, { toneAt: (i) => items[i].tone, kindAt: (i) => items[i].kind }, 'hint-stack');
        counterEls(el).forEach((c, i) => { c.classList.add('hint-c'); if (items[i].outline) c.classList.add('hint-outline'); });
      } else {
        let html = '';
        for (let r = 0; r * ROW < items.length; r++) {
          html += '<div class="hint-row">' + items.slice(r * ROW, (r + 1) * ROW).map((it, k) => mk(it, r * ROW + k)).join('') + '</div>';
        }
        el.innerHTML = html;
      }
      (host || stage).appendChild(el);
      const n = items.length;
      if (where === 'beside') {
        reserve(stage, (b) => ({ wu: b.wu + 1.5 + stackW(colsFor(n)), hu: Math.max(b.hu, stackH(rowsFor(n))) }));
      } else {
        const rows = Math.ceil(n / ROW);
        reserve(stage, (b) => ({ wu: Math.max(b.wu, Math.min(n, ROW) * 2.2), hu: b.hu + rows * 1.4 + 0.6 }));
        stage.classList.add('hint-col');
      }
      return counterEls(el);
    }
    const seeds = (n, tone, outline) => Array.apply(null, Array(Math.max(0, n))).map(() => ({ kind: 'seed', tone: tone || 'moss', outline: !!outline }));
    const pebbles = (n, tone, outline) => Array.apply(null, Array(Math.max(0, n))).map(() => ({ kind: 'pebble', tone: tone || 'apricot', outline: !!outline }));

    /** Room for n dots that wrap onto as many rows as the stage width needs (a dot is 1.3 rem or 1.2u wide, 0.4u apart). The picture's own
     *  fit is asked first; its u is an upper bound of the final u, so the rows counted here are never fewer than the rows drawn. */
    function reserveDots(stage, n) {
      const base = stage._fitBase || (stage._fitBase = stage._fit);
      if (!base) return;
      stage._fit = Object.assign({}, base, { prep: (W, H, rem) => {
        const r = Object.assign({ wu: base.wu, hu: base.hu, wpx: 0, hpx: 0 }, base.prep ? base.prep(W, H, rem) : {});
        const u0 = Math.min((W - r.wpx) / r.wu, (H - r.hpx) / r.hu);
        const dot = Math.max(1.3 * rem, 1.2 * u0), gap = 0.4 * u0, rows = Math.ceil(n / Math.max(1, Math.floor((W + gap) / (dot + gap))));
        return Object.assign({}, r, { hpx: r.hpx + rows * (dot + gap) + 0.6 * u0 });
      } });
    }

    /** Room for a note of count text lines under the picture (.b3-noteline: 18 px at the least or 1.5u, line height 1.2, 0.3u apart). The
     *  text does not shrink with u, so the room is counted in px from the biggest pitch the picture could still have (an upper bound of the final u). */
    function reserveNote(stage, count, widest) {
      const base = stage._fitBase || (stage._fitBase = stage._fit);
      if (!base) return;
      stage._fit = Object.assign({}, base, { wu: Math.max(base.wu, widest * 0.95), prep: (W, H, rem) => {
        const r = Object.assign({ wu: base.wu, hu: base.hu, wpx: 0, hpx: 0 }, base.prep ? base.prep(W, H, rem) : {});
        const u0 = Math.min((W - r.wpx) / Math.max(r.wu, widest * 0.95), (H - r.hpx) / r.hu);
        return Object.assign({}, r, { wu: Math.max(r.wu, widest * 0.95), hpx: r.hpx + count * Math.max(18, 1.5 * u0) * 1.2 + (count - 1) * 0.3 * u0 + 0.6 * u0 + 10 });
      } });
    }

    /** A row of n small dots, lit one by one; ordinals when withNumbers. */
    function dotRow(stage, n, withNumbers) {
      const row = document.createElement('div');
      row.className = 'hint-ghost hint-dots';
      row.innerHTML = Array.apply(null, Array(n)).map(() => '<span class="hint-dot"></span>').join('');
      stage.appendChild(row);
      stage.classList.add('hint-col');
      reserveDots(stage, n);
      const dots = $all('.hint-dot', row);
      sequence(n, (i) => { dots[i].classList.add('on'); if (withNumbers) label(dots[i], String(i + 1)); });
    }

    /* ---------- rung 1: what matters ---------- */
    const TARGETS = {
      'group-a': (s) => [stacks(s)[0]], 'group-b': (s) => [stacks(s)[1]], 'empty-spots': (s) => $all('.slot', s),
      'stack-left': (s) => [$all('.tower', s)[0]], 'stack-right': (s) => [$all('.tower', s)[1]],
      stack: (s) => [$('.knock-tower', s)], basket: (s) => [$('.basket', s)], groups: (s) => $all('.stack.group', s),
      pile: (s) => [$('.treasure', s)], friends: (s) => $all('.share-face', s), 'start-counters': (s) => $all('.build-stack .counter', s),
      'start-tile': (s) => [$('.nl-start', s)],
      // subitizing: the dot/dice card; sub-build C: the ten-frame card; sub-build D: the read-the-line and
      // the even/odd pairs scene (the bond uses story-numbers)
      pattern: (s) => [$('.b1-dotcard', s) || $('.b1-frame', s) || $('.b1-numline', s) || $('.b1-pairs', s) ||
        $('.b2-blocks', s) || $('.b2-compare', s) || $('.b2-col', s) || $('.b2-fact', s) || $('.b2-bars', s) ||
        $('.b2-array', s) || $('.b2-groups', s) || $('.b2-chart', s) ||
        $('.b2-fwall', s) || $('.b2-fstack', s) || $('.b2-fline', s) || $('.b2-fbar', s) || $('.b2-balance', s) ||
        $('.b3-chart', s) || $('.b3-sum', s) || $('.b3-parts', s) || $('.b3-card', s) ||
        $('.b3-area', s) || $('.b3-piles', s) || $('.b3-divcard', s) ||
        $('.b3-overlap', s) || $('.b3-mulrow', s) || $('.b3-ofwrap', s) ||
        $('.b3-grid', s) || $('.b3-dline', s) || $('.b3-storycard', s) ||
        $('.b2-vline', s) || $('.b3-nline', s)]
    };
    const TEXT_TARGETS = ['question-number', 'instruction', 'story-numbers', 'numeral-a', 'numeral-b'];
    function rung1(stage, q, lad) {
      lad.rungs[1].marks.forEach((m) => {
        if (TEXT_TARGETS.indexOf(m) >= 0) {
          if (m !== 'numeral-b') markNumerals($(m.indexOf('numeral') === 0 ? '.sym-card' : '#q-text'), numbersOf(q));
        } else if (TARGETS[m]) mark(TARGETS[m](stage));
      });
    }

    /* ---------- rung 2: count together (never the answer) ---------- */
    const COUNT = {
      build: (s) => { s.classList.add('hint-numbering'); numberEls(counterEls($('.build-stack', s))); },
      'add-build': (s, q) => { s.classList.add('hint-numbering'); numberEls(counterEls($('.build-stack', s)).slice(0, q.numbers.a)); },
      add: (s, q) => { const st = stacks(s); numberEls(counterEls(st[0])); flash(counterEls(st[1])); },
      more: (s, q) => { numberEls($all('.counter', s)); flash($all('.slot', s)); },
      bigger: (s) => numberEls(counterEls($all('.tower', s)[0])),
      knock: (s, q) => numberEls(ghost(s, seeds(q.numbers.b, 'sand', true), 'below')),
      groups: (s, q) => {
        const g = $all('.stack.group', s), x = q.numbers;
        numberEls(counterEls(g[0]));
        if (x.g > 2) { sequence(1, () => { label(counterEls(g[1]).pop(), String(2 * x.s)); label(counterEls(g[2]).pop(), '...'); }); } else flash(counterEls(g[1]));
      },
      share: (s, q) => {
        const k = q.numbers.k;
        const row = document.createElement('div');
        row.className = 'hint-ghost hint-deal';
        row.innerHTML = Array.apply(null, Array(k)).map(() => counterHTML('seed', 'sand', 'hint-c', '')).join('');
        s.querySelector('.share-scene').appendChild(row);
        reserve(s, (b) => ({ wu: b.wu, hu: b.hu + 1.8 }));
        const cs = counterEls(row);
        cs.forEach((c) => { c.style.visibility = 'hidden'; });
        sequence(k, (i) => { cs[i].style.visibility = 'visible'; });
      },
      'sub-build': (s, q) => { numberEls(counterEls($('.build-stack', s))); },
      'add-line': (s, q) => hops(s, q, 1),
      'sub-line': (s, q) => hops(s, q, -1),
      'add-sym': (s, q) => dotRow(s, Math.min(q.numbers.a, q.numbers.b), true),
      'sub-sym-back': (s, q) => dotRow(s, q.numbers.b, true),
      'sub-sym-up': (s, q) => dotRow(s, q.numbers.a - q.numbers.b, false),
      'add-word': (s, q) => { const c = ghost(s, seeds(q.numbers.a).concat(pebbles(q.numbers.b, 'apricot', true)), 'below'); numberEls(c.slice(0, q.numbers.a)); flash(c.slice(q.numbers.a)); },
      'sub-word-take': (s, q) => numberEls(ghost(s, seeds(q.numbers.b, 'sand'), 'below')),
      'sub-word-diff': (s, q) => { const c = ghost(s, seeds(q.numbers.b).concat(pebbles(q.numbers.a, 'apricot', true)), 'below'); numberEls(c.slice(0, q.numbers.b)); }
    };
    /** Number the tiles the hops land on, one by one; the landing tile keeps its question mark. */
    function hops(stage, q, dir) {
      const a = q.numbers.a, b = q.numbers.b;
      const tiles = [];
      for (let k = 1; k < b; k++) tiles.push($('.nl-tile[data-n="' + (a + dir * k) + '"]', stage));
      numberEls(tiles.filter(Boolean), tiles.map((t, i) => String(i + 1)));
      $all('.nl-arcs path', stage).forEach((p) => p.classList.add('hint-arc'));
    }

    /* ---------- rung 3: the whole model ---------- */
    const MODEL = {
      build: (s, q) => numberEls(ghost(s, seeds(q.numbers.n), 'beside')),
      'add-build': (s, q) => numberEls(ghost(s, pebbles(q.numbers.b, 'apricot', true), 'beside'), range(q.numbers.a + 1, q.numbers.a + q.numbers.b)),
      add: (s, q) => numberEls(ghost(s, seeds(q.numbers.a).concat(pebbles(q.numbers.b)), 'beside')),
      more: (s, q) => { const sl = $all('.slot', s); sl.forEach((e) => e.classList.add('hint-fill')); numberEls(sl, range(q.numbers.have + 1, q.numbers.total)); },
      bigger: (s, q) => {
        const t = $all('.tower', s);
        t.forEach((e) => numberEls(counterEls(e)));
        mark([t[q.numbers.left > q.numbers.right ? 0 : 1]]);
      },
      knock: (s, q) => numberEls(counterEls($('.knock-tower', s)).filter((c) => Number(c.getAttribute('data-i')) < q.numbers.a - q.numbers.b)),
      groups: (s, q) => $all('.stack.group', s).forEach((g, k) => label(counterEls(g).pop(), String((k + 1) * q.numbers.s))),
      share: (s, q) => {
        const x = q.numbers, scene = $('.share-scene', s);
        const row = document.createElement('div');
        row.className = 'hint-ghost hint-deal';
        row.innerHTML = Array.apply(null, Array(x.k)).map(() => stackHTML(x.n / x.k, { toneAt: () => 'sand', kindAt: () => 'seed' }, 'hint-stack')).join('');
        scene.appendChild(row);
        reserve(s, (b) => ({ wu: b.wu, hu: b.hu + stackH(rowsFor(x.n / x.k)) + 0.6 }));
        numberEls(counterEls(row.firstChild));
      },
      'sub-build': (s, q) => {
        const cs = counterEls($('.build-stack', s)), keep = q.numbers.a - q.numbers.b;
        cs.slice(keep).forEach((c) => c.classList.add('hint-ring'));
        numberEls(cs.slice(0, keep));
      },
      'add-line': (s, q) => landing(s, q.numbers.a + q.numbers.b),
      'sub-line': (s, q) => landing(s, q.numbers.a - q.numbers.b),
      'add-sym': (s, q) => numberEls(ghost(s, seeds(q.numbers.a).concat(pebbles(q.numbers.b)), 'below')),
      'sub-sym-back': (s, q) => symTake(s, q),
      'sub-sym-up': (s, q) => symTake(s, q),
      'add-word': (s, q) => numberEls(ghost(s, seeds(q.numbers.a + q.numbers.b), 'below')),
      'sub-word-take': (s, q) => numberEls(ghost(s, seeds(q.numbers.a - q.numbers.b), 'below')),
      'sub-word-diff': (s, q) => { const c = ghost(s, seeds(q.numbers.a), 'below'); numberEls(c.slice(q.numbers.b), range(q.numbers.b + 1, q.numbers.a)); }
    };
    function range(from, to) { const out = []; for (let i = from; i <= to; i++) out.push(String(i)); return out; }
    function landing(stage, n) {
      const t = $('.nl-land', stage);
      if (!t) return;
      t.textContent = String(n);
      t.classList.add('hint-mark');
    }
    function symTake(stage, q) {
      const c = ghost(stage, seeds(q.numbers.a), 'below'), keep = q.numbers.a - q.numbers.b;
      c.slice(keep).forEach((e) => e.classList.add('hint-ring'));
      numberEls(c.slice(0, keep));
    }

    /* ---------- entry points ---------- */
    function clear(stage) {
      if (!stage) return;
      pending.forEach((id) => clearTimeout(id));
      pending = [];
      $all('.hint-ghost', stage).forEach((e) => e.remove());
      $all('.hint-n', stage).forEach((e) => e.remove());
      $all('.hint-mark, .hint-flash, .hint-ring, .hint-fill, .hint-arc', stage).forEach((e) => e.classList.remove('hint-mark', 'hint-flash', 'hint-ring', 'hint-fill', 'hint-arc'));
      $all('.nl-land', stage).forEach((e) => { e.textContent = '?'; });
      stage.classList.remove('hint-numbering', 'hint-col');
      if (stage._fitBase) { stage._fit = stage._fitBase; stage._fitBase = null; }
      [$('#q-text'), $('.sym-card', stage)].forEach((e) => { if (e && e._hintOrig !== undefined) { e.innerHTML = e._hintOrig; e._hintOrig = undefined; } });
    }
    function draw(stage, q, rung, lad) {
      if (!stage) return;
      clear(stage);
      const fn = rung === 1 ? null : (rung === 2 ? COUNT : MODEL)[lad.kind];
      if (rung === 1) rung1(stage, q, lad);
      else if (fn) fn(stage, q);
      fitStage();
    }
    /**
     * Register extra rung drawers for kinds added by a later module (step 9 band-1 types), using the same
     * helpers. spec = { count: { kind: fn(stage, q) }, model: { kind: fn } }. Reuses dotRow/ghost/sequence
     * through the shared `helpers` so a band-1 module needs no counter internals of its own.
     */
    const helpers = { dotRow, ghost, seeds, pebbles, numberEls, sequence, mark, label, counterEls, range, reserve, reserveNote };
    function register(spec) {
      Object.assign(COUNT, (spec && spec.count) || {});
      Object.assign(MODEL, (spec && spec.model) || {});
    }
    function numberNew(stage) {
      if (!stage || !stage.classList.contains('hint-numbering')) return;
      const cs = counterEls($('.build-stack', stage));
      const c = cs[cs.length - 1];
      if (c && !c.querySelector('.hint-n')) label(c, String(cs.length));
    }
    return { draw, clear, numberNew, register, helpers };
  });
}());
