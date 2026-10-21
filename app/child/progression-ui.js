/*
 * progression (L5): world completion (and the saved first-try tally, which is no longer shown), and the suggested world on Home
 * (v1 logic from section 10: onAnswer, completeWorld and suggestedWorldId).
 * Per student since P2: reads the learning service's cache and saves through
 * learning.saveWorldResult (best = max, done = or), which never makes the child wait.
 */
(function () {
  'use strict';

  NBA.define('progression', ['catalog', 'screens', 'learning'], (catalog, screens, learning) => {
    const { WORLDS } = catalog;
    const { state } = screens;

    const studentId = () => (state.currentStudent ? state.currentStudent.id : null);

    /** Best stars so far for a world. */
    function best(worldId) { return learning.worldRecord(worldId).best; }

    /** True once the world was finished (shown on Home as a quiet leaf). */
    function done(worldId) { return learning.worldRecord(worldId).done === true; }
    /** Home highlights the first world not completed yet (all worlds are always open). */
    function suggestedWorldId() {
      const w = WORLDS.find((x) => !learning.worldRecord(x.id).done);
      return w ? w.id : null;
    }

    /** After every solved mission: best = max(best, stars this run), saved at once. */
    function saveBest(worldId, stars) {
      learning.saveWorldResult(studentId(), worldId, { stars: stars, done: false }); // saved after every mission
    }

    /** After the last mission: best as above, and the world is done. */
    function saveComplete(worldId, stars) {
      learning.saveWorldResult(studentId(), worldId, { stars: stars, done: true });
    }

    return { best, done, suggestedWorldId, saveBest, saveComplete };
  });
}());
