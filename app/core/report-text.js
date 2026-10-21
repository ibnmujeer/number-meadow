/*
 * reportText (L2): the TXT learning report for one child (brief section 1, O11, O12). A PURE function: no DOM,
 * no clock, no randomness; the caller passes every record and `now`. The same input gives the same text.
 *   build(input) -> string    input = { child, attempts, sessions, mastery, recommendations, assessments, config?,
 *                             display: { id } (exporter.shown), representations, prompt, appVersion, now, openSessionId? }
 *   fileName(now)             number-meadow-report_<YYYY-MM-DD>.txt (local date; never the nickname)
 *   promptOnly(input?)        the AI PROMPT text alone (the "Copy AI prompt only" button)
 *   toAscii(s)                NFD with combining marks dropped; any other non-ASCII or control character -> ?
 *   SECTIONS                  the twelve heading lines, in order (REVIEW sits between ENGINE NEXT STEPS and DATA NOTES, step 5;
 *                             FREE PLAY sits between REVIEW and DATA NOTES, format version 3)
 * Step 12 (D12-17): the CHILD section has a "First Meadow Check: <date>" line ("Not yet" when the child has no placement
 * check), worked out from the stored placement attempts. No section was added, so the format version stays 4.
 * Format: every line ends with CRLF, ASCII only, a blank line between sections, the AI PROMPT last and byte for
 * byte. Words lead every share; a number may follow in brackets ("Most first tries right (9 of 12, 75%)"). The only
 * name printed is the child's nickname; ids are printed only for skills, ways of showing and the check blueprint.
 */
