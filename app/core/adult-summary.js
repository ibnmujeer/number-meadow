/*
 * adultSummary (L2): the facts the Grown-ups child page and the TXT report show for ONE child (step 3). Pure:
 * plain arrays in, a plain model out; `now` is passed in. Records of any other child in the input are ignored,
 * and only the child's nickname, age and age band are read from the child record.
 *   buildModel(input) -> { child, facts, skills, ways, patterns, nextSteps, review, checks, freePlay, notes, summary }
 *   freePlay (Free Play F4): Free Play next to guided play and one row per category, from the tagged attempts (freePlayBlock)
 *     input = { child, attempts, sessions, mastery, recommendations, assessments, schedule?, now, openSessionId?,
 *               representations (NBA.data.representations.list), display: { id(s) } (exporter.shown), config? }
 *   childFacts, skillRows, waysFrom, patternRows, nextSteps, reviewRows, checkRows, dataNotes, summaryLines: the parts
 * review (step 5): { scheduled, due, nextDueDay, rows } from the child's schedule items; plain counts and dates only. A due day in the
 * past is shown as today, so no date reads as late.
 * Skill rows are rebuilt from the attempts (masteryEngine.rebuild, as the mastery CSV is); a stored snapshot is
 * used only for a skill with no attempts in the input. "Works best" (brief O9): named only when at least two ways
 * were tried, every tried way has config.adults.waysMinSample answers (design hypothesis) and one way leads alone.
 */
