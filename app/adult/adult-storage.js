/*
 * adultStorage (L6): the storage banner and the About line of the Grown-ups screens (Step 12, D12-8).
 *   describe(s)    PURE. s = { mode, reason, state, errorName, pending, dropped, prefsBroken, v1Unsaved } -> null (all is well) or
 *                  { level: 'problem' | 'note', title, lines: [string] } in plain words, one reason per code.
 *   snapshot()     the live s, read from repo, learning and prefs (nothing is written, nothing is stored).
 *   noteMigration(report)  main.js tells the module how the older-version (v1) merge ended at boot; kept in memory for this
 *                  page only (a merge that could not be written sets v1Unsaved until the page closes).
 *   bannerHTML()   the banner card, or '' when all is well. Shown ONLY by the child list, the child page and the Data page,
 *                  which render only after the gate has been passed. The gate and every child screen never call it.
 *   aboutHTML()    the About card with the app version (schema.APP_VERSION).
 * The banner is derived on read. It saves nothing and adds no field to the database.
 */
(function () {
  'use strict';

  NBA.define('adultStorage', ['util', 'schema', 'repo', 'learning', 'prefs', 'adultKit'],
    (util, schema, repo, learning, prefs, kit) => {
      const { esc } = util;
      const LOST = 'Progress is kept only while this page stays open. Use Save a backup on the Data page before closing it.';
      const REASONS = {
        unavailable: 'This browser does not let the app keep data (storage is switched off or not supported). Private browsing often does this.',
        open_threw: 'The browser refused to open its storage. Private browsing or strict privacy settings often do this.',
        open_error: 'The browser could not open its storage.',
        db_newer_than_app: 'This device already holds data from a newer version of the app, and this older copy leaves it alone. ' +
          'Nothing was changed or deleted. Open the newer copy to see that data.',
        upgrade_failed: 'The app could not move the saved data to its newer format. The old data was left as it was. Reload the page to try again.',
        open_timeout: 'The browser took too long to open its storage. Reload the page to try again.',
        open_blocked: 'Another window or tab with this app is still open and is blocking its storage. Close the other ones, then reload.',
        write_failed: 'The browser opened its storage but would not save to it. The device may be full, or the browser may limit this page.'
      };
      const QUOTA = 'The storage on this device looks full. Free some space on the device.';
      const codeOf = (reason) => String(reason || '').split(':')[0];
      let v1Unsaved = false;
      const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many);

      /** Plain words for the state of storage; null when nothing needs an adult's attention. */
      function describe(s) {
        const x = s || {};
        const pending = Number(x.pending) || 0, dropped = Number(x.dropped) || 0;
        const full = x.errorName === 'QuotaExceededError';
        let out = null;
        if (x.mode === 'memory') {
          out = { level: 'problem', title: 'This device is not saving progress.',
            lines: [REASONS[codeOf(x.reason)] || REASONS.open_error, LOST, 'Reason code: ' + String(x.reason || 'unknown')] };
        } else if (x.state === 'closed') {
          out = { level: 'problem', title: 'This page lost its link to the saved data.',
            lines: ['Another copy of the app updated the saved data while this page was open. Reload this page before anyone plays on. ' +
              'What was saved before is still there.'] };
        } else if (x.state === 'degraded') {
          out = { level: 'problem', title: 'Some answers are not being saved.',
            lines: [full ? QUOTA : 'The browser keeps refusing to save. Answers made now may be lost.', 'Use Save a backup on the Data page now.'] };
        } else if (pending > 0 && x.errorName) {
          out = { level: 'problem', title: 'Some answers are waiting to be saved.',
            lines: [plural(pending, 'answer is', 'answers are') + ' waiting. The last save did not work, so the app will try again.' +
              (full ? ' ' + QUOTA : '')] };
        }
        if (dropped > 0) {
          const line = plural(dropped, 'answer', 'answers') + ' could not be kept because saving kept failing. ' + (dropped === 1 ? 'It is' : 'They are') + ' lost.';
          if (out) out.lines.push(line); else out = { level: 'problem', title: 'Some answers were lost.', lines: [line] };
        }
        if (x.v1Unsaved) {
          const line = 'The progress saved by the older version of the app could not be brought in this time. It is still on this device and was not changed. The app tries again the next time it starts.';
          if (out) out.lines.push(line); else out = { level: 'problem', title: 'Older progress could not be brought in.', lines: [line] };
        }
        if (x.prefsBroken) {
          const line = 'This browser will not keep small settings such as the sound switch.';
          if (out) out.lines.push(line); else out = { level: 'note', title: 'Settings are not remembered.', lines: [line + ' Progress is saved.'] };
        }
        return out;
      }

      function snapshot() {
        return { mode: repo.mode, reason: repo.reason, state: repo.state, errorName: repo.lastError, pending: learning.pendingWrites(),
          dropped: learning.droppedWrites(), prefsBroken: prefs.isBroken(), v1Unsaved: v1Unsaved };
      }

      function bannerHTML() {
        const d = describe(snapshot());
        if (!d) return '';
        return '<div class="ad-card ' + (d.level === 'problem' ? 'ad-alert' : 'ad-notice') + '" id="ad-storage-banner" role="' +
          (d.level === 'problem' ? 'alert' : 'status') + '" data-level="' + esc(d.level) + '">' + kit.heading(d.title) +
          d.lines.map(kit.text).join('') + '</div>';
      }

      function aboutHTML() {
        return kit.card(kit.heading('About') + '<p class="ad-text" id="ad-version">Number Meadow, version ' + esc(schema.APP_VERSION) + '</p>');
      }

      function noteMigration(report) { v1Unsaved = !!(report && report.memoryOnly); }

      return { describe, snapshot, bannerHTML, aboutHTML, noteMigration, REASONS };
    });
}());