(function () {
  'use strict';

  NBA.define('reportText', ['config', 'adultWords', 'adultSummary', 'usageMath'], (config, adultWords, adultSummary, usageMath) => {
    const W = adultWords;
    const CRLF = '\r\n';
    const SECTIONS = ['Number Meadow learning report', 'CHILD', 'CHECKS', 'SKILLS', 'WAYS OF SHOWING', 'PATTERNS',
      'ENGINE NEXT STEPS', 'REVIEW', 'FREE PLAY', 'DATA NOTES', 'GLOSSARY', 'AI PROMPT'];

    /** ASCII only: accents are dropped (NFD), anything else outside printable ASCII becomes '?'. */
    function toAscii(s) {
      return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7e]/g, '?');
    }

    function fileName(now) { return 'number-meadow-report_' + usageMath.dayKey(now) + '.txt'; }

    function promptOnly(input) {
      const p = input && typeof input.prompt === 'string' ? input.prompt : NBA.data.reportPrompt.text;
      return p;
    }

    /** "Most first tries right (9 of 12, 75%)"; no answers: "Not enough data yet". */
    function share(n, of, cfg) {
      if (!of) return W.NOT_ENOUGH;
      return W.accuracyWord(n / of, cfg) + ' (' + n + ' of ' + of + ', ' + Math.round((100 * n) / of) + '%)';
    }

    function build(input) {
      const i = input || {};
      const cfg = i.config || config;
      const a = cfg.adults;
      const model = adultSummary.buildModel(i);
      const day = (ms) => (typeof ms === 'number' && Number.isFinite(ms) ? usageMath.dayKey(ms) : 'Not yet');
      const nick = toAscii(model.child.name.trim());
      const changed = nick !== model.child.name.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const out = [];
      const section = (lines) => { if (out.length) out.push(''); lines.forEach((l) => out.push(toAscii(l))); };

      section([SECTIONS[0], 'App: Number Meadow', 'App version: ' + String(i.appVersion || ''),
        'Report format version: ' + a.reportFormatVersion, 'Date: ' + day(i.now),
        'Privacy: Only a nickname is included. Check before pasting into any tool.']);

      const f = model.facts;
      section([SECTIONS[1], 'Nickname: ' + nick,
        'Age: ' + (model.child.age !== null ? String(model.child.age) : 'Not given'),
        'Age band: ' + (model.child.ageBandWords || 'Not given'),
        'First played: ' + day(f.firstPlayed), 'Last played: ' + day(f.lastPlayed),
        'Sessions: ' + f.sessions, 'Attempts: ' + f.attempts, 'Total minutes: ' + f.totalMinutes,
        'First Meadow Check: ' + day(model.firstCheckAt)]);

      const place = model.placementChecks || [];
      const checks = [SECTIONS[2]];
      if (!model.checks.length && !place.length) checks.push('No checks yet');
      model.checks.forEach((c) => {
        const head = 'Meadow Check, ' + c.formWords + ' (' + c.blueprint + ')';
        if (!c.done) { checks.push(head + ', started ' + day(c.at) + ', not finished'); return; }
        checks.push(head + ', ' + day(c.at) + ': ' + c.correct + ' of ' + c.total + ' first tries right');
        c.byConcept.forEach((x) => checks.push('  skill ' + x.id + ' (' + W.conceptWord(x.id) + '): ' + x.correct + ' of ' + x.total));
        c.byRepresentation.forEach((x) => checks.push('  way ' + W.repWord(x.id) + ' (' + x.id + '): ' + x.correct + ' of ' + x.total));
      });
      // step 8: the placement checks, in plain D-A words only (a first guess, no percentages, no rung number)
      place.forEach((p) => {
        checks.push('Meadow Check, ' + p.formWords + ', ' + day(p.at) + ': ' + p.total + (p.total === 1 ? ' question' : ' questions'));
        checks.push('  Settled around: ' + (p.settledWords || 'not enough to say'));
        p.skills.forEach((s) => checks.push('  skill ' + s.id + ' (' + s.name + '): ' + s.levelWord));
        if (p.compareWords) checks.push('  ' + p.compareWords);
        p.warnings.forEach((w) => checks.push('  Note: ' + w));
      });
      section(checks);

      const skills = [SECTIONS[3]];
      if (!model.skills.length) skills.push('No answers yet');
      model.skills.forEach((s) => skills.push([s.id, s.name, s.levelWord, 'attempts ' + s.attempts,
        'first-try accuracy: ' + share(s.first.n, s.first.of, a), 'recent accuracy: ' + share(s.recent.n, s.recent.of, a),
        'trend: ' + s.trendWord, 'hint reliance: ' + s.hintWord + ' (' + s.hinted + ' of ' + s.attempts + ')'].join(' | ')));
      section(skills);

      const ways = [SECTIONS[4]];
      model.ways.rows.forEach((r) => ways.push(r.words + ' (' + r.id + '): attempts ' + r.n + ' | first-try accuracy: ' + share(r.first, r.n, a)));
      ways.push('Works best overall: ' + (model.ways.best ? W.repWord(model.ways.best) : W.NOT_ENOUGH));
      section(ways);

      const pats = [SECTIONS[5]];
      if (!model.patterns.length) pats.push('No patterns found yet');
      model.patterns.forEach((p) => pats.push([p.conceptId, p.words, p.statusWord, adultSummary.patternCount(p)].join(' | ')));
      section(pats);

      const next = [SECTIONS[6]];
      if (!model.nextSteps.length) next.push('No plans yet. The app plans after a few answers.');
      model.nextSteps.forEach((n) => next.push(n.conceptId + ' | ' + n.text));
      section(next);

      const rv = model.review;
      const review = [SECTIONS[7], 'Skills in review: ' + rv.scheduled, 'Due for review now: ' + rv.due, 'Next due: ' + (rv.nextDueDay || 'None')];
      if (!rv.rows.length) review.push('Nothing in review yet');
      rv.rows.forEach((r) => review.push([r.id, r.name, 'step ' + r.step + ' of ' + r.steps + ' (every ' + r.everyDays + (r.everyDays === 1 ? ' day)' : ' days)'),
        'next due ' + r.dueDay, 'reviews ' + r.reviews + ', first try right ' + r.firstTries].join(' | ')));
      section(review);

      const fp = model.freePlay, free = [SECTIONS[8]];
      const times = (k) => k + (k === 1 ? ' time' : ' times');
      if (!fp.total.problems) free.push('No Free Play yet');
      else {
        free.push('Free Play problems: ' + fp.total.problems, 'Free Play active minutes: ' + fp.total.minutes,
          'Free Play first-try accuracy: ' + share(fp.total.firstTry, fp.total.problems, a));
        fp.categories.forEach((c) => free.push([c.label + ' (' + c.id + ')', 'minutes ' + c.minutes, 'problems ' + c.problems,
          'first-try accuracy: ' + share(c.firstTry, c.problems, a), 'difficulty steps visited ' + c.steps + (c.steps ? ' (' + c.levels.join(', ') + ')' : ''),
          'step-down rule fired ' + times(c.stepDowns)].join(' | ')));
        const g = fp.windows.all.guided;
        free.push('Guided play, for comparison: ' + g.minutes + ' active minutes, ' + g.problems + ' problems',
          'Free Play answers are also counted in CHILD, SKILLS and WAYS OF SHOWING.');
      }
      section(free);

      const notes = model.notes.slice();
      if (changed) notes.push('Some letters of the nickname cannot be shown and appear as ?.');
      section([SECTIONS[9]].concat(notes.map((n) => '- ' + n)));

      section([SECTIONS[10]].concat(W.glossary(cfg).map((g) => g[0] + ': ' + g[1])));

      section([SECTIONS[11]]);
      out.push(promptOnly(i));
      return out.join(CRLF) + CRLF;
    }

    return { build, fileName, promptOnly, toAscii, share, SECTIONS, CRLF };
  });
}());
