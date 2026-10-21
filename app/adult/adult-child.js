/*
 * adultChildUI (L6): one child's page in the Grown-ups area (brief screen 2) and the report fallback box (O13).
 *   'adult-child'   a short summary; skills with their level words and the way of showing that works best; the Review card (step 5:
 *                   skills in review, due for review, next due date; words and dates only); minutes
 *                   played in the last 7 and 30 days; error patterns in plain words; three at-home ideas per listed
 *                   skill (NBA.data.homeActivities); the Free Play card (F4: Free Play next to guided play for the last 7 and 30 days, a
 *                   button to the Free Play page); the card What the app plans next (step 7: going back to an earlier skill or moving on, left out when
 *                   there are none); the Meadow Checks or "No checks yet"; Download report, Copy AI
 *                   prompt only and Settings. Words lead; this page shows no percentages.
 *   'adult-report'  the full report text in a read-only box with a Copy button, shown when the file download fails
 * Every record is read through the studentId index of this child only; the report is reportText.build (pure).
 */
(function () {
  'use strict';

  NBA.define('adultChildUI',
    ['util', 'catalog', 'schema', 'repo', 'exporter', 'children', 'learning', 'adultWords', 'adultSummary', 'reportText', 'usageMath', 'usage', 'screens',
      'adultKit', 'adultStorage', 'fileSave', 'adultGateUI', 'adultPlacementUI'],
    (util, catalog, schema, repo, exporter, children, learning, W, adultSummary, reportText, usageMath, usage, screens, kit, storage, fileSave, gateUI, adultPlacement) => {
      const { esc } = util;
      const STORES = ['attempts', 'sessions', 'mastery', 'recommendations', 'assessments', 'schedule'];
      const HOME = catalog.HOME_ACTIVITIES; // bands 1-2 and the band-3 sibling, merged by catalog
      let current = null; // { id, input } of the page shown last
      let lastMsg = '';
      let shownText = ''; // the report in the fallback box, with its CRLF line endings (a text box shows them as LF)

      /** This child's records and the report input (one child only: the studentId index). */
      async function loadChild(id) {
        const child = await children.get(id);
        if (!child) throw new Error('no such child');
        const input = { child: child, display: { id: exporter.shown }, representations: NBA.data.representations.list,
          prompt: NBA.data.reportPrompt.text, appVersion: schema.APP_VERSION, now: util.now() };
        for (const s of STORES) input[s] = (await repo.getAll(s, { index: 'studentId', value: id })) || [];
        const open = learning.currentSession();
        input.openSessionId = open && open.studentId === id ? open.id : null;
        current = { id: id, input: input };
        return input;
      }

      function list(items) { return '<ul class="ad-list">' + items.map((x) => '<li class="ad-text">' + x + '</li>').join('') + '</ul>'; }

      function pageHTML(d) {
        const m = d.model;
        // a skill names its best way of showing only when there is one (the Ways of showing card says when there is not)
        const skills = m.skills.length ? list(m.skills.map((s) => '<span class="ad-strong">' + esc(s.name) + '</span>: ' + esc(s.levelWord) + '.' +
          (s.ways.best ? ' Works best: ' + esc(W.repWord(s.ways.best)) + '.' : ''))) : kit.text('No answers yet.');
        const tried = m.ways.rows.filter((r) => r.n > 0);
        const ways = kit.text('Works best so far: ' + (m.ways.best ? W.repWord(m.ways.best) : W.NOT_ENOUGH) + '.') +
          (tried.length ? list(tried.map((r) => esc(r.words) + ': ' + esc(W.accuracyWord(r.first / r.n)))) : '');
        const pats = m.patterns.length ? list(m.patterns.map((p) => esc(W.conceptWord(p.conceptId)) + ': ' + esc(p.words) + ' (' + esc(p.statusWord) + ')'))
          : kit.text('No patterns found yet.');
        const ideas = m.skills.length ? m.skills.map((s) => '<h3 class="ad-h3">' + esc(s.name) + '</h3>' +
          list((HOME.bySkill[s.id] || []).map((a) => '<span class="ad-strong">' + esc(a.name) + '.</span> ' + esc(a.text)))).join('')
          : kit.text('Ideas for each skill appear here after some play.');
        const day = (ms) => (typeof ms === 'number' ? usageMath.dayKey(ms) : '');
        const oldChecks = m.checks.map((c) => 'Meadow Check, ' + esc(c.formWords) + ': ' +
          (c.done ? esc(day(c.at)) + ', ' + c.correct + ' of ' + c.total + ' first tries right' : 'started ' + esc(day(c.at)) + ', not finished'));
        // step 8: the placement checks, plain D-A words only (a first guess, no rung number, no percentages)
        const placeChecks = m.placementChecks.map((p) => {
          const bits = ['Meadow Check, ' + esc(p.formWords) + ', ' + esc(day(p.at)) + ': ' + p.total +
            (p.total === 1 ? ' question' : ' questions') + '. Settled around: ' + esc(p.settledWords || 'not enough to say') + '.'];
          p.skills.forEach((s) => bits.push(esc(s.name) + ': ' + esc(s.levelWord) + '.'));
          if (p.compareWords) bits.push(esc(p.compareWords));
          p.warnings.forEach((w) => bits.push(esc(w)));
          return bits.join(' ');
        });
        const checkItems = oldChecks.concat(placeChecks);
        const checks = (m.firstCheckAt !== null ? kit.text('First Meadow Check: ' + day(m.firstCheckAt) + '.') : '') +
          (checkItems.length ? list(checkItems) : kit.text('No checks yet')) +
          adultPlacement.cardExtra(d.record, d.settings);
        const rv = m.review;
        const review = rv.scheduled ? kit.text('Skills in review: ' + rv.scheduled + '.') + kit.text('Due for review: ' + rv.due + '.') +
          kit.text('Next due: ' + (rv.nextDueDay || 'None') + '.') : kit.text('Nothing in review yet. A skill joins once it is Growing.');
        // step 7: only the moves to another skill (go back, move on); the card is left out when there are none
        const moves = m.nextSteps.filter((n) => n.action === 'step_back' || n.action === 'next_concept');
        const plans = moves.length ? kit.card(kit.heading('What the app plans next') + kit.note('Plans for the next questions, from recent answers. They can change.') +
          list(moves.map((n) => '<span class="ad-strong">' + esc(n.name) + '</span> - ' + esc(n.text)))) : '';
        const fp = m.freePlay;
        const fpCard = kit.card(kit.heading('Free Play') + kit.note('Active minutes worked out from the answers, so they can differ from Time played.') +
          (fp.total.problems ? [['last 7 days', fp.windows.d7], ['last 30 days', fp.windows.d30]].filter((x) => x[1]).map((x) => W.freePlayLines(x[0], x[1]).map(kit.text).join('')).join('')
            : kit.text('No Free Play yet.')) +
          (gateUI.has('adult-freeplay') ? kit.btn('ad-freeplay', 'Free Play page') : ''));
        const buttons = [kit.btn('ad-download', 'Download report', { go: true }), kit.btn('ad-copy-prompt', 'Copy AI prompt only')];
        if (gateUI.has('adult-settings')) buttons.push(kit.btn('ad-settings', 'Settings'));
        return kit.page('adult-child', m.child.name, [
          storage.bannerHTML(),
          kit.card(kit.heading('About ' + m.child.name) + m.summary.map(kit.text).join('')),
          kit.card(kit.heading('Time played') + kit.text('Last 7 days: ' + d.m7 + ' minutes.') + kit.text('Last 30 days: ' + d.m30 + ' minutes.')),
          fpCard,
          kit.card(kit.heading('Skills') + skills),
          plans,
          kit.card(kit.heading('Review') + kit.note('Skills the child did well come back after a few days so they last.') + review),
          kit.card(kit.heading('Ways of showing') + ways),
          kit.card(kit.heading('Patterns') + kit.note('Guesses from recent answers, not a judgement.') + pats),
          kit.card(kit.heading('At-home ideas') + kit.note('Household things only, about 10 minutes. Ideas, not a tested method.') + ideas),
          kit.card(kit.heading('Meadow Checks') + checks),
          kit.card('<div class="ad-actions">' + buttons.join('') + '</div>' + kit.msg('ad-child-msg', lastMsg))
        ].join(''));
      }

      gateUI.register('adult-child', {
        async load(p) {
          const input = await loadChild(p.id);
          return { model: adultSummary.buildModel(input), record: input.child, m7: await usage.minutesInLastDays(p.id, 7, input.now),
            m30: await usage.minutesInLastDays(p.id, 30, input.now) };
        },
        render(p) { const html = pageHTML(p.data); lastMsg = ''; return html; }
      });

      gateUI.register('adult-report', {
        /** p.id: the child's report; or p.text with p.what 'backup' (a backup file that could not be saved, plan 6.3). */
        async load(p) {
          shownText = typeof p.text === 'string' ? p.text : reportText.build(await loadChild(p.id));
          return { text: shownText, backup: p.what === 'backup' };
        },
        render(p) {
          const b = p.data.backup;
          return kit.page('adult-report', b ? 'Backup' : 'Learning report', kit.card(
            kit.text('This browser could not save the file, so the ' + (b ? 'backup' : 'report') + ' is shown here. Copy it and keep it somewhere safe.') +
            fileSave.boxHTML('ad-report-box', p.data.text, b ? 'The backup' : 'The report') +
            '<div class="ad-actions">' + kit.btn('ad-copy-report', 'Copy', { go: true }) + (b ? '' : kit.btn('ad-copy-prompt', 'Copy AI prompt only')) + '</div>' +
            kit.msg('ad-report-msg', '')), { back: b ? 'ad-list' : 'ad-back-child' });
        }
      });

      function say(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }

      screens.registerActions({
        async 'ad-download'() {
          if (!current) return;
          const input = await loadChild(current.id);
          const text = reportText.build(input);
          const res = fileSave.save(reportText.fileName(input.now), text, 'text/plain;charset=utf-8');
          if (res.ok) say('ad-child-msg', 'The report was saved as a file.');
          else gateUI.go('adult-report', { id: current.id });
        },
        async 'ad-copy-prompt'() {
          const msgId = screens.state.screen === 'adult-report' ? 'ad-report-msg' : 'ad-child-msg';
          say(msgId, await fileSave.copy(reportText.promptOnly()));
        },
        async 'ad-copy-report'() {
          const box = document.getElementById('ad-report-box');
          if (box) say('ad-report-msg', await fileSave.copy(shownText || box.value, box));
        },
        'ad-back-child'() { if (current) gateUI.go('adult-child', { id: current.id }); else gateUI.go('adult-list'); },
        'ad-settings'() { if (current) gateUI.go('adult-settings', { id: current.id }); },
        'ad-freeplay'() { if (current) gateUI.go('adult-freeplay', { id: current.id }); }
      });

      return { currentId: () => (current ? current.id : null), STORES };
    });
}());
