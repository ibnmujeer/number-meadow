/*
 * questionTypes (L2): the question registry, pure parts only (v1 section 8, extended in P3 as the
 * learning object model of DESIGN 8.2). Every entry has the same interface, so a new kind of
 * question is one new entry here plus its metadata in data/activities.js:
 *   id, conceptId (= primaryConcept), inputMode, representation, operation, answerType,
 *   hintStrategy, difficulties, family     metadata merged from data/activities.js
 *   candidates(level, template?)  every valid number set for a declared level (data/difficulty.js);
 *                                 throws for anything else (a v1-style candidates(10) fails loudly)
 *   candidatesForMax(10 | 20)     the v1 signature: level 2 or 4
 *   key(n, template?)   stops a question repeating within a run (the question id); v1 keys unchanged
 *   size(n)             biggest number in the picture (the test hook infers max from it)
 *   create(n, ctx)      { display: [lines], speech, answer, cap?, start?, scene? } (pure);
 *                       ctx = { buddyId, buddyName, friendId, friendName, rng, template }
 *   (the hints are the ladder in core/hint-ladder.js; hintStrategy in the metadata only names the idea)
 * render(stage, q) and the optional afterShow(stage, q) live in child/renderers.js, which attaches
 * them with attachRenderer(id, { render, afterShow }). Display text may use maths symbols;
 * speech never does. The v1 types keep their v1 key, size and create.
 */
