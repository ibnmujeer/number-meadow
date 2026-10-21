/*
 * children (L4): child profiles and the automatic default player (DESIGN 9.3, 17.2, D4, D10).
 *
 * The default player is found by its isDefault flag, never by its name. It is created once
 * ("Player 1"; the UI can rename it), so every attempt has a studentId even with no setup at all.
 * Several children can share one device; each child has a nickname, an age in years and an age band.
 *
 * Each change is one batch. Child create (extra ops, for example a pending baseline, join the same
 * batch: P5-N2)/update/archive/restore/delete (one cascading batch over every store with that
 * studentId, exact counts from countStudentData).
 * Validation returns [{ field, code }]; nothing is written while there is a problem.
 * ensurePlayer(currentId): the last-active fallback (17.1, 17.2): the game always has a player.
 * Step 3: setSettings(id, { dailyLimitMin?, voice?, sound?, freePlay?, fpHidden? }) (the per-child settings, one put), promoteDefault(id)
 * (the default flag moves to that child after the default child is deleted) and buddyIdOf(student) (the mapped buddy id).
 *
 * create({ repo, now? }) makes an independent service (tests); the module itself is the app's.
 */
(function () {
  'use strict';

  NBA.define('children', ['util', 'catalog', 'childSettings', 'repo', 'growth'], (util, catalog, childSettings, appRepo, growth) => {
    const DEFAULT_NAME = 'Player 1';
    // eslint-disable-next-line no-control-regex
    const CONTROL = /[\u0000-\u001f\u007f-\u009f]/;
    const AGE_BANDS = ['4-6', '7-9', '10-12'];
    /** Stores whose records belong to one child (the cascade delete covers each). */
    const STUDENT_STORES = ['worldProgress', 'sessions', 'attempts', 'mastery', 'recommendations', 'assessments', 'schedule'];

    function create(options) {
      const o = options || {};
      const repo = o.repo || appRepo;
      const now = typeof o.now === 'function' ? o.now : () => util.now();
      let ensuring = null;

      function newStudent(fields) {
        const t = now();
        return Object.assign({
          id: util.newId('stu', t), name: DEFAULT_NAME, status: 'active', isDefault: false,
          heroId: null, baselineRequired: false, age: null, ageBand: null, createdAt: t, updatedAt: t
        }, fields || {});
      }

      const byAge = (a, b) => (a.createdAt - b.createdAt) || (a.id < b.id ? -1 : (a.id > b.id ? 1 : 0));
      const byName = (a, b) => String(a.name).toLowerCase().localeCompare(String(b.name).toLowerCase()) || byAge(a, b);

      /**
       * The default child (isDefault: true), created if missing. Idempotent: concurrent calls
       * share one promise, and an existing default is never replaced. If the read fails, an unsaved
       * default is returned and nothing is added (P2-L1); if the write fails, the new record is still
       * returned. Either way the game stays playable for this session.
       */
      function ensureDefaultStudent() {
        if (!ensuring) {
          ensuring = (async () => {
            let all;
            try { all = await repo.getAll('students'); } catch (e) { return newStudent({ isDefault: true }); }
            const found = all.filter((s) => s.isDefault === true).sort(byAge)[0];
            if (found) return found;
            const rec = newStudent({ isDefault: true });
            try { await repo.add('students', rec); } catch (e) { /* repo counts the failure; play goes on */ }
            return rec;
          })().finally(() => { ensuring = null; });
        }
        return ensuring;
      }

      function get(id) { return repo.get('students', id); }
      async function allStudents() { return ((await repo.getAll('students')) || []).sort(byName); }

      /** Active children, oldest first. An archived child is never offered to the player picker. */
      async function activeStudents() {
        const all = await repo.getAll('students', { index: 'status', value: 'active' });
        return all.sort(byAge);
      }

      /** The last-used active child if there is one, otherwise the default child. */
      async function chooseStudent(lastStudentId, defaultStudent) {
        if (lastStudentId && lastStudentId !== defaultStudent.id) {
          try {
            const s = await repo.get('students', lastStudentId);
            if (s && s.status === 'active') return s;
          } catch (e) { /* fall back to the default */ }
        }
        return defaultStudent;
      }

      /** The "Who's playing?" picker is shown only with 2 or more active children (D4). */
      async function needsPlayerPicker() {
        try { return (await activeStudents()).length >= 2; } catch (e) { return false; }
      }

      /** Store a buddy choice in the child record field heroId (false for a non-buddy id or a failed write). */
      async function setBuddy(studentId, buddyId) {
        if (!catalog.buddyById(buddyId)) return false;
        try {
          const s = await repo.get('students', studentId);
          if (!s) return false;
          await repo.put('students', Object.assign({}, s, { heroId: buddyId, updatedAt: now() }));
          return true;
        } catch (e) {
          return false;
        }
      }

      /**
       * 17.1/17.2 fallback: the current child when still active; else another active child (the
       * default first); with none active, the default is reactivated, or a new default is created.
       */
      async function ensurePlayer(currentId) {
        const all = (await repo.getAll('students')) || [];
        const cur = all.find((s) => s.id === currentId);
        if (cur && cur.status === 'active') return cur;
        const active = all.filter((s) => s.status === 'active').sort(byAge);
        if (active.length) return active.find((s) => s.isDefault) || active[0];
        const def = all.filter((s) => s.isDefault === true).sort(byAge)[0];
        if (def) {
          const back = Object.assign({}, def, { status: 'active', updatedAt: now() });
          await repo.put('students', back);
          return back;
        }
        return ensureDefaultStudent();
      }

      /* ---------- validation (17.2): [{ field, code }] ---------- */
      function textProblems(field, value, max) {
        if (typeof value !== 'string' || !value.trim()) return [{ field: field, code: 'required' }];
        if (CONTROL.test(value)) return [{ field: field, code: 'control_characters' }];
        if (value.trim().length > max) return [{ field: field, code: 'too_long', max: max }];
        return [];
      }
      function studentProblems(f) {
        const out = textProblems('name', f.name, 30);
        if (f.age !== undefined && f.age !== null && !(typeof f.age === 'number' && Number.isInteger(f.age) && f.age >= 3 && f.age <= 13)) {
          out.push({ field: 'age', code: 'bad_age' });
        }
        if (f.ageBand !== undefined && f.ageBand !== null && AGE_BANDS.indexOf(f.ageBand) < 0) {
          out.push({ field: 'ageBand', code: 'bad_age_band' });
        }
        return out;
      }

      /* ---------- children ---------- */
      function studentFields(f) {
        const out = {};
        if (f.name !== undefined) out.name = String(f.name).trim();
        if (f.age !== undefined) out.age = f.age === null ? null : f.age;
        if (f.ageBand !== undefined) out.ageBand = f.ageBand === null ? null : f.ageBand;
        if (f.baselineRequired !== undefined) out.baselineRequired = f.baselineRequired === true;
        return out;
      }
      /** extraOpsFor(studentId) -> ops (or a Promise of them) written in the SAME batch (P5-N2). */
      async function createStudent(fields, extraOpsFor) {
        const f = fields || {};
        const problems = studentProblems(f);
        if (problems.length) return { ok: false, problems };
        const rec = newStudent(studentFields(Object.assign({ age: null, ageBand: null, baselineRequired: false }, f)));
        const extra = typeof extraOpsFor === 'function' ? (await extraOpsFor(rec.id, rec)) || [] : [];
        await repo.batch([{ op: 'put', store: 'students', value: rec }].concat(extra));
        return { ok: true, record: rec };
      }
      async function updateStudent(id, fields, extraOpsFor) {
        const s = await repo.get('students', id);
        if (!s) return { ok: false, problems: [{ field: 'name', code: 'not_found' }] };
        const f = Object.assign({ name: s.name }, fields || {});
        const problems = studentProblems(f);
        if (problems.length) return { ok: false, problems };
        const rec = Object.assign({}, s, studentFields(f), { updatedAt: now() });
        const extra = typeof extraOpsFor === 'function' ? (await extraOpsFor(id, rec, s)) || [] : [];
        await repo.batch([{ op: 'put', store: 'students', value: rec }].concat(extra));
        return { ok: true, record: rec };
      }
      async function setStudentStatus(id, status) {
        const s = await repo.get('students', id);
        if (!s) return { ok: false, code: 'not_found' };
        const rec = Object.assign({}, s, { status: status, updatedAt: now() });
        await repo.put('students', rec);
        return { ok: true, record: rec };
      }
      const archiveStudent = (id) => setStudentStatus(id, 'archived');
      const restoreStudent = (id) => setStudentStatus(id, 'active');

      async function studentRecords(id) {
        const out = {};
        for (const store of STUDENT_STORES) out[store] = (await repo.getAll(store, { index: 'studentId', value: id })) || [];
        return out;
      }
      /** The exact counts the delete dialog states (17.2). */
      async function countStudentData(id) {
        const r = await studentRecords(id);
        // P8-20: a placement check (step 8) writes no assessments row; it opens an 'assessment' session
        // with assessmentId null. Count those too so the delete message states every Meadow Check.
        const placementSessions = r.sessions.filter((s) => s.kind === 'assessment' && (s.assessmentId === null || s.assessmentId === undefined)).length;
        return { answers: r.attempts.length, sessions: r.sessions.length, checks: r.assessments.length + placementSessions,
          worlds: r.worldProgress.filter((w) => w.best > 0 || w.done).length, worldRecords: r.worldProgress.length,
          mastery: r.mastery.length, recommendations: r.recommendations.length };
      }
      /** Irreversible: ONE batch deletes the child and every record with that studentId (17.2). */
      async function deleteStudent(id) {
        const s = await repo.get('students', id);
        if (!s) return { ok: false, code: 'not_found' };
        const r = await studentRecords(id);
        const keys = { worldProgress: (x) => [x.studentId, x.worldId], mastery: (x) => [x.studentId, x.conceptId],
          recommendations: (x) => [x.studentId, x.conceptId], schedule: (x) => [x.studentId, x.conceptId] };
        const ops = [{ op: 'delete', store: 'students', key: id }];
        STUDENT_STORES.forEach((store) => r[store].forEach((x) => ops.push({ op: 'delete', store: store, key: keys[store] ? keys[store](x) : x.id })));
        await repo.batch(ops);
        const counts = {};
        STUDENT_STORES.forEach((store) => { counts[store] = r[store].length; });
        return { ok: true, counts: counts };
      }

      /* ---------- step 3: per-child settings and the default handover ---------- */
      /** fields: { dailyLimitMin? (config.adults.limitChoices), voice?, sound?, freePlay? (booleans), fpHidden? (known strand ids, G1) }. One put. */
      async function setSettings(id, fields) {
        const f = fields || {};
        const problems = [];
        if (f.dailyLimitMin !== undefined && !childSettings.validLimit(f.dailyLimitMin)) problems.push({ field: 'dailyLimitMin', code: 'bad_limit' });
        ['voice', 'sound', 'freePlay'].forEach((k) => { if (f[k] !== undefined && typeof f[k] !== 'boolean') problems.push({ field: k, code: 'not_boolean' }); });
        if (f.fpHidden !== undefined && !childSettings.validHidden(f.fpHidden)) problems.push({ field: 'fpHidden', code: 'bad_hidden_categories' });
        const s = await repo.get('students', id);
        if (!s) problems.push({ field: 'id', code: 'not_found' });
        if (problems.length) return { ok: false, problems };
        const rec = Object.assign({}, s, { updatedAt: now() });
        ['dailyLimitMin', 'voice', 'sound', 'freePlay'].forEach((k) => { if (f[k] !== undefined) rec[k] = f[k]; });
        if (f.fpHidden !== undefined) rec.fpHidden = f.fpHidden.slice();
        await repo.put('students', rec);
        return { ok: true, record: rec };
      }

      /** Make this child the default player (plan DD8): its isDefault flag on, every other one off, in one batch. */
      async function promoteDefault(id) {
        const all = (await repo.getAll('students')) || [];
        const target = all.find((s) => s.id === id);
        if (!target) return { ok: false, code: 'not_found' };
        const t = now();
        const ops = all.filter((s) => (s.id === id) !== (s.isDefault === true))
          .map((s) => ({ op: 'put', store: 'students', value: Object.assign({}, s, { isDefault: s.id === id, updatedAt: t }) }));
        if (ops.length) await repo.batch(ops);
        return { ok: true };
      }

      /**
       * Step 4 (P4): choose the buddy's colour tint and accessory. look = { tint?, accessory? }, an id or null (the buddy's own
       * colour / no accessory). An id the child has not unlocked is refused. unlockedMarks is the caller's count of growth
       * marks when it knows more than the stored record (a mark earned a moment ago may not be written yet). Get, then put.
       */
      async function setBuddyLook(id, look, unlockedMarks) {
        const f = look || {};
        const s = await repo.get('students', id);
        if (!s) return { ok: false, problems: [{ field: 'id', code: 'not_found' }] };
        const marks = Math.max(s.growth && Array.isArray(s.growth.marks) ? s.growth.marks.length : 0, Math.floor(Number(unlockedMarks)) || 0);
        const open = growth.unlockedItems(marks);
        const problems = [];
        if (f.tint !== undefined && f.tint !== null && open.tints.indexOf(f.tint) < 0) problems.push({ field: 'tint', code: 'not_unlocked' });
        if (f.accessory !== undefined && f.accessory !== null && open.accessories.indexOf(f.accessory) < 0) problems.push({ field: 'accessory', code: 'not_unlocked' });
        if (problems.length) return { ok: false, problems };
        const rec = Object.assign({}, s, { updatedAt: now() });
        if (f.tint !== undefined) rec.buddyTint = f.tint;
        if (f.accessory !== undefined) rec.buddyAccessory = f.accessory;
        await repo.put('students', rec);
        return { ok: true, record: rec };
      }
      /** The child's buddy id (a stored retired id is mapped), or null when none is picked yet. */
      function buddyIdOf(student) { return student ? catalog.toBuddyId(student.heroId) : null; }

      return {
        ensureDefaultStudent, get, allStudents, activeStudents, chooseStudent, needsPlayerPicker, setBuddy, newStudent, ensurePlayer,
        createStudent, updateStudent, archiveStudent, restoreStudent, countStudentData, deleteStudent,
        setSettings, setBuddyLook, promoteDefault, buddyIdOf,
        DEFAULT_NAME, STUDENT_STORES, AGE_BANDS
      };
    }

    const app = create();
    return Object.assign({ create }, app);
  });
}());
