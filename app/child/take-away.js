/*
 * takeAway (L5): the subtraction picture's motion (docs/STYLE.md section 10, art spec 3.5). The top B
 * counters lift, float in a gentle arc and land in the basket; nothing is knocked over, and the counters
 * that stay never move. The game never waits for it.
 *
 *   run({ stage, from, basket, onDone, later? })  from: the moving counters, top first (counter i takes
 *       slot i); basket: the .basket-load box; later: a scheduler (default dom.later; tests pass a stub
 *       clock). stage.dataset.takeaway is 'running' from the start and 'done' in the end state. Pending
 *       slots carry only the class `pending`; a slot becomes `loaded` when its counter has landed
 *       (design review M1). The end state runs once: from a timer, or at once on 'nba:fit'.
 *   flightPath({ box, slot, allowed, u })  pure: the three keyframes { k1, k2, k3 }, each { x, y, s } in px,
 *       clamped so the scaled box stays inside `allowed`; box, slot and allowed are { left, top, width, height }
 *   soundTimes(b), totalMs(b)  pure timing helpers
 */
(function () {
  'use strict';

  NBA.define('takeAway', ['config', 'dom', 'audio', 'counters'], (config, dom, audio, counters) => {
    const { TIMING, SIZE } = config;
    const SCALES = [1.05, 0.8, SIZE.LOAD_SCALE];
    const MAX_PLOPS = 4, PLOP_GAP = 150;

    /** When the last counter has landed: start, lift, arc, plus one stagger per extra counter. */
    function totalMs(b) { return TIMING.TAKE_START + TIMING.TAKE_LIFT + TIMING.TAKE_ARC + TIMING.TAKE_STAGGER * (b - 1); }
    /** Plop delays after the first landing: counters 1 to 4 only, 150 ms apart (never overlapping). */
    function soundTimes(b) {
      const out = [];
      for (let i = 0; i < Math.min(b, MAX_PLOPS); i++) out.push(i * PLOP_GAP);
      return out;
    }

    const clampv = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
    /** Move the offset only as far as needed so the box, scaled by s about its centre, lies inside allowed. */
    function keep(box, x, y, s, allowed) {
      const cx = box.left + box.width / 2, cy = box.top + box.height / 2;
      const hw = box.width * s / 2, hh = box.height * s / 2;
      return {
        x: clampv(x, allowed.left + hw - cx, allowed.left + allowed.width - hw - cx),
        y: clampv(y, allowed.top + hh - cy, allowed.top + allowed.height - hh - cy),
        s: s
      };
    }
    function flightPath(o) {
      const { box, slot, allowed, u } = o;
      const dx = (slot.left + slot.width / 2) - (box.left + box.width / 2);
      const dy = (slot.top + slot.height / 2) - (box.top + box.height / 2);
      const lift = -SIZE.TAKE_LIFT_U * u;
      return {
        k1: keep(box, 0, lift, SCALES[0], allowed),
        k2: keep(box, dx / 2, Math.min(lift, dy) - SIZE.TAKE_ARC_U * u, SCALES[1], allowed),
        k3: keep(box, dx, dy, SCALES[2], allowed)
      };
    }

    const rect = (el) => { const r = el.getBoundingClientRect(); return { left: r.left, top: r.top, width: r.width, height: r.height }; };
    /** The stage's content box: its padding box minus the padding. */
    function contentBox(stage) {
      const r = stage.getBoundingClientRect(), cs = getComputedStyle(stage);
      const pl = parseFloat(cs.paddingLeft) || 0, pt = parseFloat(cs.paddingTop) || 0;
      const pr = parseFloat(cs.paddingRight) || 0, pb = parseFloat(cs.paddingBottom) || 0;
      return { left: r.left + stage.clientLeft + pl, top: r.top + stage.clientTop + pt,
        width: stage.clientWidth - pl - pr, height: stage.clientHeight - pt - pb };
    }

    function run(o) {
      const stage = o.stage || null, basket = o.basket || null, from = (o.from || []).slice();
      const later = o.later || dom.later;
      const reduced = dom.reducedMotion();
      let done = false, slots = [];
      const onFit = () => end();
      /** One hidden slot per moving counter, same kind and tone; class `pending`, never `loaded`. */
      function makeSlots() {
        return from.map((el) => {
          const s = el.cloneNode(true);
          s.removeAttribute('data-i');
          s.removeAttribute('style');
          s.className = Array.prototype.filter.call(el.classList, (c) => c === 'counter' || /^(k|c)-/.test(c)).join(' ') + ' pending';
          basket.appendChild(s);
          return s;
        });
      }
      function end() {
        if (done) return;
        done = true;
        if (stage) stage.removeEventListener('nba:fit', onFit);
        if (basket && !slots.length) slots = makeSlots();
        from.forEach((el) => el.remove());
        slots.forEach((s) => { s.classList.remove('pending'); s.classList.add('loaded'); });
        if (stage) stage.dataset.takeaway = 'done';
        if (o.onDone) o.onDone();
      }
      if (stage) stage.dataset.takeaway = 'running';
      const t1 = TIMING.TAKE_START + TIMING.TAKE_LIFT + TIMING.TAKE_ARC;
      const instant = reduced || !stage || !basket;
      soundTimes(from.length).forEach((d) => later(() => audio.AUDIO.play('float'), (instant ? TIMING.TAKE_START : t1) + d));
      later(() => {
        if (done) return;
        if (instant) { end(); return; }
        slots = makeSlots();
        const allowed = contentBox(stage);
        const u = parseFloat(stage.style.getPropertyValue('--u')) || 20;
        from.forEach((el, i) => {
          const p = flightPath({ box: rect(el), slot: rect(slots[i]), allowed: allowed, u: u });
          [p.k1, p.k2, p.k3].forEach((k, n) => {
            el.style.setProperty('--x' + (n + 1), k.x.toFixed(2) + 'px');
            el.style.setProperty('--y' + (n + 1), k.y.toFixed(2) + 'px');
          });
          el.style.animationDelay = (i * TIMING.TAKE_STAGGER) + 'ms';
          el.classList.add('floating');
        });
        stage.addEventListener('nba:fit', onFit);
        const box = basket.parentElement;
        later(() => { if (!done && box) box.classList.add('settle'); }, t1 - TIMING.TAKE_START);
        later(end, totalMs(from.length) - TIMING.TAKE_START);
      }, TIMING.TAKE_START);
      return { end: end, isDone: () => done };
    }

    return { run, flightPath, soundTimes, totalMs, contentBox };
  });
}());
