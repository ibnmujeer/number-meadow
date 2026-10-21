/*
 * adultFreePlayUI (L6): the Free Play page of one child in the Grown-ups area (Free Play F4, requirements R29 to R31).
 *   'adult-freeplay'  Free Play next to guided play (active minutes and problems, all time and the last 7 and 30 days), one line per
 *                     category that was played (minutes, problems, first-try words, difficulty steps visited, step-down count),
 *                     the switches (Free Play on or off for the child; each category shown or hidden: saved as the optional
 *                     students fields freePlay and fpHidden, owner decision G1) and where the daily limit is changed.
 * The switches are the adult's choices for this child. They do not look at who the child is. Nothing here is spoken or sounded.
 * Every record is read through the studentId index of this child only; the numbers are adultSummary.freePlayBlock (pure).
 */
(function () {
  'use strict';

  NBA.define('adultFreePlayUI',
    ['util', 'config', 'repo', 'children', 'childSettings', 'freeplay', 'adultSummary', 'adultWords', 'screens', 'gameUI', 'adultKit', 'adultGateUI'],
    (util, config, repo, children, childSettings, freeplay, adultSummary, W, screens, gameUI, kit, gateUI) => {
      const { state } = screens;
      let cur = null; // the child record shown
      let msg = '';

      function list(items) { return '<ul class="ad-list">' + items.map((x) => '<li class="ad-text">' + kit.esc(x) + '</li>').join('') + '</ul>'; }

      function body(d) {
        const fp = d.block, w = fp.windows, c = d.cats, s = childSettings.freePlayOf(d.child);
        const hidden = s.hidden;
        const windows = [['all time', w.all], ['last 7 days', w.d7], ['last 30 days', w.d30]].filter((x) => x[1]);
        const numbers = fp.total.problems
          ? windows.map((x) => W.freePlayLines(x[0], x[1]).map(kit.text).join('')).join('') +
            kit.text('First tries: ' + W.accuracyWord(fp.total.share) + '.')
          : kit.text('No Free Play yet.');
        const switches = '<div class="ad-actions">' + kit.toggle('ad-fp-on', 'Free Play: ' + (s.on ? 'on' : 'off'), s.on) + '</div>' +
          '<div class="ad-choices" role="group" aria-label="Categories">' +
          c.all.map((x) => kit.toggle('ad-fp-cat', x.label + ': ' + (hidden.indexOf(x.id) >= 0 ? 'hidden' : 'shown'), hidden.indexOf(x.id) < 0, { 'data-cat': x.id })).join('') + '</div>';
        const limit = childSettings.settingsOf(d.child).dailyLimitMin;
        return [
          kit.card(kit.heading('Free Play') + kit.note('Active minutes are worked out from the answers (an estimate). Free Play answers also count in Skills.') + numbers),
          kit.card(kit.heading('By category') + (fp.categories.length ? list(fp.categories.map(W.freePlayCategory)) : kit.text('No Free Play yet.'))),
          kit.card(kit.heading('Choices for ' + d.child.name) + kit.text('Free Play can be turned off, and a category can be hidden. These are your choices for this child.') + switches),
          kit.card(kit.heading('Daily limit') + kit.text(limit === 0 ? 'The daily limit is Off, so Free Play does not stop.' :
            'Free Play stops after ' + limit + ' minutes of play in a day. A grown-up can allow ' + config.freeplay.approvalMin + ' more minutes from the end screen.') +
            kit.btn('ad-fp-settings', 'Settings')),
          kit.card(kit.msg('ad-fp-msg', msg))
        ].join('');
      }

      gateUI.register('adult-freeplay', {
        async load(p) {
          const child = await children.get(p.id);
          if (!child) throw new Error('no such child');
          cur = child;
          const rows = async (store) => (await repo.getAll(store, { index: 'studentId', value: p.id })) || [];
          const block = adultSummary.freePlayBlock(await rows('attempts'), await rows('sessions'), util.now());
          return { child: child, block: block, cats: freeplay.categories(child) };
        },
        render(p) { const html = kit.page('adult-freeplay', 'Free Play for ' + p.data.child.name, body(p.data), { back: 'ad-fp-back' }); msg = ''; return html; }
      });

      /** Save fields on the child, then show the page again with a short line. */
      async function change(fields, line) {
        if (!cur) return;
        const r = await children.setSettings(cur.id, fields);
        if (r.ok && state.currentStudent && state.currentStudent.id === cur.id) Object.assign(state.currentStudent, fields);
        if (r.ok) await gameUI.refreshPlayers(); // "Who's playing?" hands out fresh records with the new choices
        msg = r.ok ? line : 'That did not work. Please try again.';
        gateUI.go('adult-freeplay', { id: cur.id });
      }

      screens.registerActions({
        async 'ad-fp-on'() {
          if (!cur) return;
          const on = !childSettings.freePlayOf(await children.get(cur.id)).on;
          change({ freePlay: on }, 'Free Play is ' + (on ? 'on' : 'off') + ' for ' + cur.name + '.');
        },
        async 'ad-fp-cat'(el) {
          if (!cur) return;
          const id = el.getAttribute('data-cat');
          const hidden = childSettings.freePlayOf(await children.get(cur.id)).hidden;
          const next = hidden.indexOf(id) >= 0 ? hidden.filter((x) => x !== id) : hidden.concat([id]);
          const label = (freeplay.categories(cur).all.find((x) => x.id === id) || { label: id }).label;
          change({ fpHidden: next }, label + ' is ' + (next.indexOf(id) >= 0 ? 'hidden' : 'shown') + ' in Free Play for ' + cur.name + '.');
        },
        'ad-fp-settings'() { if (cur && gateUI.has('adult-settings')) gateUI.go('adult-settings', { id: cur.id }); },
        'ad-fp-back'() { if (cur) gateUI.go('adult-child', { id: cur.id }); else gateUI.go('adult-list'); }
      });

      return {};
    });
}());
