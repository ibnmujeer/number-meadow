/*
 * buddyUI (L5): the My buddy screen (step 4, P4). The child's buddy drawn large, a row of colours (the buddy's own colour
 * first, then the tints the child's growth marks unlocked) and a row of extras (None first, then the unlocked
 * accessories). A row with only one choice is not drawn, and nothing that is still locked is shown, named, counted or
 * hinted at. Every choice is a button of at least 64 px with a picture and a word; its name is spoken when it is tapped.
 * The choice is saved on the child (children.setBuddyLook) and shows at once on Home, the story card and the mission.
 * Screen: mybuddy. Actions: mybuddy (open it), look-tint, look-acc.
 */
(function () {
  'use strict';

  NBA.define('buddyUI', ['util', 'catalog', 'dom', 'speech', 'art', 'screens', 'children', 'learning', 'growth', 'buddyLooks'],
    (util, catalog, dom, speech, art, screens, children, learning, growth, buddyLooks) => {
      const { esc } = util;
      const { $, $all, replayClass } = dom;
      const { SPEECH } = speech;
      const { ICONS, faceHTML, iconBtn } = art;
      const { state, currentBuddy } = screens;
      const R = catalog.REWARDS;
      const nameOf = (list, id) => (list.find((x) => x.id === id) || { name: '' }).name;

      /** How many growth marks the child has: the live cache can know of one that is not stored yet. */
      function marksOf(student) {
        const live = learning.growthState();
        const stored = student && student.growth && Array.isArray(student.growth.marks) ? student.growth.marks.length : 0;
        return Math.max(stored, live && Array.isArray(live.marks) ? live.marks.length : 0);
      }

      function choiceHTML(action, id, name, face, on) {
        return '<button type="button" class="buddy-card look-btn' + (on ? ' chosen' : '') + '" data-action="' + action + '" data-id="' + esc(id || '') +
          '" aria-pressed="' + on + '">' + face + '<span class="buddy-name">' + esc(name) + '</span>' +
          '<span class="tick-badge" aria-hidden="true">' + ICONS.tick + '</span></button>';
      }

      /** The two rows for the child's look; a row with a single choice is left out. */
      function rowsHTML(student) {
        const open = growth.unlockedItems(marksOf(student));
        const look = buddyLooks.lookOf(student), b = currentBuddy().id;
        const face = (l) => faceHTML(b, 'card-face', '', l);
        let html = '';
        if (open.tints.length) {
          html += '<h2 class="look-title">Colours</h2><div class="look-row" role="group" aria-label="Colours">' +
            choiceHTML('look-tint', '', 'My colour', face({ tint: null, accessory: look.accessory }), look.tint === null) +
            open.tints.map((id) => choiceHTML('look-tint', id, nameOf(R.tints, id), face({ tint: id, accessory: look.accessory }), look.tint === id)).join('') + '</div>';
        }
        if (open.accessories.length) {
          html += '<h2 class="look-title">Extras</h2><div class="look-row" role="group" aria-label="Extras">' +
            choiceHTML('look-acc', '', 'None', face({ tint: look.tint, accessory: null }), look.accessory === null) +
            open.accessories.map((id) => choiceHTML('look-acc', id, nameOf(R.accessories, id), face({ tint: look.tint, accessory: id }), look.accessory === id)).join('') + '</div>';
        }
        return html;
      }
      const bigHTML = (student) => faceHTML(currentBuddy().id, 'mybuddy-face', '', buddyLooks.lookOf(student));

      screens.register('mybuddy', {
        render() {
          const s = state.currentStudent, rows = rowsHTML(s);
          return '<section class="screen mybuddy-screen" data-screen="mybuddy"><header class="bar">' + iconBtn('home', 'home', 'Home') +
            '<h1 class="screen-title">My buddy</h1></header>' +
            '<div id="mybuddy-big" class="mybuddy-big">' + bigHTML(s) + '</div>' +
            (rows ? '' : '<p class="mybuddy-line">This is ' + esc(currentBuddy().name) + '.</p>') + // the line fills the screen only when there is nothing to choose
            '<div id="look-rows" class="look-rows">' + rows + '</div></section>';
        },
        after() { dom.later(() => SPEECH.say('This is ' + currentBuddy().name + '.'), 300); }
      });

      /** Draw the big buddy and the rows again (in place), keeping the keyboard focus on the same choice. */
      function refresh(focusAction, focusId) {
        const s = state.currentStudent;
        const big = $('#mybuddy-big'), rows = $('#look-rows');
        if (!big || !rows) return;
        big.innerHTML = bigHTML(s);
        rows.innerHTML = rowsHTML(s);
        if (focusAction) {
          const again = $all('[data-action="' + focusAction + '"]', rows).find((e) => e.getAttribute('data-id') === focusId);
          if (again) again.focus();
        }
      }

      /** One choice: update the child at once (like screens.setBuddy), then save; put the old choice back if saving fails. */
      async function choose(kind, el) {
        const s = state.currentStudent;
        if (!s) return;
        const id = el.getAttribute('data-id') || null;
        const open = growth.unlockedItems(marksOf(s));
        const list = kind === 'tint' ? open.tints : open.accessories;
        if (id !== null && list.indexOf(id) < 0) return; // a locked or unknown choice is never taken
        const field = kind === 'tint' ? 'buddyTint' : 'buddyAccessory';
        const had = s[field];
        const name = id === null ? (kind === 'tint' ? 'My colour' : 'None') : nameOf(kind === 'tint' ? R.tints : R.accessories, id);
        SPEECH.say(name);
        s[field] = id;
        refresh('look-' + (kind === 'tint' ? 'tint' : 'acc'), id || '');
        replayClass($('#mybuddy-big .face'), 'pop');
        let r = null;
        try { r = await children.setBuddyLook(s.id, kind === 'tint' ? { tint: id } : { accessory: id }, marksOf(s)); } catch (e) { r = null; }
        if (!r || !r.ok) {
          if (s[field] === id) s[field] = had;
          refresh();
        }
      }

      screens.registerActions({
        mybuddy() { screens.show('mybuddy'); },
        'look-tint'(el) { choose('tint', el); },
        'look-acc'(el) { choose('acc', el); }
      });

      return { marksOf, rowsHTML };
    });
}());
