/*
 * hintUI (L5): the four-rung hint ladder on the mission screen (step 4, P9). After an answer that is not right yet it
 * shows and speaks one short line (the gentle line of the rung, then the rung text from core/hint-ladder.js) and draws
 * the help in the child's own way of showing (child/hint-draw.js). Rung 1 looks, rung 2 counts together, rung 3 shows
 * the model; the child still taps the answer. Rung 4, the similar question, is chosen by missionUI when a question
 * finishes after the model. No red, no cross, no buzzer: the wood knock for the tapped answer is played by missionUI.
 *   show(run, q)    rung = hintLadder.rungFor(run.wrongCount, ...); sets run.rung and counts run.hintsShown
 *   lead(q)         the gentle line of rung 4, said before a similar question
 */
(function () {
  'use strict';

  NBA.define('hintUI', ['dom', 'speech', 'counters', 'screens', 'questionTypes', 'feedback', 'hintLadder', 'hintDraw'],
    (dom, speech, counters, screens, questionTypes, feedback, hintLadder, hintDraw) => {
    const { $, replayClass } = dom;
    const { SPEECH, forSpeech } = speech;
    const { state } = screens;

    function show(run, q) {
      const box = $('#hint');
      if (!box) return;
      const rung = hintLadder.rungFor(run.wrongCount, hintLadder.wrongOptionsOf(questionTypes.get(q.typeId).inputMode)) || 1;
      const s = hintLadder.say(q, rung, { index: screens.nextFeedbackIndex(), avoid: state.lastLine });
      state.lastLine = s.lead;
      run.rung = rung;
      run.hintsShown++;
      box.textContent = s.say;
      box.hidden = false;
      replayClass(box, 'pop');
      hintDraw.draw($('#stage'), q, rung, hintLadder.ladder(q));
      counters.fitStage(); // the hint takes room from the stage
      SPEECH.say(forSpeech(s.say));
    }

    /** The calm line before a similar question (rung 4); it is not a hint, so nothing is counted. */
    function lead(q) {
      const line = feedback.gentle({ rung: 4, index: screens.nextFeedbackIndex(), way: q.representation, avoid: state.lastLine });
      state.lastLine = line;
      return line;
    }

    return { show, lead };
  });
}());
