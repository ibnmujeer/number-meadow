/*
 * Difficulty levels 1 to 4 (DESIGN 6.2; JSON-compatible data only). Each level is a subset of one
 * v1 tier (q.max 10 or 20), so every question keeps the v1 number rules of its tier. Levels 2 and 4
 * are exactly v1's max-10 and max-20 rules, and v1Default (2 for missions 1 to 4, 4 for 5 to 8) is
 * v1's MAX_BY_MISSION, so a student with no data plays exactly as in v1.
 *   families  number rules per activity family and level (the generation constraints):
 *     add        a, b >= min, b <= bMax (when set), sumMin <= a + b <= sumMax
 *     take-away  aMin <= a <= aMax, bMin <= b <= bMax, a - b >= leftMin
 *     more       tMin <= total <= tMax, mMin <= total - have <= mMax, have >= 1
 *     build      nMin <= n <= nMax
 *     bigger     lo <= both heights <= hi, 1 <= difference <= dMax, taller >= largerMin (when set)
 *     groups, share   v1's fixed lists ([g, s] and [n, k])
 *   extra     per activity and level: add-line keeps b <= 9 and a >= b at levels 3 and 4
 *   Step 9 sub-build A band-1 families (every bound is a design hypothesis; numbers stay within the
 *   docs/curriculum-data.json examples): seq-fwd / seq-back (next / just-before a start number nMin..nMax),
 *   seq-100 (the number just after nMin..nMax, to 100), tens-100 (the next ten after a ten nMin..nMax),
 *   numeral-10 (name a numeral nMin..nMax), match-sort (two sorted
 *   groups a and b, each min..max, a + b <= totalMax; the answer is the named group a).
 *   Step 9 sub-build B subitizing families (every bound a design hypothesis; numbers stay within the
 *   docs/curriculum-data.json examples): subitize-3 (1 to 3 dots, a dot-pattern card, answer = the count),
 *   subitize-5 (1 to 5 dots, a dice-pattern card; the top level stretches to a dice face of 6).
 *   Step 9 sub-build C part-whole and ten-frame families (every bound a design hypothesis; numbers stay within
 *   the docs/curriculum-data.json examples): part-bond (a whole wMin..wMax joined to two parts, one part shown,
 *   answer = whole - shown part), ten-frame (a frame of nMin..nMax counters; mode 0 asks how many counters,
 *   mode 1 asks how many boxes are empty = 10 - n).
 *   Step 9 sub-build D number line and even/odd families (every bound a design hypothesis; numbers stay within
 *   the docs/curriculum-data.json examples): line-10 (a point mMin..mMax marked on a 0 to 10 line, answer = the
 *   number), even-odd (a number nMin..nMax shown as pairs, answer 0 for even and 1 for odd; levels within 10
 *   then within 20, the curriculum range).
 *   Step 9 sub-build E make-5 / make-10 and teen-numbers families (every bound a design hypothesis; numbers
 *   stay within the docs/curriculum-data.json examples): make-5 (a whole 5 shown with one part pMin..pMax, the
 *   partner that makes 5 is the answer), make-10 (a whole 10 on a ten-frame with one part pMin..pMax filled, how
 *   many more make 10 is the answer), teen-ten (a teen number nMin..nMax as a full ten and some ones, how many
 *   ones = n - 10 is the answer).
 *   Step 9 sub-build F fractions family (every bound a design hypothesis; wholes come straight from the
 *   docs/curriculum-data.json level-3 example): frac-share (a whole from `wholes` dealt fairly into `parts`
 *   equal plates; the answer is whole / parts). Level 2 = a half (parts 2) of 2,4,6,8,10; level 3 = a quarter
 *   (parts 4) of 4,8. Every whole divides exactly by its parts, so the answer is always a whole number.
 *   Step 10 sub-build A band-2 place-value and counting families (every bound a design hypothesis; numbers
 *   stay within the docs/curriculum-data.json examples and level sentences, D10-8/D10-9): skip-count (count on
 *   by each of `steps` to `max`, answer = n + by), count-1000 (the number `jumps` away from n, by ones/tens/
 *   hundreds, within 0 to 1000), tens-ones (t tens and o ones; mode 0 reads the number, mode 1 names the tens
 *   digit), regroup (mode 0: o seeds trade 10 away, answer o - 10; mode 1: t tens and o ones trade one
 *   ten for ten ones, answer o + 10), hundreds (h/t/o pieces; mode 0 reads the number, mode 1 names the value
 *   of the tens digit), compare-pv (two numbers l and r on coprime steps, answer 0 if left bigger else 1),
 *   more-less (10/100 more or less than n), round-pv (round n to the nearest `to` = 10 or 100, halves up).
 *   Step 10 sub-build C band-2 multiplication / division families (every bound a design hypothesis; numbers
 *   stay within the docs/curriculum-data.json examples and level sentences, D10-8/D10-9): mul-array (an array
 *   of r rows by c columns, 2..5 each; mode 0 asks the total r x c, mode 1 asks the repeated-adding total),
 *   mul-fact (a times fact for the `tables` 2/5/10 times k = 1..kMax, with the turn-around at the harder
 *   level), mul-fact34 (the same shape for the 3 and 4 tables), div-group (how many groups of `sizes` in a
 *   total that is a multiple of the size, totals to 20), div-inverse (a division n / c that undoes r x c = n,
 *   c one of the 2/5/10 tables, answer r).
 *   Step 10 sub-build D band-2 fraction families (every bound a design hypothesis; numbers stay within the
 *   docs/curriculum-data.json examples and level sentences, D10-8/D10-9): frac-unit (mode 0: a bar of `parts`
 *   equal parts with c coloured, answer parts - c; mode 1: compare two unit fractions 1/d1 and 1/d2 from
 *   `pairs`, a two-button choice), frac-nonunit (mode 0: a whole from `wholes`, p taken, answer whole - p;
 *   mode 1: p of `parts` coloured, answer the fraction p/parts), frac-line (mode 0: a 0 to 1 line split into
 *   `parts` parts, hop k, answer the fraction k/parts; mode 1: compare k1/d and k2/d with the same bottom
 *   number from `pairs` [k1, k2, d], a two-button choice), frac-wall (mode 0: half equals how many of `dens`
 *   parts, answer d / 2; mode 1: compare k1/d and k2/d on the wall from `pairs` [k1, k2, d], a two-button
 *   choice). The fraction-answer modes write the fraction as "num/den" (ASCII), never a vulgar-fraction glyph.
 *   Step 10 sub-build E band-2 negatives / order / missing-number families (every bound a design hypothesis;
 *   numbers stay within the docs/curriculum-data.json examples and level sentences, D10-8/D10-9): neg (a story
 *   magnitude nMin..nMax below zero, answer -n; `opposite` also offers the "opposite of n" shape), ops-steps
 *   (three numbers and a mode straight from `cases`, done left to right), missing-num (the box in one of three
 *   positions from `cases` = [mode, loMax, hiMax], the total walked within `max`), balance (`trueFalse` triples
 *   for the yes/no check, `sides` triples for a sum on each side, `single` pairs for one number on one side),
 *   missing-muldiv (a known `tables` factor of 2, 5 or 10 and a group count kMin..kMax, the box in one of four
 *   positions).
 */
