/*
 * Retired character ids and the buddy each one is shown as (art spec 5.2; JSON-compatible data only).
 * Older saves, databases and exports can hold one of these eight ids as the buddy choice. The map is
 * one-to-one and matches colour warmth only; a retired name or look is never shown. Nothing rewrites a
 * stored id: catalog.toBuddyId maps it when it is drawn. This file is the one place app code names them.
 */
NBA.data.legacyHeroes = { "map": {
  "blaze": "coral", "storm": "sky", "jade": "moss", "shadow": "slateblue",
  "frost": "mint", "webflash": "rose", "nightweb": "plum", "rocket": "apricot" } };
