/*
 * learning (L4): the per-student cache, sessions, attempt recording and the write queue
 * (DESIGN 9.5, 11, 16.5, N17). P4 adds mastery, recommendations and slot decisions here.
 *
 *   loadStudent(studentId)     fills the cache: the student's 5 worldProgress records and the
 *                              question ids of their newest config.attempt.recentLimit attempts
 *   worldRecord(worldId)       { best, done } for the loaded student (synchronous)
 *   applyUnsaved(sid, worlds)  show values for this session without writing them (P2-M1)
 *   saveWorldResult(studentId, worldId, { stars, done })
 *                              applied to the cache at once (best = max, done = or), then written
 *                              through the retry queue; the child flow never waits for storage
 *   startSession({ studentId, kind, worldId?, assignmentId?, assessmentId? }) -> session id
 *                              (the first question of a run; written through the queue)
 *   endSession()               endedAt and attemptCount (World Complete, Home, change of student,
 *                              pagehide); a session left open by a closed tab keeps endedAt null
 *   recordAttempt(rec)         P4 (DESIGN 14.5): updates the cached mastery snapshot of every credited
 *                              concept, remembers the question id, refreshes the recommendations it
 *                              affects, then writes attempt (add), mastery, recommendations and the
 *                              session (put) in one batch through the queue
 *   loadStudent also caches mastery snapshots and recommendations;
 *   decideSlotFor(run, i) decides a world slot from that cache only (learningEngine.decideSlot);
 *   recentExclude(activityId), isAdaptive()/setAdaptive(bool) (N6), lastDecisions() (test hook).
 *   recordAttempt(rec, extraOps?)  P5: extra batch ops (a Meadow Check answer's run put) join the batch
 *   openChecks(), openCheck(runId), noteCheck(run), baselineDone()  R3 (P5): the student's open Meadow
 *                              Check runs from the assessments studentId index (cancelled runs never)
 *   flush()                    retry queued writes (main.js: visibilitychange hidden and pagehide)
 *   setReviewHook(h)           step 5: h.load(id, levels) seeds the review list at load, h.attempt(rec, levels) returns the schedule
 *                              records that join the answer's batch, h.reset() (services/review-service.js)
 *
 * The retry queue lives in services/write-queue.js (built here with config.storage.retryMax). It keeps at
 * most that many items (the oldest are dropped and counted); a newer write for the same key replaces a
 * queued older one; writes run one at a time in order; a record the schema refuses is dropped with one
 * console.error; an attempt already stored (ConstraintError on retry) counts as written.
 * create({ repo, now?, newId? }) makes an independent service (tests); the module itself is the app's.
 */
