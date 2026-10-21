/*
 * restCard (L5): the soft daily reminder (brief D-B, FP-1/FP-2). When today's play of the current child reaches
 * the child's daily limit, the child sees ONE calm, spoken card after the current question, in place of the Next
 * card: feedback.restLine() and two buttons of equal size and weight, Home and Keep playing. It never blocks play,
 * shows no clock, no number and no countdown, and never appears in a Meadow Check.
 *   - On the Next card (missionUI rest hook onNextCard) it asks usage.minutesOnDay (the one minutes-per-day
 *     function) for today; the answer arrives well before the Next tap (input guard plus the card).
 *   - On Next (beforeNext) it shows the card when the limit is reached and it was not yet shown to this child today
 *     on this page (plan DD6: an in-memory set, no stored field; after a reload it may show once more that day).
 *   lastCheck()   the promise of the latest check (tests await it before tapping Next)
 */
(function () {
  'use strict';

  NBA.define('restCard', ['config', 'util', 'catalog', 'prefs', 'childSettings', 'usageMath', 'usage', 'dom', 'art', 'speech', 'screens', 'missionUI', 'feedback'],
    (config, util, catalog, prefs, childSettings, usageMath, usage, dom, art, speech, screens, missionUI, feedback) => {
      const { esc } = util;
      const { $, guardInput } = dom;
      const { ICONS } = art;
      const { SPEECH } = speech;
      const { state } = screens;
      const shown = new Set(); // childId|day: shown once per child per local day on this page
      let pending = Promise.resolve(false);
      let due = null;          // { key } when the last check found the limit reached
      let resume = null;       // the advance function of the run waiting behind the card

      const keyOf = (childId, t) => childId + '|' + usageMath.dayKey(t);

      function onNextCard() {
        const child = state.currentStudent;
        due = null;
        if (!child) { pending = Promise.resolve(false); return; }
        const set = childSettings.settingsOf(child, prefs.get('sound'));
        const t = util.now();
        const key = keyOf(child.id, t);
        if (!set.dailyLimitMin || shown.has(key)) { pending = Promise.resolve(false); return; }
        pending = usage.minutesOnDay(child.id, usageMath.dayKey(t), t)
          .then((m) => { const hit = childSettings.limitReached(m, set); if (hit && state.currentStudent === child) due = { key: key }; return hit; })
          .catch(() => false);
      }

      function cardHTML() {
        return '<div class="card next-box rest-box" data-rest="1">' +
          '<p class="rest-text" aria-live="polite">' + esc(feedback.restLine()) + '</p>' +
          '<div class="rest-buttons">' +
          '<button type="button" class="big-btn btn-quiet rest-btn" data-action="rest-home">' + ICONS.home + '<span>Home</span></button>' +
          '<button type="button" class="big-btn btn-quiet rest-btn" data-action="rest-keep">' + ICONS.play + '<span>Keep playing</span></button>' +
          '</div></div>';
      }

      function beforeNext(run, advance) {
        if (!due || run.kind !== 'world' || shown.has(due.key)) return false;
        const overlay = $('#next-card');
        if (!overlay) return false;
        shown.add(due.key);
        due = null;
        resume = advance;
        overlay.innerHTML = cardHTML();
        guardInput();
        SPEECH.say(feedback.restLine());
        return true;
      }

      missionUI.setRestHook({ onNextCard: onNextCard, beforeNext: beforeNext });

      screens.registerActions({
        'rest-home'() { resume = null; missionUI.leaveRun(); screens.show('home'); },
        'rest-keep'() {
          const go = resume;
          resume = null;
          if (go) go();
        }
      });

      return { cardHTML, lastCheck: () => pending, wasShown: (childId, t) => shown.has(keyOf(childId, typeof t === 'number' ? t : util.now())) };
    });
}());
