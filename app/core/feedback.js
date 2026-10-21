/*
 * feedback (L2): pure pickers over NBA.data.feedbackLines. No DOM, no clock, no randomness; the caller passes
 * every input, including a rotation index (a plain counter the caller advances once per line it shows).
 * The same input always gives the same line, and two consecutive indexes never give the same line.
 *   situation({ firstTry, wrongCount, modelShown, sameWayAsBefore, improving })
 *                                   'firstTry' | 'progress' | 'afterHelp' | 'newWay' | 'stayed'
 *   improving(flags, windowSize?)   true when the first-try success on a skill rose from the window before to the latest one
 *   praise({ situation, index, way?, avoid?, buddyName? })   one praise line
 *   gentle({ rung, index, way?, avoid? })                     one line for a not-right answer (rung 1 look, 2 count, 3 model, 4 similar)
 *   growthLine({ conceptId })       "You are getting stronger at adding." or null for an unknown skill
 *   worldComplete({ index })        { heading, sentence } for the World Complete card
 *   restLine()                      the soft rest reminder
 *   pauseLine() stretchLine() endLine() categoryDoneLine() pickTitle()   the Free Play lines; freeplayLine(key) by key
 *   freeplayButton(key)             a Free Play button word (justPlay, go, change, keepGoing, takeBreak, home, askGrownUp, includeNew)
 *   lines()                         every child-facing string as { section, group, text } (for scans and the lines list)
 *   problems(data?)                 list of problems in a lines object (empty = fine); data defaults to the shipped lines
 *   make(data)                      the same pickers over another lines object (tests plant faults this way)
 * Rules:
 *   - way is the representation id of the question (concrete, visual, number-line, symbolic, word-problem). A line that
 *     names a tool is listed in data.ways and is picked only for the ways it fits; an unknown or missing way gets only the
 *     lines that fit every way. avoid is the line the child saw last: it is skipped, so a line never shows twice in a row
 *     even when the way changes.
 *   - The progress group says that things are getting easier. It is used only for a first-try answer with evidence
 *     (improving is true). Otherwise a first-try answer rotates the effort and strategy groups only.
 */
