/*
 * adultSettingsUI (L6): settings per child (brief screen 3, D-B, O4, O6) and the PIN screen (O2, O3).
 *   'adult-settings'  the daily time limit (Off, 15, 20, 30, 45, 60 minutes: a soft reminder in guided play; Free Play stops at it), voice on or off,
 *                     sound on or off, Play sample voice, rename, and delete the child (the record counts in words,
 *                     "Save a backup first", then the nickname typed exactly)
 *   'adult-pin'       set, change or remove the grown-up PIN; hidden with one line when Web Crypto is missing
 * A change to the child who is playing is copied onto screens.state.currentStudent at once, so the voice and sound
 * gates and the rest card follow it without a reload.
 */
(function () {
  'use strict';

  NBA.define('adultSettingsUI',
    ['util', 'config', 'prefs', 'exporter', 'children', 'childSettings', 'adultGate', 'speech', 'screens', 'gameUI', 'adultKit', 'fileSave', 'adultGateUI'],
    (util, config, prefs, exporter, children, childSettings, adultGate, speech, screens, gameUI, kit, fileSave, gateUI) => {
      const { state } = screens;
      const SAMPLE = 'Hello! This is the voice your child hears.';
      let cur = null;      // the child record shown
      let msg = '';
      let pinMsg = '';

      const minutesWord = (m) => (m === 0 ? 'Off' : m + ' minutes');
      function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

      function settingsBody(d) {
        const s = d.settings, c = d.child, n = d.counts;
        const limits = childSettings.LIMITS.map((m) => kit.toggle('ad-limit', minutesWord(m), s.dailyLimitMin === m, { 'data-limit': String(m) })).join('');
        const what = [plural(n.answers, 'answer', 'answers'), plural(n.sessions, 'session', 'sessions'), plural(n.checks, 'Meadow Check', 'Meadow Checks')];
        return [
          kit.card(kit.heading('Daily time limit') +
            kit.text('Your child sees one calm rest card after a question when today\'s play reaches this. Guided play is never blocked.') +
            kit.text('Free Play stops at this limit until a grown-up allows ' + config.freeplay.approvalMin + ' more minutes.') +
            '<div class="ad-choices" role="group" aria-label="Daily time limit">' + limits + '</div>'),
          kit.card(kit.heading('Voice and sound') +
            // the state is in the words and aria-pressed, not only in the fill (WCAG 1.4.1)
            // sound off silences the voice too (the speech gate needs both), so Voice then says off and cannot be changed
            '<div class="ad-actions">' + (s.sound ? kit.toggle('ad-voice', 'Voice: ' + (s.voice ? 'on' : 'off'), s.voice)
              : kit.toggle('ad-voice', 'Voice: off (sound is off)', false, { 'aria-disabled': 'true' })) +
            kit.toggle('ad-sound', 'Sound: ' + (s.sound ? 'on' : 'off'), s.sound) + '</div>' +
            kit.text('Sound off also turns the voice off.') +
            kit.note('Voice reads the questions aloud. Sound is the soft taps, the chimes and the voice.') +
            kit.btn('ad-sample', 'Play sample voice', { icon: 'speaker' })),
          kit.card(kit.heading('Nickname') + kit.field('ad-rename', 'Nickname', { hint: 'Use a nickname, not a real name.', maxlength: 30, value: c.name }) +
            kit.btn('ad-rename-save', 'Save the nickname')),
          kit.card(kit.heading('Delete this child') +
            kit.text('This deletes ' + c.name + ' and ' + what.join(', ') + ' from this device. It cannot be undone.') +
            kit.btn('ad-backup-child', 'Save a backup first') +
            kit.field('ad-del-confirm', 'Type the nickname to confirm', {}) +
            kit.btn('ad-delete', 'Delete this child', { disabled: true })),
          kit.card(kit.msg('ad-settings-msg', msg))
        ].join('');
      }

      gateUI.register('adult-settings', {
        async load(p) {
          const child = await children.get(p.id);
          if (!child) throw new Error('no such child');
          cur = child;
          return { child: child, settings: childSettings.settingsOf(child, prefs.get('sound')), counts: await children.countStudentData(p.id) };
        },
        render(p) { const html = kit.page('adult-settings', 'Settings for ' + p.data.child.name, settingsBody(p.data), { back: 'ad-back-child' }); msg = ''; return html; },
        after(sec) {
          const input = sec.querySelector('#ad-del-confirm'), del = sec.querySelector('[data-action="ad-delete"]');
          if (input && del) input.addEventListener('input', () => { del.disabled = input.value.trim() !== cur.name.trim(); });
        }
      });

      /** Save fields on the child, then show the settings again with a short line. */
      async function change(fields, line) {
        if (!cur) return;
        const r = await children.setSettings(cur.id, fields);
        if (r.ok && state.currentStudent && state.currentStudent.id === cur.id) Object.assign(state.currentStudent, fields);
        if (r.ok) await gameUI.refreshPlayers(); // "Who's playing?" hands out fresh records with the new settings
        msg = r.ok ? line : 'That did not work. Please try again.';
        gateUI.go('adult-settings', { id: cur.id });
      }
      const live = () => childSettings.settingsOf(cur, prefs.get('sound'));

      async function backup(scope, studentId) {
        const r = await exporter.exportJson({ scope: scope, studentId: studentId });
        if (!r.ok) return 'That did not work. Please try again.';
        if (fileSave.save(r.name, r.text, r.mime).ok) return 'The backup was saved as a file.';
        gateUI.go('adult-report', { text: r.text, what: 'backup' });
        return null;
      }

      async function deleteChild() {
        const input = document.getElementById('ad-del-confirm');
        if (!cur || !input || input.value.trim() !== cur.name.trim()) return;
        const gone = cur;
        const r = await children.deleteStudent(gone.id);
        if (!r.ok) { msg = 'That did not work. Please try again.'; gateUI.go('adult-settings', { id: gone.id }); return; }
        const left = ((await children.allStudents()) || []).slice().sort((a, b) => (a.createdAt - b.createdAt) || (a.id < b.id ? -1 : 1));
        if (gone.isDefault && left.length) await children.promoteDefault(left[0].id); // plan DD8
        if (!state.currentStudent || state.currentStudent.id === gone.id) {
          const next = await children.ensurePlayer(state.currentStudent ? state.currentStudent.id : null); // none left: a new default child
          await gameUI.refreshPlayers();
          await gameUI.selectStudent(next.id);
        }
        await gameUI.refreshPlayers();
        cur = null;
        gateUI.go('adult-list', { msg: gone.name + ' was deleted.' });
      }

      function pinBody(has) {
        if (!adultGate.supported()) {
          return kit.card(kit.text('A PIN needs a secure page. This browser does not offer it here, so the press-and-hold gate is used.'));
        }
        return kit.card(kit.text(has ? 'A PIN is set. The gate asks for it.' : 'No PIN is set. The gate uses press and hold.') +
          kit.note('The PIN only keeps children out by accident. It is not a security lock.') +
          kit.field('ad-pin-new', has ? 'New PIN (4 digits)' : 'PIN (4 digits)', { inputmode: 'numeric', maxlength: 4, type: 'password' }) +
          kit.field('ad-pin-again', 'Type it again', { inputmode: 'numeric', maxlength: 4, type: 'password' }) +
          '<div class="ad-actions">' + kit.btn('ad-pin-save', 'Save PIN', { go: true }) + (has ? kit.btn('ad-pin-remove', 'Remove PIN') : '') + '</div>' +
          kit.msg('ad-pin-screen-msg', pinMsg));
      }

      gateUI.register('adult-pin', {
        async load() { return { has: await adultGate.hasPin() }; },
        render(p) { const html = kit.page('adult-pin', 'Grown-up PIN', pinBody(p.data.has)); pinMsg = ''; return html; }
      });

      const value = (id) => { const el = document.getElementById(id); return el ? String(el.value).trim() : ''; };

      screens.registerActions({
        'ad-limit'(el) { const m = Number(el.getAttribute('data-limit')); change({ dailyLimitMin: m }, 'Daily time limit: ' + minutesWord(m) + '.'); },
        'ad-voice'() { if (!live().sound) return; /* aria-disabled while sound is off */ const on = !live().voice; change({ voice: on }, 'Voice is ' + (on ? 'on' : 'off') + ' for ' + cur.name + '.'); },
        'ad-sound'() { const on = !live().sound; change({ sound: on }, 'Sound is ' + (on ? 'on' : 'off') + ' for ' + cur.name + '.'); },
        'ad-sample'() { speech.SPEECH.sample(SAMPLE); },
        async 'ad-rename-save'() {
          if (!cur) return;
          const r = await children.updateStudent(cur.id, { name: value('ad-rename') });
          if (r.ok) {
            if (state.currentStudent && state.currentStudent.id === cur.id) state.currentStudent.name = r.record.name;
            await gameUI.refreshPlayers();
          }
          msg = r.ok ? 'The nickname was saved.' : (r.problems[0].code === 'too_long' ? 'The nickname can have at most 30 letters.' : 'Please type a nickname.');
          gateUI.go('adult-settings', { id: cur.id });
        },
        async 'ad-backup-child'() {
          if (!cur) return;
          const line = await backup('student', cur.id);
          const el = document.getElementById('ad-settings-msg');
          if (line && el) el.textContent = line;
        },
        'ad-delete'() { deleteChild(); },
        'ad-pin'() { gateUI.go('adult-pin'); },
        async 'ad-pin-save'() {
          const a = value('ad-pin-new'), b = value('ad-pin-again');
          if (!/^\d{4}$/.test(a)) pinMsg = 'Please type 4 digits.';
          else if (a !== b) pinMsg = 'The two PINs are not the same.';
          else {
            const r = await adultGate.setPin(a);
            pinMsg = r.ok ? 'The PIN is saved. The gate asks for it from now on.' : 'That did not work. Please try again.';
            await gateUI.refresh();
          }
          gateUI.go('adult-pin');
        },
        async 'ad-pin-remove'() {
          await adultGate.clearPin();
          await gateUI.refresh();
          pinMsg = 'The PIN is removed. The gate uses press and hold.';
          gateUI.go('adult-pin');
        }
      });

      return { backup };
    });
}());
