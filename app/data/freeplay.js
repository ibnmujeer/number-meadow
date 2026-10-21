/*
 * Free Play data (JSON-compatible data only; ASCII only; docs/STYLE.md section 15).
 *   labels      strand id -> the word a child sees on a tile (OD-7). A strand that has a playable skill needs a label;
 *               a test fails when one has none. The words match the Home world labels.
 *   mixed       the label of the Mixed tile
 *   mixedOnly   skills that are offered only inside Mixed, never in the tile of their own strand (OD-9): addsub.mixed
 *               has strand sub but its questions alternate adding and taking away
 */
NBA.data.freeplay = {
  "labels": {
    "sense": "Numbers",
    "count": "Counting",
    "add": "Adding",
    "sub": "Taking away",
    "place": "Tens and ones",
    "frac": "Fractions",
    "dec": "Decimals",
    "pct": "Percents",
    "mul": "Groups",
    "div": "Sharing",
    "neg": "Below zero",
    "ops": "Step by step",
    "unk": "Missing number"
  },
  "mixed": "Mixed",
  "mixedOnly": ["addsub.mixed"]
};
