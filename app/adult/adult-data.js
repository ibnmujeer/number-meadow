/*
 * adultDataUI (L6): the Data screen of the Grown-ups area (brief screen 4, O5, O7).
 *   Save a backup         exporter.exportJson (scope all) -> fileSave.save, or the text box when saving fails
 *   Choose a backup file  importer.read -> importer.check: a refusal shows its plain message; a plan shows the counts
 *                         per kind of record BEFORE anything is written, then Keep this device's version / Use the
 *                         file's version (or one Bring in the data) -> importer.apply; a changed device shows the new plan
 *   Reset everything      Save a backup first, then type RESET: dataReset.resetEverything (the v1 save is never touched;
 *                         its marker is written again so it is not merged back on the next boot)
 * The CSV files are not offered here (plan DD7). The PIN is never in a backup and an import never changes it.
 */
(function () {
  'use strict';

  NBA.define('adultDataUI',
    ['util', 'importer', 'dataReset', 'learning', 'children', 'screens', 'gameUI', 'adultKit', 'adultStorage', 'adultGateUI', 'adultSettingsUI'],
    (util, importer, dataReset, learning, children, screens, gameUI, kit, storage, gateUI, settingsUI) => {
      const { esc } = util;
      const { state } = screens;
      let plan = null;   // the import plan on show
      let msg = '';      // the import line
      let resetMsg = '';

      function rowLine(r) {
        if (r.store === 'meta') return esc(r.type) + ': ' + r.inFile + ' in the file, not brought in (this device keeps its own)';
        if (r.rebuilt) return esc(r.type) + ': ' + r.inFile + ' in the file, worked out again from the answers';
        return esc(r.type) + ': ' + [r.add + ' new', r.same + ' already here', r.merge + ' combined', r.conflict + ' differ'].join(', ');
      }

      function planHTML() {
        if (!plan) return '';
        const rows = plan.rows.filter((r) => r.inFile > 0);
        const choose = plan.choosable > 0
          ? kit.text('Some records differ between this device and the file. Which version should stay?') +
            '<div class="ad-actions">' + kit.btn('ad-import-keep', 'Keep this device\'s version') + kit.btn('ad-import-file', 'Use the file\'s version') + '</div>'
          : '<div class="ad-actions">' + kit.btn('ad-import-keep', 'Bring in the data', { go: true }) + '</div>';
        return '<div class="ad-plan" id="ad-plan">' + kit.text('This file holds:') +
          '<ul class="ad-list">' + rows.map((r) => '<li class="ad-text">' + rowLine(r) + '</li>').join('') + '</ul>' +
          kit.note('Nothing has been changed yet.') + choose + kit.btn('ad-import-cancel', 'Cancel') + '</div>';
      }

      function body() {
        return [
          storage.bannerHTML(),
          kit.card(kit.heading('Save a backup') + kit.text('A backup file holds every child\'s answers and progress. Keep it somewhere safe.') +
            kit.btn('ad-backup-all', 'Save a backup') + kit.msg('ad-backup-msg', '')),
          kit.card(kit.heading('Bring in a backup') + kit.text('Choose a backup file from Number Meadow. You see what it holds before anything changes.') +
            '<input type="file" id="ad-file" accept=".json,application/json" hidden>' +
            kit.btn('ad-choose', 'Choose a backup file') + planHTML() + kit.msg('ad-import-msg', msg)),
          kit.card(kit.heading('Reset everything') +
            kit.text('This deletes every child, every answer, the settings and the PIN on this device. It cannot be undone.') +
            kit.btn('ad-backup-all', 'Save a backup first') +
            kit.field('ad-reset-confirm', 'Type RESET to confirm', { maxlength: 5 }) +
            kit.btn('ad-reset', 'Reset everything', { disabled: true }) + kit.msg('ad-reset-msg', resetMsg))
        ].join('');
      }

      gateUI.register('adult-data', {
        render() { const html = kit.page('adult-data', 'Data', body()); msg = ''; resetMsg = ''; return html; },
        after(sec) {
          const input = sec.querySelector('#ad-reset-confirm'), btn = sec.querySelector('[data-action="ad-reset"]');
          if (input && btn) input.addEventListener('input', () => { btn.disabled = input.value.trim() !== 'RESET'; });
          const file = sec.querySelector('#ad-file');
          if (file) file.addEventListener('change', () => { if (file.files && file.files[0]) checkFile(file.files[0]); });
          if (plan) { const p = sec.querySelector('#ad-plan'); if (p && p.scrollIntoView) p.scrollIntoView({ block: 'nearest' }); }
        }
      });

      const show = () => gateUI.go('adult-data');

      async function checkFile(file) {
        plan = null;
        const read = await importer.read(file);
        if (!read.ok) { msg = read.message; show(); return; }
        const r = await importer.check(read.text);
        if (!r.ok) { msg = r.message; show(); return; }
        plan = r.plan;
        show();
      }

      /** After an import or a reset: the current child's cache and the player list from storage again. */
      async function reloadPlayer(id) {
        const s = await children.ensurePlayer(id);
        await learning.loadStudent(s.id);
        state.currentStudent = s;
        await gameUI.refreshPlayers();
      }

      async function apply(choice) {
        if (!plan) return;
        const r = await importer.apply(plan, choice);
        if (r.changed) { plan = r.plan; msg = r.message; show(); return; }
        plan = null;
        msg = r.message || (r.ok ? 'Done.' : 'Nothing was imported.');
        if (r.ok) await reloadPlayer(state.currentStudent ? state.currentStudent.id : null);
        show();
      }

      screens.registerActions({
        'ad-data'() { plan = null; gateUI.go('adult-data'); },
        async 'ad-backup-all'() {
          const line = await settingsUI.backup('all');
          const el = document.getElementById('ad-backup-msg');
          if (line && el) el.textContent = line;
        },
        'ad-choose'() { const f = document.getElementById('ad-file'); if (f) { f.value = ''; f.click(); } },
        'ad-import-keep'() { apply('keep'); },
        'ad-import-file'() { apply('file'); },
        'ad-import-cancel'() { plan = null; msg = 'Nothing was changed.'; show(); },
        async 'ad-reset'() {
          const input = document.getElementById('ad-reset-confirm');
          if (!input || input.value.trim() !== 'RESET') return;
          const r = await dataReset.resetEverything();
          if (!r.ok) { resetMsg = 'Reset is not finished. Please try again.'; show(); return; }
          plan = null;
          await reloadPlayer(r.studentId);
          await gateUI.refresh();
          gateUI.go('adult-list', { msg: 'Everything was reset.' });
        }
      });

      return { checkFile };
    });
}());
