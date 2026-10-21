/*
 * freeplayUI (L5): the Just play button on Home and the Free Play category screen (F3). There is no mission, no target and
 * no count. The tiles are read from the real strands (freeplay.categories); nothing here looks at who the child is, only at the
 * adult switches already applied by the service. No tile is marked as better than another.
 *   justPlayHTML(child)   the Home button (the first cell of the Home footer row; a full-width row on tall screens), or '' when Free Play is off for the child or nothing is offered
 *   noteHTML()            the calm line for the Home render after Take a break (read once; the line is on screens.state.homeNote)
 *   speakNote(line)       says that line (sound and voice follow the child's settings)
 * Screen 'freeplay' (params { note? }): a Home button and the title; a grid of big picture tiles (at least 72 px), Mixed first and
 * selected when two or more categories are offered; a quiet "Include new kinds" switch while Mixed is selected (off on every
 * arrival, not saved); Go. Tapping a tile selects it and says its name (the screen does not change, so the name is heard). The
 * title or the calm note is said on arrival.
 * Actions: just-play (Home to the category screen, or the end screen when today's limit is reached; a waiting Meadow Check comes
 * first, as for the worlds), fp-tile, fp-new, fp-go, fp-change (leave the question and pick again, at no cost and with no message).
 */
(function () {
  'use strict';

  NBA.define('freeplayUI', ['config', 'util', 'dom', 'speech', 'art', 'screens', 'feedback', 'missionUI', 'checkUI', 'freeplay', 'freeplayFlow', 'freeplayArt', 'freeplayCards'],
    (config, util, dom, speech, art, screens, feedback, missionUI, checkUI, freeplay, freeplayFlow, freeplayArt, cards) => {
      const { esc } = util;
      const { $all, later } = dom;
      const { SPEECH } = speech;
      const { ICONS, iconBtn } = art;
      const { state } = screens;
      const MIXED = 'mixed';
      let sel = null;      // the selected tile (a category id or 'mixed')
      let incl = false;    // "Include new kinds" (Mixed only)
      let busy = false;    // a Go is starting a run

      const mixedLabel = () => NBA.data.freeplay.mixed;
      const tilesOf = (child) => {
        const c = child ? freeplay.categories(child) : { offered: [], mixed: false };
        return (c.mixed ? [{ id: MIXED, label: mixedLabel() }] : []).concat(c.offered);
      };

      function justPlayHTML(child) {
        if (!child || !freeplay.categories(child).enabled) return '';
        return '<button type="button" class="btn-go just-play" data-action="just-play">' + ICONS.play +
          '<span>' + esc(feedback.freeplayButton('justPlay')) + '</span></button>';
      }

      function noteHTML() {
        const line = state.homeNote || '';
        state.homeNote = null;
        return line ? '<p class="home-note" aria-live="polite">' + esc(line) + '</p>' : '';
      }
      function speakNote(line) { if (line) later(() => SPEECH.say(line), config.TIMING.STORY_SPEAK); }

      function tileHTML(t, on) {
        return '<button type="button" class="fp-tile ' + freeplayArt.toneOf(t.id) + (t.id === MIXED ? ' fp-wide' : '') + (on ? ' chosen' : '') + '" data-action="fp-tile" data-cat="' + esc(t.id) +
          '" aria-pressed="' + on + '"><span class="tile-glyph">' + freeplayArt.glyph(t.id) + '</span>' +
          '<span class="fp-tile-name">' + esc(t.label) + '</span><span class="tick-badge" aria-hidden="true">' + ICONS.tick + '</span></button>';
      }

      screens.register('freeplay', {
        render(p) {
          const tiles = tilesOf(state.currentStudent);
          sel = tiles.length ? tiles[0].id : null;
          incl = false;
          return '<section class="screen fp-screen" data-screen="freeplay"><header class="bar">' + iconBtn('home', 'home', 'Home') +
            '<h1 class="screen-title">' + esc(feedback.pickTitle()) + '</h1></header>' +
            (p.note ? '<p class="fp-note" aria-live="polite">' + esc(p.note) + '</p>' : '') +
            '<div class="fp-grid">' + tiles.map((t) => tileHTML(t, t.id === sel)).join('') + '</div>' +
            '<div class="fp-foot"><button type="button" class="big-btn btn-quiet fp-new" data-action="fp-new" aria-pressed="false"' + (sel === MIXED ? '' : ' hidden') + '>' +
            '<span>' + esc(feedback.freeplayButton('includeNew')) + '</span></button>' +
            '<button type="button" class="big-btn btn-go fp-go" data-action="fp-go"' + (sel ? '' : ' disabled') + '><span>' + esc(feedback.freeplayButton('go')) + '</span>' + ICONS.next + '</button></div>' +
            '</section>';
        },
        after(sec, p) { later(() => SPEECH.say(p.note || feedback.pickTitle()), config.TIMING.STORY_SPEAK); }
      });

      async function justPlay() {
        const child = state.currentStudent;
        if (!child) return;
        const locked = checkUI.lockedRunId();
        if (locked) { checkUI.start(locked, { locked: true }); return; }
        cards.reset();
        let st = null;
        try { st = await freeplay.status(child); } catch (e) { st = null; }
        if (state.currentStudent !== child || state.screen !== 'home') return;
        if (st && st.reached) cards.showEnd(); else screens.show('freeplay');
      }

      async function go() {
        if (!sel || busy) return;
        busy = true;
        try {
          const r = await freeplayFlow.start(sel, { includeNew: sel === MIXED && incl });
          if (!r.ok && r.why !== 'limit' && r.why !== 'done' && state.screen === 'freeplay') screens.show('home');
        } finally { busy = false; }
      }

      screens.registerActions({
        'just-play'() { justPlay(); },
        'fp-tile'(el) {
          sel = el.getAttribute('data-cat');
          $all('.fp-tile').forEach((t) => { const on = t === el; t.classList.toggle('chosen', on); t.setAttribute('aria-pressed', String(on)); });
          const more = document.querySelector('.fp-new');
          if (more) more.hidden = sel !== MIXED;
          SPEECH.say(el.querySelector('.fp-tile-name').textContent, { now: true });
        },
        'fp-new'(el) {
          incl = !incl;
          el.setAttribute('aria-pressed', String(incl));
          SPEECH.say(feedback.freeplayButton('includeNew') + (incl ? ', on' : ', off'), { now: true });
        },
        'fp-go'() { go(); },
        'fp-change'() { missionUI.leaveRun(); state.run = null; screens.show('freeplay'); }
      });

      return { justPlayHTML, noteHTML, speakNote };
    });
}());
