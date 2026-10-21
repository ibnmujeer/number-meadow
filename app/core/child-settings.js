/*
 * childSettings (L2): the per-child settings read from a students record (brief O4, FP-1/FP-2, D-B). Pure:
 * the caller passes the record and the device sound preference.
 *   settingsOf(student, deviceSound)  { dailyLimitMin, voice, sound, explicitSound }: an absent or odd limit is
 *                                      config.adults.defaultLimitMin (30), an absent voice is on, an absent sound
 *                                      is the device preference (explicitSound false)
 *   validLimit(x)                      true for one of config.adults.limitChoices (0 = Off)
 *   limitReached(minutesToday, settings)  true when the limit is on and today's minutes reached it
 *   freePlayOf(student)                { on, hidden } (Free Play G1): freePlay absent = on, fpHidden absent or odd = none hidden
 *   validHidden(list)                  true for an array of known strand ids without repeats (the students.fpHidden field)
 * The limit only drives a soft reminder in guided play (Free Play stops at it: services/freeplay-service.js).
 */
(function () {
  'use strict';
  NBA.define('childSettings', ['config'], (config) => {
    const A = config.adults;
    const STRANDS = NBA.data.concepts.strands.map((s) => s.id);

    function validLimit(x) { return typeof x === 'number' && A.limitChoices.indexOf(x) >= 0; }

    function settingsOf(student, deviceSound) {
      const s = student && typeof student === 'object' ? student : {};
      const explicitSound = typeof s.sound === 'boolean';
      return {
        dailyLimitMin: validLimit(s.dailyLimitMin) ? s.dailyLimitMin : A.defaultLimitMin,
        voice: s.voice !== false,
        sound: explicitSound ? s.sound : deviceSound !== false,
        explicitSound: explicitSound
      };
    }

    function limitReached(minutesToday, settings) {
      const lim = settings && validLimit(settings.dailyLimitMin) ? settings.dailyLimitMin : A.defaultLimitMin;
      return lim > 0 && typeof minutesToday === 'number' && minutesToday >= lim;
    }

    function validHidden(x) {
      return Array.isArray(x) && x.length <= STRANDS.length && x.every((id) => STRANDS.indexOf(id) >= 0) && new Set(x).size === x.length;
    }

    function freePlayOf(student) {
      const s = student && typeof student === 'object' ? student : {};
      return { on: s.freePlay !== false, hidden: validHidden(s.fpHidden) ? s.fpHidden.slice() : [] };
    }

    return { settingsOf, validLimit, limitReached, validHidden, freePlayOf, LIMITS: A.limitChoices, DEFAULT_LIMIT: A.defaultLimitMin };
  });
}());