(function () {
  'use strict';

  NBA.define('feedback', ['catalog'], (catalog) => {
    const FIRST_TRY_GROUPS = ['effort', 'strategy'];
    const SITUATION_GROUP = { progress: 'progress', afterHelp: 'help', newWay: 'newWay', stayed: 'stayed' };
    const RUNG_GROUP = { 1: 'look', 2: 'count', 3: 'model', 4: 'similar' };
    const WAYS = ['concrete', 'visual', 'number-line', 'symbolic', 'word-problem'];
    const MAX_WORDS = 9;
    const MIN = { praiseGroups: 4, praiseTotal: 20, gentleTotal: 15, look: 4, count: 4, model: 4, similar: 3 };
    const own = (m, k) => Object.prototype.hasOwnProperty.call(m, k);

    /** A rotation index as a whole number of at least 0. */
    function whole(n) { const x = Math.floor(Number(n)); return x > 0 ? x : 0; }
    const fillBuddy = (s, name) => (typeof name === 'string' && name ? s.replace(/\{buddy\}/g, name) : s);
    const wordCount = (s) => String(s).split(/[\s\u00a0]+/).filter(Boolean).length;

    function situation(o) {
      const p = o || {};
      const wrong = whole(p.wrongCount);
      if (wrong >= 3 || p.modelShown === true) return 'stayed';
      if (p.firstTry === false || wrong >= 1) return 'afterHelp';
      if (p.improving === true) return 'progress';
      return p.sameWayAsBefore === false ? 'newWay' : 'firstTry';
    }

    /**
     * Did first-try success rise? flags: first-try results of the child's answers on one skill, oldest first.
     * Needs two full windows; true only when the latest window has a strictly higher share than the one before.
     */
    function improving(flags, windowSize) {
      const w = Math.max(2, whole(windowSize) || 5);
      if (!Array.isArray(flags) || flags.length < 2 * w) return false;
      const share = (a) => a.filter((x) => x === true).length / a.length;
      return share(flags.slice(-w)) > share(flags.slice(-2 * w, -w));
    }

    /** The picker set over one lines object. */
    function make(L) {
      const ways = L.ways || {};
      /** The lines of a group that fit the way (all of them when untagged); never empty when the group is not. */
      function usable(list, way) {
        const fit = list.filter((t) => !own(ways, t) || ways[t].indexOf(way) >= 0);
        return fit.length ? fit : list.filter((t) => !own(ways, t));
      }
      /** The line at position pos of the usable lines, stepping over avoid when another line is usable. */
      function choose(list, way, pos, avoid) {
        const u = usable(list, way);
        if (!u.length) return list[pos % list.length];
        const first = u[pos % u.length];
        return first === avoid && u.length > 1 ? u[(pos + 1) % u.length] : first;
      }

      function praise(o) {
        const p = o || {};
        const i = whole(p.index);
        if (own(SITUATION_GROUP, p.situation)) {
          return fillBuddy(choose(L.praise[SITUATION_GROUP[p.situation]], p.way, i, p.avoid), p.buddyName);
        }
        const g = L.praise[FIRST_TRY_GROUPS[i % FIRST_TRY_GROUPS.length]];
        return fillBuddy(choose(g, p.way, Math.floor(i / FIRST_TRY_GROUPS.length), p.avoid), p.buddyName);
      }

      function gentle(o) {
        const p = o || {};
        const rung = Math.min(4, Math.max(1, whole(p.rung) || 1));
        return choose(L.gentle[RUNG_GROUP[rung]], p.way, whole(p.index), p.avoid);
      }

      function growthLine(o) {
        const id = o && o.conceptId;
        const G = L.growth;
        if (!own(G.families, id) || !own(G.skills, id)) return null;
        return G.sentences[G.families[id]].replace(/\{skill\}/g, G.skills[id]);
      }

      function worldComplete(o) {
        const s = L.worldComplete.sentences;
        return { heading: L.worldComplete.heading, sentence: s[whole(o && o.index) % s.length] };
      }

      /** One Free Play line by key (pause, stretch, end, categoryDone, title), or null. */
      function freeplayLine(key) {
        const F = L.freeplay;
        return F && own(F, key) && typeof F[key] === 'string' ? F[key] : null;
      }
      /** One Free Play button word by key (justPlay, go, change, keepGoing, takeBreak, home, askGrownUp, includeNew), or null. */
      function freeplayButton(key) {
        const B = L.freeplay && L.freeplay.buttons;
        return B && own(B, key) ? B[key] : null;
      }

      return {
        praise, gentle, growthLine, worldComplete, restLine: () => L.restLine, usable, freeplayLine, freeplayButton,
        pauseLine: () => freeplayLine('pause'), stretchLine: () => freeplayLine('stretch'), endLine: () => freeplayLine('end'),
        categoryDoneLine: () => freeplayLine('categoryDone'), pickTitle: () => freeplayLine('title')
      };
    }

    /** Every child-facing string of a lines object; growth sentences are filled once for each skill of their family. */
    function linesOf(data) {
      const out = [];
      const add = (section, group, text) => out.push({ section: section, group: group, text: text });
      Object.keys(data.praise).forEach((g) => data.praise[g].forEach((t) => add('praise', g, t)));
      Object.keys(data.gentle).forEach((g) => data.gentle[g].forEach((t) => add('gentle', g, t)));
      if (data.hints) {
        Object.keys(data.hints).forEach((type) => Object.keys(data.hints[type]).forEach((rung) => {
          const h = data.hints[type][rung];
          (Array.isArray(h) ? h : [h]).forEach((t) => add('hints', type + ' ' + rung, t));
        }));
      }
      const G = data.growth;
      Object.keys(G.skills).forEach((id) => add('growth skill', id, G.skills[id]));
      Object.keys(G.families).forEach((id) => add('growth', id, G.sentences[G.families[id]].replace(/\{skill\}/g, G.skills[id])));
      add('worldComplete', 'heading', data.worldComplete.heading);
      data.worldComplete.sentences.forEach((t) => add('worldComplete', 'sentence', t));
      add('restLine', 'restLine', data.restLine);
      const FP = data.freeplay || {};
      Object.keys(FP).forEach((k) => {
        if (k === 'buttons') Object.keys(FP.buttons).forEach((b) => add('freeplay', 'button ' + b, FP.buttons[b]));
        else add('freeplay', k, FP[k]);
      });
      return out;
    }

    /** Structure checks that the lines file must keep: group sizes, word limits, ASCII, no repeats, tags and usable lines per way. */
    function problems(data) {
      const d = data || catalog.FEEDBACK_LINES;
      const out = [];
      try {
        const seen = {};
        let praiseTotal = 0, gentleTotal = 0;
        ['effort', 'strategy', 'progress', 'help'].forEach((g) => {
          if (!d.praise[g] || d.praise[g].length < MIN.praiseGroups) out.push('praise.' + g + ': fewer than ' + MIN.praiseGroups + ' lines');
        });
        ['look', 'count', 'model', 'similar'].forEach((g) => {
          if (!d.gentle[g] || d.gentle[g].length < MIN[g]) out.push('gentle.' + g + ': fewer than ' + MIN[g] + ' lines');
        });
        Object.keys(d.praise).forEach((g) => d.praise[g].forEach((t) => {
          praiseTotal++;
          if (own(seen, t)) out.push('praise line in two groups or twice: ' + t);
          seen[t] = g;
        }));
        Object.keys(d.gentle).forEach((g) => { gentleTotal += d.gentle[g].length; });
        if (praiseTotal < MIN.praiseTotal) out.push('praise: ' + praiseTotal + ' lines, want at least ' + MIN.praiseTotal);
        if (gentleTotal < MIN.gentleTotal) out.push('gentle: ' + gentleTotal + ' lines, want at least ' + MIN.gentleTotal);
        linesOf(d).forEach((l) => {
          if (typeof l.text !== 'string' || !l.text.trim()) { out.push(l.section + ' ' + l.group + ': empty line'); return; }
          if (/[^\x20-\x7e]/.test(l.text)) out.push(l.section + ' ' + l.group + ': not ASCII: ' + l.text);
          if (l.section === 'hints') return;
          l.text.split(/(?<=[.!?])\s+/).forEach((s) => {
            if (wordCount(s) > MAX_WORDS) out.push(l.section + ' ' + l.group + ': more than ' + MAX_WORDS + ' words: ' + s);
          });
          if ((l.section === 'praise' || l.section === 'gentle' || l.section === 'growth' || l.section === 'freeplay') && wordCount(l.text) > MAX_WORDS) {
            out.push(l.section + ' ' + l.group + ': more than ' + MAX_WORDS + ' words: ' + l.text);
          }
        });
        Object.keys(d.growth.families).forEach((id) => {
          if (!own(d.growth.skills, id)) out.push('growth: no skill name for ' + id);
          if (!own(d.growth.sentences, d.growth.families[id])) out.push('growth: no sentence for family ' + d.growth.families[id]);
        });
        Object.keys(d.growth.sentences).forEach((f) => {
          if (d.growth.sentences[f].indexOf('{skill}') < 0) out.push('growth: sentence for ' + f + ' has no {skill}');
        });
        // tags: every key is a real praise or gentle line, every value a list of known ways
        const everyLine = {};
        ['praise', 'gentle'].forEach((s) => Object.keys(d[s]).forEach((g) => d[s][g].forEach((t) => { everyLine[t] = s + '.' + g; })));
        Object.keys(d.ways || {}).forEach((t) => {
          if (!own(everyLine, t)) out.push('ways: not a praise or gentle line: ' + t);
          const v = d.ways[t];
          if (!Array.isArray(v) || !v.length || v.some((x) => WAYS.indexOf(x) < 0)) out.push('ways: bad list for ' + t);
        });
        // every way keeps enough usable lines in every group
        const pick = make(d).usable;
        WAYS.forEach((way) => {
          [['praise', 'effort', MIN.praiseGroups], ['praise', 'strategy', MIN.praiseGroups], ['praise', 'progress', MIN.praiseGroups],
            ['praise', 'help', MIN.praiseGroups], ['gentle', 'look', MIN.look], ['gentle', 'count', MIN.count],
            ['gentle', 'model', MIN.model], ['gentle', 'similar', MIN.similar]].forEach((c) => {
            const n = pick(d[c[0]][c[1]], way).length;
            if (n < c[2]) out.push(c[0] + '.' + c[1] + ' has ' + n + ' usable lines for ' + way + ', want ' + c[2]);
          });
        });
      } catch (e) {
        out.push('lines data is malformed: ' + e.message);
      }
      return out;
    }

    const shipped = make(catalog.FEEDBACK_LINES);
    return {
      MAX_WORDS, WAYS, situation, improving, make, linesOf, problems,
      praise: shipped.praise, gentle: shipped.gentle, growthLine: shipped.growthLine, worldComplete: shipped.worldComplete,
      restLine: shipped.restLine, freeplayLine: shipped.freeplayLine, freeplayButton: shipped.freeplayButton,
      pauseLine: shipped.pauseLine, stretchLine: shipped.stretchLine, endLine: shipped.endLine,
      categoryDoneLine: shipped.categoryDoneLine, pickTitle: shipped.pickTitle, lines: () => linesOf(catalog.FEEDBACK_LINES)
    };
  });
}());
