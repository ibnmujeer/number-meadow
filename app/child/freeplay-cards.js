/*
 * freeplayCards (L5): what can stand between two Free Play questions, and the calm ways out of Free Play (F3). Nothing here
 * shows a clock, a count or a bar. A card comes only after the Next tap (never in the middle of a question), never moves on by
 * itself, and its two buttons have the same size, fill and weight, so keeping on never looks better than stopping.
 *   pause card     after every config.freeplay.pauseEvery finished problems on this page: "Want to keep going, or take a break?"
 *   stretch card   after every config.freeplay.stretchEveryMin active minutes of one continuous period (guided and Free Play
 *                  together; the minutes come from the stored answers, freeplay.status().periodMin). It wins over the pause card
 *                  when both are due on the same Next tap, and both counters restart (one card only)
 *   end screen     'freeplay-end': the warm stop at the daily limit, after the Next tap or on Just play. Home, or Ask a grown-up
 *                  (the button's action fp-ask is registered by the Grown-ups area, app/adult; the child code never reaches it)
 *   category done  the category screen with one calm line, when a category has nothing more to offer
 * Actions: fp-keep (Keep going), fp-break (Take a break: Home with one calm line for the next Home render only). Every line is
 * said with SPEECH.say, so it follows the child's sound and voice settings (sound off is text only).
 *   reset()      new sitting (Just play): the problem count and the stretch count start again
 *   showEnd()    show the end screen (used by Just play and by the limit handler)
 */
(function () {
  'use strict';

  NBA.define('freeplayCards', ['config', 'util', 'dom', 'speech', 'art', 'screens', 'feedback', 'missionUI', 'freeplayFlow'],
    (config, util, dom, speech, art, screens, feedback, missionUI, freeplayFlow) => {
      const FP = config.freeplay;
      const { esc } = util;
      const { $, later, guardInput } = dom;
      const { SPEECH } = speech;
      const { ICONS, faceHTML } = art;
      const { state, currentBuddy, currentLook } = screens;
      let since = 0;           // problems finished since the last pause or stretch card
      let base = 0;            // active minutes of the period when the last stretch card was shown (or 0)
      let seen = null;         // the period minutes the last check saw
      let resume = null;       // the function that shows the next question behind the card

      /** True when 20 more active minutes of this period have passed since the last stretch card; moves the base. */
      function stretchDue(st) {
        const p = st && Number.isFinite(st.periodMin) ? st.periodMin : null;
        if (p === null) return false;
        if (seen !== null && p < seen) base = 0; // the period ended and a new one began
        seen = p;
        if (p - base < FP.stretchEveryMin) return false;
        base = p;
        return true;
      }

      function cardHTML(kind, line) {
        return '<div class="card next-box fp-card" data-fp-card="' + kind + '">' +
          '<p class="rest-text" aria-live="polite">' + esc(line) + '</p>' +
          '<div class="rest-buttons">' +
          '<button type="button" class="big-btn btn-quiet rest-btn" data-action="fp-keep">' + ICONS.play + '<span>' + esc(feedback.freeplayButton('keepGoing')) + '</span></button>' +
          '<button type="button" class="big-btn btn-quiet rest-btn" data-action="fp-break">' + ICONS.home + '<span>' + esc(feedback.freeplayButton('takeBreak')) + '</span></button>' +
          '</div></div>';
      }

      function showCard(kind, line, proceed) {
        const overlay = $('#next-card');
        if (!overlay) return false;
        overlay.innerHTML = cardHTML(kind, line);
        guardInput();
        resume = proceed;
        SPEECH.say(line);
        const first = overlay.querySelector('button');
        if (first) first.focus();
        return true;
      }

      freeplayFlow.addGate((run, proceed, st) => {
        since += 1;
        if (stretchDue(st)) { since = 0; return showCard('stretch', feedback.stretchLine(), proceed); }
        if (since >= FP.pauseEvery) { since = 0; return showCard('pause', feedback.pauseLine(), proceed); }
        return false;
      });

      screens.register('freeplay-end', {
        render() {
          return '<section class="screen fp-end" data-screen="freeplay-end">' +
            faceHTML(currentBuddy().id, 'fp-end-buddy', '', currentLook()) +
            '<p class="fp-end-line" aria-live="polite">' + esc(feedback.endLine()) + '</p>' +
            '<div class="rest-buttons fp-end-buttons">' +
            '<button type="button" class="big-btn btn-quiet rest-btn" data-action="home">' + ICONS.home + '<span>' + esc(feedback.freeplayButton('home')) + '</span></button>' +
            '<button type="button" class="big-btn btn-quiet rest-btn" data-action="fp-ask">' + ICONS.adults + '<span>' + esc(feedback.freeplayButton('askGrownUp')) + '</span></button>' +
            '</div></section>';
        },
        after() { later(() => SPEECH.say(feedback.endLine()), config.TIMING.STORY_SPEAK); }
      });

      function leave() { missionUI.leaveRun(); state.run = null; resume = null; }
      function showEnd() { leave(); screens.show('freeplay-end'); }

      freeplayFlow.setHandlers({
        limit() { showEnd(); },
        exhausted() { leave(); screens.show('freeplay', { note: feedback.categoryDoneLine() }); }
      });

      screens.registerActions({
        'fp-keep'() { const go = resume; resume = null; if (go) go(); },
        'fp-break'() {
          leave();
          since = 0;
          state.homeNote = feedback.restLine(); // shown on the next Home render only (game-ui reads and clears it)
          screens.show('home');
        }
      });

      return { reset() { since = 0; base = 0; seen = null; }, showEnd, stretchDue, cardHTML };
    });
}());
