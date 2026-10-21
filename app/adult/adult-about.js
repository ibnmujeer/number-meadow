/*
 * adultAboutUI (L6): 'adult-about', "About and offline" (Step 12, H5b-2). Grown-ups only: it opens from a button on the first
 * Grown-ups screen, so it is shown only after the gate has been passed. A child never sees it, and nothing here is an install prompt.
 *   Works offline   ready / not ready / not available on this copy (asked from the offline copy by message, no network request)
 *   Update          when a complete newer version is waiting: "Update ready, install on next start" and one button to confirm.
 *                   Nothing changes while the app is open; the new version is used the next time it is closed and opened again.
 *   Your data       whether the browser will keep this site's data (asked once per session, here and nowhere else)
 *   Install help    plain steps for an Android phone and an iPhone
 *   Backup reminder text only (no notification)
 * Nothing is saved by this screen.
 */
(function () {
  'use strict';

  NBA.define('adultAboutUI', ['screens', 'adultKit', 'adultStorage', 'adultGateUI', 'offline'], (screens, kit, storage, gateUI, offline) => {
    const ANDROID = [
      'Open the web address of Number Meadow in Chrome while the phone has internet. Leave it open for about a minute.',
      'Tap the three dots at the top right of Chrome.',
      'Tap Install app, or Add to Home screen.',
      'Open Number Meadow from the new icon, and add the children there.',
      'From now on it works without internet.'
    ];
    const IPHONE = [
      'Open the web address of Number Meadow in Safari while the phone has internet. Leave it open for about a minute.',
      'Tap the Share button (a square with an arrow pointing up).',
      'Scroll down and tap Add to Home Screen, then tap Add.',
      'Open Number Meadow from the new icon on the Home Screen, and add the children there.',
      'The installed app may keep its own saved data, apart from the Safari tab. If a child already has progress in Safari, press Save a backup in Safari, then use Choose a backup file in the installed app. We have not checked this on a real iPhone yet.'
    ];
    const steps = (list) => list.map((s, i) => kit.text('Step ' + (i + 1) + ': ' + s)).join('');

    function offlineCard(st) {
      const extra = st.kind === 'file' ? kit.text('This copy runs from a file and is already offline. Installing to a phone needs the hosted copy.') :
        (st.kind === 'notReady' && st.missing > 0 ? kit.text(st.missing + ' of ' + st.total + ' files are not saved yet.') : '');
      return kit.card(kit.heading('Works offline') + '<p class="ad-text" id="ad-offline-line">' + kit.esc(offline.offlineLine(st)) + '</p>' + extra +
        kit.text('Open the app once with internet, then use it any time, with or without internet.'));
    }

    function updateCard(st, msg) {
      if (!st.update) return msg ? kit.card(kit.msg('ad-update-msg', msg)) : '';
      const line = offline.updateLine(st);
      return kit.card(kit.heading('Update') + '<p class="ad-text" id="ad-update-line">' + kit.esc(line) + '</p>' +
        (st.update.approved ? '' : kit.text('A newer version of Number Meadow has been saved on this device. Nothing changes while a child is playing. ' +
          'Press the button, then close the app completely and open it again.') +
          kit.btn('ad-update', 'Install on next start', { go: true, attrs: { 'data-via': st.update.via } })) + kit.msg('ad-update-msg', msg));
    }

    gateUI.register('adult-about', {
      async load() {
        const st = await offline.status();
        const kept = await offline.persistence(); // the one place that asks the browser to keep the data: after the gate, Grown-ups only
        return { st: st, kept: kept };
      },
      render(p) {
        const d = p.data || { st: { kind: 'none', update: null }, kept: { state: 'unknown' } };
        return kit.page('adult-about', 'About and offline', storage.aboutHTML() + offlineCard(d.st) + updateCard(d.st, p.msg) +
          kit.card(kit.heading('Your saved data') + '<p class="ad-text" id="ad-keep-line">' + kit.esc(offline.persistLine(d.kept)) + '</p>' +
            kit.note('On an iPhone or iPad, Safari may still remove the saved data of a site that is not used for a week or more. We have not checked on a real phone whether the answer above prevents that, so keep saving backups.')) +
          kit.card(kit.heading('Install on an Android phone (Chrome)') + steps(ANDROID)) +
          kit.card(kit.heading('Install on an iPhone (Safari)') + steps(IPHONE)) +
          kit.card(kit.heading('Backup reminder') + kit.text('Save a backup every week, and before any break of a week or more. Open Data, then press Save a backup. ' +
            'The app never sends reminders or notifications.')));
      }
    });

    screens.registerActions({
      'ad-about'() { gateUI.go('adult-about'); },
      async 'ad-update'(el) {
        const ok = await offline.approve(el.getAttribute('data-via'));
        gateUI.go('adult-about', { msg: ok ? '' : 'That did not work. Please try again.' });
      }
    });

    return {};
  });
}());
