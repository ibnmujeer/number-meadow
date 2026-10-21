/*
 * importUpgraders (L3): the export-file upgraders of the JSON import (moved out of import.js, which
 * was at the 400-line limit).
 *
 * upgraders[v](bundle) -> the bundle at version v + 1. The envelope in import.js runs them in order
 * from the file's schemaVersion, after the checksum check and before per-record validation, so the
 * result of each step must be valid under the next schema.
 *   upgraders[1]  schema 1 -> 2: drops the classes/assignments/overrides data, strips classId,
 *                 archivedWithClass and localId from every child and nulls assignmentId on every attempt.
 *   upgraders[2]  schema 2 -> 3 (step 5): adds an empty `schedule` list (the new spaced-review store).
 */
(function () {
  'use strict';

  NBA.define('importUpgraders', [], () => {
    const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

    const upgraders = {
      1(bundle) {
        const data = Object.assign({}, bundle.data);
        delete data.classes; delete data.assignments; delete data.overrides;
        if (Array.isArray(data.students)) data.students = data.students.map((s) => {
          const v = Object.assign({}, s);
          delete v.classId; delete v.archivedWithClass; delete v.localId;
          if (!own(v, 'age')) v.age = null;
          if (!own(v, 'ageBand')) v.ageBand = null;
          return v;
        });
        if (Array.isArray(data.attempts)) data.attempts = data.attempts.map((a) => Object.assign({}, a, { assignmentId: null }));
        return Object.assign({}, bundle, { schemaVersion: 2, data: data });
      },
      2(bundle) {
        // schema 2 -> 3 (step 5): the only change is the new `schedule` store. An older file has none, so it
        // gets an empty list; the app seeds the schedule from the child's mastery when the child loads.
        return Object.assign({}, bundle, { schemaVersion: 3, data: Object.assign({ schedule: [] }, bundle.data) });
      }
    };

    return { upgraders: upgraders };
  });
})();
