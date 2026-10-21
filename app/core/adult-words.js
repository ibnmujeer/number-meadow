/*
 * adultWords (L2): the plain words of the Grown-ups area and the TXT report (brief O8, O11). Pure maps and
 * small functions; no DOM, no clock, no randomness. Every word an adult reads for a stored code comes from here.
 *   LEVEL_WORDS / levelWord(level)        the four level words (brief D-A, exactly)
 *   conceptWord(id), repWord(id)          a plain skill name and a way of showing ("counters", not ids)
 *   PATTERN_WORDS, statusWord(status)     error patterns (errorEngine.LABELS) and their status
 *   trendWord(trend), hintWord(band)      masteryEngine metrics.recentTrend and metrics.hintBand
 *   accuracyWord(ratio, cfg?)             words for a first-try share (config.adults.accuracyWords)
 *   NEXT_ACTIONS, NEXT_REASONS, nextStepText(decision)   what the app plans next and why (a move to another skill names it); an unmapped code
 *                                         prints "(no plain words yet: <code>)"
 *   glossary(cfg?)                        [term, one line] for every term the report can use
 *   freePlayLines(label, window), freePlayCategory(row)   the Free Play lines of the child page and the Free Play page (F4)
 * Rules: plain words, no percentages, never the word for "not right" that children never hear.
 */
