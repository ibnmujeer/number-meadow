/*
 * placements (L4): the placement check run (step 8; DESIGN 15, R1 to R6). It drives the pure
 * placementEngine over the real stores: it starts a run, builds each question and its attempt record,
 * records every answer through the learning queue (so mastery, growth, review and the write queue
 * behave as always), and ends the session. No saved-data change (P8-1 A): a placement answer is an
 * ordinary attempt (context 'assessment', decisionSource 'assessment'), tagged in the free-form
 * decision object with source 'placement'; the session kind is 'assessment'. DB_VERSION and
 * SCHEMA_VERSION stay 3; schema.js is unchanged.
 *
 *   start(studentId, { band, createdBy })  read the student's earlier placement answers to pick the
 *       form (baseline until a complete baseline placement run exists, then post) and the question ids
 *       to exclude (R4: a later check uses different but matching questions), begin the engine at the
 *       band's start rung and open an 'assessment' session. Resolves { form, startRung, startBand }.
 *   next()               the next question to ask ({ question, rung, n, ... }) or null when the run has
 *                        stopped or no variant can build. The caller shows question.* on the mission screen.
 *   answer(submitted)    the engine steps on the first-try verdict FIRST, then this writes the attempt
 *                        record with the stop verdict and calls learning.recordAttempt. Returns
 *                        { accepted, correct, stop, done, written }. One submission per question.
 *   abandon()            P8-19: an abandoned placement question writes NOTHING (returns null); the run
 *                        is left where it was so the caller may end it.
 *   end()                close the 'assessment' session (child finished or stopped). Resolves the flush.
 *   state()              a copy of the live engine state (tests and the adult summary read it).
 *   summarize()          the live run folded to a summary (placementEngine.summarize over this run's
 *                        attempts), for the adult card and the pre/post comparison.
 * create({ repo, learning, now?, newId?, seedSource? }) makes an independent service (tests).
 */
(function () {
  'use strict';

  NBA.define('placements', ['config', 'util', 'repo', 'placementEngine', 'learningEngine', 'learning'],
    (config, util, appRepo, engine, learningEngine, appLearning) => {
      const copy = (x) => (x === null || x === undefined ? null : JSON.parse(JSON.stringify(x)));
      /** A placement attempt (tagged in its decision object), of any context, written in the new way. */
      const isPlacement = (a) => !!(a && a.decision && a.decision.source === 'placement');

      function create(options) {
        const o = options || {};
        const repo = o.repo || appRepo;
        const learning = o.learning || appLearning;
        const now = typeof o.now === 'function' ? o.now : () => util.now();
        const newId = typeof o.newId === 'function' ? o.newId : (p) => util.newId(p, now());
        const seedSource = typeof o.seedSource === 'function' ? o.seedSource : () => util.newSeed();

        let studentId = null;
        let st = null;          // the live engine state (begin/step), or null before a run
        let used = null;        // Set of question ids to avoid this run (earlier answers + this run)
        let sessionId = null;   // the open 'assessment' session id
        let pending = null;     // the question returned by next() and not yet answered
        let answered = [];      // the attempt records written this run, in order (for summarize)

        /** The student's earlier placement attempts (oldest first). A failed read gives none. */
        async function placementAttempts(id) {
          let all = [];
          try { all = (await repo.getAll('attempts', { index: 'studentId', value: id })) || []; } catch (e) { return []; }
          return all.filter(isPlacement).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0) || (a.id < b.id ? -1 : 1));
        }

        /** baseline until a complete baseline placement run exists, then post (the pairing rule of R4). */
        function formFrom(atts) {
          const baselineDone = atts.some((a) => a.assessmentForm === 'baseline' && a.decision && a.decision.stop);
          return baselineDone ? 'post' : 'baseline';
        }

        async function start(id, opts) {
          const c = opts || {};
          const atts = await placementAttempts(id);
          const form = formFrom(atts);
          used = new Set(atts.map((a) => a.questionId).filter((q) => typeof q === 'string'));
          st = engine.begin({ band: c.band, form: form, now: now() });
          answered = [];
          pending = null;
          studentId = id;
          sessionId = learning.startSession({ studentId: id, kind: 'assessment', assessmentId: null, worldId: null });
          return { form: st.form, startRung: st.startRung, startBand: st.startBand };
        }

        function next(buddyId) {
          if (!st) return null;
          const q = engine.next(st, { seed: seedSource() >>> 0, used: used, buddyId: buddyId || null });
          pending = q;
          return q ? copy(q) : null;
        }

        /** Build the attempt record for one answer, after the engine has stepped (so `stop` is known). */
        function recordFor(q, submitted, stopReason) {
          const outcome = {
            outcome: Number(submitted) === q.question.answer ? 'correct' : 'incorrect',
            submittedAnswers: [Number(submitted)], hintsShown: 0, starEarned: null,
            shownAt: now(), responseMs: null, totalMs: null
          };
          const ctx = {
            id: newId('att'), now: now(), studentId: studentId, sessionId: sessionId, speed: 1,
            context: 'assessment', decisionSource: 'assessment',
            assessmentForm: q.form, assessmentId: null, assessmentCellId: null, worldId: null,
            missionId: 'placement.m' + ((q.n % 8) + 1), missionIndex: Math.min(999, q.n),
            leadConcepts: (q.concepts || []).slice(), mixed: false, transfer: false,
            decision: {
              action: 'placement', source: 'placement', reasonCode: q.reasonCode, form: q.form,
              n: q.n, rung: q.rung, toRung: null, startRung: q.startRung,
              startBand: q.startBand, variant: q.activityId, confidence: config.placement.confidence,
              stop: stopReason || null
            }
          };
          return learningEngine.buildAttempt(q.question, outcome, ctx);
        }

        function answer(submitted) {
          if (!st || !pending) return { accepted: false, reason: 'no_question' };
          const q = pending;
          const correct = Number(submitted) === q.question.answer;
          // the engine steps on the verdict FIRST, so the record carries the resulting stop verdict
          st = engine.step(st, correct);
          const stopReason = engine.stop(st);
          const toRung = st.rung;
          const rec = recordFor(q, submitted, stopReason);
          rec.decision.toRung = toRung; // the rung the staircase moved to after this answer
          answered.push(rec);
          pending = null;
          const written = learning.recordAttempt(rec);
          return { accepted: true, correct: correct, stop: stopReason, done: !!stopReason, written: written };
        }

        /** P8-19: an abandoned placement question writes nothing. The run is left where it was. */
        function abandon() {
          pending = null;
          return null;
        }

        function end() {
          const p = learning.endSession();
          st = null; pending = null; used = null; sessionId = null; studentId = null;
          return p;
        }

        return {
          create, start, next, answer, abandon, end,
          state: () => copy(st),
          sessionId: () => sessionId,
          attempts: () => answered.map(copy),
          summarize: () => (answered.length ? engine.summarize(answered) : null)
        };
      }

      const app = create();
      return Object.assign({ create }, app);
    });
}());
