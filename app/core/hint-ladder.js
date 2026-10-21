/*
 * hintLadder (L2): the four-rung hint ladder as pure data (step 4, P9). No DOM, no clock, no randomness, and no
 * mission context: a mission, and later Free Play, call it with a question object and the number of answers that
 * were not right yet. app/child/hint-ui.js and hint-draw.js turn the data into pictures in the child's own way of
 * showing (counters, pictures, number line, symbols, story).
 *   rungFor(wrongCount, wrongOptions?)  0 before any hint, then 1 (look), 2 (count together), 3 (show the model, from the third on).
 *                            wrongOptions is how many not-right answers the question can still be given: 2 for three buttons, 1 for
 *                            two stacks, none (unlimited) for building. A question with fewer than three ways to be not right
 *                            starts higher, so that the model is always reachable (3 buttons: count together, then the model).
 *   kindOf(q)                the template key of a question (sub-word and sub-sym have two)
 *   ladder(q)                { kind, way, rungs: { 1: { say, marks }, 2: { say, count }, 3: { say, model } },
 *                              reveals: { 1: false, 2: false, 3: true } }
 *   say(q, rung, opts?)      { lead, text, say }: the gentle line (feedback.gentle) in front of the rung text
 *   wrongOptionsOf(inputMode)  2 for choices, 1 for towers, null (unlimited) for build
 *   needsSimilar({ modelShown, isSimilar, isLast, kind })   rung 4: ask for a similar question next
 *   similarSpec(q)           { activityId, difficulty, template, excludeKey }: same activity, level and template, new numbers
 * Rules: rungs 1 and 2 never carry the answer (text or drawing data) unless it is a number already in the question;
 * rung 3 draws the model and the child still taps the answer; no text says the answer.
 * Drawing data: marks = what to outline, count = steps to play one by one, model = the whole structure. A count
 * step that starts at 1 leaves `from` out.
 */
