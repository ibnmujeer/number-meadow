/*
 * missionUI (L5): the mission screen, a world run, answers, hints, the Next card and the build
 * controls (v1 sections 9 and 10). World Complete and check-end are shown by name (screens.show).
 * P3/P4 (DESIGN 8.1, 11, 14.5, 16.5): each slot is decided in showMission(i) from the learning cache
 * (no data or adaptation off: the v1 type at the v1 level), questions are seeded, and every answered
 * question is recorded as an attempt (on the correct answer, or 'abandoned' on leaving after a wrong
 * one). A run opens a session at its first question and closes it at the end or on leaving; writes
 * go through the learning queue, so the child flow never waits for storage.
 * P5 (DESIGN 16.6): run.kind 'check' (a Meadow Check; answers go to assessment-ui's hook) uses the
 * same screen and actions as a world run; what differs per kind (header, counter, last question,
 * session, missionId) is in runKinds. Step 3: setRestHook lets restCard show one calm rest card in place of the Next card.
 * Free Play (F2): run.kind 'freeplay' (runKinds.newFreeRun); setFreeHook lets freeplayFlow choose the next question or a card.
 * Placement (step 8): run.kind 'place' (runKinds.newPlaceRun); setPlaceHook lets placementFlow build each question (the pure
 * placementEngine, through the placements service) and choose the next question or the end. The staircase, the attempt record
 * and the session are owned by the service, so missionUI records nothing itself for a 'place' run (an abandoned question writes
 * nothing, P8-19); the screen shows no counter, no score, no rung and the same neutral Next line after every answer.
 */
