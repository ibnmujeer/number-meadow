/*
 * feedbackUI (L5): what the child sees and hears around an answer: the Next card after a right answer and the hint box
 * after an answer that is not right yet. Moved out of mission-ui.js so that the mission file stays small; the Meadow
 * Check shows its neutral line through the same Next card. Calm rules: the line is announced politely, the Next
 * card never moves on by itself, and nothing here records, scores or times anything.
 *   praiseFor(run)                 the line for a right answer: chosen by what the child did (feedback.situation), never by chance
 *   growthFor()                    the growth sentence of the oldest unshown growth mark, or null
 *   nextCardHTML(praise, last, growthText?)  the Next card markup (no star, no count: nothing is scored on it)
 *   showNextCard(praise, afterShow?, growthText?)  adds the Next card once; afterShow runs after it is on screen
 *   showHint(run, q)               the hint ladder rung for the current question (child/hint-ui.js)
 */
(function () {
  'use strict';

  NBA.define('feedbackUI',
    ['util', 'dom', 'art', 'screens', 'runKinds', 'feedback', 'learning', 'hintUI'],
    (util, dom, art, screens, runKinds, feedback, learning, hintUI) => {
      const { esc } = util;
      const { $, guardInput } = dom;
      const { ICONS } = art;
      const { state, fill } = screens;

      const IMPROVING_WINDOW = 5; // first-try results per window when asking whether the skill is going better

      /**
       * The line for a right answer, by what the child did: first try, after help, stayed with a tricky one, a new way of
       * showing (run.sameWay is false), or progress when the first-try success on this skill rose over the window before.
       */
      function praiseFor(run) {
        const q = run.q;
        const sit = feedback.situation({
          firstTry: run.firstTry, wrongCount: run.wrongCount, modelShown: run.rung >= 3, sameWayAsBefore: run.sameWay,
          improving: feedback.improving(learning.firstTryFlags(q.conceptId), IMPROVING_WINDOW)
        });
        const line = feedback.praise({ situation: sit, index: screens.nextFeedbackIndex(), way: q.representation, avoid: state.lastLine });
        state.lastLine = line;
        return fill(line);
      }

      /**
       * The growth sentence for the oldest growth mark that was earned and not shown yet, or null (step 4, P2). It is
       * shown quietly on the Next card after the answer, never in the middle of a question.
       */
      function growthFor() {
        const m = learning.takeGrowth();
        return m ? feedback.growthLine({ conceptId: m.conceptId }) : null;
      }

      /** The Next card overlay shown after a correct answer (the praise is announced politely). */
      function nextCardHTML(praise, last, growthText) {
        return '<div id="next-card" class="overlay"><div class="card next-box">' +
          '<p class="praise" aria-live="polite">' + esc(praise) + '</p>' +
          (growthText ? '<p class="growth-line" aria-live="polite"><span class="sprout">' + ICONS.sprout + '</span><span>' + esc(growthText) + '</span></p>' : '') +
          '<button type="button" class="big-btn btn-go" data-action="next"><span>' + (last ? 'Finish' : 'Next') + '</span>' +
          ICONS.next + '</button></div></div>';
      }

      function showNextCard(praise, afterShow, growthText) {
        const sec = $('.screen[data-screen="mission"]');
        if (!sec || $('#next-card')) return;
        sec.insertAdjacentHTML('beforeend', nextCardHTML(praise, runKinds.isLast(state.run), growthText));
        guardInput();
        if (typeof afterShow === 'function') afterShow();
      }

      /** Show (and say) the hint for the answer that was not right yet (the ladder: look, count, model). */
      function showHint(run, q) { hintUI.show(run, q); }

      return { praiseFor, growthFor, nextCardHTML, showNextCard, showHint };
    });
}());
