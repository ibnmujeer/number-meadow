/*
 * config (L2): counter tones, sizes, timings and limits (moved from v1 section 1).
 * Text lines, buddies and worlds are data (app/data/*.js), looked up through catalog.
 */
(function () {
  'use strict';

  NBA.define('config', [], () => {
    /** Stacks change tone (and shape) every 5 counters to make counting easier. Token names (docs/STYLE.md 9). */
    const BAND_CYCLE = ['moss', 'apricot', 'teal', 'plum', 'sand'];
    /** In "groups" questions every group has its own tone. */
    const GROUP_COLOURS = ['moss', 'apricot', 'teal', 'plum', 'sand'];

    const MISSIONS_PER_WORLD = 8;
    /** Missions 1 to 4 use numbers up to 10; missions 5 to 8 use numbers up to 20. */
    const MAX_BY_MISSION = [10, 10, 10, 10, 20, 20, 20, 20];

    /** Every built-in wait, in ms. Short on purpose: 40 missions should take 10 to 15 minutes. */
    const TIMING = {
      SCREEN_FADE: 400,    // screen enter animation (--dur-soft, the CSS .enter rule)
      QUESTION_SPEAK: 300, // read the question aloud this long after it appears
      STORY_SPEAK: 300,    // same for story cards and the win screen
      SPEAK_DEFER: 60,     // gap between speechSynthesis.cancel() and speak()
      NEXT_CARD: 800,      // correct answer -> Next card
      PICK_TO_HOME: 1200,  // buddy picked -> Home, long enough to hear "You picked ..."
      TAKE_START: 250,     // take-away: the counters start to lift (docs/STYLE.md 10)
      TAKE_LIFT: 400,      // lift (--dur-lift)
      TAKE_ARC: 900,       // float to the basket (--dur-float); the first lands at START + LIFT + ARC
      TAKE_STAGGER: 60,    // each next counter starts this much later (--stagger)
      SHAKE: 700,          // not-yet-right sway (--dur-slow, the CSS .sway rule)
      BOUNCE: 700,         // buddy bob after a right answer (--dur-slow)
      INPUT_GUARD: 350     // taps are ignored this long after a new screen or the Next card appears,
                           // so the second tap of a double-tap cannot answer an unseen question
    };
    /** Soft rest reminder after this much play time (counted from the first Play tap). */
    const REST_AFTER_MS = 15 * 60 * 1000;

    /** Picture sizes. u is the counter pitch in px; fitStage() picks u per question. */
    const SIZE = {
      U_MIN: 4,          // px, never smaller (6 until Step 12: eight hundreds, nine tens and nine ones need 5 px at 320 x 568)
      U_MAX_REM: 2.2,    // rem, never bigger
      FIT_SAFETY: 0.97,  // leave a little room around the picture
      FACE_GAP: 8,       // px between buddy faces in "share"
      FACE_MIN: 40,      // px
      FACE_MAX_REM: 4,   // rem
      BASKET_W: 3.2,     // u: the take-away basket (1.6 by 1.1 counter cells)
      BASKET_H: 2.2,     // u
      TAKE_HEAD: 1.0,    // u of headroom above the stack for the lift and the arc
      TAKE_GAP: 1.5,     // u between the stack and the basket
      LOAD_SCALE: 0.4,   // a landed counter is drawn at this scale
      TAKE_LIFT_U: 0.5,  // u: the lift
      TAKE_ARC_U: 0.3    // u: the apex above the higher of the lifted start and the slot
    };
    const COL_ROWS = 10;       // stacks taller than 10 counters split into columns of 10
    const BUILD_EXTRA = 5;     // "build" lets the stack grow to N + 5
    const SHARE_ROW = 5;       // "share" counters are laid out in rows of 5
    const SHARE_FACE_GAP = 12; // px between the treasure pile and the buddy faces

    /** The v1 save key. V2 only reads it (migrations.migrateV1); it never writes or deletes it. */
    const STORAGE_KEY = 'ninjaBrickAcademy.v1';
    const SAVE_VERSION = 1;
    /** The v2 lightweight preferences key (sound, last buddy, last student). */
    const PREFS_KEY = 'ninjaBrickAcademy.v2.prefs';
    const PREFS_VERSION = 2;

    /** Boot: a plain "Loading..." line appears if storage takes longer than this. */
    const boot = { slowMs: 1500 };
    /** Storage limits (DESIGN 9.4, 9.5). */
    const storage = {
      openTimeoutMs: 3000, // IndexedDB open (also the wait for a blocked upgrade)
      retryMax: 500,       // failed writes kept for retry; beyond this the oldest are dropped and counted
      degradedAfter: 3     // consecutive failed writes before repo.state becomes 'degraded'
    };

    /** Attempt records (DESIGN 11): longer response times are stored as null; recent question ids kept. */
    const attempt = { maxResponseMs: 600000, recentLimit: 200 };
    /**
     * Error observations and patterns (DESIGN 13.1, 13.2). A wrong first answer faster than quickMs at
     * real speed is quick-wrong. Pattern thresholds count attempts in the recent window (the two
     * cross-representation labels use all attempts per representation). Product heuristics only.
     */
    const error = {
      quickMs: 1200,
      distance: { possible: 2, observed: 3 },                      // counting, calculation, place-value
      wrongWay: { possible: 2, observed: 3 },                      // built-wrong-way attempts
      result: { possible: 2, possibleShare: 0.5, observed: 4, observedShare: 0.75 }, // result-* of offered-*
      guessing: { possible: 2, observed: 3, observedShare: 0.3 },
      hintDependence: { possibleMin: 6, observedMin: 8, firstAccuracyMax: 0.5, solvedShare: 0.8 },
      wordProblem: { wordMax: 0.5, otherMin: 0.8, possibleMin: 3, observedMin: 5 },
      transition: { symbolicMin: 0.8, otherMax: 0.5, possibleMin: 3, observedMin: 5 }
    };

    /** Mastery levels (DESIGN 12.1): simple rules on recent answers, not scientific measures. */
    const mastery = {
      recentWindow: 10,
      minAttemptsForLevel: 3,
      strong: {
        recentAccuracy: 0.85, minAttempts: 5, firstAttemptAccuracy: 0.70, firstAttemptScope: 'recent',
        nonSymbolicEvidence: { minAttempts: 2, firstAttemptAccuracy: 0.70 }
      },
      developing: { recentAccuracyMin: 0.60 },
      needsSupport: { recentAccuracyBelow: 0.60, repeatedPatternTriggers: true },
      // design hypothesis (also used for the adult report's trend and hint reliance)
      trend: { minRecent: 6, delta: 0.15 },
      hintDependence: { some: 0.30, high: 0.50 },
      confidence: { low: 3, medium: 5, high: 10 },
      includeContexts: ['play', 'assignment', 'assessment'],
      // step 7 (round 1 reviewer input Q8, confirmed by a human reviewer as reported by the owner): the teen numbers stay
      // "Practising" longer, so Growing needs 10 answers instead of 5. The 10 is a design hypothesis with no source.
      // Keys of a skill's entry replace the same keys of the general thresholds above (see masteryEngine.evaluate).
      perConcept: { 'place.teen-numbers': { strong: { minAttempts: 10 } } }
    };

    /**
     * Spaced review (step 5). Every number here is a design hypothesis: the intervals and the 30 percent cap
     * are the project owner's numbers with no source. intervals = days to the next review after each step
     * (step 0 = 1 day ... step 5 = 60 days); share x baseSlots = the most review questions in one run
     * (floor(0.3 x 8) = 2, which is 25 percent); plan = the 1-based run positions used for 1 and for 2 review
     * questions (never position 1 or the last position); excluded = concepts that never get a review question
     * (rep.transition has no question of its own).
     */
    const review = {
      intervals: [1, 3, 7, 14, 30, 60], share: 0.3, baseSlots: 8,
      firstPosition: 2, lastPosition: 6, plan: [[], [4], [3, 6]],
      excluded: ['rep.transition']
    };
    /**
     * The prerequisite graph (step 7). Every value is a design hypothesis, none has a source. weakLevels = the
     * mastery levels that make an earlier skill "weak" (an unseen skill is not weak); openLevels = the levels at
     * which an earlier skill counts as met for the next-skill choice; maxDepth = how far a step-back walks
     * along the earlier skills (a guard against bad data).
     */
    const prereq = { maxDepth: 8, weakLevels: ['needs_support'], openLevels: ['developing', 'strong'] };
    /** Adaptive rules (DESIGN 14.6). enabled is the default of learning.isAdaptive(); test mode can turn it off. */
    const adaptive = {
      enabled: true,
      struggleRun: 2, successRun: 4, successFirstAccuracy: 0.8, minAttemptsAtLevel: 3, cooldownAttempts: 2,
      minLevel: 1, maxLevel: 4,
      maxSameActivityRun: 2, recentQuestionWindow: 20,
      transfer: { symbolicMin: 0.8, symbolicMinAttempts: 3, otherMax: 0.6, otherMinAttempts: 2 },
      concretenessOrder: ['concrete', 'shape-fraction', 'dot-pattern', 'dice-pattern', 'ten-frame', 'number-bond', 'array', 'area-model', 'hundred-grid', 'base-ten-blocks', 'place-value-chart', 'fraction-bar', 'vertical-number-line', 'visual', 'number-line', 'symbolic']
    };

    /**
     * Free Play (Free Play F1). EVERY number here is a design hypothesis with no source (the owner approved them as defaults).
     * Level control per category: warmUpAnswers = the first answers in a category where a step up needs only warmStepUpRun
     * first-try successes in a row; after that a change needs minGap answers since the last change and comfortMin answers in
     * the window; the window (comfortWindow answers) above upAbove goes one level up, below downBelow one level down (exactly
     * at a threshold stays). mistakeRun first-try mistakes in a row step down once (no gap needed); at the lowest level only a
     * guided example and a change of way happen, at most once per lowStepGap answers. noRepeat = the no-repeat window in
     * questions per activity (a smaller pool repeats the oldest). reviewEvery = at most one due review question in this many.
     * newKindShare = how often "Include new kinds" brings in an easy question of an unplayed category. pauseEvery = answers
     * between pause cards; stretchEveryMin = active minutes between stretch cards. time = active-time rules (section 4.2 of
     * the investigation): thinking and lead-in count at most touchMs per answer, a gap up to periodGapMs keeps the period
     * going, a longer gap ends it and is not counted.
     */
    const freeplay = {
      warmUpAnswers: 6, warmStepUpRun: 2, minGap: 6, comfortWindow: 12, comfortMin: 6, upAbove: 0.85, downBelow: 0.75,
      mistakeRun: 3, lowStepGap: 12, noRepeat: 20, reviewEvery: 4, newKindShare: 0.25, pauseEvery: 10, stretchEveryMin: 20,
      approvalMin: 15, // G2: one adult approval after the daily limit allows this many more minutes (memory only, a reload asks again)
      time: { touchMs: 60000, periodGapMs: 120000 }
    };

    /**
     * The Meadow Check (DESIGN 15): one blueprint for both forms, a fixed length (the blueprint's 12
     * cells) and no time cut-off; targetMinutes is the intended length, checked by the pacing test.
     */
    const assessment = { blueprintId: 'ninja-check.v1', targetMinutes: 5, forms: ['baseline', 'post'] };

    /**
     * The placement check (step 8). EVERY number here is a design hypothesis with no source (the owner approved
     * them as defaults); an adult reviewer may tune them. The ladder itself (rungs, variants, adult words) is data
     * (app/data/placement.js). minRung/maxRung clamp the staircase to the built ladder; the engine never reads
     * the ladder length, so these two must match data/placement.js.
     *   stepFirst / stepAfter  the staircase moves 2 rungs until the first reversal, then 1 rung (design hypothesis)
     *   minAnswers / maxAnswers  R1 "between 12 and 20": settle no sooner than 12 answers, stop hard at 20 (design hypothesis)
     *   stableWindow / stableSpread  settled when the last 6 answered rungs sit within 1 rung of each other (design hypothesis)
     *   stableReversals  and at least 3 direction changes have happened, so the path really turned (design hypothesis)
     *   ceilingRun  OR the last 4 answers were all correct at the top rung (a strong child hits the ceiling of built content) (design hypothesis)
     *   floorMisses  end kindly after this many first-try misses in a row, all at rung 1 (P8-8 default A); 0 turns the floor off (design hypothesis)
     *   startRung  the start rung per age band, and the kind start when the band is unknown (design hypothesis; also in data/placement.js)
     *   confidence  every placement answer is tagged low confidence so a few real answers overrule it (R3)
     */
    const placement = {
      minRung: 1, maxRung: 32,             // step 11 sub-build G: eight band-3 rungs added at the hard end (design hypothesis; step 10 added band-2 rungs 17-24, step 9 band-1 rungs 1-4)
      stepFirst: 2, stepAfter: 1,          // design hypothesis
      minAnswers: 12, maxAnswers: 20,      // design hypothesis (R1 "between 12 and 20"; NOT raised for the taller ladder, so an always-right child hits the top by 'cap', D11-4)
      stableWindow: 6, stableSpread: 1, stableReversals: 3, // design hypothesis
      ceilingRun: 4,                       // design hypothesis
      floorMisses: 3,                      // design hypothesis (P8-8 default A; 0 = off)
      startRung: { '4-6': 1, '7-9': 17, '10-12': 17, unknown: 1 }, // design hypothesis (step 11: 10-12 rises to the first band-2 rung 17 so band-2 content comes first and the child climbs into the band-3 rungs; 4-6 and 7-9 unchanged)
      confidence: 'low'
    };

    /**
     * Import (DESIGN 18.4, P7): the largest file read, the most records accepted in one file, how many
     * validation problems the rejection lists and how many conflicts the plan summary shows.
     */
    const dataImport = { maxBytes: 20 * 1024 * 1024, maxRecords: 250000, problemsShown: 50, conflictsShown: 20 };

    /**
     * The Grown-ups area and the TXT report (step 3). The daily limit is a soft reminder only (brief D-B);
     * 0 means Off and a child without the setting gets defaultLimitMin (FP-1/FP-2).
     */
    const adults = {
      reportFormatVersion: '4', // step 5: REVIEW added (2); Free Play: FREE PLAY added (3); step 8: the CHECKS section now shows placement checks (4)
      limitChoices: [0, 15, 20, 30, 45, 60], defaultLimitMin: 30,
      waysMinSample: 5,     // design hypothesis: answers per compared way before a "works best" way is named
      smallSampleTotal: 20, // design hypothesis: fewer answers in all -> a DATA NOTES warning
      smallSampleSkill: 5,  // design hypothesis: fewer answers on a skill -> a DATA NOTES line
      sessionCapMin: 90,    // design hypothesis: one session never counts more than this many minutes
      // design hypothesis: the words that lead a first-try share (the lowest bound that the share reaches wins)
      accuracyWords: [[0.85, 'Almost all first tries right'], [0.6, 'Most first tries right'],
        [0.4, 'About half of first tries right'], [0.0001, 'A few first tries right'], [0, 'No first tries right yet']],
      // the gate: hold time, PIN length and wait (brief O2), the forgotten-PIN sum (D-D), PBKDF2 (O3)
      gate: { holdMs: 2000, pinLength: 4, pinTries: 3, pinWaitMs: 30000, sumMin: 21, sumMax: 59, sumTries: 3,
        pbkdf2Iterations: 150000, saltBytes: 16 },
      revokeDelayMs: 1500   // O13: the download URL is revoked after at least 1 s
    };

    return {
      BAND_CYCLE, GROUP_COLOURS, MISSIONS_PER_WORLD, MAX_BY_MISSION, TIMING, REST_AFTER_MS,
      SIZE, COL_ROWS, BUILD_EXTRA, SHARE_ROW, SHARE_FACE_GAP, STORAGE_KEY, SAVE_VERSION,
      PREFS_KEY, PREFS_VERSION, boot, storage, attempt, error, mastery, review, prereq, adaptive, freeplay, assessment,
      placement, import: dataImport, adults
    };
  });
}());
