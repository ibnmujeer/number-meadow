/*
 * prereqEngine (L2): the prerequisite graph rules of step 7. Pure: levels and data come in, plain objects go out; no DOM,
 * no clock, no randomness. Free of worlds and slots, so any caller (the slot decision, the stored plan, Free Play) can use it.
 *
 *   build(rows, isPlayable?)                 a graph from map rows { id, band, prereq }. A skill the app cannot play yet
 *                                            (isPlayable false) never blocks anything and is never offered.
 *   levelsFor(cache, cfg?, ids?)             { conceptId: mastery level } for the playable skills (cache = { mastery, now })
 *   isOpen(c, levels, opts?)                 true when every playable prerequisite of c is at least developing
 *   stepBack(c, levels, opts?)               { conceptId, path, reasonCode } or null: the deepest weak prerequisite
 *   nextOpenAll(c, levels, opts?)            every skill that may be offered after c, best first
 *   nextOpen(c, levels, opts?)               the first of those, or null
 *   dependentsOf(ids, opts?)                 every playable skill that builds on one of ids, directly or through others
 *   opts = { graph, leadIns, weak, open, maxDepth, fits, operation } (defaults: the real map, curriculum.leadIns, config.prereq)
 *
 * Rules (every number is a design hypothesis, see config.prereq):
 *   weak          a prerequisite is weak when its level is in config.prereq.weakLevels (needs_support). An unseen skill is not weak.
 *   step back     walk the earlier skills in their listed order, only through weak ones: the first weak prerequisite, then its first
 *                 weak prerequisite, and so on. The last one reached is the target; the path from c to it is returned.
 *                 reasonCode: prereq_weak for a direct prerequisite, prereq_chain_weak for a longer path. A visited set and
 *                 config.prereq.maxDepth keep it safe on bad data. A lead-in skill is never a target.
 *   next skill    a playable skill, not strong, not c, whose prerequisites are all met, inside the same operation as c. The
 *                 availability rule gates this choice only: it never removes a skill the child can play today.
 *   lead-ins      curriculum.leadIns (skill -> skills to offer first while the child has no data on it) is a play-order hook,
 *                 not a graph edge (a graph edge would be a cycle). A lead-in skips the availability rule.
 */
