/*
 * placementFlow (L5): the placement check run on the mission screen (step 8; DESIGN 15, R1 to R6). It joins the
 * placements service to missionUI the way freeplayFlow joins Free Play: it starts a run, shows each question the
 * pure placementEngine chooses, answers with one tap (the same neutral Next line after every answer, no star, no
 * hint, no right answer), and ends the run on the stop verdict or when the child taps "All done". It draws the
 * intro and end cards (place-intro, place-end) and the All done stop button (action place-stop).
 *
 * What the child never sees here (CLAUDE.md rules 3 and 4, R2): no count, no timer, no score, no rung, no
 * right/wrong, no growth line, no number, and never the words test/level/score/mastery/assessment. Every child
 * line is at most 14 words and is voiced through SPEECH.say (silent when Sound is off, D-E). Targets are 64 px.
 *
 * This file is NOT a Free Play file and must not import Free Play modules; it may use placement modules. (static
 * check 14 isolation; the Free Play files must not import placementFlow.)
 *
 * API:
 *   start(opts?)   async. opts { band } (an age band id or undefined). Opens a run through placements.start, shows
 *                  the first question on the mission screen, resolves { ok, form, startRung } or { ok:false, why }.
 *   state()        a copy of the live engine state (tests read it); null before a run.
 */
(function () {
  'use strict';

  NBA.define('placementFlow', ['config', 'util', 'dom', 'audio', 'speech', 'art', 'screens', 'placements', 'missionUI'],
    (config, util, dom, audio, speech, art, screens, placements, missionUI) => {
      const { TIMING } = config;
      const { esc } = util;
      const { $, later, replayClass } = dom;
      const { AUDIO } = audio;
      const { SPEECH } = speech;
      const { ICONS, faceHTML, iconBtn } = art;
      const { state, currentBuddy, fill } = screens;

      /** The same line after every answer, right or wrong (D8); no score, no verdict. */
      const NEUTRAL_LINE = 'Got it! On to the next one.';
      const INTRO_LINES = ["Let's play some number games, {buddy}!", 'Do what you can. You can stop any time.'];
      const END_LINE = 'Thanks, {buddy}! Back to the meadow.';

      /** Start a placement run for the current student at the band's rung; show the first question (false: none). */
      async function start(opts) {
        const o = opts || {};
        const child = state.currentStudent;
        if (!child) return { ok: false, why: 'no_child' };
        let begun;
        try { begun = await placements.start(child.id, { band: o.band, createdBy: o.createdBy || 'adult' }); }
        catch (e) { return { ok: false, why: 'unreadable' }; }
        if (state.currentStudent !== child) { placements.abandon(); placements.end(); return { ok: false, why: 'no_child' }; }
        const first = placements.next(screens.currentBuddyId());
        if (!first) { placements.end(); return { ok: false, why: 'no_question' }; }
        missionUI.startPlace(first.question, 'Meadow Check');
        return { ok: true, form: begun.form, startRung: begun.startRung };
      }

      missionUI.setPlaceHook({
        /** One submission: lock, tap sound, record through the service, then the same neutral Next card. */
        answer(value, el) {
          const run = state.run;
          if (!run || run.kind !== 'place' || !run.q || run.locked) return;
          run.locked = true;
          run.submitted.push(value);
          if (run.firstPerf === null) run.firstPerf = performance.now();
          AUDIO.play('tap');
          if (el) replayClass(el, 'pop');
          placements.answer(value); // the service steps the staircase and writes the attempt (P8-19: nothing on abandon)
          SPEECH.say(NEUTRAL_LINE);
          later(() => missionUI.showNextCard(NEUTRAL_LINE), TIMING.NEXT_CARD);
        },
        /** The Next tap: show the next question, or end the run when the staircase has settled (no number shown). */
        next(run) {
          const q = placements.next(screens.currentBuddyId());
          if (q) { missionUI.showPlace(q.question); return; }
          placements.end();
          missionUI.leaveRun();
          state.run = null;
          screens.show('place-end');
        },
        /** Leaving (Home, All done, a new run, a student change): abandon the open question and close the session. */
        leave(run) { placements.abandon(); placements.end(); }
      });

      function banner() {
        return '<div class="banner tile-paper check-banner"><span class="tile-symbol">' + ICONS.tick + '</span>' +
          '<span class="banner-name">Meadow Check</span></div>';
      }

      screens.register('place-intro', {
        render() {
          return '<section class="screen story-screen check-screen" data-screen="place-intro"><header class="bar">' +
            iconBtn('home', 'home', 'Home') + '<h1 class="screen-title">Meadow Check</h1></header>' +
            '<div class="card story-card">' + banner() +
            '<div class="story-art">' + faceHTML(currentBuddy().id, 'story-buddy') + '</div>' +
            '<p class="story-text">' + esc(fill(INTRO_LINES[0])) + ' ' + esc(fill(INTRO_LINES[1])) + '</p>' +
            '<button type="button" class="big-btn btn-go go-btn" data-action="place-begin"><span>Start!</span>' + ICONS.next + '</button>' +
            '</div></section>';
        },
        after(sec, p) {
          state.placeBand = p && p.band ? p.band : null;
          later(() => SPEECH.say(fill(INTRO_LINES[0]) + ' ' + fill(INTRO_LINES[1])), TIMING.STORY_SPEAK);
        }
      });

      screens.register('place-end', {
        render() {
          return '<section class="screen story-screen check-screen" data-screen="place-end"><header class="bar">' +
            '<h1 class="screen-title">Meadow Check</h1></header>' +
            '<div class="card story-card">' + banner() +
            '<div class="story-art">' + faceHTML(currentBuddy().id, 'story-buddy') + '</div>' +
            '<p class="story-text"><strong>All done!</strong> ' + esc(fill(END_LINE)) + '</p>' +
            '<button type="button" class="big-btn btn-go go-btn" data-action="home">' + ICONS.home + '<span>Home</span></button>' +
            '</div></section>';
        },
        after() {
          AUDIO.play('star');
          later(() => SPEECH.say('All done! ' + fill(END_LINE)), TIMING.STORY_SPEAK);
        }
      });

      screens.registerActions({
        'place-begin'() { start({ band: state.placeBand }).then((r) => { if (!r || !r.ok) screens.show('home'); }); },
        /** All done: abandon the open question, end the session (the place hook), show the same kind end card. */
        'place-stop'() { missionUI.leaveRun(); state.run = null; screens.show('place-end'); }
      });

      return { start, state: () => placements.state(), NEUTRAL_LINE };
    });
}());
