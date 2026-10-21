/*
 * main (L6): boot (DESIGN 4.2; v1 section 11 init). Checks that every module built, runs the
 * synchronous v1 init steps in v1 order, installs NBA_TEST (with ?test) before storage opens,
 * then boots storage asynchronously: repo.open() (IndexedDB, or memory with a reason),
 * the default student, the v1 save migration, the current student and their world progress.
 * Only then html[data-nba-ready="1"] is set and the title screen shown. #app stays empty
 * (the page background) until then; a plain "Loading..." line appears after boot.slowMs.
 */
(function () {
  'use strict';

  // The index.html module list (static_checks.py checks registry.test.js holds the same list).
  const REQUIRED = ['config', 'util', 'catalog', 'questionTypesBand1', 'questionTypesBand2', 'questionTypesBand2b', 'questionTypesBand2c', 'questionTypesBand2d', 'questionTypesBand2e', 'questionTypesBand3a', 'questionTypesBand3b', 'questionTypesBand3c', 'questionTypesBand3d', 'questionTypesBand3e', 'questionTypesBand3f', 'questionTypes', 'generator', 'feedback', 'hintLadderBand2', 'hintLadderBand2c', 'hintLadderBand2d', 'hintLadderBand2e', 'hintLadderBand3a', 'hintLadderBand3b', 'hintLadderBand3c', 'hintLadderBand3d', 'hintLadderBand3e', 'hintLadderBand3f', 'hintLadder', 'growth', 'errorEngine', 'masteryEngine', 'adaptiveEngine', 'targets', 'prereqEngine', 'prereqPick', 'placementEngine', 'assessmentEngine', 'learningEngine', 'adultWords', 'childSettings', 'look', 'numberWords', 'usageMath', 'reviewEngine', 'reviewPick', 'activeTime', 'freeplayPick', 'freeplayEngine', 'freeplayStats', 'adultSummary', 'reportText', 'schema',
    'memoryAdapter', 'migrations', 'idbAdapter', 'prefs', 'repo', 'exporter', 'importUpgraders', 'importRules', 'importer', 'children', 'writeQueue', 'learning', 'review', 'assessments', 'placements', 'usage', 'freeplay', 'adultGate', 'dataReset', 'offlineModel', 'offline', 'dom', 'audio', 'speech', 'buddyLooks', 'art',
    'counters', 'meadowArt', 'takeAway', 'screens', 'lookUI', 'renderersBand1', 'renderersBand2', 'renderersBand2c', 'renderersBand2d', 'renderersBand2e', 'renderersBand3a', 'renderersBand3b', 'renderersBand3c', 'renderersBand3d', 'renderersBand3e', 'renderersBand3f', 'renderers', 'progression', 'runKinds', 'hintDraw', 'hintDrawBand1', 'hintDrawBand2', 'hintDrawBand2c', 'hintDrawBand2d', 'hintDrawBand2e', 'hintDrawBand3a', 'hintDrawBand3b', 'hintDrawBand3c', 'hintDrawBand3d', 'hintDrawBand3e', 'hintDrawBand3f', 'hintUI', 'feedbackUI', 'buildControls', 'missionUI', 'checkUI', 'restCard', 'placementFlow', 'freeplayFlow', 'freeplayArt', 'freeplayCards', 'freeplayUI', 'buddyUI', 'gameUI', 'adultKit', 'adultStorage', 'fileSave', 'adultGateUI', 'adultListUI', 'adultPlacementUI', 'adultChildUI', 'adultSettingsUI', 'adultDataUI', 'adultAboutUI', 'adultFpMoreUI', 'adultFreePlayUI', 'testHook'];
  const SCREEN_NAMES = ['title', 'picker', 'home', 'story', 'mission', 'complete', 'check-intro', 'check-end', 'place-intro', 'place-end', 'players', 'mybuddy', 'adults',
    'adult-forgot', 'adult-list', 'adult-add', 'adult-child', 'adult-report', 'adult-settings', 'adult-pin', 'adult-data', 'adult-about', 'freeplay', 'freeplay-end', 'adult-fp-more', 'adult-freeplay'];

  /** Plain message for the child plus a <details> list of the module errors for adults. */
  function showBootError(errors) {
    const app = document.getElementById('app');
    if (!app) return;
    app.textContent = '';
    const p = document.createElement('p');
    p.style.cssText = 'font-size:24px;padding:16px';
    p.textContent = 'The game could not start. Please reload the page.';
    const details = document.createElement('details');
    details.style.cssText = 'padding:0 16px;font-size:16px';
    const summary = document.createElement('summary');
    summary.style.cssText = 'min-height:64px;display:flex;align-items:center';
    summary.textContent = 'Details';
    const list = document.createElement('ul');
    errors.forEach((e) => {
      const li = document.createElement('li');
      li.textContent = e.module + ' (' + e.kind + '): ' + e.detail;
      list.appendChild(li);
    });
    details.appendChild(summary);
    details.appendChild(list);
    app.appendChild(p);
    app.appendChild(details);
  }

  const booted = NBA.boot(REQUIRED);
  if (!booted.ok) { showBootError(booted.errors); return; }

  const config = NBA.require('config');
  const prefs = NBA.require('prefs');
  const repo = NBA.require('repo');
  const migrations = NBA.require('migrations');
  const children = NBA.require('children');
  const learning = NBA.require('learning');
  const speech = NBA.require('speech');
  const audio = NBA.require('audio');
  const counters = NBA.require('counters');
  const screens = NBA.require('screens');
  const missionUI = NBA.require('missionUI');
  const gameUI = NBA.require('gameUI');
  const testHook = NBA.require('testHook');

  // Boot step 2 (DESIGN 4.2): the content data is consistent and every activity has logic and a renderer.
  // P4-N1: the mastery thresholds are consistent (developing lower bound = needs-support bound).
  const catalogProblems = NBA.require('catalog').validate({ questionTypes: NBA.require('questionTypes') })
    .concat(NBA.require('masteryEngine').configProblems(config.mastery));
  if (catalogProblems.length) {
    try { console.error('[NBA] content data problems: ' + catalogProblems.join('; ')); } catch (e) { /* ignore */ }
    showBootError(catalogProblems.map((p) => ({ module: 'catalog', kind: 'invalid-data', detail: p })));
    return;
  }

  try {
    screens.requireScreens(SCREEN_NAMES);
    if (!screens.hasBuddyWriter()) throw new Error('[NBA] no buddy writer registered (gameUI)');
    if (!missionUI.hasCheckAnswerHandler()) throw new Error('[NBA] no check answer handler registered (checkUI)');
    if (!missionUI.hasRestHook()) throw new Error('[NBA] no rest card hook registered (restCard)');
    if (!missionUI.hasFreeHook()) throw new Error('[NBA] no Free Play hook registered (freeplayFlow)');
    if (!missionUI.hasPlaceHook()) throw new Error('[NBA] no placement hook registered (placementFlow)');
  } catch (e) {
    try { console.error(e.message); } catch (e2) { /* ignore */ }
    showBootError([{ module: 'screens', kind: 'missing-screen', detail: e.message }]);
    return;
  }

  /** The test hook exists only when the URL has ?test (for example index.html?test=1). */
  const TEST_MODE = /[?&]test(=|&|$)/.test(window.location.search);

  /** Block pinch, double-tap and keyboard zoom, text selection menus and long-press menus (not inside a text box). */
  function guardZoom() {
    const stop = (e) => { if (e.cancelable) e.preventDefault(); };
    const guard = (e) => stop(e);
    // Step 3: text boxes on the Grown-ups screens may be selected (to copy the report by hand) and get their menu.
    const inField = (e) => { const t = e.target && e.target.nodeType === 1 ? e.target : e.target && e.target.parentElement; return !!(t && t.closest && t.closest('textarea, input')); };
    const guardText = (e) => { if (!inField(e)) stop(e); };
    ['gesturestart', 'gesturechange', 'gestureend'].forEach((t) => document.addEventListener(t, stop, { passive: false }));
    document.addEventListener('touchmove', (e) => { if (e.touches && e.touches.length > 1) stop(e); }, { passive: false });
    document.addEventListener('dblclick', guard, { passive: false });
    document.addEventListener('contextmenu', guardText);
    document.addEventListener('selectstart', guardText);
    window.addEventListener('wheel', (e) => { if (e.ctrlKey) guard(e); }, { passive: false });
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && ['+', '=', '-', '_', '0'].indexOf(e.key) >= 0) guard(e);
    });
  }

  let resizeFrame = 0;
  function onResize() {
    if (resizeFrame) return;
    resizeFrame = window.requestAnimationFrame(() => { resizeFrame = 0; counters.applyScale(); counters.fitStage(); });
  }

  /** What the asynchronous boot found (NBA_TEST.state() reads it). */
  const bootInfo = { stage: 'start', storageMode: null, storageReason: null, migration: null, defaultStudentId: null, error: null };

  function init() {
    prefs.load();
    speech.SPEECH.init();
    counters.applyScale();
    guardZoom();
    document.getElementById('app').addEventListener('click', screens.onClick);
    document.addEventListener('pointerdown', () => audio.AUDIO.unlock(), { passive: true }); // backup unlock
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { speech.SPEECH.cancel(); missionUI.noteHidden(); learning.flush(); }
    });
    window.addEventListener('pagehide', () => { missionUI.leaveRun(); learning.flush(); });
  }

  /** Steps 6 to 9 of DESIGN 4.2. Never rejects: storage problems fall back to memory. */
  async function bootStorage() {
    bootInfo.stage = 'open';
    const opened = await repo.open();
    bootInfo.storageMode = opened.mode;
    bootInfo.storageReason = opened.reason;
    bootInfo.stage = 'default-student';
    const def = await children.ensureDefaultStudent();
    bootInfo.defaultStudentId = def.id;
    bootInfo.stage = 'migration';
    bootInfo.migration = await migrations.migrateV1({ repo: repo, prefs: prefs, studentId: def.id });
    NBA.require('adultStorage').noteMigration(bootInfo.migration); // the Grown-ups banner says when the older save could not be written
    bootInfo.stage = 'student';
    // The migration may have given the default player its v1 buddy choice: read the record again.
    let fresh = null;
    try { fresh = await children.get(def.id); } catch (e) { fresh = null; }
    let current = await children.chooseStudent(prefs.get('lastStudentId'), fresh || def);
    await learning.loadStudent(current.id);
    // A failed migration write: show the validated v1 values for this session (review P2-M1).
    const unsaved = bootInfo.migration && bootInfo.migration.memoryOnly;
    if (unsaved && current.id === def.id) {
      learning.applyUnsaved(current.id, unsaved.worlds);
      if (!current.heroId && unsaved.heroId) current = Object.assign({}, current, { heroId: unsaved.heroId });
    }
    screens.state.currentStudent = current;
    await gameUI.refreshPlayers(); // P6: who the players screen lists (D4: shown only with 2 or more)
  }

  init();
  let readyResolve;
  const ready = new Promise((resolve) => { readyResolve = resolve; });
  if (TEST_MODE) testHook.install({ ready: ready, bootInfo: bootInfo });

  const slowTimer = setTimeout(() => {
    const app = document.getElementById('app');
    if (!NBA.ready && app && !app.firstChild) {
      const p = document.createElement('p');
      p.style.cssText = 'font-size:24px;padding:16px';
      p.textContent = 'Loading...';
      app.appendChild(p);
    }
  }, config.boot.slowMs);

  bootStorage().then(() => {
    bootInfo.stage = 'ready';
    clearTimeout(slowTimer);
    NBA.ready = true;
    document.documentElement.dataset.nbaReady = '1';
    screens.show('title');
    NBA.require('offline').register(); // after the page is ready and loaded; does nothing from a file or in a test page without &sw=1
    readyResolve(bootInfo);
  }).catch((e) => {
    clearTimeout(slowTimer);
    bootInfo.error = (e && e.message) || String(e);
    try { console.error('[NBA] boot failed: ' + bootInfo.error); } catch (e2) { /* ignore */ }
    showBootError([{ module: 'main', kind: 'boot-failed', detail: bootInfo.error }]);
    readyResolve(bootInfo);
  });
}());