(function () {
  'use strict';

  NBA.define('missionUI',
    ['config', 'util', 'catalog', 'dom', 'audio', 'speech', 'art', 'counters', 'screens', 'questionTypes', 'generator',
      'assessmentEngine', 'learningEngine', 'learning', 'review', 'buildControls', 'progression', 'runKinds', 'feedbackUI', 'hintLadder', 'hintUI'],
    (config, util, catalog, dom, audio, speech, art, counters, screens, questionTypes, generator,
      assessmentEngine, learningEngine, learning, review, buildControls, progression, runKinds, feedbackUI, hintLadder, hintUI) => {
      const { MISSIONS_PER_WORLD, TIMING } = config;
      const { clamp, esc, repeat } = util;
      const { WORLDS, worldById } = catalog;
      const { $, $all, later, replayClass } = dom;
      const { AUDIO } = audio;
      const { SPEECH } = speech;
      const { ICONS, faceHTML, iconBtn } = art;
      const { fitStage } = counters;
      const { state, currentBuddy, currentLook } = screens;

      const progressHTML = runKinds.progressHTML; // the 8 progress steps, or the "4 of 12" counter (DESIGN 16.6)

      const inputModeOf = (q) => questionTypes.get(q.typeId).inputMode;

      screens.register('mission', {
        render() {
          const run = state.run, q = run.q, check = run.kind === 'check';
          const mode = inputModeOf(q);
          const { title, label } = runKinds.header(run);
          let answers = '';
          if (mode === 'choices') {
            // A type may give word labels for its buttons (band-1 even/odd), so the choice is speakable; the
            // button value stays the number (data-value), only the shown and read label changes. Numbers unchanged.
            const label = (v) => (q.choiceText && Object.prototype.hasOwnProperty.call(q.choiceText, v) ? q.choiceText[v] : v);
            answers = q.choices.map((v) => '<button type="button" class="choice" data-action="answer" data-value="' + v + '">' + esc(String(label(v))) + '</button>').join('');
          } else if (mode === 'build') {
            answers = '<div id="build-controls" class="build-controls">' +
              '<button type="button" class="ctl ctl-add" data-action="add-counter" aria-label="Add one counter">+1</button>' +
              '<button type="button" class="ctl ctl-undo" data-action="undo" aria-label="Undo" disabled>' + ICONS.undo + '</button>' +
              '<button type="button" class="ctl ctl-done" data-action="done">' + ICONS.tick + '<span>Done</span></button></div>';
          }
          return '<section class="screen mission mode-' + mode + (check ? ' kind-check' : '') + (run.kind === 'freeplay' ? ' kind-freeplay' : '') + (run.kind === 'place' ? ' kind-place' : '') + '" data-screen="mission" data-type="' + q.typeId + '"><header class="bar">' +
            runKinds.homeBtn(run) +
            '<div class="mission-title"><span class="world-name">' + title + '</span>' +
            '<span class="mission-no">' + label + '</span></div>' +
            faceHTML(currentBuddy().id, '', ' id="mission-buddy"', currentLook()) + runKinds.changeBtn(run) +
            iconBtn('replay', 'speaker', 'Hear the question again') + '</header>' +
            progressHTML(run) +
            '<h2 id="q-text">' + q.display.map((l) => '<span class="q-line">' + esc(l) + '</span>').join('') + '</h2>' +
            '<div id="stage" class="stage"></div>' +
            '<p id="hint" class="hint" aria-live="polite"' + (run.lead ? '>' + esc(run.lead) : ' hidden>') + '</p>' +
            '<div id="answers" class="answers"' + (mode === 'towers' ? ' hidden' : '') + '>' + answers + '</div>' +
            '</section>';
        },
        after(sec) {
          const q = state.run.q, T = questionTypes.get(q.typeId);
          const stage = $('#stage', sec);
          stage._fit = T.render(stage, q);
          fitStage();
          if (T.inputMode === 'build') buildControls.update(); // Undo on exactly when buildCount > 0
          if (T.afterShow) T.afterShow(stage, q);
          const run = state.run, lead = run.lead; // read now: the run may be gone when the timer fires
          // Free Play: the guided example (run.heard, set after the screen is drawn) is spoken after the question, so both are heard
          later(() => SPEECH.say((lead ? lead + ' ' : '') + q.speech + (run.heard ? ' ' + run.heard : '')), TIMING.QUESTION_SPEAK);
        }
      });

      /* ---------- attempt capture (DESIGN 11) ---------- */
      const studentId = () => (state.currentStudent ? state.currentStudent.id : null);

      /**
       * The attempt record of the current question, built once: 'correct', or 'abandoned' after a wrong
       * answer; in a Meadow Check the single answer (assessmentEngine.attemptParts: no hint, no star).
       */
      function attemptRecord(kind) {
        const run = state.run;
        if (!run || run.kind === 'place') return null; // placement: the service owns the record (P8-19 abandoned writes nothing)
        if (!run.q || run.recorded || !run.sessionId || !studentId()) return null;
        if (!run.submitted.length) return null; // no answer: nothing to record
        run.recorded = true;
        // From input accepted (the end of the input guard) to the first and the last answer. A test
        // hook tap can come before the guard ends (it resets the guard), so the time is at least 0.
        const times = learningEngine.responseTimes({
          readyPerf: run.readyPerf, firstPerf: run.firstPerf, nowPerf: performance.now(),
          hiddenBeforeFirst: run.hiddenBeforeFirst, hidden: run.wasHidden
        });
        const base = { id: util.newId('att'), now: util.now(), studentId: studentId(), sessionId: run.sessionId, speed: dom.getSpeed() };
        const timing = { shownAt: run.shownAt, responseMs: times.responseMs, totalMs: times.totalMs };
        if (run.kind === 'check') {
          const parts = assessmentEngine.attemptParts(run.checkRun, run.cellId, run.submitted[0]);
          return learningEngine.buildAttempt(run.q, Object.assign(timing, parts.outcome), Object.assign(base, parts.ctx));
        }
        return learningEngine.buildAttempt(run.q, Object.assign(timing, {
          outcome: kind, submittedAnswers: run.submitted, hintsShown: run.hintsShown,
          starEarned: kind === 'correct' ? run.firstTry : false
        }), Object.assign(base, runKinds.attemptWhere(run), {
          missionIndex: run.missionIndex,
          decisionSource: run.slot.decisionSource, decision: run.slot.decision, mixed: run.slot.mixed, leadConcepts: run.slot.leadConcepts
        }));
      }

      /** Record the current world question once (see attemptRecord). */
      function recordCurrent(kind) {
        const rec = attemptRecord(kind);
        if (rec) { learning.recordAttempt(rec); if (freeHook && state.run.kind === 'freeplay') freeHook.recorded(rec); } // Free Play: the level state follows each answer
        return rec;
      }

      /**
       * The child leaves the run (Home, a new run, change of student or pagehide): a question with
       * a wrong answer and no right one is recorded as abandoned, then the session ends.
       */
      function leaveRun() {
        const run = state.run;
        if (!run) return;
        if (run.kind === 'place') { if (placeHook) placeHook.leave(run); return; } // the service abandons (writes nothing) and ends its session
        if (run.q && !run.locked) recordCurrent('abandoned');
        if (run.sessionId) { learning.endSession(); run.sessionId = null; }
      }

      /** Page hidden (main.js): totalMs becomes null, responseMs too before the first answer (P3-N1). */
      function noteHidden() {
        const run = state.run;
        if (!run) return;
        run.wasHidden = true;
        if (run.firstPerf === null) run.hiddenBeforeFirst = true;
      }

      /** Start a fresh run of a world (no screen change). */
      function startRun(worldId) {
        leaveRun();
        const w = worldById(worldId) || WORLDS[0];
        state.run = {
          worldId: w.id,
          plan: generator.buildPlan(w, util.rngFrom(util.newSeed())), // 8 question type ids (the v1 slot labels)
          missionIndex: 0,
          results: repeat(null, MISSIONS_PER_WORLD), // null | 'done' | 'star' (a first try; saved data, not shown)
          stars: 0,                                  // first-try tally this run (saved as before, not shown)
          used: new Set(),                           // question keys already shown this run
          q: null, firstTry: true, wrongCount: 0, locked: false, buildCount: 0,
          kind: 'world', sessionId: null, slot: null,
          checkRunId: null, total: MISSIONS_PER_WORLD, sittingCount: 0, // DESIGN 16.6
          activities: []                              // activity shown in each slot so far (the variety rule)
        };
        return state.run;
      }

      /** P5: a check run of the live record (assessments.begin), from the first unanswered cell; false: none. */
      function startCheck(checkRun) {
        leaveRun();
        const first = checkRun ? assessmentEngine.resumeCell(checkRun) : null;
        if (!first) return false;
        state.run = runKinds.newCheckRun(checkRun);
        showMission(checkRun.items.findIndex((it) => it.cellId === first));
        return true;
      }

      const isLast = runKinds.isLast;

      function startWorld(worldId, missionIndex) {
        startRun(worldId);
        showMission(clamp(missionIndex || 0, 0, MISSIONS_PER_WORLD - 1));
      }

      /**
       * Show mission i of the current run: a new seeded question for the slot decision
       * (learning.decideSlotFor: adaptive or v1 default) unless one is given (the test
       * hook). A given question records decisionSource 'default', decision null, with its own concept
       * plus the range concept (R6); a world 5 add/sub slot also credits addsub.mixed.
       */
      function showMission(i, givenQ) {
        const run = state.run;
        if (run.q && !run.locked) recordCurrent('abandoned');
        const prevQ = run.q;
        const similar = run.similarSpec; // Step 4 (P9 rung 4): set when the last question finished after the model
        run.similarSpec = null; run.isSimilar = false; run.lead = null;
        run.missionIndex = i;
        if (run.kind === 'check') {
          // the stored instance (DESIGN 15.2): the same numbers, seed and button order on every visit
          const item = run.checkRun.items[i];
          run.cellId = item.cellId;
          run.q = assessmentEngine.questionFor(item, screens.currentBuddyId());
          run.slot = { decisionSource: 'assessment', decision: null, mixed: false, leadConcepts: [item.conceptId] };
        } else if (run.kind === 'place') {
          // placement (step 8): the flow set run.placeQ from the placements service (the pure staircase); the record is the service's
          run.q = run.placeQ;
          run.slot = { decisionSource: 'assessment', decision: null, mixed: false, leadConcepts: [] };
        } else if (givenQ) {
          run.q = givenQ; // R6: no slot decision for a test-given question
          run.slot = { decisionSource: 'default', decision: null, mixed: false, leadConcepts: [] };
        } else if (similar) {
          // a similar question: same activity, level and template, new numbers
          run.q = generator.generate(similar.activityId, similar.difficulty, run.used, util.newSeed(),
            { buddyId: screens.currentBuddyId(), template: similar.template || undefined, exclude: new Set([similar.excludeKey]) });
          run.slot = { decisionSource: 'default', decision: runKinds.similarTag(run, similar), mixed: false, leadConcepts: [] }; // Free Play: carries the tag
          run.isSimilar = true;
          run.lead = hintUI.lead(run.q);
        } else if (run.kind === 'freeplay') { // F2: the flow put the plan of this question on the run (freeplayFlow); used stays empty so the no-repeat window decides
          const d = run.fpPlan;
          run.fpPlan = null;
          run.used = new Set();
          run.q = generator.generate(d.activityId, d.difficulty, run.used, util.newSeed(), { buddyId: screens.currentBuddyId(), template: d.template, exclude: d.exclude });
          run.slot = { decisionSource: d.decisionSource, decision: d.decision, mixed: false, leadConcepts: d.leadConcepts };
        } else {
          // P4 (DESIGN 14.5): adaptive > v1 default, from the in-memory cache only; step 5: a due review question may take the slot (looks like any other)
          const d = review.pickFor(run, i) || learning.decideSlotFor(run, i);
          run.q = generator.generate(d.activityId, d.difficulty, run.used, util.newSeed(),
            { buddyId: screens.currentBuddyId(), template: d.template, exclude: learning.recentExclude(d.activityId) });
          run.slot = { decisionSource: d.decisionSource, decision: d.decision, mixed: d.mixed, leadConcepts: d.leadConcepts };
        }
        run.sameWay = !prevQ || prevQ.representation === run.q.representation; // step 4: the praise notices a new way of showing
        run.used.add(run.q.key);
        run.activities.push(run.q.activityId);
        run.firstTry = true;
        run.wrongCount = 0;
        run.rung = 0;
        run.heard = null;
        run.locked = false;
        run.buildCount = run.q.start || 0;
        run.submitted = [];
        run.hintsShown = 0;
        run.recorded = false;
        run.wasHidden = false;
        run.hiddenBeforeFirst = false;
        run.firstPerf = null;
        run.sittingCount++;
        if (run.kind !== 'place' && !run.sessionId && studentId()) run.sessionId = learning.startSession(runKinds.sessionArgs(run, studentId())); // placement: the service owns the session
        run.shownAt = util.now();
        screens.show('mission');
        if (run.kind === 'freeplay' && run.slot.decision && run.slot.decision.guided) { run.wrongCount = 3; feedbackUI.showHint(run, run.q); run.wrongCount = 0; run.heard = $('#hint').textContent; } // the guided example: the model first
        run.readyPerf = Math.max(performance.now(), dom.inputReadyAt());
      }

      /**
       * Handle an answer: a number button, a stack (value = 0/1) or Done (value =
       * counters built). Not yet right: sway, soft sound, hint, grey out the button. No
       * timer, lives or score loss. Right: happy sound, praise, progress step,
       * then the Next card.
       */
      function onAnswer(value, el) {
        const run = state.run;
        if (!run || !run.q || run.locked) return;
        if (run.kind === 'check') { // P5 (DESIGN 16.6): one submission, neutral feedback (assessment-ui)
          if (checkAnswerHandler) checkAnswerHandler(value, el);
          else { try { console.error('[NBA] check answer handler missing'); } catch (e) { /* ignore */ } }
          return;
        }
        if (run.kind === 'place') { // step 8: one submission, the same neutral line, no star, no hint, no right answer (the service records it)
          if (placeHook) placeHook.answer(value, el);
          else { try { console.error('[NBA] placement answer handler missing'); } catch (e) { /* ignore */ } }
          return;
        }
        const q = run.q;
        const mode = inputModeOf(q);
        run.submitted.push(value);
        if (run.firstPerf === null) run.firstPerf = performance.now();

        if (value !== q.answer) {
          run.firstTry = false;
          run.wrongCount++;
          if (mode === 'build') {
            replayClass(el, 'sway', TIMING.SHAKE); // Done stays usable
          } else {
            el.classList.add('sway', 'used');
            el.disabled = true;
          }
          AUDIO.play('again');
          feedbackUI.showHint(run, q);
          return;
        }

        run.locked = true;
        const world = run.kind === 'world';
        const star = world && run.firstTry;
        if (world) {
          if (star) run.stars++;
          run.results[run.missionIndex] = star ? 'star' : 'done';
          progression.saveBest(run.worldId, run.stars); // saved after every mission
        }
        recordCurrent('correct');
        if (hintLadder.needsSimilar({ modelShown: run.rung >= 3, isSimilar: run.isSimilar, isLast: runKinds.isLast(run), kind: run.kind })) {
          run.similarSpec = hintLadder.similarSpec(q); // the next question is a similar one (once; the model again just moves on)
        }
        AUDIO.play('correct');
        el.classList.add('pop', 'right');
        const pb = world ? $all('#progress .pstep')[run.missionIndex] : $('#progress');
        if (pb && world) {
          pb.className = 'pstep filled world-' + run.worldId + ' drop'; // a finished mission fills its step, whatever the accuracy
          pb.innerHTML = '';
        } else if (pb) pb.textContent = runKinds.counterText(run);
        replayClass($('#mission-buddy'), 'bounce', TIMING.BOUNCE);
        const praise = feedbackUI.praiseFor(run);
        const grew = world || run.kind === 'freeplay' ? feedbackUI.growthFor() : null; // step 4 (P2): a skill moved up a level: one quiet sentence on the Next card
        SPEECH.say(grew ? praise + ' ' + grew : praise);
        later(() => showNextCard(praise, grew), TIMING.NEXT_CARD);
      }

      function showNextCard(praise, growthText) {
        feedbackUI.showNextCard(praise, () => {
          if (restHook && state.run.kind === 'world') restHook.onNextCard(state.run); // step 3: is today's limit reached?
          else if (freeHook && state.run.kind === 'freeplay') freeHook.onNextCard(state.run); // Free Play: the same question, asked for the stop
        }, growthText);
      }
      function nextMission() {
        const run = state.run;
        if (!run || !run.locked) return;
        if (run.kind === 'freeplay') { if (freeHook) freeHook.next(run); return; } // never auto: the flow decides the card or the next question
        if (run.kind === 'place') { if (placeHook) placeHook.next(run); return; } // step 8: the flow asks the service for the next question or ends
        if (run.kind !== 'world') {
          // R4: a check goes to the next unanswered cell in blueprint order
          const next = run.kind === 'check' ? assessmentEngine.nextCell(run.checkRun, run.cellId) : null;
          if (next) { showMission(run.checkRun.items.findIndex((it) => it.cellId === next)); return; }
          leaveRun();
          state.run = null;
          // P5-N3: an answer that was not recorded leaves the run open: never show "done" for it silently
          if (assessmentEngine.resumeCell(run.checkRun) !== null) {
            try { console.error('[NBA] Meadow Check ended with unrecorded answers; the run stays open'); } catch (e) { /* ignore */ }
            screens.show('home');
            return;
          }
          screens.show('check-end', { runId: run.checkRunId });
          return;
        }
        const advance = () => { if (run.missionIndex >= MISSIONS_PER_WORLD - 1) completeWorld(); else showMission(run.missionIndex + 1); };
        if (restHook && restHook.beforeNext(run, advance)) return; // step 3: the rest card took over (it calls advance)
        advance();
      }

      function completeWorld() {
        const run = state.run;
        progression.saveComplete(run.worldId, run.stars);
        leaveRun();
        const p = { worldId: run.worldId, stars: run.stars };
        state.run = null;
        screens.show('complete', p);
      }

      screens.registerActions({
        replay() { if (state.run && state.run.q) SPEECH.say(state.run.q.speech); },
        answer(el) { onAnswer(Number(el.getAttribute('data-value')), el); },
        tower(el) { onAnswer(Number(el.getAttribute('data-value')), el); },
        done(el) { if (state.run) onAnswer(state.run.buildCount, el); },
        next() { nextMission(); }
      }, ['answer', 'tower', 'done']);

      /** assessment-ui registers the check answer hook in its factory (main.js checks it at boot). */
      let checkAnswerHandler = null;
      function setCheckAnswerHandler(fn) { checkAnswerHandler = typeof fn === 'function' ? fn : null; }

      /** Free Play: freeplayFlow registers { onNextCard(run), next(run), recorded(rec) }; startFree shows question 1 of a new run (plan from freeplay.plan). */
      let freeHook = null;
      function setFreeHook(h) { freeHook = h && typeof h.next === 'function' && typeof h.recorded === 'function' && typeof h.onNextCard === 'function' ? h : null; }
      function startFree(fp, label, plan) {
        leaveRun();
        state.run = runKinds.newFreeRun(fp, label);
        state.run.fpPlan = plan;
        showMission(0);
        return state.run;
      }

      /** Step 3: restCard registers { onNextCard(run), beforeNext(run, advance) -> true when it shows the rest card }. */
      let restHook = null;
      function setRestHook(h) { restHook = h && typeof h.onNextCard === 'function' && typeof h.beforeNext === 'function' ? h : null; }

      /** Step 8: placementFlow registers { answer(value, el), next(run), leave(run) }; startPlace shows the first placement question, showPlace the next. */
      let placeHook = null;
      function setPlaceHook(h) { placeHook = h && typeof h.answer === 'function' && typeof h.next === 'function' && typeof h.leave === 'function' ? h : null; }
      function startPlace(firstQ, label) { leaveRun(); state.run = runKinds.newPlaceRun(label); state.run.placeQ = firstQ; showMission(0); return state.run; }
      function showPlace(question) { const run = state.run; if (run && run.kind === 'place') { run.placeQ = question; showMission(run.missionIndex + 1); } }

      return {
        startRun, startWorld, showMission, leaveRun, noteHidden, setRestHook, hasRestHook: () => !!restHook, setFreeHook, hasFreeHook: () => !!freeHook, startFree,
        setPlaceHook, hasPlaceHook: () => !!placeHook, startPlace, showPlace,
        startCheck, currentAttempt: attemptRecord, showNextCard, setCheckAnswerHandler, hasCheckAnswerHandler: () => !!checkAnswerHandler
      };
    });
}());