NBA.data.difficulty = {
  "levels": [1, 2, 3, 4],
  "tierByLevel": { "1": 10, "2": 10, "3": 20, "4": 20 },
  "levelByTier": { "10": 2, "20": 4 },
  "v1Default": [2, 2, 2, 2, 4, 4, 4, 4],
  "families": {
    "add": {
      "1": { "min": 1, "bMax": 3, "sumMin": 4, "sumMax": 7 },
      "2": { "min": 1, "sumMin": 4, "sumMax": 10 },
      "3": { "min": 2, "bMax": 5, "sumMin": 11, "sumMax": 20 },
      "4": { "min": 2, "sumMin": 11, "sumMax": 20 }
    },
    "take-away": {
      "1": { "aMin": 4, "aMax": 7, "bMin": 1, "bMax": 3, "leftMin": 1 },
      "2": { "aMin": 4, "aMax": 10, "bMin": 1, "bMax": 5, "leftMin": 1 },
      "3": { "aMin": 11, "aMax": 20, "bMin": 2, "bMax": 5, "leftMin": 2 },
      "4": { "aMin": 11, "aMax": 20, "bMin": 2, "bMax": 9, "leftMin": 2 }
    },
    "more": {
      "1": { "tMin": 4, "tMax": 7, "mMin": 1, "mMax": 3 },
      "2": { "tMin": 4, "tMax": 10, "mMin": 1, "mMax": 5 },
      "3": { "tMin": 11, "tMax": 20, "mMin": 2, "mMax": 5 },
      "4": { "tMin": 11, "tMax": 20, "mMin": 2, "mMax": 9 }
    },
    "build": {
      "2": { "nMin": 3, "nMax": 10 },
      "4": { "nMin": 11, "nMax": 20 }
    },
    "bigger": {
      "2": { "lo": 2, "hi": 10, "dMax": 4 },
      "4": { "lo": 8, "hi": 20, "dMax": 3, "largerMin": 11 }
    },
    "groups": {
      "2": { "list": [[2, 2], [2, 3], [2, 4], [2, 5], [3, 2], [3, 3], [4, 2], [5, 2]] },
      "4": { "list": [[3, 4], [3, 5], [4, 3], [4, 4], [4, 5], [5, 3], [5, 4]] }
    },
    "share": {
      "2": { "list": [[4, 2], [6, 2], [8, 2], [10, 2], [6, 3], [9, 3], [8, 4], [10, 5]] },
      "4": { "list": [[12, 2], [14, 2], [16, 2], [18, 2], [20, 2], [12, 3], [15, 3], [18, 3], [12, 4], [16, 4], [20, 4], [15, 5], [20, 5]] }
    },
    "seq-fwd": {
      "2": { "nMin": 1, "nMax": 9 },
      "4": { "nMin": 10, "nMax": 19 }
    },
    "seq-back": {
      "2": { "nMin": 2, "nMax": 10 },
      "4": { "nMin": 11, "nMax": 20 }
    },
    "seq-100": {
      "2": { "nMin": 10, "nMax": 49 },
      "4": { "nMin": 50, "nMax": 98 }
    },
    "tens-100": {
      "2": { "nMin": 10, "nMax": 90 }
    },
    "numeral-10": {
      "2": { "nMin": 0, "nMax": 10 }
    },
    "match-sort": {
      "2": { "min": 1, "max": 9, "totalMax": 10 }
    },
    "subitize-3": {
      "2": { "nMin": 1, "nMax": 3 },
      "3": { "nMin": 1, "nMax": 3 }
    },
    "subitize-5": {
      "2": { "nMin": 1, "nMax": 5 },
      "3": { "nMin": 1, "nMax": 6 }
    },
    "part-bond": {
      "2": { "wMin": 2, "wMax": 10 }
    },
    "ten-frame": {
      "2": { "nMin": 1, "nMax": 10, "mode": 0 },
      "3": { "nMin": 1, "nMax": 9, "mode": 1 }
    },
    "line-10": {
      "2": { "mMin": 0, "mMax": 10 }
    },
    "even-odd": {
      "2": { "nMin": 1, "nMax": 10 },
      "3": { "nMin": 1, "nMax": 20 }
    },
    "make-5": {
      "2": { "whole": 5, "pMin": 1, "pMax": 4 }
    },
    "make-10": {
      "2": { "whole": 10, "pMin": 1, "pMax": 9 }
    },
    "teen-ten": {
      "2": { "nMin": 11, "nMax": 19 }
    },
    "frac-share": {
      "2": { "parts": 2, "wholes": [2, 4, 6, 8, 10] },
      "3": { "parts": 4, "wholes": [4, 8] }
    },
    "skip-count": {
      "2": { "steps": [10], "max": 100 },
      "3": { "steps": [2, 5], "max": 100 }
    },
    "count-1000": {
      "2": { "jumps": [1], "nMin": 99, "nMax": 299 },
      "3": { "jumps": [10, 100], "nMin": 100, "nMax": 900 },
      "4": { "jumps": [-100], "nMin": 200, "nMax": 1000 }
    },
    "tens-ones": {
      "2": { "tMin": 2, "tMax": 9, "oMin": 0, "oMax": 9, "mode": 0 },
      "3": { "tMin": 2, "tMax": 9, "oMin": 0, "oMax": 9, "mode": 1 }
    },
    "regroup": {
      "2": { "mode": 0, "oMin": 10, "oMax": 19 },
      "3": { "mode": 1, "tMin": 2, "tMax": 5, "oMin": 0, "oMax": 5 }
    },
    "hundreds": {
      "2": { "hMin": 1, "hMax": 9, "tMin": 0, "tMax": 9, "oMin": 0, "oMax": 9, "mode": 0 },
      "3": { "hMin": 1, "hMax": 9, "tMin": 1, "tMax": 9, "oMin": 0, "oMax": 9, "mode": 1 }
    },
    "compare-pv": {
      "2": { "lo": 20, "hi": 99, "stepL": 7, "stepR": 11 },
      "3": { "lo": 100, "hi": 999, "stepL": 61, "stepR": 83 }
    },
    "more-less": {
      "2": { "changes": [10, -10], "nMin": 20, "nMax": 400, "stepN": 15 },
      "3": { "changes": [100, -100], "nMin": 100, "nMax": 900, "stepN": 37 }
    },
    "round-pv": {
      "2": { "to": 10, "nMin": 11, "nMax": 99, "step": 1 },
      "3": { "to": 100, "nMin": 110, "nMax": 990, "step": 7 }
    },
    "add-fact": {
      "2": { "kind": "double", "min": 5, "max": 10 },
      "3": { "kind": "ten", "min": 6, "max": 9, "bMin": 4, "bMax": 9 }
    },
    "sub-fact": {
      "2": { "aMin": 11, "aMax": 18, "bMin": 2, "bMax": 9, "leftMin": 1 }
    },
    "col-add": {
      "2": { "aMin": 21, "aMax": 55, "aStep": 3, "bMin": 11, "bMax": 44, "bStep": 7, "trade": false, "cap": 99 },
      "3": { "aMin": 31, "aMax": 71, "aStep": 5, "bMin": 12, "bMax": 46, "bStep": 9, "trade": false, "cap": 99 }
    },
    "col-add3": {
      "2": { "aMin": 231, "aMax": 540, "aStep": 29, "bMin": 123, "bMax": 345, "bStep": 37, "trade": false, "cap": 999 },
      "3": { "aMin": 241, "aMax": 560, "aStep": 31, "bMin": 125, "bMax": 348, "bStep": 41, "trade": false, "cap": 999 }
    },
    "col-add-regroup": {
      "2": { "aMin": 27, "aMax": 67, "aStep": 3, "bMin": 15, "bMax": 46, "bStep": 7, "trade": true, "cap": 130 },
      "3": { "aMin": 37, "aMax": 77, "aStep": 5, "bMin": 25, "bMax": 48, "bStep": 9, "trade": true, "cap": 130 }
    },
    "col-sub": {
      "2": { "aMin": 48, "aMax": 98, "aStep": 3, "bMin": 12, "bMax": 45, "bStep": 7, "trade": false, "leftMin": 1 },
      "3": { "aMin": 54, "aMax": 99, "aStep": 5, "bMin": 13, "bMax": 46, "bStep": 9, "trade": false, "leftMin": 1 }
    },
    "col-sub3": {
      "2": { "aMin": 480, "aMax": 880, "aStep": 29, "bMin": 120, "bMax": 360, "bStep": 37, "trade": false, "leftMin": 1 },
      "3": { "aMin": 520, "aMax": 980, "aStep": 31, "bMin": 123, "bMax": 468, "bStep": 41, "trade": false, "leftMin": 1 }
    },
    "col-sub-regroup": {
      "2": { "aMin": 42, "aMax": 92, "aStep": 3, "bMin": 15, "bMax": 47, "bStep": 7, "trade": true, "leftMin": 1 },
      "3": { "aMin": 52, "aMax": 98, "aStep": 5, "bMin": 25, "bMax": 48, "bStep": 9, "trade": true, "leftMin": 1 }
    },
    "two-step": {
      "2": { "cases": [[15, -6, 4], [8, 5, -4], [12, 7, -5], [20, -8, -3], [9, 6, -7], [14, -5, 6]] },
      "3": { "cases": [[52, -27, 5], [62, -28, 5], [40, -13, -8], [70, -25, -8], [63, -28, 6], [55, -29, 7]] }
    },
    "mul-array": {
      "2": { "mode": 0, "rMin": 2, "rMax": 4, "cMin": 2, "cMax": 4 },
      "3": { "mode": 1, "rMin": 2, "rMax": 5, "cMin": 2, "cMax": 5 }
    },
    "mul-fact": {
      "2": { "tables": [2, 5, 10], "kMin": 1, "kMax": 5, "turn": false },
      "3": { "tables": [2, 5, 10], "kMin": 1, "kMax": 10, "turn": true }
    },
    "mul-fact34": {
      "2": { "tables": [3, 4], "kMin": 1, "kMax": 5, "turn": false },
      "3": { "tables": [3, 4], "kMin": 1, "kMax": 10, "turn": true }
    },
    "div-group": {
      "2": { "sizes": [2, 3], "gMin": 2, "gMax": 6, "nMax": 20 },
      "3": { "sizes": [3, 4, 5], "gMin": 2, "gMax": 6, "nMax": 20 }
    },
    "div-inverse": {
      "2": { "cols": [2, 5, 10], "rMin": 1, "rMax": 5 },
      "3": { "cols": [2, 5, 10], "rMin": 1, "rMax": 8 }
    },
    "frac-unit": {
      "2": { "mode": 0, "parts": [3, 4, 5, 6, 8] },
      "3": { "mode": 1, "pairs": [[3, 5], [2, 4], [3, 6], [4, 8], [2, 5], [3, 8]] }
    },
    "frac-nonunit": {
      "2": { "mode": 0, "wholes": [6, 8] },
      "3": { "mode": 1, "parts": [4, 5] }
    },
    "frac-line": {
      "2": { "mode": 0, "parts": [4, 6] },
      "3": { "mode": 1, "pairs": [[2, 4, 5], [1, 3, 4], [2, 5, 6], [3, 5, 8], [1, 4, 6], [2, 3, 4]] }
    },
    "frac-wall": {
      "2": { "mode": 0, "dens": [4, 6, 8] },
      "3": { "mode": 1, "pairs": [[3, 5, 8], [1, 3, 4], [2, 5, 6], [4, 7, 8], [1, 2, 6], [3, 7, 8]] }
    },
    "neg": {
      "2": { "nMin": 1, "nMax": 10, "opposite": false },
      "3": { "nMin": 1, "nMax": 20, "opposite": true }
    },
    "ops-steps": {
      "2": { "cases": [[3, 4, 2, 0], [5, 2, 3, 0], [6, 3, 4, 0], [2, 5, 6, 0], [4, 4, 3, 0], [7, 1, 2, 0]] },
      "3": { "cases": [[12, 5, 4, 1], [20, 8, 5, 1], [10, 4, 3, 1], [15, 6, 4, 1], [18, 9, 5, 1], [14, 5, 3, 1]] }
    },
    "missing-num": {
      "2": { "max": 10, "cases": [[0, 4, 9], [1, 4, 9], [2, 4, 9]] },
      "3": { "max": 20, "cases": [[0, 10, 19], [1, 10, 19], [2, 10, 19]] }
    },
    "balance": {
      "2": { "trueFalse": [[4, 3, 7], [4, 3, 8], [5, 2, 6], [5, 2, 7], [6, 1, 7], [3, 3, 7]] },
      "3": { "sides": [[5, 2, 3], [6, 4, 7], [7, 2, 6], [8, 1, 5], [9, 3, 8], [4, 5, 6]], "single": [[8, 5], [9, 4], [7, 3], [10, 6], [6, 2], [11, 7]] }
    },
    "missing-muldiv": {
      "2": { "tables": [2, 5, 10], "kMin": 2, "kMax": 5 },
      "3": { "tables": [2, 5, 10], "kMin": 2, "kMax": 7 }
    }
  },
  "extra": {
    "add-line": {
      "3": { "bMax": 9, "aGteB": true },
      "4": { "bMax": 9, "aGteB": true }
    }
  }
};