(function () {
  'use strict';

  NBA.define('adultSummary', ['config', 'catalog', 'masteryEngine', 'adultWords', 'usageMath', 'reviewEngine', 'activeTime', 'freeplayStats', 'placementEngine'],
    (config, catalog, masteryEngine, adultWords, usageMath, reviewEngine, activeTime, freeplayStats, placementEngine) => {
      const W = adultWords;
      const EPS = 1e-9;
      const list = (x) => (Array.isArray(x) ? x.filter((r) => r && typeof r === 'object') : []);
      const mine = (x, id) => list(x).filter((r) => r.studentId === id);
      const num = (x) => typeof x === 'number' && Number.isFinite(x);
      const ORDER = catalog.CURRICULUM.conceptOrder;
      const LIST_ORDER = catalog.CONCEPTS.map((c) => c.id);
      const rank = (id) => {
        const i = ORDER.indexOf(id);
        return i >= 0 ? i : ORDER.length + LIST_ORDER.indexOf(id);
      };
      const byConcept = (a, b) => rank(a) - rank(b) || (a < b ? -1 : (a > b ? 1 : 0));
      const AGE_BAND_WORDS = { '4-6': '4 to 6', '7-9': '7 to 9', '10-12': '10 to 12' };

      /** First and last played, session and attempt counts and total minutes. */
      function childFacts(sessions, attempts, opts) {
        const o = opts || {};
        const cap = (o.cfg || config).adults.sessionCapMin * usageMath.MINUTE_MS;
        const lastAt = {};
        attempts.forEach((a) => { if (num(a.timestamp)) lastAt[a.sessionId] = Math.max(lastAt[a.sessionId] || 0, a.timestamp); });
        const span = { openId: o.openSessionId || null, now: o.now, capMs: cap, lastAttemptAt: lastAt };
        const starts = [], ends = [];
        sessions.forEach((s) => {
          const sp = usageMath.sessionSpan(s, { openId: span.openId, now: o.now, capMs: cap, lastAttemptAt: lastAt[s.id] });
          if (num(s.startedAt)) { starts.push(sp.start); ends.push(sp.end); }
        });
        attempts.forEach((a) => { if (num(a.timestamp)) { starts.push(a.timestamp); ends.push(a.timestamp); } });
        return {
          firstPlayed: starts.length ? Math.min.apply(null, starts) : null,
          lastPlayed: ends.length ? Math.max.apply(null, ends) : null,
          sessions: sessions.length, attempts: attempts.length,
          totalMinutes: usageMath.minutesIn(sessions, -Infinity, Infinity, span),
          spanOpts: span
        };
      }

      /** One row per skill with answers, in curriculum order. */
      function skillRows(childId, attempts, snapshots, cfg, now) {
        const c = cfg || config;
        const inc = c.mastery.includeContexts;
        const ids = new Set();
        attempts.forEach((a) => { if (inc.indexOf(a.context) >= 0 && Array.isArray(a.conceptIds)) a.conceptIds.forEach((x) => ids.add(x)); });
        const stored = {};
        snapshots.forEach((s) => { if (typeof s.conceptId === 'string') stored[s.conceptId] = s; });
        Object.keys(stored).forEach((k) => ids.add(k));
        return Array.from(ids).filter((id) => catalog.conceptById(id)).sort(byConcept).map((id) => {
          const hasAtt = attempts.some((a) => Array.isArray(a.conceptIds) && a.conceptIds.indexOf(id) >= 0);
          const snap = hasAtt ? masteryEngine.rebuild(attempts, childId, id, c.mastery) : masteryEngine.norm(stored[id]);
          const ev = masteryEngine.evaluate(snap, c.mastery, now, c.error);
          const recent = snap.recent || [];
          return {
            id: id, name: W.conceptWord(id), level: ev.level, levelWord: W.levelWord(ev.level), attempts: snap.total,
            first: { n: snap.firstCorrect, of: snap.total }, recent: { n: recent.filter((r) => r.first).length, of: recent.length },
            trend: ev.metrics.recentTrend, trendWord: W.trendWord(ev.metrics.recentTrend),
            hintBand: ev.metrics.hintBand, hintWord: W.hintWord(ev.metrics.hintBand), hinted: snap.hinted,
            patterns: ev.patterns || [], ways: waysFrom(snap.byRepresentation, null, c)
          };
        }).filter((r) => r.attempts > 0);
      }

      /**
       * Ways of showing from counts { rep: { n, first } } (a snapshot's byRepresentation, or counted from attempts).
       * -> { rows: [{ id, words, n, first }] for every listed way, best: id | null, tried, short: [ids under the minimum] }
       */
      function waysFrom(counts, repList, cfg) {
        const min = (cfg || config).adults.waysMinSample;
        const reps = (Array.isArray(repList) && repList.length ? repList : catalog.REPRESENTATIONS).map((r) => r.id);
        const rows = reps.map((id) => {
          const b = counts && counts[id];
          return { id: id, words: W.repWord(id), n: b && num(b.n) ? b.n : 0, first: b && num(b.first) ? b.first : 0 };
        });
        const tried = rows.filter((r) => r.n > 0);
        const short = tried.filter((r) => r.n < min).map((r) => r.id);
        let best = null;
        if (tried.length >= 2 && !short.length) {
          const top = Math.max.apply(null, tried.map((r) => r.first / r.n));
          const leaders = tried.filter((r) => r.first / r.n >= top - EPS);
          if (leaders.length === 1) best = leaders[0].id;
        }
        return { rows: rows, best: best, tried: tried.length, short: short };
      }

      /** Counts per way of showing over the attempts (first tries right). */
      function wayCounts(attempts) {
        const out = {};
        attempts.forEach((a) => {
          if (typeof a.representation !== 'string') return;
          const b = out[a.representation] || { n: 0, first: 0 };
          out[a.representation] = { n: b.n + 1, first: b.first + (a.firstAttemptCorrect === true ? 1 : 0) };
        });
        return out;
      }

      function patternRows(skills) {
        const out = [];
        skills.forEach((s) => s.patterns.forEach((p) => out.push({
          conceptId: s.id, label: p.label, words: W.patternWord(p.label), status: p.status, statusWord: W.statusWord(p.status),
          count: p.count, of: p.of
        })));
        return out;
      }

      /** The two cross-representation labels count over every answer per way of showing, the others over recent answers. */
      const BY_WAY = ['word-problem-comprehension', 'representation-transition'];
      function patternCount(p) {
        return BY_WAY.indexOf(p.label) >= 0 ? 'based on ' + p.of + ' answers' : p.count + ' of ' + p.of + ' recent answers';
      }

      function nextSteps(recommendations) {
        return recommendations.filter((r) => typeof r.conceptId === 'string' && r.decision)
          .sort((a, b) => byConcept(a.conceptId, b.conceptId))
          .map((r) => ({ conceptId: r.conceptId, name: W.conceptWord(r.conceptId), action: String(r.decision.action || ''), text: W.nextStepText(r.decision) }));
      }

      /** The review block: how many skills are in the review list, how many are due now, the next due day, one row per skill. */
      function reviewRows(items, now) {
        const all = list(items).filter((it) => reviewEngine.reviewable(it.conceptId));
        const s = reviewEngine.summary(all, now);
        const today = reviewEngine.today(now, reviewEngine.floorOf(all));
        const rows = all.slice().sort((a, b) => byConcept(a.conceptId, b.conceptId)).map((it) => ({
          id: it.conceptId, name: W.conceptWord(it.conceptId), step: it.step + 1, steps: reviewEngine.INTERVALS.length,
          everyDays: reviewEngine.INTERVALS[it.step], dueDay: it.dueDay < today ? today : it.dueDay, due: it.dueDay <= today,
          reviews: it.reviews, firstTries: it.firstTries
        }));
        return { scheduled: s.scheduled, due: s.due, nextDueDay: s.nextDueDay, rows: rows };
      }

      const FORM_WORDS = { baseline: 'first check (baseline)', post: 'later check (post)' };
      /** Complete and started Meadow Checks, oldest first. display.id maps a stored check id for display. */
      function checkRows(assessments, display) {
        const show = display && typeof display.id === 'function' ? display.id : (s) => s;
        const scores = (m) => Object.keys(m || {}).map((k) => ({ id: k, correct: m[k].correct, total: m[k].total }));
        return assessments.filter((r) => r.status === 'complete' || r.status === 'in_progress')
          .sort((a, b) => (a.createdAt - b.createdAt) || (a.id < b.id ? -1 : 1))
          .map((r) => {
            const res = r.status === 'complete' ? r.result : null;
            return {
              form: r.form, formWords: FORM_WORDS[r.form] || String(r.form), blueprint: show(r.blueprintId), done: !!res,
              at: res ? r.completedAt : r.startedAt, correct: res ? res.correct : null, total: res ? res.total : null,
              byConcept: res ? scores(res.byConcept).sort((a, b) => byConcept(a.id, b.id)) : [],
              byRepresentation: res ? scores(res.byRepresentation) : []
            };
          });
      }

      const PLACE_FORM_WORDS = { baseline: 'first check', post: 'later check' };
      const isPlacement = (a) => !!(a && a.decision && a.decision.source === 'placement');
      /**
       * The time of the FIRST placement check (Step 12, D12-17): the earliest tagged placement attempt of this child, or null
       * when there is none. Worked out on every read from the stored attempts; nothing new is saved.
       */
      function firstCheckAt(attempts) {
        return list(attempts).filter(isPlacement).reduce((m, a) => (num(a.timestamp) && (m === null || a.timestamp < m) ? a.timestamp : m), null);
      }

      /** Short D-A words for a settled rung (the first variant's words at that rung), or null. */
      function rungWords(rungN) {
        const rungs = (NBA.data.placement && NBA.data.placement.rungs) || [];
        const r = rungs[(Number(rungN) || 0) - 1];
        return r && r.variants && r.variants[0] ? r.variants[0].words : null;
      }

      /**
       * The placement checks (step 8), fed from the tagged attempts, NOT the old assessments store (P8-1 A).
       * One block per run (grouped by its session), oldest first. Each block carries the D-A words only
       * (Growing, Practising, Needs a gentler step, Not enough data yet), a FIRST GUESS note, and plain
       * data warnings (early stop, cap without settling, the top of built content, the floor stop).
       * -> [{ sessionId, form, formWords, at, total, outcome, settledRung, settledWords, firstGuess,
       *       skills: [{ id, name, levelWord }], warnings: [string], compareWords? }]
       */
      function placementRows(attempts, cfg) {
        const c = cfg || config;
        const runs = {};
        list(attempts).filter(isPlacement).forEach((a) => {
          const key = typeof a.sessionId === 'string' ? a.sessionId : 'none';
          (runs[key] = runs[key] || []).push(a);
        });
        const rows = Object.keys(runs).map((sid) => {
          const atts = runs[sid];
          const at = atts.reduce((m, a) => (num(a.timestamp) ? Math.max(m, a.timestamp) : m), -Infinity);
          const sum = placementEngine.summarize(atts, c);
          const skills = Object.keys(sum.levels).sort(byConcept).map((id) => ({
            id: id, name: W.conceptWord(id), levelWord: W.levelWord(sum.levels[id].level)
          }));
          return {
            sessionId: sid, form: sum.form, formWords: PLACE_FORM_WORDS[sum.form] || String(sum.form),
            at: num(at) ? at : null, total: sum.total, outcome: sum.outcome, settledRung: sum.settledRung,
            settledWords: rungWords(sum.settledRung), firstGuess: true,
            skills: skills, warnings: placementWarnings(sum, c)
          };
        }).sort((a, b) => (a.at || 0) - (b.at || 0) || (a.sessionId < b.sessionId ? -1 : 1));
        return addCompare(rows);
      }

      /** Plain, D-A data warnings for one placement summary (R5). */
      function placementWarnings(sum, cfg) {
        const c = cfg || config;
        const out = [];
        out.push('These words come from a short check, so they are a first guess. Play will update them.');
        if (sum.outcome === 'child_stopped' || sum.total < c.placement.minAnswers) {
          out.push('Stopped early after ' + sum.total + (sum.total === 1 ? ' question' : ' questions') + '. This is not enough to say much.');
        }
        // A 'cap' ending at (or just below) the top rung means the child kept answering the hardest built
        // questions right up to the twenty-answer limit, so it reads as reaching the top of the built content,
        // not as "did not settle" (step 11 D11-4: with 32 rungs an always-right child hits the cap at the top).
        const atTop = sum.settledRung !== null && sum.settledRung >= c.placement.maxRung - 1;
        if (sum.outcome === 'cap' && !atTop) out.push('Ended after ' + sum.total + ' questions without settling. Treat the result as rough.');
        if (sum.outcome === 'floor') out.push('The check ended early because the easiest questions were hard. That is fine.');
        if (atTop) {
          out.push('The child answered the hardest questions the app has today. More arrive in later updates.');
        }
        return out;
      }

      /** Add the pre/post words to the latest later check that follows a first check (R4). */
      function addCompare(rows) {
        const base = rows.filter((r) => r.form === 'baseline' && r.outcome !== 'child_stopped').slice(-1)[0];
        const post = rows.filter((r) => r.form === 'post' && r.outcome !== 'child_stopped').slice(-1)[0];
        if (base && post && (post.at || 0) >= (base.at || 0)) {
          post.compareWords = 'Compared with the first check: settled around ' +
            (base.settledWords || 'the easiest step') + ', now around ' + (post.settledWords || 'the easiest step') + '.';
        }
        return rows;
      }

      const tenth = (ms) => Math.round(ms / 6000) / 10;
      const isFree = (a) => !!(a.decision && a.decision.source === 'freeplay');
      /**
       * The FREE PLAY block (F4): Free Play next to guided play, all time and the last 7 and 30 days, and one row per category.
       * Both sides are ACTIVE minutes worked out from the answers (activeTime), so they are comparable; guided = ordinary play
       * questions that carry no Free Play tag. Free Play answers are also counted in every other block of the model.
       * -> { total, categories: [{ id, label, ...freeplayStats row }], windows: { all, d7, d30 } | { all } } with
       *    window = { freePlay: { minutes, problems, firstTry, share }, guided: { minutes, problems } }
       */
      function freePlayBlock(attempts, sessions, now) {
        const ses = {};
        sessions.forEach((s) => { if (typeof s.id === 'string') ses[s.id] = { startedAt: s.startedAt }; });
        const stats = freeplayStats.summarize(attempts, { sessions: ses });
        const L = NBA.data.freeplay;
        const order = Object.keys(L.labels).concat(['mixed']);
        const rank2 = (k) => (order.indexOf(k) >= 0 ? order.indexOf(k) : order.length);
        const categories = Object.keys(stats.categories).sort((a, b) => rank2(a) - rank2(b) || (a < b ? -1 : 1)).map((k) =>
          Object.assign({ id: k, label: k === 'mixed' ? L.mixed : (L.labels[k] || k) }, stats.categories[k]));
        const guided = activeTime.spans(attempts, { sessions: ses }).filter((sp) => sp.attempt.context === 'play' && !isFree(sp.attempt));
        const part = (from, to) => {
          const mine2 = guided.filter((sp) => sp.attempt.timestamp >= from && sp.attempt.timestamp < to);
          return { freePlay: freeplayStats.summarize(attempts, { sessions: ses, from: from, to: to }).total,
            guided: { minutes: tenth(mine2.reduce((n, sp) => n + sp.ms, 0)), problems: mine2.length } };
        };
        const windows = { all: part(-Infinity, Infinity) };
        if (num(now)) {
          const today = usageMath.dayKey(now);
          [['d7', 7], ['d30', 30]].forEach((w) => {
            const d = usageMath.daysBack(today, w[1]);
            windows[w[0]] = part(usageMath.dayBounds(d[0]).start, usageMath.dayBounds(d[d.length - 1]).end);
          });
        }
        return { total: stats.total, categories: categories, windows: windows };
      }

      /** DATA NOTES: small samples, ways of showing, no check, how minutes are counted. */
      function dataNotes(model, cfg) {
        const a = (cfg || config).adults;
        const out = [];
        const n = model.facts.attempts;
        const answers = (k) => k + (k === 1 ? ' answer' : ' answers');
        if (n < a.smallSampleTotal) out.push('Only ' + answers(n) + ' in all. Treat this report as a first look.');
        model.skills.filter((s) => s.attempts < a.smallSampleSkill).forEach((s) => out.push(s.id + ': only ' + answers(s.attempts) + '.'));
        const w = model.ways;
        if (n > 0 && w.best === null) {
          if (w.short.length) {
            out.push('Ways of showing: fewer than ' + a.waysMinSample + ' answers for ' + w.short.map(W.repWord).join(', ') + ', so no best way is named.');
          } else if (w.tried < 2) out.push('Ways of showing: only one way was tried, so no best way is named.');
          else out.push('Ways of showing: no single way leads, so no best way is named.');
        }
        if (!model.checks.length && !(model.placementChecks && model.placementChecks.length)) out.push('No Meadow Check has been done yet.');
        if (model.review.scheduled > 0) out.push('Review times of ' + reviewEngine.INTERVALS.join(', ') + ' days are a design hypothesis, not research.');
        out.push('Minutes come from the start and end times of play sessions.');
        if (model.freePlay && model.freePlay.total.problems > 0) {
          out.push('Free Play minutes are active time worked out from the answers (an estimate, a design hypothesis), so they can differ from session minutes.');
        }
        return out;
      }

      /** Two to four plain sentences for the top of the child page. */
      function summaryLines(model) {
        const name = model.child.name;
        const f = model.facts;
        if (!f.attempts) return [name + ' has not answered any questions yet.', 'This page fills in after some play.'];
        const out = [name + ' has played ' + f.sessions + (f.sessions === 1 ? ' session' : ' sessions') + ' and answered ' +
          f.attempts + (f.attempts === 1 ? ' question.' : ' questions.')];
        const group = (level) => model.skills.filter((s) => s.level === level).map((s) => s.name);
        const grow = group('strong'), gentle = group('needs_support');
        if (grow.length) out.push('Growing: ' + grow.slice(0, 3).join(', ') + '.');
        if (gentle.length) out.push('Needs a gentler step: ' + gentle.slice(0, 3).join(', ') + '.');
        if (out.length < 3 && model.ways.best) out.push('Works best so far: ' + W.repWord(model.ways.best) + '.');
        if (out.length < 2) out.push('Most skills do not have enough answers yet.');
        return out.slice(0, 4);
      }

      function buildModel(input) {
        const i = input || {};
        const cfg = i.config || config;
        const ch = i.child && typeof i.child === 'object' ? i.child : {};
        const id = ch.id;
        const attempts = mine(i.attempts, id), sessions = mine(i.sessions, id);
        const model = {
          child: { name: typeof ch.name === 'string' ? ch.name : '', age: num(ch.age) ? ch.age : null,
            ageBand: typeof ch.ageBand === 'string' ? ch.ageBand : null,
            ageBandWords: AGE_BAND_WORDS[ch.ageBand] || null },
          facts: childFacts(sessions, attempts, { now: i.now, openSessionId: i.openSessionId, cfg: cfg }),
          skills: skillRows(id, attempts, mine(i.mastery, id), cfg, i.now),
          ways: waysFrom(wayCounts(attempts), i.representations, cfg),
          nextSteps: nextSteps(mine(i.recommendations, id)),
          review: reviewRows(mine(i.schedule, id), i.now),
          checks: checkRows(mine(i.assessments, id), i.display),
          placementChecks: placementRows(attempts, cfg),
          firstCheckAt: firstCheckAt(attempts)
        };
        model.patterns = patternRows(model.skills);
        model.freePlay = freePlayBlock(attempts, sessions, i.now);
        model.notes = dataNotes(model, cfg);
        model.summary = summaryLines(model);
        return model;
      }

      return { buildModel, childFacts, skillRows, waysFrom, wayCounts, patternRows, patternCount, nextSteps, reviewRows, checkRows, placementRows, firstCheckAt, dataNotes, summaryLines, freePlayBlock, AGE_BAND_WORDS };
    });
}());
