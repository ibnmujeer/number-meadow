/*
 * Rewards (JSON-compatible data only; step 4, P3). Growth marks unlock these extras one by one, in this order: mark
 * number k unlocks entry k. Once all twelve are unlocked, more marks still show their sentence and unlock nothing.
 * Locked items are never shown anywhere. Unlocks are extras only: the engine never withholds practice a child needs.
 *   order        the twelve unlocks, alternating a colour tint and an accessory
 *   tints        the six new buddy colours (id, spoken name); the colours are tokens in tokens.css (--<id>, --<id>-deep)
 *   accessories  six small flat accessories drawn in code (child/buddy-looks.js): id, spoken name, where it sits
 *   puzzles      new puzzle types a mark could unlock; none exist yet, later steps fill this list
 */
NBA.data.rewards = {
  "order": [
    { "kind": "tint", "id": "blush" }, { "kind": "accessory", "id": "sprig" },
    { "kind": "tint", "id": "butter" }, { "kind": "accessory", "id": "daisy" },
    { "kind": "tint", "id": "sage" }, { "kind": "accessory", "id": "sunhat" },
    { "kind": "tint", "id": "ice" }, { "kind": "accessory", "id": "glasses" },
    { "kind": "tint", "id": "periwinkle" }, { "kind": "accessory", "id": "bell" },
    { "kind": "tint", "id": "orchid" }, { "kind": "accessory", "id": "acorn" }
  ],
  "tints": [
    { "id": "blush", "name": "Blush" }, { "id": "butter", "name": "Butter" }, { "id": "sage", "name": "Sage" },
    { "id": "ice", "name": "Ice" }, { "id": "periwinkle", "name": "Periwinkle" }, { "id": "orchid", "name": "Orchid" }
  ],
  "accessories": [
    { "id": "sprig", "name": "Leaf sprig", "slot": "top" }, { "id": "daisy", "name": "Daisy", "slot": "side" },
    { "id": "sunhat", "name": "Sun hat", "slot": "top" }, { "id": "glasses", "name": "Round glasses", "slot": "face" },
    { "id": "bell", "name": "Little bell", "slot": "neck" }, { "id": "acorn", "name": "Acorn cap", "slot": "top" }
  ],
  "puzzles": []
};