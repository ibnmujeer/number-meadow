/*
 * adultFpMoreUI (L6): "Ask a grown-up" on the Free Play end screen (F3, owner decision G2). The child button carries the
 * action fp-ask; the Grown-ups area registers it here, so the child code never depends on the adult code. The gate comes first
 * (a PIN, or press and hold: only the PIN keeps a child out, the hold can be passed by a child). Then one screen asks:
 * allow 15 more minutes of play today? Yes calls freeplay.approve (memory only: a reload asks again; each approval adds another
 * 15 minutes) and shows the category screen. Back goes Home. Nothing is stored.
 *   'adult-fp-more'   the question and its two buttons (Grown-ups screens are quiet: no sound, no speech)
 */
(function () {
  'use strict';

  NBA.define('adultFpMoreUI', ['config', 'screens', 'freeplay', 'adultKit', 'adultGateUI'],
    (config, screens, freeplay, kit, gateUI) => {
      const { state } = screens;
      const MIN = config.freeplay.approvalMin;

      gateUI.register('adult-fp-more', {
        render() {
          return kit.page('adult-fp-more', 'More play today?',
            kit.card(kit.text('Allow ' + MIN + ' more minutes of Free Play today?') +
              kit.note('This is kept only until the page is closed. You will be asked again after that.') +
              '<div class="ad-actions">' + kit.btn('ad-fp-allow', 'Allow ' + MIN + ' more minutes', { go: true }) + '</div>'), { back: 'home' });
        }
      });

      screens.registerActions({
        'fp-ask'() { gateUI.go('adult-fp-more'); },
        async 'ad-fp-allow'() {
          const child = state.currentStudent;
          if (!child || !gateUI.unlocked()) return;
          await freeplay.approve(child);
          screens.show('freeplay'); // any child screen closes the Grown-ups area again
        }
      });

      return {};
    });
}());
