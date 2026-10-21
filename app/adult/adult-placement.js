/*
 * adultPlacementUI (L6): the "Start a Meadow Check" button and its band chooser on the Grown-ups child page
 * (step 8; DESIGN 15 section 6, D-C, D-E). The adult starts a placement check for one child, from the child
 * page, inside the existing Meadow Checks card, behind the same gate as the rest of the area. There is NO start
 * button on the child's own Home screen (D-C).
 *
 *   cardExtra(child, settings)  the HTML added below the Meadow Checks list: the start button, the age-band
 *                               chooser (shown only when the child has no stored band AND no age; P8-5: the
 *                               answer is used for THIS run only and is NEVER saved on the child record), and a
 *                               plain warning when Sound is off (P8-18, D-E: no separate voice switch).
 *
 * The action ad-check selects the child in the game cache, then shows the child-side place-intro screen with the
 * chosen band; any child screen closes the Grown-ups area again (the pattern of adultFpMoreUI). A band toggle
 * (ad-check-band) only sets this run's band in module memory and redraws the card; nothing is written until the
 * child answers a question (P8-15: no pending record, no resume).
 *
 * The band words and the staircase numbers are a design hypothesis (data/placement.js, config.placement).
 */
(function () {
  'use strict';

  NBA.define('adultPlacementUI', ['config', 'childSettings', 'prefs', 'screens', 'gameUI', 'adultKit', 'adultGateUI'],
    (config, childSettings, prefs, screens, gameUI, kit, gateUI) => {
      const { state } = screens;
      const BANDS = [['4-6', '4 to 6'], ['7-9', '7 to 9'], ['10-12', '10 to 12']];
      const bandOfAge = (age) => (typeof age !== 'number' ? null : (age <= 6 ? '4-6' : (age <= 9 ? '7-9' : '10-12')));
      let cardChild = null;    // the child record the card was last drawn for
      let chosenBand = null;   // this run's band when the child has none (never saved on the child, P8-5)

      /** The band the check should start at: the stored band, else from the age, else this run's choice (or null). */
      function bandFor(child) {
        if (child && typeof child.ageBand === 'string') return child.ageBand;
        const fromAge = child ? bandOfAge(child.age) : null;
        return fromAge || chosenBand; // null means "Not sure": the engine starts at the easiest rung
      }
      const needsChooser = (child) => !(child && (typeof child.ageBand === 'string' || typeof child.age === 'number'));

      /** The HTML added below the Meadow Checks list on the child page. */
      function cardExtra(child, settings) {
        if (!child) return '';
        if (!cardChild || cardChild.id !== child.id) chosenBand = null; // a fresh child resets the run choice
        cardChild = child;
        const s = settings || childSettings.settingsOf(child, prefs.get('sound'));
        const label = 'Start a Meadow Check';
        const parts = [];
        if (needsChooser(child)) {
          parts.push(kit.text('Choose an age group for this check (not saved).'));
          const toggles = BANDS.map((b) => kit.toggle('ad-check-band', b[1], chosenBand === b[0], { 'data-band': b[0] }))
            .concat(kit.toggle('ad-check-band', 'Not sure', chosenBand === null, { 'data-band': '' }));
          parts.push('<div class="ad-choices" role="group" aria-label="Age group for this check">' + toggles.join('') + '</div>');
        }
        parts.push(kit.note('Best with a grown-up nearby. Takes about ' + config.assessment.targetMinutes +
          ' minutes. Questions are read aloud when Sound is on.'));
        if (!s.sound) parts.push(kit.text('Sound is off for this child, so nothing will be read aloud.'));
        parts.push(kit.btn('ad-check', label, { go: true }));
        return parts.join('');
      }

      /** Hand over to the child-side placement run for the current child (gateUI closes the area). */
      async function startCheck(child) {
        if (!child || !gateUI.unlocked()) return;
        const band = bandFor(child);
        await gameUI.selectStudent(child.id); // load this child's learning cache
        chosenBand = null;
        cardChild = null;
        screens.show('place-intro', band ? { band: band } : {}); // any child screen closes the Grown-ups area
      }

      screens.registerActions({
        'ad-check-band'(el) {
          if (!gateUI.unlocked() || !cardChild) return;
          const b = el.getAttribute('data-band');
          chosenBand = b ? b : null;
          gateUI.go('adult-child', { id: cardChild.id }); // redraw the card with the new choice marked
        },
        'ad-check'() {
          if (!gateUI.unlocked() || !cardChild) return;
          startCheck(cardChild);
        }
      });

      return { cardExtra, bandFor, needsChooser, startCheck };
    });
}());