(function () {
  'use strict';

  NBA.define('questionTypes', ['config', 'util', 'catalog', 'questionTypesBand1', 'questionTypesBand2', 'questionTypesBand2b', 'questionTypesBand2c', 'questionTypesBand2d', 'questionTypesBand2e', 'questionTypesBand3a', 'questionTypesBand3b', 'questionTypesBand3c', 'questionTypesBand3d', 'questionTypesBand3e', 'questionTypesBand3f'], (config, util, catalog, band1, band2, band2b, band2c, band2d, band2e, band3a, band3b, band3c, band3d, band3e, band3f) => {
    const { BUILD_EXTRA } = config;
    const { range } = util;
    const { BUDDIES, DIFFICULTY, ACTIVITIES } = catalog;

    const MINUS = '\u2212', TIMES = '\u00d7', DIVIDE = '\u00f7', NBSP = '\u00a0';
    function tier(max) { return max > 10 ? 20 : 10; }
    /** A count before its noun: "1 counter", "2 counters" (finding 15; wording.test.js::plural_agrees). */
    const cnt = (n, one, many) => n + ' ' + (n === 1 ? one : many);

    /* ---------- candidates from the difficulty table (DESIGN 6.2) ---------- */
    const FAMILIES = {
      add(p) {
        const out = [];
        for (let a = p.min; a <= p.sumMax; a++) {
          for (let b = p.min; a + b <= p.sumMax; b++) {
            if (a + b >= p.sumMin && (p.bMax === undefined || b <= p.bMax)) out.push({ a: a, b: b });
          }
        }
        return out;
      },
      'take-away'(p) {
        const out = [];
        for (let a = p.aMin; a <= p.aMax; a++) {
          for (let b = p.bMin; b <= p.bMax; b++) if (a - b >= p.leftMin) out.push({ a: a, b: b });
        }
        return out;
      },
      more(p) {
        const out = [];
        for (let t = p.tMin; t <= p.tMax; t++) {
          for (let m = p.mMin; m <= p.mMax; m++) if (t - m >= 1) out.push({ have: t - m, total: t });
        }
        return out;
      },
      build: (p) => range(p.nMin, p.nMax).map((n) => ({ n: n })),
      bigger(p) {
        const out = [];
        for (let l = p.lo; l <= p.hi; l++) {
          for (let r = p.lo; r <= p.hi; r++) {
            const d = Math.abs(l - r);
            if (d >= 1 && d <= p.dMax && (p.largerMin === undefined || Math.max(l, r) >= p.largerMin)) out.push({ left: l, right: r });
          }
        }
        return out;
      },
      groups: (p) => p.list.map((x) => ({ g: x[0], s: x[1] })),
      share: (p) => p.list.map((x) => ({ n: x[0], k: x[1] }))
    };
    // The band-1 counting and number-sense families (step 9 sub-build A) merge in here.
    Object.assign(FAMILIES, band1.FAMILIES);
    // The band-2 place-value and counting families (step 10 sub-build A) merge in here.
    Object.assign(FAMILIES, band2.FAMILIES);
    // The band-2 multi-digit add/sub families (step 10 sub-build B) merge in here.
    Object.assign(FAMILIES, band2b.FAMILIES);
    // The band-2 multiplication / division families (step 10 sub-build C) merge in here.
    Object.assign(FAMILIES, band2c.FAMILIES);
    // The band-2 fraction families (step 10 sub-build D) merge in here.
    Object.assign(FAMILIES, band2d.FAMILIES);
    // The band-2 negatives / order / missing-number families (step 10 sub-build E) merge in here.
    Object.assign(FAMILIES, band2e.FAMILIES);
    // The band-3 big-number and fact families (step 11 sub-build A) merge in here.
    Object.assign(FAMILIES, band3a.FAMILIES);
    // The band-3 area-model, remainder and long-division families (step 11 sub-build B) merge in here.
    Object.assign(FAMILIES, band3b.FAMILIES);
    // The band-3 fraction families (step 11 sub-build C) merge in here.
    Object.assign(FAMILIES, band3c.FAMILIES);
    // The band-3 decimal families (step 11 sub-build D) merge in here.
    Object.assign(FAMILIES, band3d.FAMILIES);
    Object.assign(FAMILIES, band3e.FAMILIES);
    // The band-3 negative-number, order-of-operations and letter families (step 11 sub-build F) merge in here.
    Object.assign(FAMILIES, band3f.FAMILIES);

    const plusEq = (a, b) => a + ' + ' + b + ' = ?';
    const minusEq = (a, b) => a + ' ' + MINUS + ' ' + b + ' = ?';
    /** Build-mode cap: +1 stops here (DESIGN 8.1); for build exactly v1's min(n + 5, 25). */
    const capFor = (start, answer) => Math.max(start, Math.min(answer + BUILD_EXTRA, 25));
    // The seed picks the object of the story (one draw, as before): seeds or pebbles, matching the picture.
    const OBJECTS = [['seed', 'seeds'], ['pebble', 'pebbles']];
    function sceneFor(ctx, withBasket) {
      const c = ctx || {};
      const o = OBJECTS[Math.floor((c.rng || (() => 0))() * OBJECTS.length)];
      return { buddyId: c.buddyId || null, friendId: withBasket ? null : (c.friendId || null), basket: !!withBasket, object: o[0],
        unit: o[0], word: o[1], buddy: c.buddyName || BUDDIES[0].name, friend: c.friendName || BUDDIES[1].name };
    }

    const QUESTION_TYPES = {
      /* Build a stack of exactly N counters with +1 / Undo / Done (no running total: counting is the task). */
      build: {
        key: (x) => 'build:' + x.n,
        size: (x) => x.n,
        create: (x) => ({
          display: ['Build a stack', 'of ' + cnt(x.n, 'counter', 'counters') + '!'],
          speech: 'Build a stack of ' + cnt(x.n, 'counter', 'counters') + '! Tap plus 1 for each counter, then tap Done.',
          answer: x.n,
          cap: Math.min(x.n + BUILD_EXTRA, 25) // +1 stops here, so the stack can never overflow
        })
      },

      /* A + B: two groups with a plus sign between them. */
      add: {
        key: (x) => 'add:' + x.a + '+' + x.b,
        size: (x) => x.a + x.b,
        create: (x) => ({
          display: [x.a + ' + ' + x.b + ' = ?'],
          speech: cnt(x.a, 'counter', 'counters') + ' and ' + cnt(x.b, 'more counter', 'more counters') + '. ' + x.a + ' plus ' + x.b + '. How many in all?',
          answer: x.a + x.b
        })
      },

      /* How many more: H counters plus (T - H) empty spots. */
      more: {
        key: (x) => 'more:' + x.have + '/' + x.total,
        size: (x) => x.total,
        create: (x) => ({
          display: ['Have ' + x.have + '. Need ' + x.total + '.', 'How many more?'],
          speech: 'You have ' + cnt(x.have, 'counter', 'counters') + '. You need ' + x.total + '. How many more?',
          answer: x.total - x.have
        })
      },

      /* Tap the bigger stack: each whole stack is a button. Heights are never equal. */
      bigger: {
        key: (x) => 'bigger:' + Math.min(x.left, x.right) + '-' + Math.max(x.left, x.right),
        size: (x) => Math.max(x.left, x.right),
        // No numbers in the speech on purpose: they would give the answer away.
        create: (x) => ({ display: ['Tap the bigger stack!'], speech: 'Tap the bigger stack!', answer: x.left > x.right ? 0 : 1 })
      },

      /* B of A counters float into the basket (child/take-away.js). Nothing falls. */
      knock: {
        key: (x) => 'knock:' + x.a + '-' + x.b,
        size: (x) => x.a,
        create: (x) => ({
          display: ['How many are left?', x.a + ' ' + MINUS + ' ' + x.b + ' = ?'],
          speech: 'Put ' + cnt(x.b, 'counter', 'counters') + ' in the basket. ' + x.a + ' take away ' + x.b + '. How many are left?',
          answer: x.a - x.b
        })
      },

      /* G groups of S counters, each group its own tone on its own mat. */
      groups: {
        key: (x) => 'groups:' + x.g + 'x' + x.s,
        size: (x) => x.g * x.s,
        create: (x) => ({
          display: [x.g + ' groups of ' + x.s, x.g + ' ' + TIMES + ' ' + x.s + ' = ?'],
          speech: x.g + ' groups of ' + cnt(x.s, 'counter', 'counters') + '. ' + x.g + ' times ' + x.s + '. How many in all?',
          answer: x.g * x.s
        })
      },

      /* N counters shared by K friends: the chosen buddy plus K - 1 others. */
      share: {
        key: (x) => 'share:' + x.n + '/' + x.k,
        size: (x) => x.n,
        create: (x) => ({
          // NBSP keeps "20 shared by" and "5 friends" whole, so a narrow phone breaks
          // line 1 between them instead of leaving "friends" alone on its own line.
          display: [x.n + NBSP + 'shared' + NBSP + 'by ' + x.k + NBSP + 'friends', x.n + ' ' + DIVIDE + ' ' + x.k + ' = ?'],
          speech: cnt(x.n, 'counter', 'counters') + ' shared by ' + x.k + ' friends. How many does each friend get?',
          answer: x.n / x.k
        })
      },
      /* ---------- V2 activities (DESIGN 7, 8.1): concrete, number-line, symbolic, word-problem ---------- */

      /* Start with A counters and add B more with +1, then Done (no running total). */
      'add-build': {
        key: (x) => 'add-build:' + x.a + '+' + x.b,
        size: (x) => x.a + x.b,
        create: (x) => ({
          display: ['You have ' + cnt(x.a, 'counter', 'counters') + '.', 'Add ' + x.b + ' more!'],
          speech: 'You have ' + cnt(x.a, 'counter', 'counters') + '. Add ' + x.b + ' more. Tap plus 1 for each counter, then tap Done.',
          answer: x.a + x.b, start: x.a, cap: capFor(x.a, x.a + x.b)
        })
      },

      /* Start with A banded counters and take B away with Undo, then Done. */
      'sub-build': {
        key: (x) => 'sub-build:' + x.a + '-' + x.b,
        size: (x) => x.a,
        create: (x) => ({
          display: ['You have ' + cnt(x.a, 'counter', 'counters') + '.', 'Take ' + x.b + ' away!'],
          speech: 'You have ' + cnt(x.a, 'counter', 'counters') + '. Take ' + x.b + ' away. Tap Undo for each counter, then tap Done.',
          answer: x.a - x.b, start: x.a, cap: capFor(x.a, x.a - x.b)
        })
      },

      /* Start at A on the number line and jump on B. */
      'add-line': {
        key: (x) => 'add-line:' + x.a + '+' + x.b,
        size: (x) => x.a + x.b,
        create: (x) => ({
          display: [plusEq(x.a, x.b)],
          speech: 'Start at ' + x.a + '. Jump on ' + x.b + '. Where do you land?',
          answer: x.a + x.b, start: x.a
        })
      },

      /* Start at A on the number line and jump back B. */
      'sub-line': {
        key: (x) => 'sub-line:' + x.a + '-' + x.b,
        size: (x) => x.a,
        create: (x) => ({
          display: [minusEq(x.a, x.b)],
          speech: 'Start at ' + x.a + '. Jump back ' + x.b + '. Where do you land?',
          answer: x.a - x.b, start: x.a
        })
      },

      /* "A + B = ?" on a plain card: numerals and signs only. */
      'add-sym': {
        key: (x) => 'add-sym:' + x.a + '+' + x.b,
        size: (x) => x.a + x.b,
        create: (x) => ({ display: [plusEq(x.a, x.b)], speech: 'What is ' + x.a + ' plus ' + x.b + '?', answer: x.a + x.b })
      },

      /* "A - B = ?" on a plain card: count back a small B, or count up from B to A. */
      'sub-sym': {
        key: (x) => 'sub-sym:' + x.a + '-' + x.b,
        size: (x) => x.a,
        create: (x) => ({ display: [minusEq(x.a, x.b)], speech: 'What is ' + x.a + ' take away ' + x.b + '?', answer: x.a - x.b })
      },

      /* A short story read aloud: the buddy has A, a friend brings B more. */
      'add-word': {
        key: (x) => 'add-word:' + x.a + '+' + x.b,
        size: (x) => x.a + x.b,
        create(x, ctx) {
          const s = sceneFor(ctx, false);
          const lines = [s.buddy + ' has ' + cnt(x.a, s.unit, s.word) + '.', s.friend + ' brings ' + x.b + ' more.', 'How many now?'];
          return { display: lines, speech: lines.join(' '), answer: x.a + x.b, scene: s };
        }
      },

      /* A short story: take (B of A go in the basket) or diff (A and B: how many more?). */
      'sub-word': {
        key: (x, template) => 'sub-word:' + (template === 'diff' ? 'diff' : 'take') + ':' + x.a + '-' + x.b,
        size: (x) => x.a,
        create(x, ctx) {
          const diff = !!ctx && ctx.template === 'diff';
          const s = sceneFor(ctx, !diff);
          const lines = diff
            ? [s.buddy + ' has ' + cnt(x.a, s.unit, s.word) + '.', s.friend + ' has ' + x.b + '.', 'How many more has ' + s.buddy + '?']
            : [s.buddy + ' has ' + cnt(x.a, s.unit, s.word) + '.', s.buddy + ' puts ' + x.b + ' in the basket.', 'How many are left?'];
          return { display: lines, speech: lines.join(' '), answer: x.a - x.b, scene: s };
        }
      }
    };

    // The band-1 question types (step 9 sub-build A) merge in here; their renderers attach later.
    Object.assign(QUESTION_TYPES, band1.TYPES);
    // The band-2 question types (step 10 sub-build A) merge in here; their renderers attach later.
    Object.assign(QUESTION_TYPES, band2.TYPES);
    // The band-2 multi-digit add/sub types (step 10 sub-build B) merge in here; renderers attach later.
    Object.assign(QUESTION_TYPES, band2b.TYPES);
    // The band-2 multiplication / division types (step 10 sub-build C) merge in here; renderers attach later.
    Object.assign(QUESTION_TYPES, band2c.TYPES);
    // The band-2 fraction types (step 10 sub-build D) merge in here; renderers attach later.
    Object.assign(QUESTION_TYPES, band2d.TYPES);
    // The band-2 negatives / order / missing-number types (step 10 sub-build E) merge in here; renderers attach later.
    Object.assign(QUESTION_TYPES, band2e.TYPES);
    // The band-3 big-number and fact types (step 11 sub-build A) merge in here; renderers attach later.
    Object.assign(QUESTION_TYPES, band3a.TYPES);
    // The band-3 area-model, remainder and long-division types (step 11 sub-build B) merge in here; renderers attach later.
    Object.assign(QUESTION_TYPES, band3b.TYPES);
    // The band-3 fraction types (step 11 sub-build C) merge in here; renderers attach later.
    Object.assign(QUESTION_TYPES, band3c.TYPES);
    // The band-3 decimal types (step 11 sub-build D) merge in here; renderers attach later.
    Object.assign(QUESTION_TYPES, band3d.TYPES);
    Object.assign(QUESTION_TYPES, band3e.TYPES);
    // The band-3 negative-number, order-of-operations and letter types (step 11 sub-build F) merge in here.
    Object.assign(QUESTION_TYPES, band3f.TYPES);

    /* ---------- the learning object interface (DESIGN 8.2) ---------- */
    function checkLevel(id, declared, level) {
      if (!Number.isInteger(level) || level < 1 || level > 4) throw new Error('[NBA] candidates: level must be an integer 1 to 4');
      if (declared.indexOf(level) < 0) throw new Error('[NBA] ' + id + ' does not declare level ' + level);
    }

    ACTIVITIES.forEach((meta) => {
      const T = QUESTION_TYPES[meta.id];
      if (!T) return; // catalog.validate() reports an activity without logic
      Object.assign(T, {
        id: meta.id, conceptId: meta.primaryConcept, inputMode: meta.inputMode, representation: meta.representation,
        operation: meta.operation, answerType: meta.answerType, hintStrategy: meta.hintStrategy,
        difficulties: meta.difficulties.slice(), family: meta.family, adaptive: meta.adaptive, v1: meta.v1,
        templates: meta.templates ? Object.keys(meta.templates) : null
      });
      /** Every valid number set for a declared level; sub-word takes the template (take | diff). */
      T.candidates = function (level, template) {
        checkLevel(meta.id, meta.difficulties, level);
        const famName = meta.templates ? meta.templates[template === 'diff' ? 'diff' : 'take'] : meta.family;
        let list = FAMILIES[famName](DIFFICULTY.families[famName][String(level)]);
        if (famName === 'more' && meta.id !== 'more') list = list.map((x) => ({ a: x.total, b: x.have }));
        const extra = DIFFICULTY.extra[meta.id] && DIFFICULTY.extra[meta.id][String(level)];
        if (extra) list = list.filter((x) => (extra.bMax === undefined || x.b <= extra.bMax) && (!extra.aGteB || x.a >= x.b));
        return list;
      };
      /** The v1 signature: max 10 is level 2, max 20 is level 4. */
      T.candidatesForMax = function (max, template) { return T.candidates(DIFFICULTY.levelByTier[String(tier(max))], template); };
    });

    /** The entry for a type id (with render/afterShow once renderers.js has attached them). */
    function get(id) {
      return Object.prototype.hasOwnProperty.call(QUESTION_TYPES, id) ? QUESTION_TYPES[id] : undefined;
    }
    function ids() { return Object.keys(QUESTION_TYPES); }

    /** Called by child/renderers.js for every id: the one place a lower layer holds UI functions. */
    function attachRenderer(id, fns) {
      const T = get(id);
      if (!T) throw new Error('[NBA] attachRenderer: unknown question type ' + id);
      if (T.render) throw new Error('[NBA] attachRenderer: ' + id + ' already has a renderer');
      if (typeof fns.render !== 'function') throw new Error('[NBA] attachRenderer: ' + id + ' needs render()');
      T.render = fns.render;
      if (fns.afterShow) T.afterShow = fns.afterShow;
    }

    return { get, ids, attachRenderer, tier };
  });
}());