(function () {
  'use strict';

  NBA.define('learning', ['config', 'util', 'catalog', 'repo', 'masteryEngine', 'learningEngine', 'growth', 'writeQueue'],
    (config, util, catalog, appRepo, masteryEngine, learningEngine, growth, writeQueue) => {
    const { WORLDS } = catalog;
    const CFG = { mastery: config.mastery, adaptive: config.adaptive, error: config.error };
    const copy = (x) => (x === null || x === undefined ? null : JSON.parse(JSON.stringify(x)));

    function create(options) {
      const o = options || {};
      const repo = o.repo || appRepo;
      const now = typeof o.now === 'function' ? o.now : () => util.now();
      const newId = typeof o.newId === 'function' ? o.newId : (p) => util.newId(p, now());
      const retryMax = o.retryMax || config.storage.retryMax;
      const recentLimit = config.attempt.recentLimit;
      const log = o.log || { error(m) { try { console.error(m); } catch (e) { /* ignore */ } } };
      let adaptiveEnabled = typeof o.adaptive === 'boolean' ? o.adaptive : config.adaptive.enabled;

      let studentId = null;
      let worlds = {};      // worldId -> { best, done }
      let recent = [];      // newest first: { activityId, questionId }
      let session = null;   // the open session record
      // P4 per-student cache (DESIGN 14.5, 20): every slot decision reads only these
      let mastery = {};     // conceptId -> mastery snapshot (12.2)
      let recs = {};        // conceptId -> recommendations record
      let checks = [];      // R3 (P5): the student's open Meadow Check runs (pending, in_progress), live records
      let baselineDone = false; // the student has a complete baseline run
      let lastDecision = {}; // conceptId -> the decision of the latest attempt on it
      let growthNow = null;  // step 4 (P1): { marks, maxRank } of the loaded student, or null until it is known
      let pendingMarks = []; // marks earned but not yet shown (oldest first)
      let reviewHook = null; // step 5: the review service
      let decisionLog = []; // the newest slot decisions of this page (test hook), at most 100
      let loads = 0;        // how often a student was loaded or the cache reset: Free Play rebuilds its state when this changes
      const q = writeQueue.create({ repo, retryMax, log }); // the retry queue (services/write-queue.js)
      const enqueue = q.enqueue, flush = q.flush;

      function emptyWorlds() {
        const w = {};
        WORLDS.forEach((x) => { w[x.id] = { best: 0, done: false }; });
        return w;
      }

      function clearCache() {
        mastery = {}; recs = {}; lastDecision = {}; checks = []; baselineDone = false; growthNow = null; pendingMarks = [];
      }

      const OPEN_CHECK = ['pending', 'in_progress'];
      /**
       * Keep the Meadow Check cache in step with a run record of the loaded student (the assessment
       * service calls this after every change): open runs are kept (the given object becomes the
       * cached one), others removed (N15: cancelled runs never show); a complete baseline is noted.
       */
      function noteCheck(run) {
        if (!run || run.studentId !== studentId) return;
        const i = checks.findIndex((r) => r.id === run.id);
        if (OPEN_CHECK.indexOf(run.status) >= 0) { if (i >= 0) checks[i] = run; else checks.push(run); }
        else if (i >= 0) checks.splice(i, 1);
        if (run.form === 'baseline' && run.status === 'complete') baselineDone = true;
      }

      async function loadStudent(id) {
        loads++;
        studentId = id;
        worlds = emptyWorlds();
        recent = [];
        clearCache();
        const read = async (store, q) => { try { return (await repo.getAll(store, q)) || []; } catch (e) { return []; } };
        const rows = await read('worldProgress', { index: 'studentId', value: id });
        const atts = await read('attempts', { index: 'studentTime', lower: [id, 0], upper: [id, Infinity], direction: 'prev', limit: recentLimit });
        const snaps = await read('mastery', { index: 'studentId', value: id });
        const recRows = await read('recommendations', { index: 'studentId', value: id });
        const asmRows = await read('assessments', { index: 'studentId', value: id });
        if (studentId !== id) return; // another student was loaded meanwhile
        asmRows.forEach(noteCheck);
        rows.forEach((r) => { worlds[r.worldId] = { best: r.best, done: r.done }; });
        recent = atts.map((a) => ({ activityId: a.activityId, questionId: a.questionId }));
        snaps.forEach((s) => { mastery[s.conceptId] = s; });
        recRows.forEach((r) => { recs[r.conceptId] = r; });
        await rebuildStale(id, atts);
        if (studentId !== id) return;
        await loadGrowth(id);
        if (studentId !== id) return;
        atts.slice().reverse().forEach((a) => { if (a.decision && a.decision.conceptId && a.decisionSource !== 'review') lastDecision[a.decision.conceptId] = a.decision; });
        if (reviewHook) { // step 5: a child who is already strong joins the review list; the writes are queued like any other
          const rows = await reviewHook.load(id, levelsOf(Object.keys(mastery)));
          if (studentId !== id) return;
          rows.forEach((r) => enqueue({ keyStr: 'schedule|' + id + '|' + r.conceptId, store: 'schedule', record: r }));
          if (rows.length) await flush();
        }
      }

      /**
       * The mastery store is a cache of the attempts (DESIGN 9.2, 12.2). A concept whose snapshot is
       * missing or older than its newest stored attempt (attempts written without the play path, for
       * example imported or planted ones) is rebuilt from all of the student's attempts, once, and the
       * rebuilt snapshot and its recommendations are written back through the queue.
       */
      async function rebuildStale(id, newest) {
        const inc = config.mastery.includeContexts;
        const latest = {};
        newest.forEach((a) => {
          if (inc.indexOf(a.context) < 0 || !Array.isArray(a.conceptIds)) return;
          a.conceptIds.forEach((c) => { latest[c] = Math.max(latest[c] || 0, a.timestamp || 0); });
        });
        const stale = Object.keys(latest).filter((c) => !mastery[c] || (mastery[c].lastAttemptAt || 0) < latest[c]);
        if (!stale.length) return;
        let all = [];
        try { all = (await repo.getAll('attempts', { index: 'studentId', value: id })) || []; } catch (e) { return; }
        if (studentId !== id) return;
        stale.forEach((c) => {
          mastery[c] = masteryEngine.rebuild(all, id, c, config.mastery);
          enqueue({ keyStr: 'mastery|' + id + '|' + c, store: 'mastery', record: mastery[c] });
        });
        const view = cacheView([]);
        learningEngine.recommendableAffected(stale).forEach((c) => {
          const d = learningEngine.recommendationFor(c, view, CFG);
          if (!d) return;
          recs[c] = { studentId: id, conceptId: c, createdAt: now(), source: 'adaptive', decision: d };
          enqueue({ keyStr: 'recommendations|' + id + '|' + c, store: 'recommendations', record: recs[c] });
        });
        flush();
      }

      /** The levels of the cached mastery snapshots (every skill that has data), through the mastery engine. */
      function levelsOf(ids) {
        const out = {};
        ids.forEach((c) => { if (mastery[c]) out[c] = masteryEngine.evaluate(mastery[c], CFG.mastery, now(), CFG.error).level; });
        return out;
      }
      const growthOrder = () => catalog.CURRICULUM.conceptOrder.concat(catalog.CONCEPTS.map((c) => c.id).filter((c) => catalog.CURRICULUM.conceptOrder.indexOf(c) < 0));
      /** Write the growth of a student onto the students record (get, then put, so other fields are kept). */
      function enqueueGrowth(sid) {
        const snap = copy(growthNow);
        enqueue({ keyStr: 'growth|' + sid, update: async () => {
          const s = await repo.get('students', sid);
          if (s) await repo.put('students', Object.assign({}, s, { growth: snap, updatedAt: now() }));
        } });
      }
      /**
       * Step 4 (P1): the stored growth of the student, or, when there is none yet, a silent baseline from the current
       * levels (nothing is awarded, so nobody gets a burst of marks after the update). The baseline is written at load, so a level that
       * drops and rises later, even after a reload, cannot earn a mark for a level the child already had.
       * A failed read leaves it null.
       */
      async function loadGrowth(id) {
        let s = null;
        try { s = await repo.get('students', id); } catch (e) { return; }
        if (studentId !== id) return;
        if (s && s.growth) { growthNow = copy(s.growth); return; }
        growthNow = growth.seed(levelsOf(Object.keys(mastery)));
        if (s) { enqueueGrowth(id); await flush(); } // a failed write stays queued and is retried
      }

      /** The cache contents a pure slot decision reads (DESIGN 14.5). */
      function cacheView(runActivities) {
        return { mastery: mastery, adaptiveEnabled: adaptiveEnabled, now: now(), runActivities: runActivities || [] };
      }

      /** Decide slot i of a world run from the cache only (run = { worldId, plan, activities }). */
      function decideSlotFor(run, i) {
        const d = learningEngine.decideSlot({ worldId: run.worldId, missionIndex: i, label: run.plan[i] }, cacheView(run.activities), CFG);
        decisionLog.push({ worldId: run.worldId, missionIndex: i, label: run.plan[i], decisionSource: d.decisionSource,
          activityId: d.activityId, difficulty: d.difficulty, decision: copy(d.decision) });
        if (decisionLog.length > 100) decisionLog = decisionLog.slice(-100);
        return d;
      }

      /** The question keys generation should avoid for this activity (N16 e: newest 20 of the cached 200). */
      function recentExclude(activityId) {
        return new Set(learningEngine.recentQuestionIds(recent, activityId, config.adaptive.recentQuestionWindow));
      }

      /** Show validated values for this session without writing them: best = max, done = or (P2-M1). */
      function applyUnsaved(sid, byWorld) {
        if (sid !== studentId || !byWorld) return;
        Object.keys(byWorld).forEach((worldId) => {
          const x = byWorld[worldId], rec = worldRecord(worldId);
          if (!x) return;
          rec.best = Math.max(rec.best, Number(x.best) || 0);
          rec.done = rec.done || x.done === true;
        });
      }

      /** The record for one world, created on first use (v1 Store.world). */
      function worldRecord(worldId) {
        if (!worlds[worldId]) worlds[worldId] = { best: 0, done: false };
        return worlds[worldId];
      }

      /**
       * Best stars and completion after a mission or World Complete. Resolves true when the
       * write (and any queued older ones) reached storage, false when it stays queued.
       */
      function saveWorldResult(sid, worldId, result) {
        if (sid !== studentId) return Promise.resolve(false); // only the loaded student plays
        const r = result || {};
        const rec = worldRecord(worldId);
        rec.best = Math.max(rec.best, Number(r.stars) || 0);
        rec.done = rec.done || r.done === true;
        enqueue({ keyStr: 'worldProgress|' + sid + '|' + worldId, store: 'worldProgress',
          record: { studentId: sid, worldId: worldId, best: rec.best, done: rec.done, updatedAt: now(), source: 'play' } });
        return flush();
      }

      const sessionCopy = () => Object.assign({}, session);

      /** Open a session for the first question of a run (ends any open one first). */
      function startSession(args) {
        const a = args || {};
        if (session) endSession();
        session = { id: newId('ses'), studentId: a.studentId, kind: a.kind || 'play', startedAt: now(), endedAt: null,
          worldId: a.worldId || null, assignmentId: a.assignmentId || null, assessmentId: a.assessmentId || null, attemptCount: 0 };
        enqueue({ keyStr: 'sessions|' + session.id, store: 'sessions', record: sessionCopy() });
        flush();
        return session.id;
      }

      /** Close the open session (no-op when none is open). */
      function endSession() {
        if (!session) return Promise.resolve(true);
        session.endedAt = now();
        enqueue({ keyStr: 'sessions|' + session.id, store: 'sessions', record: sessionCopy() });
        session = null;
        return flush();
      }

      /**
       * Store one attempt record (built by learningEngine.buildAttempt). The UI never awaits this.
       * For the loaded student, synchronously and in this order (DESIGN 14.5): 1. mastery update for
       * every credited concept, 2. the question id, 3. recommendations for every recommendable concept
       * affected, 4. one batch (attempts add, mastery put, recommendations put, session put).
       */
      function recordAttempt(rec, extraOps) {
        const ops = [{ op: 'add', store: 'attempts', value: rec }];
        if (rec.studentId === studentId) {
          const credited = Array.isArray(rec.conceptIds) ? rec.conceptIds : [];
          const before0 = growthNow;
          credited.forEach((c) => {
            const before = mastery[c] || masteryEngine.empty(studentId, c);
            const after = masteryEngine.update(before, rec, config.mastery);
            if (after !== before) { mastery[c] = after; ops.push({ op: 'put', store: 'mastery', value: after }); }
          });
          const lv = levelsOf(credited);
          if (growthNow && credited.length) { // step 4 (P1): did a skill reach a new highest level?
            const r = growth.apply(growthNow, lv, growthOrder());
            // Step 8 (P8-3): a placement answer raises maxRank silently but earns NO growth mark (it is a
            // first guess, not a real move up); drop the mark apply() added, keeping the old marks array,
            // so a later real rise above the placed level still earns one.
            const placement = !!(rec.decision && rec.decision.source === 'placement');
            growthNow = (placement && r.mark) ? { marks: before0.marks, maxRank: r.growth.maxRank } : r.growth;
            if (r.mark && !placement) pendingMarks.push(r.mark);
            if ((r.mark && !placement) || JSON.stringify(growthNow) !== JSON.stringify(before0)) enqueueGrowth(studentId);
          }
          if (reviewHook) reviewHook.attempt(rec, lv).forEach((r) => ops.push({ op: 'put', store: 'schedule', value: r })); // step 5, same batch
          recent.unshift({ activityId: rec.activityId, questionId: rec.questionId });
          if (recent.length > recentLimit) recent.length = recentLimit;
          const view = cacheView([]);
          learningEngine.recommendableAffected(credited).forEach((c) => {
            const d = learningEngine.recommendationFor(c, view, CFG);
            if (!d) return;
            recs[c] = { studentId: studentId, conceptId: c, createdAt: now(), source: 'adaptive', decision: d };
            ops.push({ op: 'put', store: 'recommendations', value: recs[c] });
          });
          if (rec.decision && rec.decision.conceptId && rec.decisionSource !== 'review') lastDecision[rec.decision.conceptId] = rec.decision;
        }
        if (session && session.id === rec.sessionId) {
          session.attemptCount++;
          ops.push({ op: 'put', store: 'sessions', value: sessionCopy() });
        }
        // P5 (DESIGN 15.4): a Meadow Check answer saves its run in the same batch
        (Array.isArray(extraOps) ? extraOps : []).forEach((x) => ops.push(x));
        enqueue({ keyStr: 'attempts|' + rec.id, ops: ops });
        return flush();
      }

      /** Test hook: forget the cache, the open session and the queue (resetSave). */
      function reset() {
        loads++;
        studentId = null;
        worlds = emptyWorlds();
        recent = [];
        session = null;
        q.clear();
        clearCache();
        decisionLog = [];
        if (reviewHook) reviewHook.reset();
      }

      return {
        loadStudent, worldRecord, applyUnsaved, saveWorldResult, startSession, endSession, recordAttempt, flush, reset,
        decideSlotFor, recentExclude, setReviewHook(h) { reviewHook = h; },
        /** N6: the run-time adaptation switch (config.adaptive.enabled at start; test mode may change it). */
        isAdaptive: () => adaptiveEnabled,
        setAdaptive(on) { adaptiveEnabled = on !== false; return adaptiveEnabled; },
        snapshot: (c) => copy(mastery[c] || null),
        /** Step 4 (P1): a copy of the loaded student's growth ({ marks, maxRank }), or null while unknown. */
        growthState: () => copy(growthNow),
        /** The oldest growth mark that was earned and not yet shown ({ conceptId, level, n }), or null. */
        takeGrowth: () => pendingMarks.shift() || null,
        /** Test hook: replace the cached growth of the loaded student and write it. */
        plantGrowth(g) { growthNow = copy(g); pendingMarks = []; if (studentId) enqueueGrowth(studentId); return flush(); },
        /** Step 4: first-try results (oldest first, at most config.mastery.recentWindow) of the latest answers on one skill. */
        firstTryFlags: (c) => (mastery[c] && Array.isArray(mastery[c].recent) ? mastery[c].recent.map((r) => r.first === true) : []),
        recommendation: (c) => copy(recs[c] || null),
        latestDecision: (c) => copy(lastDecision[c] || null),
        /** R3 (P5): the open Meadow Check runs (copies), the live cached record of one, and baselineDone. */
        openChecks: () => copy(checks),
        openCheck: (runId) => checks.find((r) => r.id === runId) || null,
        noteCheck, baselineDone: () => baselineDone,
        lastDecisions: () => copy(decisionLog),
        currentStudentId: () => studentId,
        currentSessionId: () => (session ? session.id : null),
        /** Step 3: a copy of the open session record, or null (usage.minutesOnDay counts it up to now). */
        currentSession: () => (session ? sessionCopy() : null),
        recentQuestions: () => recent.map((r) => Object.assign({}, r)),
        pendingWrites: () => q.size(),
        droppedWrites: () => q.dropped(),
        /** Free Play: the levels of the cached mastery snapshots for these skills, and the cache view a pure decision reads. */
        levels: levelsOf,
        cacheView,
        generation: () => loads
      };
    }

    const app = create();
    return Object.assign({ create }, app);
  });
}());