(function () {
  'use strict';

  NBA.define('prereqEngine', ['config', 'catalog', 'masteryEngine'], (config, catalog, masteryEngine) => {
    const NO_DATA = 'insufficient_data';
    const own = (o, k) => !!o && typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k);

    /** A graph from map rows. Rows without a text id and repeated ids are ignored. */
    function build(rows, isPlayable) {
      const play = typeof isPlayable === 'function' ? isPlayable : () => true;
      const byId = {};
      const ids = [];
      (Array.isArray(rows) ? rows : []).forEach((r, i) => {
        if (!r || typeof r.id !== 'string' || own(byId, r.id)) return;
        byId[r.id] = { id: r.id, index: i, band: Number.isFinite(r.band) ? r.band : 99,
          prereq: Array.isArray(r.prereq) ? r.prereq.filter((p) => typeof p === 'string') : [] };
        ids.push(r.id);
      });
      return { byId: byId, ids: ids, playable: (id) => own(byId, id) && !!play(id) };
    }

    const REAL = build(NBA.data.concepts.map, (id) => !!catalog.conceptById(id));

    /** The playable prerequisites of a skill in their listed order; unknown skills have none. */
    function prereqsOf(g, id) {
      return own(g.byId, id) ? g.byId[id].prereq.filter((p) => g.playable(p)) : [];
    }

    function settings(opts) {
      const o = opts || {};
      const cfg = config.prereq;
      return {
        graph: o.graph || REAL,
        leadIns: o.leadIns || NBA.data.curriculum.leadIns || {},
        weak: Array.isArray(o.weak) ? o.weak : cfg.weakLevels,
        open: Array.isArray(o.open) ? o.open : cfg.openLevels,
        maxDepth: Number.isInteger(o.maxDepth) && o.maxDepth >= 0 ? o.maxDepth : cfg.maxDepth,
        fits: typeof o.fits === 'function' ? o.fits : null,
        operation: typeof o.operation === 'string' ? o.operation : null
      };
    }

    const levelOf = (levels, id) => (levels && own(levels, id) && typeof levels[id] === 'string' ? levels[id] : NO_DATA);
    const isLeadIn = (leadIns, id) => Object.keys(leadIns).some((k) => Array.isArray(leadIns[k]) && leadIns[k].indexOf(id) >= 0);

    /** Mastery levels for the given skills (default: every playable skill of the map). Reads the cache, changes nothing. */
    function levelsFor(cache, cfg0, ids) {
      const cfg = Object.assign({ mastery: config.mastery, error: config.error }, cfg0 || {});
      const list = Array.isArray(ids) ? ids : REAL.ids.filter((id) => REAL.playable(id));
      const out = {};
      list.forEach((id) => {
        const snap = cache && cache.mastery && own(cache.mastery, id) ? cache.mastery[id] : null;
        out[id] = masteryEngine.evaluate(snap || masteryEngine.empty(null, id), cfg.mastery, cache && cache.now, cfg.error).level;
      });
      return out;
    }

    /** True when every playable prerequisite of c is at least developing. A skill with none is open. */
    function isOpen(c, levels, opts) {
      const o = settings(opts);
      return prereqsOf(o.graph, c).every((p) => o.open.indexOf(levelOf(levels, p)) >= 0);
    }

    /**
     * The deepest weak prerequisite of c reached through weak ones, in listed order, or null when no prerequisite is weak.
     * Returns { conceptId, path: [c, ..., conceptId], reasonCode }.
     */
    function stepBack(c, levels, opts) {
      const o = settings(opts);
      const weak = (id) => o.weak.indexOf(levelOf(levels, id)) >= 0 && !isLeadIn(o.leadIns, id);
      const seen = new Set([c]);
      function walk(id, path) {
        if (path.length - 1 >= o.maxDepth) return path;
        const ps = prereqsOf(o.graph, id);
        for (let k = 0; k < ps.length; k++) {
          if (seen.has(ps[k]) || !weak(ps[k])) continue;
          seen.add(ps[k]);
          return walk(ps[k], path.concat(ps[k]));
        }
        return path;
      }
      const path = walk(c, [c]);
      if (path.length < 2) return null;
      return { conceptId: path[path.length - 1], path: path, reasonCode: path.length > 2 ? 'prereq_chain_weak' : 'prereq_weak' };
    }

    /** Default fit: the skill has an activity in the same operation as c (or in opts.operation). */
    function defaultFits(c, o) {
      const concept = catalog.conceptById(c);
      const op = o.operation || (concept ? concept.operation : null);
      return (id) => !!op && catalog.ACTIVITIES.some((a) => a.operation === op && (a.concepts || []).indexOf(id) >= 0);
    }

    /**
     * Every skill that may be offered after c, best first: { conceptId, reasonCode, before }.
     * Order: skills with a lead-in first, then the map band, then curriculum.conceptOrder, then the map order.
     * reasonCode next_skill_ready, or lead_in_first (before = the skill the lead-in comes before).
     */
    function nextOpenAll(c, levels, opts) {
      const o = settings(opts);
      const g = o.graph;
      const fits = o.fits || defaultFits(c, o);
      const order = catalog.CURRICULUM.conceptOrder;
      const orderOf = (id) => (order.indexOf(id) < 0 ? order.length : order.indexOf(id));
      const leadFor = (t) => {
        if (levelOf(levels, t) !== NO_DATA || !Array.isArray(o.leadIns[t])) return null;
        return o.leadIns[t].find((l) => l !== c && g.playable(l) && levelOf(levels, l) !== 'strong') || null;
      };
      const list = g.ids.filter((id) => id !== c && g.playable(id) && levelOf(levels, id) !== 'strong' && isOpen(id, levels, o) && fits(id))
        .map((id) => ({ id: id, lead: leadFor(id) }));
      list.sort((a, b) => ((a.lead ? 0 : 1) - (b.lead ? 0 : 1)) || (g.byId[a.id].band - g.byId[b.id].band)
        || (orderOf(a.id) - orderOf(b.id)) || (g.byId[a.id].index - g.byId[b.id].index));
      return list.map((x) => ({ conceptId: x.lead || x.id, reasonCode: x.lead ? 'lead_in_first' : 'next_skill_ready', before: x.lead ? x.id : null }));
    }

    function nextOpen(c, levels, opts) {
      const all = nextOpenAll(c, levels, opts);
      return all.length ? all[0] : null;
    }

    /** Every playable skill that builds on one of `ids`, directly or through others (not the ids themselves unless they build on each other). */
    function dependentsOf(ids, opts) {
      const g = settings(opts).graph;
      const out = [];
      let frontier = Array.isArray(ids) ? ids.slice() : [];
      while (frontier.length) {
        const found = g.ids.filter((id) => out.indexOf(id) < 0 && g.playable(id) && prereqsOf(g, id).some((p) => frontier.indexOf(p) >= 0));
        out.push.apply(out, found);
        frontier = found;
      }
      return out;
    }

    return { build, graph: REAL, prereqsOf, levelsFor, isOpen, stepBack, nextOpenAll, nextOpen, dependentsOf, isLeadIn };
  });
}());