(function () {
  'use strict';

  NBA.define('adultWords', ['config', 'catalog', 'errorEngine'], (config, catalog, errorEngine) => {
    const own = (m, k) => typeof k === 'string' && Object.prototype.hasOwnProperty.call(m, k);
    const EPS = 1e-9;

    const LEVEL_WORDS = { strong: 'Growing', developing: 'Practising', needs_support: 'Needs a gentler step',
      insufficient_data: 'Not enough data yet' };
    const NOT_ENOUGH = LEVEL_WORDS.insufficient_data;
    const levelWord = (level) => (own(LEVEL_WORDS, level) ? LEVEL_WORDS[level] : NOT_ENOUGH);

    const CONCEPT_WORDS = {
      'add.combine': 'Adding two groups', 'add.count-on': 'Counting on to add', 'add.within-10': 'Adding within 10',
      'add.within-20': 'Adding within 20', 'sub.take-away': 'Taking away', 'sub.difference': 'Finding the difference',
      'sub.within-10': 'Taking away within 10', 'sub.within-20': 'Taking away within 20',
      'addsub.mixed': 'Mixed adding and taking away', 'rep.transition': 'Moving between counters, pictures and numbers',
      'num.count': 'Counting a group', 'num.compare': 'Comparing two groups', 'mul.groups': 'Equal groups',
      'div.share': 'Fair sharing',
      'count.rote-20': 'Saying the number words to 20', 'count.back-20': 'Counting back from 20',
      'count.rote-100': 'Counting to 100 by ones', 'count.tens-100': 'Counting to 100 by tens',
      'sense.numerals-10': 'Numerals 0 to 10', 'sense.match-sort': 'Matching and sorting groups',
      'sense.subitize-3': 'Seeing 1, 2 or 3 without counting',
      'sense.subitize-5': 'Seeing up to 5 without counting (dot and dice patterns)',
      'sense.part-whole-10': 'A number made of two parts (to 10)',
      'sense.ten-frame': 'Reading, filling and comparing a ten-frame',
      'sense.line-10': 'Numbers 0 to 10 on a number line',
      'sense.even-odd': 'Even and odd numbers',
      'add.make-5': 'Pairs that make 5', 'add.make-10': 'Pairs that make 10',
      'place.teen-numbers': 'Teen numbers as a ten and some ones',
      'frac.halves-quarters': 'Halves and quarters',
      'count.skip-2-5-10': 'Skip counting by 2s, 5s and 10s',
      'place.two-digit': 'Tens and ones (to 99)',
      'place.regroup': 'Trading ten ones for one ten',
      'place.hundreds': 'Hundreds, tens and ones (to 999)',
      'place.compare-order': 'Comparing and ordering numbers to 1000',
      'place.round': 'Rounding to the nearest 10 and 100',
      'count.to-1000': 'Counting to 1000 by ones, tens and hundreds',
      'add.facts-20': 'Addition facts to 20 (doubles, make ten)',
      'add.two-digit': 'Adding two-digit numbers without regrouping',
      'add.two-digit-regroup': 'Adding two-digit numbers with regrouping',
      'add.three-digit': 'Adding three-digit numbers',
      'sub.facts-20': 'Taking-away facts to 20 and their link to adding',
      'sub.two-digit': 'Taking away two-digit numbers without regrouping',
      'sub.two-digit-regroup': 'Taking away two-digit numbers with regrouping',
      'sub.three-digit': 'Taking away three-digit numbers',
      'sub.stories-two-step': 'Two-step adding and taking-away stories',
      'mul.arrays': 'Rows and columns, and adding the same number again',
      'mul.facts-2-5-10': 'Times tables for 2, 5 and 10',
      'mul.facts-3-4': 'Times tables for 3 and 4',
      'div.group': 'Dividing by making equal groups (how many groups?)',
      'div.inverse': 'Dividing as the opposite of multiplying',
      'frac.unit': 'Equal parts: thirds, fifths and other unit fractions',
      'frac.non-unit': 'Fractions like 3 out of 4',
      'frac.on-line': 'Fractions on a number line',
      'frac.compare-wall': 'Comparing fractions with a fraction wall; fractions equal to a half',
      'neg.meaning': 'Numbers below zero',
      'ops.left-to-right': 'Doing several steps in order',
      'unk.missing-number': 'The missing number in 3 + ? = 7',
      'unk.equals-balance': 'The equals sign as a balance',
      'unk.missing-mul-div': 'The missing number in times and sharing sums',
      'place.large': 'Numbers up to a million',
      'mul.facts-6-9': 'Times tables for 6 to 9',
      'add.large': 'Adding larger numbers (up to 6 digits)',
      'sub.large': 'Taking away larger numbers (up to 6 digits)',
      'div.facts': 'Division facts',
      'mul.factors-multiples': 'Factors and multiples',
      'mul.two-by-one': 'Multiplying a larger number by one digit (area model, then symbols)',
      'mul.two-by-two': 'Multiplying by a two-digit number (area model, then symbols)',
      'div.remainder': 'Dividing with a remainder',
      'div.multi-digit': 'Dividing larger numbers by one digit',
      'div.long': 'Dividing by a two-digit number (long division)',
      'frac.equivalent-compare': 'Equivalent fractions and comparing fractions',
      'frac.of-amount': 'A fraction of a number (1/4 of 12)',
      'frac.add-same': 'Adding and taking away fractions with the same bottom number',
      'frac.add-unlike': 'Adding and taking away fractions with different bottom numbers',
      'frac.multiply': 'Multiplying fractions',
      'dec.tenths': 'Tenths as decimals',
      'dec.hundredths': 'Hundredths and decimals with two places',
      'dec.compare-order': 'Comparing and ordering decimals',
      'dec.add-sub': 'Adding and taking away decimals',
      'dec.multiply-divide': 'Multiplying and dividing decimals',
      'pct.meaning': 'Percent as parts of 100',
      'pct.benchmarks': 'Common percents: half, quarter and tenth',
      'pct.fraction-decimal-link': 'Moving between fractions, decimals and percents',
      'pct.of-amount': 'Finding a percent of an amount',
      'neg.compare-order': 'Comparing and ordering negative numbers',
      'neg.add-sub': 'Adding and taking away with negative numbers',
      'ops.brackets': 'Brackets',
      'ops.mul-before-add': 'Multiplying and dividing before adding and taking away',
      'unk.letter': 'A letter standing for a number'
    };
    function conceptWord(id) {
      if (own(CONCEPT_WORDS, id)) return CONCEPT_WORDS[id];
      const c = catalog.conceptById(id);
      return c ? c.name : String(id);
    }

    const REP_WORDS = { concrete: 'counters', 'vertical-number-line': 'a number line standing up', 'shape-fraction': 'shapes in equal parts', 'dot-pattern': 'dot patterns', 'dice-pattern': 'dice patterns', 'fraction-bar': 'fraction bars',
      'ten-frame': 'ten-frame', 'number-bond': 'number bond', array: 'rows and columns', 'area-model': 'area model',
      'hundred-grid': 'hundred grid', 'base-ten-blocks': 'base-ten pieces', 'place-value-chart': 'place value chart',
      visual: 'pictures', 'number-line': 'number line', symbolic: 'symbols', 'word-problem': 'story' };
    const repWord = (id) => (own(REP_WORDS, id) ? REP_WORDS[id] : String(id));

    const PATTERN_WORDS = {
      counting: 'Counting slips (one or two out)',
      calculation: 'Adding or taking away slips (a few out)',
      'place-value': 'Mixing up tens and ones',
      'operation-misunderstanding': 'Adds when it should take away, or the other way round',
      guessing: 'Answers before working it out',
      'hint-dependence': 'Often right only after a hint',
      'word-problem-comprehension': 'Stories are harder than the same sums shown other ways',
      'representation-transition': 'Symbols go well, but counters, pictures or the number line are harder'
    };
    const patternWord = (label) => (own(PATTERN_WORDS, label) ? PATTERN_WORDS[label] : '(no plain words yet: ' + label + ')');
    const STATUS_WORDS = { possible: 'Maybe', observed: 'Seen several times' };
    const statusWord = (s) => (own(STATUS_WORDS, s) ? STATUS_WORDS[s] : String(s));

    const TREND_WORDS = { improving: 'Getting better', steady: 'Steady', declining: 'Harder lately', unknown: NOT_ENOUGH };
    const trendWord = (t) => (own(TREND_WORDS, t) ? TREND_WORDS[t] : NOT_ENOUGH);
    const HINT_WORDS = { low: 'Rarely needs hints', some: 'Sometimes uses hints', high: 'Often uses hints' };
    const hintWord = (band) => (own(HINT_WORDS, band) ? HINT_WORDS[band] : NOT_ENOUGH);

    /** The first row of cfg.accuracyWords whose bound the share reaches; no share: "Not enough data yet". */
    function accuracyWord(ratio, cfg) {
      const rows = (cfg || config.adults).accuracyWords;
      if (typeof ratio !== 'number' || !Number.isFinite(ratio)) return NOT_ENOUGH;
      const row = rows.find((r) => ratio >= r[0] - EPS);
      return row ? row[1] : rows[rows.length - 1][1];
    }

    /** Every action code the engines can store in a decision (adaptiveEngine, learningEngine, masteryEngine). */
    const NEXT_ACTIONS = {
      gather_more_practice: 'Keeps practising to gather more answers',
      step_down: 'Gives a gentler step',
      continue: 'Keeps practising at this step',
      step_up: 'Moves on to harder questions',
      next_concept: 'Moves on to the next skill',
      step_back: 'Goes back to an earlier skill',
      introduce_transfer: 'Tries another way of showing',
      v1_default: 'Uses the usual question for this part of the meadow',
      change_representation: 'Changes the way of showing',
      more_concrete: 'Shows it in a more hands-on way',
      reduce_difficulty: 'Gives easier questions',
      maintain: 'Keeps the same level',
      increase_difficulty: 'Gives slightly harder questions',
      less_concrete: 'Moves towards numbers and symbols',
      concept_default: 'Uses the starting question for this skill',
      adaptive: 'Follows its own plan for this skill'
    };
    /** Every reason code (repeated_pattern_<label> and repeated_pattern:<label> go through PATTERN_WORDS). */
    const NEXT_REASONS = {
      insufficient_attempts: 'There are only a few answers so far',
      no_data: 'There are no answers for this skill yet',
      invalid_input: 'The saved data could not be read, so the usual question is used',
      adaptive_off: 'Changing the questions is switched off',
      recent_low_accuracy: 'Many recent answers were not right on the first try',
      consecutive_incorrect: 'The last few answers were not right on the first try',
      cooldown_active: 'The level changed a moment ago, so it waits before changing again',
      at_easiest_level: 'It is already at the easiest level',
      symbolic_strong_transfer_weak: 'Symbols go well, but other ways of showing are harder',
      solved_after_hint_pattern: 'Answers are often right only after a hint',
      consistent_success: 'Answers are right on the first try again and again',
      consistent_success_max_difficulty: 'Answers are right at the hardest level',
      success_building_evidence: 'Answers go well; a few more are needed before a change',
      concept_strong: 'This skill is Growing',
      concept_strong_max: 'This skill is Growing at the hardest level, in more than one way of showing',
      concept_strong_narrow: 'This skill is Growing, but mostly in one way of showing',
      developing_continue: 'This skill is still Practising',
      strong_symbolic_only: 'Answers go well with symbols only',
      recent_mid_accuracy: 'Some recent answers were right on the first try, some were not',
      strong_needs_more_attempts: 'Answers go well, but there are still only a few',
      strong_first_attempt_low: 'Many answers needed a second try',
      strong_all_rules_met: 'Every rule for Growing is met',
      prereq_weak: 'An earlier skill that this one builds on still needs a gentler step',
      prereq_chain_weak: 'Several earlier skills are still hard, so it starts with the first one they build on',
      next_skill_ready: 'This skill is Growing and the skills it builds on are Practising or better, so the next skill is open',
      lead_in_first: 'A gentler first step comes before this skill'
    };
    const NO_WORDS = (code) => '(no plain words yet: ' + code + ')';
    const PATTERN_CODES = {};
    errorEngine.LABELS.forEach((l) => { PATTERN_CODES[l.replace(/-/g, '_')] = l; });

    /** Plain words for one action code. */
    function actionText(code) { return own(NEXT_ACTIONS, code) ? NEXT_ACTIONS[code] : NO_WORDS(code); }
    /** Plain words for one reason code, with the repeated-pattern codes expanded. */
    function reasonText(code) {
      const c = String(code);
      if (own(NEXT_REASONS, c)) return NEXT_REASONS[c];
      const m = /^repeated_pattern[_:](.+)$/.exec(c);
      if (m) {
        const label = own(PATTERN_CODES, m[1]) ? PATTERN_CODES[m[1]] : m[1];
        if (own(PATTERN_WORDS, label)) return 'A pattern was seen several times: ' + PATTERN_WORDS[label];
        if (label === 'pattern') return 'A pattern was seen several times';
      }
      return NO_WORDS(c);
    }

    /** "<action> (level 2, counters). Why: <reason>." A +variety suffix adds "and mixes the way of showing". */
    function nextStepText(decision) {
      const d = decision && typeof decision === 'object' ? decision : {};
      let reason = String(d.reasonCode || 'no_data');
      const variety = /\+variety$/.test(reason);
      reason = reason.replace(/\+variety$/, '');
      const detail = [];
      if (typeof d.toDifficulty === 'number') detail.push('level ' + d.toDifficulty);
      if (typeof d.representation === 'string') detail.push(repWord(d.representation));
      // step 7: a move to another skill names that skill (stepBackTo, nextConceptId); older rows have neither
      const to = typeof d.stepBackTo === 'string' ? d.stepBackTo : (typeof d.nextConceptId === 'string' ? d.nextConceptId : '');
      return actionText(String(d.action || 'adaptive')) + (to ? ': ' + conceptWord(to) : '') + (variety ? ' and mixes the way of showing' : '') +
        (detail.length ? ' (' + detail.join(', ') + ')' : '') + '. Why: ' + reasonText(reason) + '.';
    }

    /** [term, one line] for every term the report uses, in reading order; numbers come from config. */
    function glossary(cfg) {
      const c = cfg || config;
      const m = c.mastery, a = c.adults, f = c.freeplay || config.freeplay;
      const pts = Math.round(m.trend.delta * 100), some = Math.round(m.hintDependence.some * 100), high = Math.round(m.hintDependence.high * 100);
      return [
        ['Growing', 'Most recent answers on this skill are right, also when shown in more than one way.'],
        ['Practising', 'Some recent answers are right; the child is still learning this skill.'],
        ['Needs a gentler step', 'Many recent answers were not right on the first try, so the app makes it easier.'],
        ['Not enough data yet', 'Too few answers to say anything.'],
        ['Attempt', 'One question the child answered.'],
        ['Session', 'One stretch of play, from the first question to leaving or finishing.'],
        ['First-try accuracy', 'How many questions were right on the first try, out of all questions.'],
        ['Recent accuracy', 'The same, for the last ' + m.recentWindow + ' questions on this skill.'],
        ['Trend', 'Compares the older and newer half of the last ' + m.recentWindow + ' answers (at least ' + m.trend.minRecent +
          ' needed); a change of ' + pts + ' in 100 or more is Getting better or Harder lately (design hypothesis).'],
        ['Hint reliance', 'How often a hint was shown: under ' + some + ' in 100 is Rarely, ' + some + ' to ' + (high - 1) +
          ' in 100 is Sometimes, ' + high + ' in 100 or more is Often (design hypothesis).'],
        ['Way of showing', 'How a question is shown: counters, pictures, number line, symbols or a story.'],
        ['Counters', 'The child builds the answer with counters.'],
        ['Pictures', 'The child counts a picture of counters.'],
        ['Number line', 'The child follows jumps along a line of numbers.'],
        ['Symbols', 'Only numbers and signs, such as 3 + 4.'],
        ['Story', 'A short story read aloud, with a question.'],
        ['Works best', 'The way with the most first tries right, named only when at least two ways each have ' +
          a.waysMinSample + ' or more answers (design hypothesis).'],
        ['Pattern', 'The same kind of slip seen more than once in recent answers. It is a guess, not a judgement.'],
        ['Maybe', 'A pattern seen a couple of times.'],
        ['Seen several times', 'A pattern seen often enough to plan for it.'],
        ['Meadow Check', 'A short, playful set of questions with no hints that gets gently harder or easier, used to see where the child is (design hypothesis).'],
        ['First check', 'The first Meadow Check (baseline).'],
        ['Later check', 'A Meadow Check after some play (post), to see how things have moved.'],
        ['Settled around', 'The step the questions settled near by the end of the check. It is a first guess.'],
        ['First guess', 'A starting estimate from a short check. A few real answers in play soon update it.'],
        ['Level', 'How hard a question is, from 1 (easiest) to 4.'],
        ['Due for review', 'A skill the child did well comes back for a short look after ' + c.review.intervals.join(', ') + ' days, one waiting time after another (design hypothesis, not research). It is due when its day has come.'],
        ['Review step', 'Which of the waiting times a skill is on. A first-try right answer moves it one step later; any other answer moves it one step earlier.'],
        ['Going back a step', 'When a skill is hard and an earlier skill it builds on still Needs a gentler step, the app practises that earlier skill first. The rule is a design hypothesis, not research.'],
        ['Next skill', 'When a skill is Growing at the hardest level, the app can offer the next skill whose earlier skills are Practising or better. The rule is a design hypothesis, not research.'],
        ['Minutes', 'Play time from the start and end of each session, each session counted up to ' + a.sessionCapMin + ' minutes.'],
        ['Free Play', 'Play the child starts with Just play and a category, with no tasks. Its answers are saved like any other answers and also counted here. It stops at the daily limit until a grown-up allows more.'],
        ['Active minutes', 'Time worked out from the answers: up to ' + Math.round(f.time.touchMs / 1000) + ' seconds of thinking for each try, plus the time to the next question. A gap of more than ' +
          Math.round(f.time.periodGapMs / 60000) + ' minutes is not counted. It is an estimate (design hypothesis).'],
        ['Difficulty steps', 'How hard a question is, from 1 (easiest) to 4. Difficulty steps visited counts the different steps asked in Free Play, not counting review questions.'],
        ['Step-down', 'In Free Play, ' + f.mistakeRun + ' first tries in a row not right show one worked example at a gentler step. The count is how often this happened (design hypothesis).']
      ];
    }

    const unit = (n, one, many) => n + ' ' + (n === 1 ? one : many);
    /** Free Play F4: two lines, Free Play and guided play side by side for one window (adultSummary freePlayBlock). */
    function freePlayLines(label, w) {
      const line = (name, x) => name + ', ' + label + ': ' + unit(x.minutes, 'minute', 'minutes') + ', ' + unit(x.problems, 'problem', 'problems') + '.';
      return [line('Free Play', w.freePlay), line('Guided play', w.guided)];
    }
    /** Free Play F4: one category row in words (its first-try share leads, no percentage). */
    function freePlayCategory(c) {
      return c.label + ': ' + unit(c.minutes, 'minute', 'minutes') + ', ' + unit(c.problems, 'problem', 'problems') + '. ' +
        accuracyWord(c.share) + '. Difficulty steps visited: ' + c.steps + '. Step-down: ' + unit(c.stepDowns, 'time', 'times') + '.';
    }

    return {
      freePlayLines, freePlayCategory,
      LEVEL_WORDS, CONCEPT_WORDS, REP_WORDS, PATTERN_WORDS, STATUS_WORDS, TREND_WORDS, HINT_WORDS, NEXT_ACTIONS, NEXT_REASONS,
      levelWord, conceptWord, repWord, patternWord, statusWord, trendWord, hintWord, accuracyWord, actionText, reasonText,
      nextStepText, glossary, NOT_ENOUGH
    };
  });
}());
