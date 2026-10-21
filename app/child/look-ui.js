/*
 * lookUI (L5): puts the class look-grown on the app root (#app) for the screens that get the calm, grown-up look
 * (Step 11, D11-3 = B). screens.show() calls apply(name) just before it draws a screen, so the class is right from the
 * first paint and every screen change re-decides it. The decision is the pure look.lookFor; this module only reads the
 * current child's stored age and band (it never writes them) and, for a mission, the band of the activity's concept
 * from NBA.data.concepts.map. No change to mission-ui.js or to any Free Play file: they never see the class logic.
 * Reduced motion is unaffected (the class changes only sizes, spacing and the page grain).
 */
(function () {
  'use strict';
  NBA.define('lookUI', ['look', 'catalog', 'screens'], (look, catalog, screens) => {
    const BAND_OF = {};
    NBA.data.concepts.map.forEach((row) => { BAND_OF[row.id] = row.band; });
    const bandOf = (conceptId) => (Object.prototype.hasOwnProperty.call(BAND_OF, conceptId) ? BAND_OF[conceptId] : null);

    /** The band of the concept of the question now on screen (state.run.q), or null when there is none. */
    function runConceptBand() {
      const run = screens.state.run;
      const act = run && run.q ? catalog.activityById(run.q.typeId) : null;
      return act ? bandOf(act.primaryConcept) : null;
    }

    /** Set or clear the class for the screen about to be shown; returns whether the look is on. */
    function apply(name) {
      const app = document.getElementById('app');
      const child = screens.state.currentStudent || {};
      const on = look.lookFor({
        screen: name, age: child.age, ageBand: child.ageBand,
        conceptBand: name === look.PLAY_SCREEN ? runConceptBand() : null
      });
      if (app) app.classList.toggle(look.CLASS_NAME, on);
      return on;
    }

    screens.setScreenHook(apply);
    return { apply, runConceptBand, bandOf };
  });
}());
