/*
 * importRules (L3): the plain refusal texts of the JSON import and the two cheap guards that run before the file is parsed
 * (moved out of import.js, which is near the 400-line limit; Step 12 H3).
 *
 *   MESSAGES                 refusal code -> the sentence an adult reads (every one ends "Nothing was imported.")
 *   nestingOver(text, limit) true when [ and { are nested deeper than limit outside strings. One pass over the text, no parsing.
 *                            Why: JSON.stringify of a 5-million-deep array takes about 17 seconds (measured, emulated Chromium), and the
 *                            importer stringifies the data for the checksum. A real export is about 8 levels deep (records stop at 32).
 *   forbiddenOutsideData(b)  true when a parsed file holds __proto__, constructor or prototype as a key anywhere except under "data"
 *                            (records under "data" are checked one by one by schema.validate, which names the record).
 * Nothing here reads or writes storage.
 */
(function () {
  'use strict';
  NBA.define('importRules', ['config'], (config) => {
    const MESSAGES = {
      too_large: 'The file is too big to import (more than ' + Math.round(config.import.maxBytes / 1048576) + ' MB). Nothing was imported.',
      read_failed: 'The file could not be read. Nothing was imported.',
      not_json: 'This file is not a Number Meadow export (it is not valid JSON). Nothing was imported.',
      not_an_export: 'This file is not a Number Meadow export. Nothing was imported.',
      newer_schema: 'This file comes from a newer version of the app. Nothing was imported.',
      checksum_mismatch: 'The file seems damaged or was changed after export. Nothing was imported.',
      too_many_records: 'The file holds more than ' + config.import.maxRecords.toLocaleString('en-GB') + ' records. Nothing was imported.',
      invalid_records: 'Some records in the file are not valid, so nothing was imported.',
      dangling_reference: 'Some records belong to a child who is neither in the file nor on this device. Nothing was imported.'
    };
    /** The deepest nesting a file may have before it is parsed. A record may nest 32 levels (schema.js), the envelope adds a few. */
    const MAX_NESTING = 40;
    const FORBIDDEN = ['__proto__', 'constructor', 'prototype'];
    function nestingOver(text, limit) {
      const s = String(text);
      let depth = 0, inString = false;
      for (let i = 0; i < s.length; i++) {
        const c = s.charCodeAt(i);
        if (inString) { if (c === 92) i++; else if (c === 34) inString = false; continue; }
        if (c === 34) inString = true;
        else if (c === 91 || c === 123) { if (++depth > limit) return true; }
        else if (c === 93 || c === 125) depth--;
      }
      return false;
    }
    function forbiddenIn(v, depth) {
      if (depth > MAX_NESTING || v === null || typeof v !== 'object') return depth > MAX_NESTING;
      if (Array.isArray(v)) return v.some((x) => forbiddenIn(x, depth + 1));
      return Object.getOwnPropertyNames(v).some((k) => FORBIDDEN.indexOf(k) >= 0 || forbiddenIn(v[k], depth + 1));
    }
    function forbiddenOutsideData(b) {
      if (b === null || typeof b !== 'object' || Array.isArray(b)) return false;
      return Object.getOwnPropertyNames(b).some((k) => k !== 'data' && (FORBIDDEN.indexOf(k) >= 0 || forbiddenIn(b[k], 1)));
    }
    return { MESSAGES, MAX_NESTING, nestingOver, forbiddenOutsideData };
  });
}());
