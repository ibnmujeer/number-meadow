/*
 * writeQueue (L4): the bounded retry queue of the learning service, split out of learning-service.js (Free Play F0).
 *
 *   create({ repo, retryMax, log }) -> { enqueue, flush, size, dropped, clear }
 *   enqueue(item)   item = { keyStr, store?, record?, ops?, update? }; a newer item with the same keyStr replaces
 *                   a queued older one
 *   flush()         write the queued items in order, one at a time; resolves true when all reached storage
 *   size()          queued items; dropped() items lost to the retryMax cap; clear() forgets both (resetSave)
 *
 * The queue keeps at most retryMax items (the oldest are dropped and counted). A newer write for the same key
 * replaces a queued older one, and writes run one at a time in order, so a retried older value never lands after
 * a newer one. A record the schema refuses is a bug: it is dropped with one log.error instead of blocking the
 * queue; an attempt already stored (ConstraintError on a retried batch) counts as written.
 */
(function () {
  'use strict';

  NBA.define('writeQueue', [], () => {
    function create(options) {
      const o = options || {};
      const repo = o.repo;
      const retryMax = o.retryMax;
      const log = o.log;
      const queue = [];     // { keyStr, store?, record?, ops?, update? }
      let dropped = 0;
      let flushing = null, again = false;

      function enqueue(item) {
        const i = queue.findIndex((q) => q.keyStr === item.keyStr);
        if (i >= 0) queue.splice(i, 1);
        queue.push(item);
        if (queue.length > retryMax) dropped += queue.splice(0, queue.length - retryMax).length;
      }

      function runItem(item) {
        if (item.update) return item.update();
        return item.ops ? repo.batch(item.ops) : repo.put(item.store, item.record);
      }

      /** Write queued items in order, one at a time; stop at the first failure (kept for retry). */
      function flush() {
        if (flushing) { again = true; return flushing; }
        flushing = (async () => {
          let failed = false;
          do {
            again = false;
            for (const item of queue.slice()) {
              try {
                await runItem(item);
              } catch (e) {
                const name = e && e.name;
                if (name === 'ValidationError') {
                  log.error('[NBA] a record was refused by the schema and dropped: ' + (e && e.message));
                } else if (!(name === 'ConstraintError' && item.ops)) {
                  failed = true;
                  break;
                }
              }
              const i = queue.indexOf(item);
              if (i >= 0) queue.splice(i, 1);
            }
          } while (again && !failed);
          return !failed;
        })().finally(() => { flushing = null; });
        return flushing;
      }

      /** Forget every queued item and the dropped count (the test hook resetSave). */
      function clear() {
        queue.length = 0;
        dropped = 0;
      }

      return { enqueue, flush, size: () => queue.length, dropped: () => dropped, clear };
    }

    return { create };
  });
}());
