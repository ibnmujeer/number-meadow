/*
 * dataReset (L4): "Reset everything" in the Grown-ups area (brief O5). In this order:
 *   1. learning.flush() then learning.reset() (nothing in flight, the cache and queue dropped);
 *   2. migrations.markerAfterReset(): reads (never writes) the v1 save and builds a meta.v1Migration marker with its
 *      current hash and status 'done', or null when there is no v1 save;
 *   3. repo.clearAllThenPut([marker]): every IndexedDB store is cleared, including meta (the PIN, lastImport and the
 *      old marker), and the new marker is put, in ONE transaction. A crash or failure in between rolls the whole
 *      reset back, so there is never a moment with the data gone and no marker (the next boot would merge v1 again);
 *   4. the marker is read back, so the next boot does not merge the v1 save into the new child;
 *   5. prefs.remove(): the v2 prefs key only (never the v1 key, never localStorage.clear());
 *   6. children.ensureDefaultStudent(): a fresh default child.
 * resetEverything() -> { ok: true, studentId, marker } | { ok: false, step } (a retry is safe).
 * create({ repo, prefs, migrations, learning, children, readV1?, now? }); the module itself is the app's.
 */
(function () {
  'use strict';

  NBA.define('dataReset', ['util', 'repo', 'prefs', 'migrations', 'learning', 'children'],
    (util, appRepo, appPrefs, appMigrations, appLearning, appChildren) => {
      function create(options) {
        const o = options || {};
        const repo = o.repo || appRepo, prefs = o.prefs || appPrefs, migrations = o.migrations || appMigrations;
        const learning = o.learning || appLearning, children = o.children || appChildren;
        const now = typeof o.now === 'function' ? o.now : () => util.now();

        async function resetEverything() {
          let step = 'flush';
          try {
            await learning.flush();
            learning.reset();
            step = 'marker';
            const marker = migrations.markerAfterReset({ readV1: o.readV1, now: now });
            step = 'clear';
            await repo.clearAllThenPut(marker ? [{ store: 'meta', value: marker }] : []);
            if (marker) {
              step = 'write-marker';
              const back = await repo.get('meta', 'v1Migration');
              if (!back || back.sourceHash !== marker.sourceHash || back.status !== 'done') return { ok: false, step: step };
            }
            step = 'prefs';
            prefs.remove();
            step = 'default-child';
            const def = await children.ensureDefaultStudent();
            return { ok: true, studentId: def.id, marker: marker };
          } catch (e) {
            return { ok: false, step: step };
          }
        }

        return { resetEverything };
      }

      const app = create();
      return Object.assign({ create }, app);
    });
}());
