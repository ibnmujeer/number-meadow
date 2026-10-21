/*
 * runKinds (L5): what differs between world, Meadow Check and Free Play runs on the one mission screen
 * (DESIGN 16.6), so missionUI keeps a single copy of the markup and actions.
 *   newCheckRun(checkRun)  the run object (every v1 field plus kind fields)
 *   newFreeRun(fp, label)  Free Play (F2): kind 'freeplay', no world, no plan; fp = the service's run part (freeplay.newRun)
 *   newPlaceRun(label)  placement (step 8): kind 'place', no world, no plan; the service owns the staircase, the record and the session
 *   header(run)       { title (HTML-escaped), label }: world name / "Meadow Check" / the Free Play category label, no count
 *   progressHTML(run) the 8 progress steps (world runs) or the "4 of 12" counter in the same box; nothing in Free Play or placement
 *   counterText(run)  its text; isLast(run) the last-question rule (never in Free Play); sessionArgs(run, sid); attemptWhere(run)
 *   similarTag(run, spec)  the tag (decision) of the similar question after a model in Free Play, else null
 *   homeBtn(run) changeBtn(run)  the header buttons: Home (Free Play: the Take a break icon, action fp-break) and, in Free Play only, Change
 * Free Play tag convention (no schema change): worldId 'master' and missionId 'master.m1' to 'master.m8' (the question number
 * modulo 8), a session of kind 'play' with worldId null, and the real tag inside attempt.decision (source 'freeplay').
 */
(function () {
  'use strict';

  NBA.define('runKinds', ['config', 'util', 'catalog', 'assessmentEngine', 'art', 'feedback'], (config, util, catalog, assessmentEngine, art, feedback) => {
    const { MISSIONS_PER_WORLD } = config;
    const { esc, repeat } = util;
    const base = () => ({ firstTry: true, wrongCount: 0, locked: false, buildCount: 0, sessionId: null, slot: null, activities: [], q: null,
      stars: 0, used: new Set(), sittingCount: 0, worldId: null, checkRunId: null });

    function newCheckRun(checkRun) {
      const items = checkRun.items;
      return Object.assign(base(), { kind: 'check', checkRunId: checkRun.id, checkRun: checkRun, cellId: null, total: items.length,
        plan: items.map((it) => it.activityId), missionIndex: 0, results: repeat(null, items.length) });
    }

    function newFreeRun(fp, label) {
      return Object.assign(base(), { kind: 'freeplay', fp: fp, label: label || '', plan: [], missionIndex: 0, results: [], total: 0 });
    }

    /** placement (step 8): no world, no fixed length; placeQ holds the current question (set by placementFlow). No counter is shown. */
    function newPlaceRun(label) {
      return Object.assign(base(), { kind: 'place', label: label || 'Meadow Check', placeQ: null, plan: [], missionIndex: 0, results: [], total: 0 });
    }

    function header(run) {
      const i = run.missionIndex + 1;
      if (run.kind === 'freeplay') return { title: esc(run.label), label: '' };
      if (run.kind === 'place') return { title: 'Meadow Check', label: '' }; // step 8: no count, the length is not known
      if (run.kind === 'check') return { title: 'Meadow Check', label: 'Question ' + i + ' of ' + run.total };
      return { title: esc(catalog.worldById(run.worldId).name), label: 'Mission ' + i + ' of ' + MISSIONS_PER_WORLD };
    }

    /** "4 of 12" answered (check). */
    function counterText(run) {
      return Object.keys(run.checkRun.answers).length + ' of ' + run.total;
    }
    /** World runs: the 8 progress steps (one filled per finished mission, whatever the accuracy); others: the counter. */
    function progressHTML(run) {
      if (run.kind === 'freeplay' || run.kind === 'place') return ''; // step 8: no counter in a placement run
      if (run.kind !== 'world') return '<p id="progress" class="run-count">' + counterText(run) + '</p>';
      const w = catalog.worldById(run.worldId);
      let html = '<div id="progress" class="progress" aria-hidden="true">';
      for (let i = 0; i < MISSIONS_PER_WORLD; i++) {
        const r = run.results[i];
        html += '<span class="pstep' + (r ? ' filled world-' + w.id : '') + (!r && i === run.missionIndex ? ' current' : '') + '"></span>';
      }
      return html + '</div>';
    }

    /** The last question: mission 8; a check with no unanswered cell after this one. */
    function isLast(run) {
      if (run.kind === 'freeplay' || run.kind === 'place') return false; // the service decides when a placement run stops
      if (run.kind === 'check') return assessmentEngine.nextCell(run.checkRun, run.cellId) === null;
      return run.missionIndex >= MISSIONS_PER_WORLD - 1;
    }

    function sessionArgs(run, studentId) {
      if (run.kind === 'check') return { studentId: studentId, kind: 'assessment', assessmentId: run.checkRunId };
      return { studentId: studentId, kind: 'play', worldId: run.worldId }; // Free Play: worldId null marks it
    }
    /** Context, ids and missionId of a world attempt (DESIGN 9.2 missionId patterns); Free Play uses world master (every activity lists it). */
    function attemptWhere(run) {
      if (run.kind === 'freeplay') return { context: 'play', worldId: 'master', missionId: 'master.m' + ((run.fp.n % MISSIONS_PER_WORLD) + 1) };
      return { context: 'play', worldId: run.worldId, missionId: run.worldId + '.m' + (run.missionIndex + 1) };
    }

    /** The similar question after a model is an ordinary tagged question of the same category (event 'similar'). */
    function similarTag(run, spec) {
      if (run.kind !== 'freeplay') return null;
      const a = catalog.activityById(spec.activityId);
      return { action: 'freeplay', source: 'freeplay', reasonCode: 'similar_after_model', category: run.fp.tag, strand: run.fp.lastStrand,
        activityId: spec.activityId, representation: a ? a.representation : null, template: spec.template || null,
        fromDifficulty: spec.difficulty, toDifficulty: spec.difficulty, event: 'similar', guided: false };
    }

    /** Placement (step 8): the header stop button, always visible, labelled "All done" (ends the run kindly, no "are you sure"). */
    const stopBtn = () => '<button type="button" class="icon-btn place-stop" data-action="place-stop" aria-label="All done">' +
      art.ICONS.tick + '<span class="place-stop-text">All done</span></button>';

    /** The header Home button; in Free Play it is Take a break (home with a calm note); in placement it is the All done stop button. */
    const homeBtn = (run) => (run.kind === 'place' ? stopBtn() : run.kind === 'freeplay' ? art.iconBtn('fp-break', 'home', feedback.freeplayButton('takeBreak')) : art.iconBtn('home', 'home', 'Home'));
    /** Free Play only: Change goes back to the categories, at no cost and with no message. */
    const changeBtn = (run) => (run.kind === 'freeplay' ? art.iconBtn('fp-change', 'swap', feedback.freeplayButton('change')) : '');

    return { newCheckRun, newFreeRun, newPlaceRun, header, counterText, progressHTML, isLast, sessionArgs, attemptWhere, similarTag, homeBtn, changeBtn };
  });
}());
