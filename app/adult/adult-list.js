/*
 * adultListUI (L6): the first Grown-ups screen, the child list (step 3, brief screen 1), and "Add a child" (O1).
 *   'adult-list'  every child, oldest first, as a 64 px button with the buddy face and the nickname; then Add a
 *                 child, Data and the PIN button (each shown once its screen exists)
 *   'adult-add'   nickname (required, 1 to 30 characters, "Use a nickname, not a real name."), an optional age from
 *                 4 to 12 and an age band (set from the age; pickable when no age is given)
 * Only the nickname, age and age band are asked for or shown.
 */
(function () {
  'use strict';

  NBA.define('adultListUI', ['util', 'children', 'art', 'screens', 'gameUI', 'adultSummary', 'adultKit', 'adultStorage', 'adultGateUI'],
    (util, children, art, screens, gameUI, adultSummary, kit, storage, gateUI) => {
      const { esc } = util;
      const BANDS = ['4-6', '7-9', '10-12'];
      const bandOfAge = (age) => (age === null ? null : (age <= 6 ? '4-6' : (age <= 9 ? '7-9' : '10-12')));
      const byAge = (a, b) => (a.createdAt - b.createdAt) || (a.id < b.id ? -1 : 1);

      function rowHTML(s) {
        const sub = [s.age !== null && s.age !== undefined ? 'Age ' + s.age : '', adultSummary.AGE_BAND_WORDS[s.ageBand] || ''].filter(Boolean).join(', ');
        return '<button type="button" class="ad-btn ad-row" data-action="ad-child" data-student="' + esc(s.id) + '">' +
          art.faceHTML(children.buddyIdOf(s), 'ad-face') + '<span class="ad-row-text"><span class="ad-row-name">' + esc(s.name) + '</span>' +
          (sub ? '<span class="ad-row-sub">' + esc(sub) + '</span>' : '') + '</span></button>';
      }

      gateUI.register('adult-list', {
        async load() {
          const all = ((await children.allStudents()) || []).slice().sort(byAge);
          return { list: all, pin: gateUI.info() };
        },
        render(p) {
          const d = p.data || { list: [], pin: {} };
          const more = [];
          if (gateUI.has('adult-add')) more.push(kit.btn('ad-add', 'Add a child', { icon: 'players' }));
          if (gateUI.has('adult-data')) more.push(kit.btn('ad-data', 'Data'));
          if (gateUI.has('adult-about')) more.push(kit.btn('ad-about', 'About and offline'));
          if (gateUI.has('adult-pin')) more.push(kit.btn('ad-pin', d.pin.hasPin ? 'Change PIN' : 'Set a PIN'));
          return kit.page('adult-list', 'Grown-ups', storage.bannerHTML() + (p.msg ? kit.card(kit.msg('ad-list-msg', p.msg)) : '') +
            kit.card(kit.heading('Children') + kit.text('Pick a child to see how they are getting on.') +
              '<div class="ad-rows">' + d.list.map(rowHTML).join('') + '</div>') +
            (more.length ? kit.card('<div class="ad-actions">' + more.join('') + '</div>') : '') +
            kit.card(kit.heading('Text size') + kit.text('Makes the text on the Grown-ups screens bigger until you close the app. Nothing is saved, and the children\'s screens do not change.') +
              kit.toggle('ad-large', 'Larger text', kit.isLarge())) + storage.aboutHTML(), { back: 'home' });
        },
        after(sec, p) { if (p.focus) { const el = sec.querySelector('[data-action="' + p.focus + '"]'); if (el) el.focus(); } }
      });

      /* ---------- Add a child (O1) ---------- */
      let form = { age: null, band: null, msg: '' };
      function addBody() {
        const ages = [null, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((a) =>
          kit.toggle('ad-age', a === null ? 'Not given' : String(a), form.age === a, { 'data-age': a === null ? '' : String(a) })).join('');
        const bands = BANDS.map((b) => kit.toggle('ad-band', adultSummary.AGE_BAND_WORDS[b], form.band === b, { 'data-band': b })).join('');
        return kit.card(kit.field('ad-name', 'Nickname', { hint: 'Use a nickname, not a real name.', maxlength: 30, value: form.name || '' }) +
          '<div class="ad-group" role="group" aria-label="Age in years"><p class="ad-label">Age in years (you can leave it out)</p>' +
          '<div class="ad-choices">' + ages + '</div></div>' +
          '<div class="ad-group" role="group" aria-label="Age band"><p class="ad-label">Age band</p><div class="ad-choices">' + bands + '</div></div>' +
          kit.msg('ad-add-msg', form.msg) + kit.btn('ad-add-save', 'Add this child', { go: true }));
      }
      function keepName() { const el = document.getElementById('ad-name'); if (el) form.name = el.value; }

      gateUI.register('adult-add', {
        render: () => kit.page('adult-add', 'Add a child', addBody()),
        after(sec) { const el = sec.querySelector('#ad-name'); if (el && !form.name) el.focus(); }
      });

      const PROBLEMS = { required: 'Please type a nickname.', too_long: 'The nickname can have at most 30 letters.',
        control_characters: 'The nickname has a character that cannot be used.' };

      screens.registerActions({
        'ad-child'(el) { gateUI.go('adult-child', { id: el.getAttribute('data-student') }); },
        'ad-large'() { kit.setLarge(!kit.isLarge()); gateUI.go('adult-list', { focus: 'ad-large' }); },
        'ad-add'() { form = { age: null, band: null, msg: '', name: '' }; gateUI.go('adult-add'); },
        'ad-age'(el) {
          keepName();
          const v = el.getAttribute('data-age');
          form.age = v === '' ? null : Number(v);
          if (form.age !== null) form.band = bandOfAge(form.age);
          form.msg = '';
          gateUI.go('adult-add');
        },
        'ad-band'(el) {
          keepName();
          const b = el.getAttribute('data-band');
          form.band = b;
          if (form.age !== null && bandOfAge(form.age) !== b) form.age = null; // the band wins over a different age
          form.msg = '';
          gateUI.go('adult-add');
        },
        async 'ad-add-save'() {
          keepName();
          const r = await children.createStudent({ name: form.name || '', age: form.age, ageBand: form.band });
          if (!r.ok) {
            form.msg = PROBLEMS[r.problems[0].code] || 'Please check the details.';
            gateUI.go('adult-add');
            return;
          }
          await gameUI.refreshPlayers();
          form = { age: null, band: null, msg: '', name: '' };
          gateUI.go('adult-list', { msg: r.record.name + ' was added.' });
        }
      });

      return { bandOfAge };
    });
}());
