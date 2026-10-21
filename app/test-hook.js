/*
 * testHook (L6): window.NBA_TEST for the Playwright checks (moved from v1 section 11).
 * main.js installs it only when the URL has ?test; without it NBA_TEST never exists.
 * The hook only calls setters (dom.setSpeed, dom.resetInputGuard, learning.setAdaptive); it holds no game state.
 */
(function () {
  'use strict';

  NBA.define('testHook',
    ['config', 'util', 'catalog', 'prefs', 'repo', 'children', 'learning', 'assessments', 'dom', 'audio', 'speech', 'counters', 'screens',
      'questionTypes', 'generator', 'learningEngine', 'missionUI', 'gameUI', 'adultGateUI', 'freeplay', 'freeplayFlow', 'placements', 'placementFlow'],
    (config, util, catalog, prefs, repo, children, learning, assessments, dom, audio, speech, counters, screens,
      questionTypes, generator, learningEngine, missionUI, gameUI, adultGateUI, freeplay, freeplayFlow, placements, placementFlow) => {
      const { MISSIONS_PER_WORLD, STORAGE_KEY, SAVE_VERSION } = config;
      const { clamp } = util;
      const { WORLDS, worldById } = catalog;
      const { $, $all, guardInput } = dom;
      const { AUDIO } = audio;
      const { SPEECH } = speech;
      const { fitStage } = counters;
      const { state, elapsedPlayMs } = screens;
      const { tier } = questionTypes;
      const { createQuestion } = generator;
      const { startRun, startWorld, showMission, leaveRun } = missionUI;
      const showScreen = screens.show;

      /** The stored choice of the current student (raw field heroId), or null when none or not a known id. */
      function storedChoice() {
        return state.currentStudent && catalog.isKnownBuddyId(state.currentStudent.heroId) ? state.currentStudent.heroId : null;
      }

      /** The v1-shaped save { v: 1, heroId, sound, worlds } built from the current student (v1 suites read it). */
      function v1Save() {
        const worlds = {};
        WORLDS.forEach((w) => { const r = learning.worldRecord(w.id); worlds[w.id] = { best: r.best, done: r.done }; });
        return { v: SAVE_VERSION, heroId: storedChoice(), sound: prefs.get('sound'), worlds: worlds };
      }

      /** opts: { ready: Promise (resolves when boot finished), bootInfo: { storageMode, storageReason, migration } } */
      function install(opts) {
        const o = opts || {};
        const bootInfo = o.bootInfo || {};
        const ready = o.ready || Promise.resolve(bootInfo);
        SPEECH.log = [];
        // P4 (DESIGN 8.4): ?test&adaptive=0 switches adaptation off for the page, so it survives reloads.
        if (/[?&]adaptive=0(&|$)/.test(window.location.search)) learning.setAdaptive(false);
        // Hook clicks are deliberate, so they skip the double-tap guard.
        const click = (el) => { dom.resetInputGuard(); if (el && !el.disabled) el.click(); return !!el; };
        const api = {
          /** A snapshot of the game state. */
          state() {
            const run = state.run, q = run && run.q;
            return {
              screen: state.screen,
              worldId: run ? run.worldId : (state.screen === 'complete' ? state.completeWorldId : null),
              missionIndex: run ? run.missionIndex : null,
              plan: run ? run.plan.slice() : null,
              typeId: q ? q.typeId : null,
              max: q ? q.max : null,
              answer: q ? q.answer : null,
              choices: q && q.choices ? q.choices.slice() : null,
              numbers: q ? Object.assign({}, q.numbers) : null,
              display: q ? q.display.slice() : null,
              speechText: q ? q.speech : null,
              starsThisRun: run ? run.stars : null,
              results: run ? run.results.slice() : null,
              firstTry: run ? run.firstTry : null,
              wrongCount: run ? run.wrongCount : null,
              buildCount: run ? run.buildCount : null,
              locked: run ? run.locked : null,
              activityId: q ? q.activityId : null,
              conceptId: q ? q.conceptId : null,
              difficulty: q ? q.difficulty : null,
              representation: q ? q.representation : null,
              questionId: q ? q.questionId : null,
              seed: q ? q.seed : null,
              template: q ? q.template : null,
              start: q && q.start !== undefined ? q.start : null,
              cap: q && q.cap !== undefined ? q.cap : null,
              decisionSource: run && run.slot ? run.slot.decisionSource : null,
              decision: run && run.slot && run.slot.decision ? JSON.parse(JSON.stringify(run.slot.decision)) : null,
              context: run ? (run.kind === 'check' ? 'assessment' : 'play') : null,
              runKind: run ? run.kind : null,                  // P5: 'world' | 'check' | 'freeplay'
              fp: run && run.fp ? JSON.parse(JSON.stringify(run.fp)) : null, // Free Play: { tag, includeNew, lastStrand, lastRep, n }
              rung: run ? (run.rung || 0) : null,              // step 4: the hint ladder rung of this question (0 = none yet)
              isSimilar: run ? run.isSimilar === true : null,  // step 4: this question is the similar one after a model
              similarPending: run ? !!run.similarSpec : null,  // step 4: the next question will be a similar one
              sittingCount: run ? run.sittingCount : null,
              total: run ? run.total : null,                   // 8 for worlds, 12 for a check
              checkRunId: run && run.checkRunId ? run.checkRunId : null,
              cellId: run && run.cellId ? run.cellId : null,
              adaptive: learning.isAdaptive(),
              sessionId: learning.currentSessionId(),
              heroId: storedChoice(),                  // the raw stored value (spec 5.3)
              buddyId: screens.studentBuddyId(),       // the mapped buddy id
              sound: prefs.get('sound'),
              playMs: elapsedPlayMs(),
              save: v1Save(),
              studentId: state.currentStudent ? state.currentStudent.id : null,
              storageMode: repo.mode,
              storageReason: repo.reason,
              storageState: repo.state,
              pendingWrites: learning.pendingWrites(),
              migration: bootInfo.migration ? JSON.parse(JSON.stringify(bootInfo.migration)) : null,
              bootStage: bootInfo.stage || null,
              symbolLeak: SPEECH.symbolLeak,
              hasSpeech: !!SPEECH.synth,
              hasAudio: !!AUDIO.ctx,
              u: (function () { const s = $('#stage'); return s ? parseFloat(s.style.getPropertyValue('--u')) || null : null; }())
            };
          },
          /** Every line passed to SPEECH.say (even when the engine is missing or muted). */
          speechLog: SPEECH.log,
          /** Multiply every game delay (tests use 0.05); also shortens CSS animations. */
          setSpeed(f) {
            dom.setSpeed(clamp(Number(f) || 1, 0.01, 1));
            guardInput(); // rescale a guard that is still running from the last screen
            document.documentElement.classList.toggle('nba-fast', dom.getSpeed() < 1);
          },
          /** Pretend this much play time has passed (starts the session clock if needed). */
          setPlayTime(ms) { state.session.startedAt = Date.now() - (Number(ms) || 0); },
          /** Jump to a screen: title | picker {firstRun} | home | story {worldId} | complete {worldId, stars, newBest} | freeplay | freeplay-end. */
          goto(screen, opts) {
            const o = opts || {};
            const worldId = worldById(o.worldId) ? o.worldId : WORLDS[0].id;
            leaveRun();
            state.run = null;
            if (screen === 'picker') { state.pickerFirstRun = !!o.firstRun; showScreen('picker'); }
            else if (screen === 'story') showScreen('story', { worldId: worldId });
            else if (screen === 'complete') {
              showScreen('complete', { worldId: worldId, stars: clamp(o.stars == null ? MISSIONS_PER_WORLD : o.stars, 0, MISSIONS_PER_WORLD), newBest: !!o.newBest });
            } else if (screen === 'title' || screen === 'home') showScreen(screen);
            // P5: check-intro {runId, locked, resumed} | check-end {runId}
            else if (screen === 'check-intro' || screen === 'check-end') showScreen(screen, { runId: o.runId || null, locked: !!o.locked, resumed: !!o.resumed });
            // P6: players {fromHome}
            else if (screen === 'players') { state.playersFromHome = !!o.fromHome; showScreen('players'); }
            else if (screen === 'adults') showScreen('adults');
            else if (screen === 'mybuddy') showScreen('mybuddy');
            else if (screen === 'freeplay' || screen === 'freeplay-end') showScreen(screen, {}); // Free Play F3: the category screen, the limit end screen
            return state.screen;
          },
          /**
           * P5: play the current student's open Meadow Check (baseline first) on the mission screen,
           * skipping the intro; with none open, request one of `form` (default 'post') first.
           * Resolves with state(); runKind 'check'.
           */
          async startCheck(form) {
            const sid = state.currentStudent ? state.currentStudent.id : null;
            let open = assessments.openRuns()[0];
            if (!open && sid) {
              const r = await assessments.request(sid, form === 'baseline' ? 'baseline' : 'post', { createdBy: 'system' });
              open = r.created ? r.run : null;
            }
            leaveRun();
            state.run = null;
            if (!open || !missionUI.startCheck(assessments.begin(open.id))) return null;
            return api.state();
          },
          /** P6: the active students (the players screen list), oldest first, as plain copies. */
          async students() { await gameUI.refreshPlayers(); return JSON.parse(JSON.stringify(state.activeStudents || [])); },
          /** P6: make a student the current player (as the players screen does); resolves state(). */
          async selectStudent(id) { const s = await gameUI.selectStudent(id); if (!s) return null; await gameUI.refreshPlayers(); showScreen('home'); return api.state(); },
          /** New run of a world, skipping the story, showing mission index i (0-7). */
          startWorld(worldId, i) { startWorld(worldById(worldId) ? worldId : WORLDS[0].id, i || 0); return api.state(); },
          /**
           * Show a given question type with given numbers (mission 1 for max 10, mission 5 for max 20).
           * opts (V2, optional): { level: 1-4, template: 'take' | 'diff', seed }. A V2 activity plays in
           * the first world whose activity metadata lists it.
           */
          renderQuestion(typeId, numbers, max, opts) {
            const o = opts || {};
            const T = questionTypes.get(typeId);
            const level = o.level || generator.levelOf(tier(max || T.size(numbers)));
            const m = tier(catalog.tierOfLevel(level));
            const meta = catalog.activityById(typeId);
            const w = WORLDS.find((x) => generator.planTypes(x).indexOf(typeId) >= 0) ||
              (meta && worldById(meta.worlds[0])) || WORLDS[0];
            startRun(w.id);
            showMission(m === 20 ? 4 : 0, createQuestion(typeId, numbers, level, o.seed,
              { buddyId: screens.currentBuddyId(), template: o.template }));
            return api.state();
          },
          /** Make every new seed (questions and plans) come from rngFrom(n); null restores Math.random. */
          seed(n) { util.setSeedSource(n === null || n === undefined ? null : util.rngFrom(n)); return true; },
          /** Switch step 3 (adaptive) of the slot decision on or off for this page (DESIGN 8.4). */
          setAdaptive(on) { return learning.setAdaptive(on !== false); },
          /** The newest slot decisions of this page (at most 100), oldest first. */
          lastDecisions() { return learning.lastDecisions(); },
          /** Step 4 (P1): a copy of the loaded child's growth ({ marks, maxRank }), or null. */
          growth() { return learning.growthState(); },
          /** Step 4: give the loaded child n growth marks, 0 to 28 (screenshots, My buddy); resolves with state(). */
          plantGrowth(n) {
            const ids = catalog.CONCEPTS.map((c) => c.id), marks = [], maxRank = {};
            for (let i = 0; i < Math.min(28, Math.max(0, n)); i++) {
              const strong = i >= ids.length, id = ids[i % ids.length];
              marks.push({ conceptId: id, level: strong ? 'strong' : 'developing', n: i + 1 });
              maxRank[id] = strong ? 3 : 2;
            }
            return learning.plantGrowth({ marks: marks, maxRank: maxRank }).then(() => api.state());
          },          /** Fix the clock used for timestamps and ids (ms), or null for the real clock. */
          setClock(ms) { util.setClock(ms); return util.now(); },
          /** Give the right answer through real DOM clicks. */
          answerCorrect() {
            const run = state.run;
            if (!run || !run.q || run.locked) return false;
            const q = run.q, mode = questionTypes.get(q.typeId).inputMode;
            if (mode === 'choices') return click($('.choice[data-value="' + q.answer + '"]'));
            if (mode === 'towers') return click($('.tower[data-value="' + q.answer + '"]'));
            let guard = 60;
            while (run.buildCount > q.answer && guard--) click($('[data-action="undo"]'));
            while (run.buildCount < q.answer && guard--) click($('[data-action="add-counter"]'));
            return click($('[data-action="done"]'));
          },
          /** Give a wrong answer through real DOM clicks. */
          answerWrong() {
            const run = state.run;
            if (!run || !run.q || run.locked) return false;
            const q = run.q, mode = questionTypes.get(q.typeId).inputMode;
            if (mode === 'choices') {
              return click($all('.choice').find((b) => !b.disabled && Number(b.getAttribute('data-value')) !== q.answer));
            }
            if (mode === 'towers') return click($('.tower[data-value="' + (1 - q.answer) + '"]'));
            if (run.buildCount === q.answer) click($('[data-action="add-counter"]'));
            return click($('[data-action="done"]'));
          },
          next() { return click($('#next-card [data-action="next"]')); },
          fit() { fitStage(); },
          /** Resolves (true) once every queued progress write has reached storage. */
          flush() { return learning.flush(); },
          /** Resolves with the boot info once storage is open and the title screen is shown. */
          ready() { return ready.then(() => api.state()); },
          /**
           * A fresh profile: clears every store, removes the v2 prefs key (so the next boot counts
           * as a first V2 run), never touches the v1 key, then creates and selects a new default
           * student. Returns a Promise; suites await it.
           */
          async resetSave() {
            await ready;
            leaveRun();
            state.run = null;
            await learning.flush();
            await repo.clearAll();
            prefs.remove();
            learning.reset();
            const s = await children.ensureDefaultStudent();
            state.currentStudent = s;
            await learning.loadStudent(s.id);
            await gameUI.refreshPlayers();
            return s.id;
          },
          /**
           * Free Play (F2). categories() the offered categories; start(tag?, opts?) plays the first question (resolves { result, state });
           * check() awaits the latest limit check (before tapping Next); status() / approve() the day's derived minutes and the limit,
           * and one adult approval (15 more minutes, memory only); engineState(strand), sinceReview() the in-memory controller;
           * plant({ count, startAt, stepMs?, thinkMs?, tag?, activityId?, level?, correct? }) stores count answers of the current child
           * (tag = a category id for Free Play answers, none for guided ones) one stepMs apart in a new session and leaves the clock
           * at the end. Each counts about stepMs of active time when thinkMs + the lead-in fill it.
           */
          freeplay: Object.freeze({
            categories() { return freeplay.categories(state.currentStudent); },
            async start(tag, opts) { const r = await freeplayFlow.start(tag, opts); return { result: JSON.parse(JSON.stringify(r)), state: api.state() }; },
            check() { return freeplayFlow.lastCheck(); },
            status() { return freeplay.status(state.currentStudent); },
            approve() { return freeplay.approve(state.currentStudent); },
            engineState(strand) { return freeplay.stateOf(strand); },
            sinceReview() { return freeplay.sinceReview(); },
            async plant(spec) {
              const s = spec || {}, child = state.currentStudent, step = s.stepMs || 60000, think = s.thinkMs === undefined ? Math.floor(step / 2) : s.thinkMs;
              const activityId = s.activityId || 'add', level = s.level || 1, rep = catalog.activityById(activityId).representation;
              util.setClock(s.startAt);
              const sid = learning.startSession({ studentId: child.id, kind: 'play', worldId: null });
              for (let i = 0; i < (s.count || 0); i++) {
                const at = s.startAt + (i + 1) * step;
                util.setClock(at);
                const q = generator.generate(activityId, level, new Set(), 1000 + i, { buddyId: screens.currentBuddyId() });
                const tag = s.tag ? { action: 'freeplay', source: 'freeplay', category: s.tag, strand: s.tag, event: 'answer', guided: false, activityId: activityId,
                  representation: rep, template: null, fromDifficulty: level, toDifficulty: level } : null;
                const wrong = s.correct === false ? q.answer + 1 : q.answer;
                learning.recordAttempt(learningEngine.buildAttempt(q, { outcome: s.correct === false ? 'abandoned' : 'correct', submittedAnswers: [wrong],
                  hintsShown: 0, starEarned: false, shownAt: at - think, responseMs: think, totalMs: think },
                { id: util.newId('att', at), now: at, studentId: child.id, sessionId: sid, speed: 1, context: 'play', worldId: 'master',
                  missionId: 'master.m' + ((i % 8) + 1), missionIndex: Math.min(i, 999), decisionSource: 'default', decision: tag, mixed: false, leadConcepts: [] }));
              }
              await learning.endSession();
              await learning.flush();
              return util.now();
            }
          }),
          /**
           * Placement (step 8). start({ band }?) opens a run for the current child and shows the first question on the mission
           * screen (resolves { result, state }); answer(ok) answers the current placement question by rule (ok true = give the
           * right value, false = a wrong value) through the service and returns the service's result; state() a copy of the live
           * engine staircase state (null before a run); run({ band, answers }) plays a whole run by a list or a rule function
           * (ok = fn(rung, n) or an array of booleans), tapping All done is left to the browser suite. No clock or randomness is
           * read here; the suite seeds through NBA_TEST.seed and NBA_TEST.setClock as for the other flows.
           */
          placement: Object.freeze({
            async start(opts) { const r = await placementFlow.start(opts || {}); return { result: JSON.parse(JSON.stringify(r)), state: api.state() }; },
            answer(ok) {
              const run = state.run;
              if (!run || !run.q || run.kind !== 'place') return null;
              const q = run.q, correct = ok !== false;
              const value = correct ? q.answer : (q.answer === 0 ? 1 : q.answer + 1);
              const res = placements.answer(value);
              // advance like the Next tap so repeated answer() calls play a whole run (no card, no DOM)
              const nx = placements.next(screens.currentBuddyId());
              if (nx) missionUI.showPlace(nx.question);
              else { placements.end(); missionUI.leaveRun(); state.run = null; screens.show('place-end'); }
              return res;
            },
            state() { return placementFlow.state(); }
          }),
          /**
           * Step 3: the Grown-ups area. gate() shows the locked gate (after reading whether a PIN is set); open(screen,
           * params) opens a Grown-ups screen as if the gate was passed (default the child list); close() locks it and
           * shows Home. Each resolves with the screen name.
           */
          adults: Object.freeze({
            async gate() { leaveRun(); state.run = null; adultGateUI.lockOut(); await adultGateUI.refresh(); showScreen('adults'); return state.screen; },
            async open(screen, params) {
              leaveRun(); state.run = null; state.adultOpen = true;
              await adultGateUI.refresh();
              await adultGateUI.go(screen || 'adult-list', params || {});
              return state.screen;
            },
            close() { adultGateUI.lockOut(); showScreen('home'); return state.screen; },
            unlocked() { return adultGateUI.unlocked(); }
          }),
          /** Direct storage access for the V2 suites (writes are validated by repo). */
          db: Object.freeze({
            count(store) { return repo.count(store); },
            getAll(store) { return repo.getAll(store); },
            put(store, rec) { return repo.put(store, rec); },
            /** P4: attempts are add-only, so planted attempts go through add. */
            add(store, rec) { return repo.add(store, rec); },
            clearAll() { return repo.clearAll(); }
          }),
          /** Tests only: plant or read a v1 save (the only V2 code that writes the v1 key). */
          v1: Object.freeze({
            get() { try { return window.localStorage.getItem(STORAGE_KEY); } catch (e) { return null; } },
            set(raw) { window.localStorage.setItem(STORAGE_KEY, String(raw)); },
            remove() { window.localStorage.removeItem(STORAGE_KEY); }
          })
        };
        Object.defineProperty(window, 'NBA_TEST', { value: Object.freeze(api), configurable: true });
      }

      return { install };
    });
}());