(function () {
  'use strict';

  NBA.define('hintLadder', ['catalog', 'feedback', 'hintLadderBand2', 'hintLadderBand2c', 'hintLadderBand2d', 'hintLadderBand2e', 'hintLadderBand3a', 'hintLadderBand3b', 'hintLadderBand3c', 'hintLadderBand3d', 'hintLadderBand3e', 'hintLadderBand3f'], (catalog, feedback, hintLadderBand2, hintLadderBand2c, hintLadderBand2d, hintLadderBand2e, hintLadderBand3a, hintLadderBand3b, hintLadderBand3c, hintLadderBand3d, hintLadderBand3e, hintLadderBand3f) => {
    const MAX_RUNG = 3;
    const KINDS_WITH_SIMILAR = ['world', 'freeplay'];
    const own = (m, k) => Object.prototype.hasOwnProperty.call(m, k);
    const whole = (n) => { const x = Math.floor(Number(n)); return x > 0 ? x : 0; };

    function rungFor(wrongCount, wrongOptions) {
      const n = whole(wrongCount);
      if (!n) return 0;
      const opts = typeof wrongOptions === 'number' && wrongOptions > 0 ? wrongOptions : MAX_RUNG;
      return Math.min(MAX_RUNG, n + Math.max(0, MAX_RUNG - opts));
    }
    const WRONG_OPTIONS = { choices: 2, towers: 1 };
    function wrongOptionsOf(inputMode) { return own(WRONG_OPTIONS, inputMode) ? WRONG_OPTIONS[inputMode] : null; }

    function kindOf(q) {
      if (q.typeId === 'sub-word') return q.template === 'diff' ? 'sub-word-diff' : 'sub-word-take';
      if (q.typeId === 'sub-sym') return q.numbers.b <= q.numbers.a - q.numbers.b ? 'sub-sym-back' : 'sub-sym-up';
      return q.typeId;
    }

    /** What each kind outlines (rung 1), plays one by one (rung 2) and draws whole (rung 3), from the question's numbers. */
    const SPEC = {
      build: (x) => ({
        marks: ['question-number'],
        count: [{ do: 'number-placed' }],
        model: { kind: 'ghost-stack', n: x.n }
      }),
      add: (x) => ({
        marks: ['group-a', 'group-b'],
        count: [{ do: 'number', target: 'group-a', to: x.a }, { do: 'flash', target: 'group-b' }],
        model: { kind: 'one-row', parts: [x.a, x.b], numbered: x.a + x.b }
      }),
      more: (x) => ({
        marks: ['empty-spots'],
        count: [{ do: 'number', target: 'solid', to: x.have }, { do: 'flash', target: 'empty-spots' }],
        model: { kind: 'fill-spots', from: x.have + 1, to: x.total }
      }),
      bigger: (x) => ({
        marks: ['stack-left', 'stack-right'],
        count: [{ do: 'number', target: 'stack-left', to: x.left }],
        model: { kind: 'number-both', left: x.left, right: x.right, outline: 'taller' }
      }),
      knock: (x) => ({
        marks: ['stack', 'basket'],
        count: [{ do: 'number', target: 'floating', to: x.b }],
        model: { kind: 'replay-float', moves: x.b, stays: x.a - x.b }
      }),
      groups: (x) => ({
        marks: ['groups'],
        // The second group is labelled with 2s only when that is not the whole answer (two groups).
        count: [{ do: 'number', target: 'group-1', to: x.s }].concat(x.g > 2
          ? [{ do: 'label', target: 'group-2', value: 2 * x.s }, { do: 'ellipsis' }] : [{ do: 'flash', target: 'group-2' }]),
        model: { kind: 'running-totals', groups: x.g, size: x.s }
      }),
      share: (x) => ({
        marks: ['pile', 'friends'],
        count: [{ do: 'deal-first-round' }],
        model: { kind: 'deal-all', friends: x.k, each: x.n / x.k }
      }),
      'add-build': (x) => ({
        marks: ['start-counters', 'instruction'],
        count: [{ do: 'number', target: 'start', to: x.a }, { do: 'number-placed', continueFrom: x.a }],
        model: { kind: 'ghost-next', from: x.a + 1, to: x.a + x.b }
      }),
      'sub-build': (x) => ({
        marks: ['start-counters'],
        count: [{ do: 'number', target: 'start', to: x.a }],
        model: { kind: 'ring-top', ring: x.b, keep: x.a - x.b }
      }),
      'add-line': (x) => ({
        marks: ['start-tile'],
        count: [{ do: 'hops', from: x.a, hops: x.b, dir: 1, landing: 'hidden' }],
        model: { kind: 'landing', at: x.a + x.b }
      }),
      'sub-line': (x) => ({
        marks: ['start-tile'],
        count: [{ do: 'hops', from: x.a, hops: x.b, dir: -1, landing: 'hidden' }],
        model: { kind: 'landing', at: x.a - x.b }
      }),
      'add-sym': (x) => ({
        marks: ['numeral-a', 'numeral-b'],
        count: [{ do: 'dots', from: Math.max(x.a, x.b), dots: Math.min(x.a, x.b), dir: 1 }],
        model: { kind: 'counter-picture', parts: [x.a, x.b], numbered: x.a + x.b }
      }),
      'sub-sym-back': (x) => ({
        marks: ['numeral-a', 'numeral-b'],
        count: [{ do: 'dots', from: x.a, dots: x.b, dir: -1 }],
        model: { kind: 'counter-picture', start: x.a, ring: x.b, numbered: x.a - x.b }
      }),
      'sub-sym-up': (x) => ({
        marks: ['numeral-a', 'numeral-b'],
        count: [{ do: 'dots-up', from: x.b, to: x.a }],
        model: { kind: 'counter-picture', start: x.a, ring: x.b, numbered: x.a - x.b }
      }),
      'add-word': (x) => ({
        marks: ['story-numbers'],
        count: [{ do: 'number', target: 'buddy-group', to: x.a }, { do: 'flash', target: 'friend-group' }],
        model: { kind: 'one-row', parts: [x.a, x.b], numbered: x.a + x.b }
      }),
      'sub-word-take': (x) => ({
        marks: ['story-numbers'],
        count: [{ do: 'number', target: 'basket', to: x.b }],
        model: { kind: 'left-numbered', numbered: x.a - x.b }
      }),
      'sub-word-diff': (x) => ({
        marks: ['story-numbers'],
        count: [{ do: 'number', target: 'friend-row', to: x.b }, { do: 'outline', target: 'buddy-row' }],
        model: { kind: 'extra-numbered', from: x.b + 1, to: x.a }
      }),
      /* ---------- band-1 counting and number sense (step 9 sub-build A) ---------- */
      // Rung 1 marks the number already in the question; rung 2 counts up to that same number (never the
      // answer); rung 3 shows the answer as counters and the child still taps it.
      'count-next': (x) => ({ marks: ['story-numbers'], count: [{ do: 'count-up', to: x.n }], model: { kind: 'seq-answer', answer: x.n + 1 } }),
      'count-back': (x) => ({ marks: ['story-numbers'], count: [{ do: 'count-up', to: x.n }], model: { kind: 'seq-answer', answer: x.n - 1 } }),
      'count-on-100': (x) => ({ marks: ['story-numbers'], count: [{ do: 'count-up', to: Math.min(x.n, 10) }], model: { kind: 'seq-answer', answer: x.n + 1 } }),
      'count-tens': (x) => ({ marks: ['story-numbers'], count: [{ do: 'count-tens', to: x.n }], model: { kind: 'tens-answer', answer: x.n + 10 } }),
      'numeral-say': (x) => ({ marks: ['story-numbers'], count: [{ do: 'show-numeral', n: x.n }], model: { kind: 'numeral-answer', answer: x.n } }),
      'match-count': (x) => ({ marks: ['story-numbers'], count: [{ do: 'count-group', to: x.a }], model: { kind: 'group-answer', answer: x.a } }),
      /* ---------- band-1 subitizing (step 9 sub-build B) ---------- */
      // Rung 1 outlines the pattern on the card (no number). Rung 2 counts the dots that are already on the
      // card, one by one (the count is not spoken as text). Rung 3 shows the group as a row of dots to match.
      'subitize-dots': (x) => ({ marks: ['pattern'], count: [{ do: 'count-dots', to: x.n }], model: { kind: 'dots-answer', answer: x.n } }),
      'subitize-dice': (x) => ({ marks: ['pattern'], count: [{ do: 'count-dots', to: x.n }], model: { kind: 'dots-answer', answer: x.n } }),
      /* ---------- band-1 part-whole and ten-frame (step 9 sub-build C) ---------- */
      // part-bond: rung 1 marks the whole and the shown part (both already in the question). Rung 2 counts up
      // from the shown part to the whole (never the answer as text). Rung 3 shows the hidden part as counters.
      'part-bond': (x) => ({ marks: ['story-numbers'], count: [{ do: 'count-up-from', from: x.p, to: x.w }], model: { kind: 'part-answer', answer: x.w - x.p } }),
      // ten-frame: rung 1 outlines the frame. Rung 2 counts the counters that are ALREADY on the frame, one by
      // one (adds no number the frame did not show). Rung 3 shows the answer: the counters, or the empty boxes.
      'ten-frame': (x) => ({ marks: ['pattern'], count: [{ do: 'count-dots', to: x.n }],
        model: { kind: 'frame-answer', answer: x.empty ? 10 - x.n : x.n } }),
      /* ---------- band-1 number line and even/odd (step 9 sub-build D) ---------- */
      // line-read: rung 1 outlines the line (the flag is already on it, no number). Rung 2 counts the tiles
      // from 0 up to the marked tile (the child sees every tile already). Rung 3 marks the answer tile.
      'line-read': (x) => ({ marks: ['pattern'], count: [{ do: 'count-dots', to: x.m }], model: { kind: 'line-answer', answer: x.m } }),
      // even-odd: rung 1 outlines the pairs (no number). Rung 2 points at each pair, one by one (it adds no
      // number the picture did not already show). Rung 3 shows the pairs with any leftover, so the child can
      // read even or odd for themselves (it never names the answer in words, it only shows the counters).
      'even-odd': (x) => ({ marks: ['pattern'], count: [{ do: 'count-pairs', to: Math.floor(x.n / 2) }], model: { kind: 'pairs-answer', n: x.n } }),
      /* ---------- band-1 make-5 / make-10 and teen numbers (step 9 sub-build E) ---------- */
      // make-5: rung 1 marks the whole and the shown part (both already in the question). Rung 2 counts up
      // from the shown part to the whole (never the answer as text). Rung 3 shows the partner as counters.
      'make-5': (x) => ({ marks: ['story-numbers'], count: [{ do: 'count-up-from', from: x.p, to: x.whole }], model: { kind: 'part-answer', answer: x.whole - x.p } }),
      // make-10: rung 1 outlines the frame (the counters are already on it). Rung 2 counts the counters that
      // are ALREADY on the frame, one by one (adds no number the frame did not show). Rung 3 shows how many
      // more make ten, as a row of counters.
      'make-10': (x) => ({ marks: ['pattern'], count: [{ do: 'count-dots', to: x.p }], model: { kind: 'frame-answer', answer: x.whole - x.p } }),
      // teen-ten: rung 1 outlines the full ten and the loose ones. Rung 2 counts the FULL ten first (ten is
      // not the answer and is shown as a full frame), so the child sees "a ten, and how many more?" without
      // the ones being named. Rung 3 shows the ones as a row of counters (the number is already in view).
      'teen-ten': (x) => ({ marks: ['pattern'], count: [{ do: 'count-dots', to: 10 }], model: { kind: 'frame-answer', answer: x.n - 10 } }),
      /* ---------- band-1 fractions (step 9 sub-build F) ---------- */
      // frac-share: rung 1 outlines the group and the plates (no number). Rung 2 counts the WHOLE group (the
      // whole is in the question text, "Half of 6"), so the child counts all of them before sharing; it names
      // no number the question did not already give. Rung 3 shows ONE plate as a row of counters the child can
      // count (the answer: the group dealt into equal parts is already on the card).
      'frac-share': (x) => ({ marks: ['pattern'], count: [{ do: 'count-dots', to: x.whole }],
        model: { kind: 'frac-answer', answer: x.whole / x.parts } })
    };
    // The band-2 place-value and counting SPEC rows (step 10 sub-build A) merge in here, keyed by the same
    // kind as their hint text (feedback-lines.js hints) and their rung drawings (hint-draw-band2.js).
    Object.assign(SPEC, hintLadderBand2.SPEC);
    // The band-2 multiplication / division SPEC rows (step 10 sub-build C) merge in here.
    Object.assign(SPEC, hintLadderBand2c.SPEC);
    // The band-2 fraction SPEC rows (step 10 sub-build D) merge in here.
    Object.assign(SPEC, hintLadderBand2d.SPEC);
    // The band-2 negatives / order / missing-number SPEC rows (step 10 sub-build E) merge in here.
    Object.assign(SPEC, hintLadderBand2e.SPEC);
    // The band-3 big-number and fact SPEC rows (step 11 sub-build A) merge in here.
    Object.assign(SPEC, hintLadderBand3a.SPEC);
    // The band-3 area-model, remainder and long-division SPEC rows (step 11 sub-build B) merge in here.
    Object.assign(SPEC, hintLadderBand3b.SPEC);
    // The band-3 fraction SPEC rows (step 11 sub-build C) merge in here.
    Object.assign(SPEC, hintLadderBand3c.SPEC);
    // The band-3 decimal SPEC rows (step 11 sub-build D) merge in here.
    Object.assign(SPEC, hintLadderBand3d.SPEC);
    // The band-3 percent SPEC rows (step 11 sub-build E) merge in here.
    Object.assign(SPEC, hintLadderBand3e.SPEC);
    // The band-3 negative-number, order-of-operations and letter SPEC rows (step 11 sub-build F) merge in here.
    Object.assign(SPEC, hintLadderBand3f.SPEC);

    /** The values a template may use: the question's numbers, the bigger and smaller of a pair, and the story's names. */
    function varsOf(q) {
      const x = q.numbers || {};
      const v = Object.assign({}, x);
      if (typeof x.a === 'number' && typeof x.b === 'number') { v.big = Math.max(x.a, x.b); v.small = Math.min(x.a, x.b); }
      if (q.scene) { v.buddy = q.scene.buddy; v.friend = q.scene.friend; v.word = q.scene.word; }
      return v;
    }
    function fillTemplate(t, vars) {
      return String(t).replace(/\{(\w+)\}/g, (m, name) => (own(vars, name) ? String(vars[name]) : m));
    }

    function ladder(q) {
      const kind = kindOf(q);
      const H = catalog.FEEDBACK_LINES.hints;
      if (!own(H, kind) || !own(SPEC, kind)) throw new Error('[NBA] hintLadder: no ladder for ' + kind);
      const vars = varsOf(q), spec = SPEC[kind](q.numbers);
      const text = (r) => fillTemplate(H[kind][String(r)], vars);
      return {
        kind: kind,
        way: q.representation,
        rungs: {
          1: { say: text(1), marks: spec.marks },
          2: { say: text(2), count: spec.count },
          3: { say: text(3), model: spec.model }
        },
        reveals: { 1: false, 2: false, 3: true }
      };
    }

    /** The spoken and shown line of a rung: the gentle line of that rung, then the rung text. */
    function say(q, rung, opts) {
      const o = opts || {};
      const r = Math.min(MAX_RUNG, Math.max(1, whole(rung) || 1));
      const lead = feedback.gentle({ rung: r, index: o.index, way: q.representation, avoid: o.avoid });
      const text = ladder(q).rungs[r].say;
      return { lead: lead, text: text, say: lead + ' ' + text };
    }

    function needsSimilar(o) {
      const p = o || {};
      return p.modelShown === true && p.isSimilar !== true && p.isLast !== true && KINDS_WITH_SIMILAR.indexOf(p.kind) >= 0;
    }

    function similarSpec(q) {
      return { activityId: q.activityId, difficulty: q.difficulty, template: q.template, excludeKey: q.key };
    }

    return { MAX_RUNG, rungFor, wrongOptionsOf, kindOf, ladder, say, needsSimilar, similarSpec };
  });
}());
