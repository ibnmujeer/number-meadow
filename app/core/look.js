/*
 * look (L2): decides whether a screen gets the calm, grown-up look (Step 11, owner decision D11-3 = B). Pure: no DOM,
 * no storage, no clock; the caller passes what it already has and nothing is ever written. The look is derived on read
 * from the age and age band already stored on the child's record, so there is no new saved data.
 *   lookFor({ screen, age, ageBand, conceptBand })  true when the screen gets the look:
 *       - 'home', 'picker' and 'freeplay': when the child is older (ageBand '10-12', or a stored age of 10 or more);
 *       - 'mission' (every play screen): when the activity's concept is in band 3, whatever the child's age;
 *       - any other screen (title, story, Grown-ups screens, ...): never.
 *     A missing, null or odd age/band, a child under 10 and an unknown concept band all give false: today's look.
 *   isOlder(child)   the age rule alone; child is { age, ageBand } (or null)
 *   CLASS_NAME       the class child/look-ui.js puts on the app root; styles/band3.css styles it
 *   OLDER_SCREENS    the screens that follow the child's age
 *   PLAY_SCREEN      the screen that follows the activity's concept band
 * The age words in this file are allowed by static_checks.py (the Free Play files themselves never read age).
 */
(function () {
  'use strict';
  NBA.define('look', [], () => {
    const CLASS_NAME = 'look-grown';
    const OLDER_BAND = '10-12';
    const OLDER_AGE = 10;
    const BAND_3 = 3;
    const OLDER_SCREENS = Object.freeze(['home', 'picker', 'freeplay']);
    const PLAY_SCREEN = 'mission';

    function isOlder(child) {
      const c = child && typeof child === 'object' ? child : {};
      if (c.ageBand === OLDER_BAND) return true;
      return typeof c.age === 'number' && Number.isFinite(c.age) && c.age >= OLDER_AGE;
    }

    function lookFor(input) {
      const x = input && typeof input === 'object' ? input : {};
      if (OLDER_SCREENS.indexOf(x.screen) >= 0) return isOlder(x);
      if (x.screen === PLAY_SCREEN) return x.conceptBand === BAND_3;
      return false;
    }

    return { lookFor, isOlder, CLASS_NAME, OLDER_SCREENS, PLAY_SCREEN };
  });
}());
