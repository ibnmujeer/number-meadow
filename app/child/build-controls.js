/*
 * buildControls (L5): the build-mode controls of the mission screen, moved out of mission-ui.js in Free Play F3 so that file
 * stays under its line limit. +1 adds a counter, Undo removes the top one, Done is handled by missionUI (it submits the count).
 *   update()   Add is off at the cap, Undo is off at zero (reads the run on screen)
 * It registers the data-actions add-counter and undo; the question screen markup is drawn by missionUI.
 */
(function () {
  'use strict';

  NBA.define('buildControls', ['config', 'audio', 'dom', 'screens', 'questionTypes', 'renderers', 'hintDraw'],
    (config, audio, dom, screens, questionTypes, renderers, hintDraw) => {
      const { COL_ROWS } = config;
      const { $, $all, reducedMotion } = dom;
      const { AUDIO } = audio;
      const { state } = screens;

      const inputModeOf = (q) => questionTypes.get(q.typeId).inputMode;
      const buildable = (run) => !!run && !run.locked && !!run.q && inputModeOf(run.q) === 'build';

      function update() {
        const run = state.run;
        const add = $('[data-action="add-counter"]'), undo = $('[data-action="undo"]');
        if (add) add.disabled = run.buildCount >= run.q.cap;
        if (undo) undo.disabled = run.buildCount <= 0;
      }

      function addCounter() {
        const run = state.run;
        if (!buildable(run) || run.buildCount >= run.q.cap) return;
        const i = run.buildCount;
        const col = $all('#stage .build-stack .col')[Math.floor(i / COL_ROWS)];
        if (!col) return;
        col.insertAdjacentHTML('beforeend', renderers.counterAt(run.q, i, reducedMotion() ? '' : 'drop', ' data-i="' + i + '"'));
        run.buildCount++;
        AUDIO.play('place', run.buildCount); // pitch rises as the stack grows
        hintDraw.numberNew($('#stage')); // counting together: the new counter gets its number
        update();
      }

      function undoCounter() {
        const run = state.run;
        if (!buildable(run) || run.buildCount <= 0) return;
        const all = $all('#stage .build-stack .counter');
        if (all.length) all[all.length - 1].remove();
        run.buildCount--;
        AUDIO.play('undo');
        update();
      }

      screens.registerActions({ 'add-counter'() { addCounter(); }, undo() { undoCounter(); } }, ['add-counter', 'undo']);

      return { update };
    });
}());
