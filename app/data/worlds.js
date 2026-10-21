/*
 * WORLDS: one entry per world, in play order (moved from v1 section 1; JSON-compatible data only;
 * names and lines from docs/STYLE.md section 11).
 *   id      stable storage key (never rename it: saved stars use it)
 *   name    shown on the Home stop, story card and mission header
 *   op      short label under the name on Home
 *   symbol  operator on the stop and story banner; empty for the mixed world (a drawn flower instead)
 *   colour  the world's accent token name (moss, sky, apricot, teal, rose)
 *   story   1 or 2 short sentences, shown and spoken before mission 1
 *   win     a calm scene line shown and spoken on the World Complete screen ({buddy} = buddy name); no praise
 *   finale  optional extra celebration line (used by the last world)
 *   plan    the 8-mission plan as data, built by generator.buildPlan(world):
 *           { kind: 'halves', types: [4 ids] } | { kind: 'repeat', type: id } | { kind: 'master' }
 */
NBA.data.worlds = {
  "list": [
    { "id": "addition", "name": "Seed Meadow", "op": "Adding", "symbol": "+", "colour": "moss",
      "story": "Welcome to the meadow! Let's count seeds together.",
      "win": "The meadow is full of seeds.",
      "plan": { "kind": "halves", "types": ["build", "add", "more", "bigger"] } },
    { "id": "subtraction", "name": "Gentle River", "op": "Taking away", "symbol": "\u2212", "colour": "sky",
      "story": "The river is calm. Float some seeds to the basket. Count what is left.",
      "win": "The river is calm and clear.",
      "plan": { "kind": "halves", "types": ["knock", "knock", "knock", "more"] } },
    { "id": "multiplication", "name": "Round Hill", "op": "Groups", "symbol": "\u00d7", "colour": "apricot",
      "story": "Seeds grow in rows on the hill. How many in all?",
      "win": "The hill is full of rows.",
      "plan": { "kind": "repeat", "type": "groups" } },
    { "id": "division", "name": "Quiet Forest", "op": "Sharing", "symbol": "\u00f7", "colour": "teal",
      "story": "We found seeds in the forest. Let's share them with our friends.",
      "win": "Everyone got a fair share.",
      "plan": { "kind": "repeat", "type": "share" } },
    { "id": "master", "name": "Flower Garden", "op": "Mixed", "symbol": "", "colour": "rose",
      "story": "The garden is blooming! Use all you know to help it grow.",
      "win": "The garden is in bloom.",
      "finale": "You grew the whole garden, {buddy}.",
      "plan": { "kind": "master" } }
  ]
};
