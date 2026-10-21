/*
 * freeplayStats (L2): Free Play numbers for the adult page and the report (F1). Pure: attempts in, plain numbers out.
 *
 *   summarize(attempts, opts?) -> { total, categories }
 *     total      { activeMs, minutes, problems, firstTry, share }
 *     categories { <category tag>: { activeMs, minutes, problems, firstTry, share, levels, steps, stepDowns } } (tag = strand id or mixed)
 *   attempts = every attempt of one child (guided ones too: they give the right lead-in time); only attempts tagged
 *   decision.source 'freeplay' are counted. opts = { sessions, from, to (time range [from, to)), time }.
 *   minutes  active minutes to one decimal (activeTime.spans); share = first-try answers / problems, or null with no problems
 *   levels   the difficulty steps asked in ordinary questions, sorted; steps = how many; review and step-back questions are not counted
 *   stepDowns  how often the step-down rule fired: each firing shows exactly one guided example, so the answered guided questions count
 * Under-count: a guided example the child left unanswered is not counted. Design hypotheses, listed in the investigation.
 */
(function () {
  'use strict';

  NBA.define('freeplayStats', ['activeTime'], (activeTime) => {
    const fin = (x) => typeof x === 'number' && Number.isFinite(x);
    const tenth = (ms) => Math.round(ms / 6000) / 10;
    const blank = () => ({ activeMs: 0, minutes: 0, problems: 0, firstTry: 0, share: null, levels: [], steps: 0, stepDowns: 0 });

    function finish(row) {
      row.levels.sort((a, b) => a - b);
      row.steps = row.levels.length;
      row.minutes = tenth(row.activeMs);
      row.share = row.problems > 0 ? row.firstTry / row.problems : null;
      return row;
    }

    function summarize(attempts, opts) {
      const o = opts || {};
      const total = blank();
      const cats = {};
      activeTime.spans(attempts, o).forEach((sp) => {
        const a = sp.attempt;
        const d = a.decision;
        if (!d || d.source !== 'freeplay') return;
        if (fin(o.from) && a.timestamp < o.from) return;
        if (fin(o.to) && a.timestamp >= o.to) return;
        const tag = typeof d.category === 'string' ? d.category : String(d.strand);
        if (!Object.prototype.hasOwnProperty.call(cats, tag)) cats[tag] = blank();
        [total, cats[tag]].forEach((r) => {
          r.activeMs += sp.ms;
          r.problems += 1;
          if (a.firstAttemptCorrect === true) r.firstTry += 1;
          if (d.guided === true && d.event !== 'review') r.stepDowns += 1;
          if (d.event === 'answer' && fin(a.difficulty) && r.levels.indexOf(a.difficulty) < 0) r.levels.push(a.difficulty);
        });
      });
      Object.keys(cats).forEach((k) => finish(cats[k]));
      return { total: finish(total), categories: cats };
    }

    return { summarize };
  });
}());
