/*
 * Difficulty rows for the band 3 (ages 10 to 12) families (Step 11; JSON-compatible data only). This is the
 * sibling of data/difficulty.js, split out so that file stays under the 400-line limit. core/catalog.js merges
 * `families` and `extra` into the one difficulty object (a family or extra name in both files is a boot error),
 * so every other module still sees them as NBA.data.difficulty. The shape of a row is documented in
 * data/difficulty.js. Every bound added here is a design hypothesis; numbers stay within the
 * docs/curriculum-data.json examples and level sentences. Sub-builds A to F add the rows.
 *
 * Sub-build A (big numbers and facts), app levels 2 and 3 (4 only for factors, where the data names its pairs):
 *   place-big    mode 0 the worth of a digit (nums are the data's 23405 and 345678; the grid walks nMin..nMax by step, the
 *                digit must be nonzero and appear once, pMin..pMax counted from the ones), mode 1 the number after (after),
 *                mode 2 how many thousands (thousands). Level 2 = up to five digits, level 3 = up to a million.
 *   mul-fact69   rows = the table (6 and 9 at level 2, 7 and 8 at level 3) times cMin..cMax.
 *   big-add / big-add-word   pairs = the data's own sums; the grid walks a and b by their steps, the sum stays under cap and
 *                the places that trade (carries) stay between cMin and cMax; zero wants a zero digit somewhere.
 *   big-sub / big-sub-word   the same with borrows; zero wants a zero in the top number (trading across a zero).
 *   div-fact     cols = the table (3 and 4 at level 2, 6 to 9 at level 3), the answer from rMin to rMax.
 *   factors      level 2: arrays [counters, rows] and "is d a factor of n" for ns; level 3: the k-th multiple of each base
 *                and "is n a multiple of d" (d times k, or one more or less); level 4: pairs for the biggest common factor.
 *
 * Sub-build B (area model, remainders, long division), app levels 2 and 3:
 *   area1 / area2  a two-digit (or three-digit) number times one digit, and a two-digit times a two-digit number. `pairs` are
 *                the data's own products; the grid walks a and b by their steps inside min..max. area2 level 2 also has `tens`
 *                (times a whole ten) and the small two-by-two numbers up to `max` (20).
 *   div-rem      the data's 17 / 5 and bigger facts: `pairs` seed it, the grid walks the divisor d (dMin..dMax) and the whole
 *                part q (qMin..qMax) with a remainder of at least rMin, so n = d * q + r is under 80. Three kinds (mode): the
 *                full groups, the left over, and a round-up van story (`vans`, the grid walks total vMin..vMax, van cMin..cMax).
 *   div-multi / div-multi-word  the data's EXACT divisions (84/4, 96/6, 756/6, 2408/8); the grid walks the quotient q and the
 *                divisor so n = q * divisor divides exactly and stays under `max`. The data's 758/6 (a remainder) is not asked
 *                here, because this activity asks the exact quotient (remainders live in div-rem). The word family is the egg-box story.
 *   div-long / div-long-word  dividing by a two-digit number or a whole ten (360/30, 540/30, 646/19, 1344/24); the grid walks
 *                the quotient and the two-digit divisor so it divides exactly. The word family tells the bus story (500 / 36).
 *
 * Sub-build D (decimals), app levels 2 and 3. A decimal is a CHOICE question whose answer is an integer CODE in hundredths
 * (0.3 is 30, 6.25 is 625) so no float is ever compared; choiceText shows the real "0.3" / "6.25" form. All numbers trace to the
 * decimal examples and level sentences of docs/curriculum-data.json.
 *   dec-tenths     `frac` [top, 10] "what decimal is top/10"; `whole` [W, t] "write W and t tenths as a decimal" (mode 0 and 1,
 *                a coded answer); `count` the tenths in a one-place decimal "how many tenths in X.Y" (mode 2, a whole-number answer).
 *   dec-hundredths `frac` [top, 100] "what decimal is top/100"; `parts` [tenths, hundredths] "T tenths and H hundredths as a
 *                decimal"; `paise` a money amount in paise "P paise is how many rupees" (a coded answer).
 *   dec-compare    `cmp` [a, b] two one- or two-place decimals in hundredths "which is bigger" (mode 0, a two-button answer);
 *                `small` three decimals in hundredths "which is smallest" (mode 1, the index of the smallest, D11-8); `fill`
 *                "a decimal with one place = ?/100" (mode 2, a whole-number answer).
 *   dec-addsub / dec-addsub-word  `pairs` [a, b, mode] two decimals in hundredths, mode 0 add and mode 1 take away (a > b); the
 *                grid walks a and b by their steps under cap. The word family tells the ribbon story (3.5 m, 1.25 m cut off).
 *   dec-muldiv / dec-muldiv-word  `mul` [a, b] a decimal in hundredths times a whole number b; `div` [a, b] a decimal in
 *                hundredths that divides exactly by b. The word family tells the pens story (12.50 rupees each, 6 pens).
 *
 * Sub-build E (percents and links), app levels 2 and 3. A percent is a whole number; most answers are plain integers. The link
 * activity can answer with a decimal CODE in hundredths (0.75 is 75) or a fraction CODE (num*100 + den, 9/20 is 920). All numbers
 * trace to the percent examples and level sentences of docs/curriculum-data.json; the benchmarks of amounts always share evenly.
 *   pct-meaning  `grid` X "X of 100 squares are green, what percent" (mode 0); `frac` [top, bot] (bot divides 100) "a fraction, what
 *                percent" (mode 1); `part` [x, y] (y is 50/20/25) "x of y, what percent" (mode 2). All answer a whole percent.
 *   pct-bench    `of` [pct, amount] "pct% of amount", pct a benchmark (50/25/10 at level 2; 75/20/5 added at level 3); the amount
 *                shares evenly so the answer is a whole number.
 *   pct-link     `toDec` [top, bot] "write top/bot as a decimal" (mode 0, a coded decimal); `toPct` a hundredths code "write the
 *                decimal as a percent" (mode 1, a whole percent); `toFrac` a percent "write the percent as a simplest fraction"
 *                (mode 2, a coded fraction).
 *   pct-of / pct-of-word  `of` [pct, amount, mode] "pct% of amount" (mode 0) or "pct% off amount" (mode 1, the price left); the
 *                word family tells the data's toy-price (off) and bead (of) stories.
 *
 * Sub-build F (negatives, order, letters), app levels 2 and 3 (4 only where the data supplies the numbers). CHOICE questions,
 * integer answers (a negative answer is allowed for neg-addsub). All numbers trace to the negative, order-of-operations and
 * letter examples and level sentences of docs/curriculum-data.json; the number lines and the step counts are design hypotheses.
 *   neg-compare    `colder` [a, b] "which is colder, minus a or minus b" on the vertical line (mode 0, a two-button choice, the
 *                colder of -a and -b); `steps` [from, to] "how many steps from `from` up to `to`" on the vertical line (mode 1, a
 *                whole-number answer, to - from), including across zero (-2 up to 3 is 5).
 *   neg-addsub     `sums` [a, b, op, mode] a signed add or take-away on the horizontal signed line: op 0 is add, op 1 is take away;
 *                the first number may be shown negative when mode 1 (a diver / owed story is in the word wording). The answer may
 *                be negative (4 - 9 = -5) or cross back above zero (-6 + 10 = 4). Encoded so the start, the move and the land all
 *                sit inside the drawn line.
 *   ops-brackets   `exprs` a three-token sum [a, s1, b, s2, c] done with the bracket first (level 2 adds and takes away within 20,
 *                level 3 multiplies with the small tables); level 4 `pairs` compares the same numbers with and without a bracket
 *                and asks which sum is smaller (D11-8, "put a bracket" has no number answer so it is left out, see the progress
 *                file). Symbolic only: this concept has no story, so mastery keeps it at Practising (D11-7 ceiling, said in the
 *                adult text).
 *   ops-order / ops-order-word  `exprs` a sum done with multiply and divide before add and take away ([a, s1, b, s2, c]); `three`
 *                a two- or three-step sum with a bracket and all four signs (level 3). The word family `boxes` [loose, boxes, each]
 *                tells the data's "loose items and boxes of counters" story (loose + boxes x each).
 *   unk-letter / unk-letter-word  `add`/`sub` [k, total] a one-step letter sum (n + k = total, total - n = k the "k - n" shape);
 *                `mul`/`div` [k, total] a times or sharing letter sum (k x n = total, n / k = total); level 4 `brk` [k, add, total]
 *                a letter sum with a bracket (k x (n + add) = total). The word family `packs` [per, total] tells the data's pens
 *                story (per x p = total, so p = total / per). A letter is spoken as "the number n" (D11-10).
 */
NBA.data.difficultyBand3 = {
  "families": {
    "place-big": {
      "2": { "worth": { "nums": [23405], "nMin": 12034, "nMax": 98765, "step": 6469, "pMin": 1, "pMax": 4 } },
      "3": {
        "worth": { "nums": [345678], "nMin": 102345, "nMax": 987654, "step": 91111, "pMin": 3, "pMax": 5 },
        "after": [99999, 9999, 999999, 199999, 599999],
        "thousands": [250000, 120000, 430000, 810000, 560000, 90000]
      }
    },
    "mul-fact69": {
      "2": { "rows": [6, 9], "cMin": 2, "cMax": 9 },
      "3": { "rows": [7, 8], "cMin": 3, "cMax": 9 }
    },
    "big-add": {
      "2": { "pairs": [[4687, 2735]], "aMin": 3407, "aMax": 69999, "aStep": 5303, "bMin": 2011, "bMax": 29999, "bStep": 3673, "cap": 99999, "cMin": 1, "cMax": 3, "zero": false },
      "3": { "pairs": [[305082, 48919], [35286, 48759]], "aMin": 100500, "aMax": 700000, "aStep": 50500, "bMin": 40919, "bMax": 99999, "bStep": 11111, "cap": 999999, "cMin": 1, "cMax": 6, "zero": true }
    },
    "big-add-word": {
      "2": { "pairs": [[4687, 2735]], "aMin": 3407, "aMax": 69999, "aStep": 5303, "bMin": 2011, "bMax": 29999, "bStep": 3673, "cap": 99999, "cMin": 1, "cMax": 3, "zero": false },
      "3": { "pairs": [[125430, 48795]], "aMin": 100500, "aMax": 700000, "aStep": 50500, "bMin": 40919, "bMax": 99999, "bStep": 11111, "cap": 999999, "cMin": 1, "cMax": 6, "zero": true }
    },
    "big-sub": {
      "2": { "pairs": [[7204, 3856]], "aMin": 10204, "aMax": 90000, "aStep": 7001, "bMin": 3856, "bMax": 60000, "bStep": 4513, "cMin": 1, "cMax": 3, "zero": false },
      "3": { "pairs": [[500000, 123456]], "aMin": 200000, "aMax": 900000, "aStep": 100000, "bMin": 100234, "bMax": 199999, "bStep": 12345, "cMin": 2, "cMax": 6, "zero": true }
    },
    "big-sub-word": {
      "2": { "pairs": [[82500, 67845]], "aMin": 10204, "aMax": 90000, "aStep": 7001, "bMin": 3856, "bMax": 60000, "bStep": 4513, "cMin": 1, "cMax": 3, "zero": false },
      "3": { "pairs": [[500000, 123456]], "aMin": 200000, "aMax": 900000, "aStep": 100000, "bMin": 100234, "bMax": 199999, "bStep": 12345, "cMin": 2, "cMax": 6, "zero": true }
    },
    "div-fact": {
      "2": { "cols": [3, 4], "rMin": 2, "rMax": 10 },
      "3": { "cols": [6, 7, 8, 9], "rMin": 2, "rMax": 9 }
    },
    "factors": {
      "2": {
        "arrays": [[12, 2], [12, 3], [12, 4], [12, 6], [18, 2], [18, 3], [18, 6], [18, 9], [20, 4], [20, 5], [24, 3], [24, 4], [24, 6], [24, 8], [15, 3], [16, 4]],
        "ns": [24, 28, 30, 32, 35, 36, 40, 42, 45, 48], "dMin": 4, "dMax": 9
      },
      "3": { "bases": [3, 4, 6, 7, 8, 9], "kMin": 4, "kMax": 10, "ds": [3, 4, 6, 7, 8, 9], "mMin": 5, "mMax": 8 },
      "4": { "pairs": [[12, 18], [8, 12], [18, 24], [12, 30], [20, 30], [24, 36], [16, 24], [30, 45]] }
    },
    "area1": {
      "2": { "pairs": [[21, 4], [24, 6]], "aMin": 12, "aMax": 48, "aStep": 3, "bMin": 3, "bMax": 7, "bStep": 1, "min": 2, "max": 99 },
      "3": { "pairs": [[47, 6], [216, 4]], "aMin": 112, "aMax": 328, "aStep": 18, "bMin": 3, "bMax": 8, "bStep": 1, "min": 100, "max": 999 }
    },
    "area2": {
      "2": { "tens": [[23, 10], [23, 20], [48, 20]], "aMin": 12, "aMax": 20, "aStep": 1, "bMin": 11, "bMax": 15, "bStep": 1, "max": 20 },
      "3": { "pairs": [[24, 35], [13, 12]], "aMin": 13, "aMax": 48, "aStep": 5, "bMin": 12, "bMax": 35, "bStep": 3 }
    },
    "div-rem": {
      "2": { "pairs": [[17, 5]], "dMin": 3, "dMax": 5, "qMin": 2, "qMax": 6, "rMin": 1, "vans": [[40, 6]], "vMin": 20, "vMax": 48, "cMin": 5, "cMax": 7 },
      "3": { "pairs": [[58, 7], [73, 8]], "dMin": 6, "dMax": 9, "qMin": 2, "qMax": 9, "rMin": 1, "vans": [[40, 6]], "vMin": 30, "vMax": 79, "cMin": 6, "cMax": 9 }
    },
    "div-multi": {
      "2": { "pairs": [[84, 4], [96, 6]], "qMin": 12, "qMax": 24, "divs": [3, 4, 6], "max": 99 },
      "3": { "pairs": [[756, 6], [2408, 8]], "qMin": 101, "qMax": 309, "divs": [4, 6, 7, 8], "max": 2500 }
    },
    "div-multi-word": {
      "2": { "pairs": [[96, 6]], "qMin": 12, "qMax": 24, "divs": [3, 4, 6], "max": 99 },
      "3": { "pairs": [[2408, 8]], "qMin": 101, "qMax": 309, "divs": [4, 6, 7, 8], "max": 2500 }
    },
    "div-long": {
      "2": { "pairs": [[360, 30], [540, 30]], "qMin": 11, "qMax": 20, "tens": [20, 30, 40], "max": 999 },
      "3": { "pairs": [[646, 19], [1344, 24]], "qMin": 13, "qMax": 56, "divs": [19, 23, 24, 36], "max": 1500 }
    },
    "div-long-word": {
      "2": { "pairs": [[540, 30]], "qMin": 11, "qMax": 20, "tens": [20, 30, 40], "max": 999 },
      "3": { "pairs": [[500, 36]], "qMin": 13, "qMax": 56, "divs": [19, 23, 24, 36], "max": 1500 }
    },
    "frac-equiv": {
      "2": {
        "fill": [[3, 4, 2], [2, 3, 2], [1, 2, 2], [1, 2, 3], [1, 2, 4], [2, 5, 2], [3, 5, 2], [1, 3, 2], [1, 4, 2], [1, 3, 3], [2, 3, 3]],
        "cmp": [[1, 2, 1, 4], [1, 3, 1, 2], [1, 4, 1, 3], [2, 5, 1, 5]]
      },
      "3": {
        "cmp": [[2, 3, 3, 4], [3, 4, 2, 3], [1, 2, 2, 3], [3, 5, 2, 3], [5, 6, 2, 3], [1, 2, 3, 5]],
        "simp": [[6, 8], [4, 8], [2, 6], [3, 6], [6, 9], [4, 6], [8, 12], [6, 12], [9, 12], [2, 8]]
      }
    },
    "frac-of": {
      "2": { "pairs": [[1, 5, 20], [1, 4, 12], [1, 2, 10], [1, 3, 12]], "wholes": [12, 16, 20, 24], "bots": [2, 4] },
      "3": { "pairs": [[3, 4, 12], [2, 3, 15], [3, 4, 20], [2, 5, 30], [3, 5, 20]], "wholes": [12, 15, 20, 24, 30], "bots": [3, 5] }
    },
    "frac-addsame": {
      "2": {
        "pairs": [[1, 3, 5, 0], [1, 2, 4, 0], [2, 1, 5, 1]],
        "bots": [4, 5]
      },
      "3": {
        "pairs": [[3, 5, 8, 0], [5, 2, 8, 1], [3, 3, 4, 0], [7, 3, 8, 1]],
        "bots": [6, 8]
      }
    },
    "frac-addunlike": {
      "2": {
        "pairs": [[1, 2, 1, 4, 0], [3, 4, 1, 8, 1], [1, 4, 1, 8, 0]],
        "bots": [[2, 4], [4, 8]]
      },
      "3": {
        "pairs": [[2, 3, 1, 6, 1], [1, 2, 1, 3, 0], [1, 3, 1, 2, 0], [5, 6, 1, 12, 1]],
        "bots": [[2, 3], [2, 6], [3, 6], [3, 4]]
      }
    },
    "frac-mul": {
      "2": {
        "pairs": [[1, 2, 1, 4], [1, 2, 1, 2], [1, 2, 1, 3]],
        "wholes": [[6, 3, 4]],
        "wbots": [4]
      },
      "3": {
        "pairs": [[2, 3, 3, 4], [1, 3, 1, 4], [2, 3, 1, 2]],
        "bots": [2, 3], "bots2": [3, 4],
        "wholes": [[6, 3, 4]]
      }
    },
    "dec-tenths": {
      "2": {
        "frac": [[3, 10], [1, 10], [7, 10], [9, 10], [4, 10], [6, 10]],
        "whole": [[4, 7], [2, 3], [5, 1], [3, 9], [1, 5], [6, 2]]
      },
      "3": {
        "whole": [[4, 7], [1, 7], [2, 5], [3, 8], [6, 4], [8, 2], [7, 6]],
        "count": [16, 17, 23, 35, 48, 52, 69]
      }
    },
    "dec-hundredths": {
      "2": {
        "frac": [[5, 100], [7, 100], [9, 100], [3, 100], [8, 100], [12, 100], [25, 100]],
        "parts": [[3, 4], [2, 7], [5, 6], [1, 9], [4, 2], [6, 5]]
      },
      "3": {
        "parts": [[0, 5], [2, 3], [7, 5], [8, 9], [3, 4], [1, 2]],
        "paise": [275, 150, 305, 90, 425, 60, 199]
      }
    },
    "dec-compare": {
      "2": {
        "cmp": [[70, 35], [34, 29], [40, 38], [25, 60], [50, 45], [80, 8]],
        "fill": [50, 20, 30, 70, 60, 90]
      },
      "3": {
        "cmp": [[66, 6], [34, 340], [7, 70], [305, 350], [12, 120], [66, 606]],
        "small": [[60, 6, 66], [34, 43, 4], [25, 52, 5], [8, 80, 18], [30, 3, 33], [15, 51, 5]]
      }
    },
    "dec-addsub": {
      "2": {
        "pairs": [[250, 375, 0], [240, 350, 0], [690, 240, 1], [460, 130, 1], [120, 505, 0], [875, 325, 1]],
        "aMin": 110, "aMax": 790, "aStep": 85, "bMin": 120, "bMax": 480, "bStep": 70, "cap": 999
      },
      "3": {
        "pairs": [[1000, 460, 1], [350, 125, 1], [625, 238, 1], [250, 375, 0], [507, 238, 1], [340, 275, 0]],
        "aMin": 350, "aMax": 1000, "aStep": 90, "bMin": 125, "bMax": 480, "bStep": 65, "cap": 1500
      }
    },
    "dec-addsub-word": {
      "2": { "pairs": [[350, 125, 1], [250, 375, 0], [460, 130, 1], [500, 240, 1], [240, 350, 0], [690, 240, 1], [120, 505, 0], [875, 325, 1], [340, 275, 0]] },
      "3": { "pairs": [[350, 125, 1], [1000, 460, 1], [625, 238, 1], [507, 238, 1], [250, 375, 0], [340, 275, 0], [875, 325, 1], [690, 240, 1], [460, 130, 1]] }
    },
    "dec-muldiv": {
      "2": {
        "mul": [[4, 3], [3, 4], [25, 6], [5, 8], [12, 7], [6, 9]],
        "div": [[720, 4], [120, 4], [180, 6], [250, 5], [360, 3]]
      },
      "3": {
        "mul": [[1250, 6], [25, 12], [36, 7], [48, 9], [125, 8]],
        "div": [[720, 4], [945, 7], [864, 6], [736, 8], [588, 3]]
      }
    },
    "dec-muldiv-word": {
      "2": { "mul": [[1250, 6], [250, 4], [360, 5], [150, 8], [240, 3], [125, 6], [320, 5], [450, 4], [275, 6]] },
      "3": { "mul": [[1250, 6], [1575, 8], [1240, 7], [1850, 4], [2250, 6], [1625, 8], [1480, 5], [1375, 8], [1920, 6]] }
    },
    "pct-meaning": {
      "2": {
        "grid": [35, 20, 45, 60, 25, 70, 15, 80],
        "frac": [[1, 4], [1, 2], [1, 5], [1, 10]],
        "part": [[25, 50], [10, 50], [5, 20], [20, 50]]
      },
      "3": {
        "frac": [[3, 4], [3, 5], [1, 20], [1, 25], [2, 5], [1, 4], [1, 2], [1, 10]],
        "part": [[5, 20], [15, 20], [5, 25], [10, 25], [25, 50], [15, 50], [10, 50], [20, 50]]
      }
    },
    "pct-bench": {
      "2": { "of": [[50, 80], [25, 60], [10, 350], [50, 60], [25, 80], [10, 80], [50, 50], [10, 200], [25, 100], [10, 50]] },
      "3": { "of": [[75, 80], [20, 350], [5, 60], [75, 60], [20, 60], [5, 80], [75, 100], [20, 250], [5, 100], [5, 200]] }
    },
    "pct-link": {
      "2": {
        "toDec": [[3, 4], [1, 2], [1, 4], [7, 10], [3, 5], [1, 5]],
        "toPct": [60, 50, 75, 25, 70, 40]
      },
      "3": {
        "toDec": [[3, 4], [9, 10], [1, 10], [3, 5], [1, 5], [1, 2]],
        "toPct": [60, 90, 20, 75, 25, 50],
        "toFrac": [45, 50, 25, 75, 60, 20, 10, 40]
      }
    },
    "pct-of": {
      "2": { "of": [[50, 80], [25, 60], [10, 350], [20, 250], [50, 60], [25, 80], [10, 80], [20, 350]] },
      "3": { "of": [[15, 80], [20, 400, 1], [40, 250], [15, 200], [20, 250], [25, 400, 1], [40, 200], [15, 100]] }
    },
    "pct-of-word": {
      "2": { "of": [[40, 250], [20, 400, 1], [50, 80], [25, 60], [10, 350], [40, 200], [20, 250], [50, 400, 1], [10, 250]] },
      "3": { "of": [[20, 400, 1], [40, 250], [15, 200], [25, 400, 1], [20, 250], [40, 200], [15, 80], [50, 400, 1], [10, 400, 1]] }
    },
    "neg-compare": {
      "2": {
        "colder": [[3, 7], [2, 5], [1, 6], [4, 9], [2, 8], [3, 10], [5, 7], [1, 4]],
        "steps": [[-4, 0], [-5, 0], [-3, 0], [-6, 0], [-2, 0], [-8, 0]]
      },
      "3": {
        "colder": [[3, 7], [2, 5], [4, 9], [1, 6], [5, 8], [2, 7], [3, 9], [6, 10]],
        "steps": [[-2, 3], [-4, 0], [-3, 2], [-5, 1], [-1, 4], [-6, 0], [-4, 3], [-2, 5]]
      }
    },
    "neg-addsub": {
      "2": {
        "sums": [[4, 9, 1], [6, 10, 0, 1], [3, 7, 1], [5, 8, 1], [2, 9, 1], [8, 3, 0, 1], [7, 2, 0, 1], [5, 11, 1], [6, 8, 1], [4, 7, 0, 1]]
      },
      "3": {
        "sums": [[4, 9, 1], [6, 10, 0, 1], [8, 5, 0, 1], [3, 4, 1, 1], [5, 12, 1], [7, 10, 0, 1], [2, 11, 1], [9, 6, 0, 1], [8, 15, 1], [5, 9, 0, 1]]
      }
    },
    "ops-brackets": {
      "2": {
        "exprs": [[20, "-", 6, "+", 4, 1], [9, "-", 4, "+", 3, 0], [15, "-", 8, "+", 3, 1], [12, "-", 4, "+", 3, 0], [18, "-", 5, "+", 5, 1], [14, "-", 9, "+", 2, 0], [16, "-", 7, "+", 2, 1], [11, "-", 3, "+", 2, 0], [17, "-", 6, "+", 5, 1], [13, "-", 5, "+", 4, 0]]
      },
      "3": {
        "exprs": [[3, "+", 2, "x", 4, 0], [3, "x", 2, "+", 4, 1], [2, "+", 3, "x", 5, 1], [4, "x", 2, "+", 3, 0], [5, "+", 1, "x", 3, 1], [2, "x", 3, "+", 5, 0], [4, "+", 2, "x", 3, 1], [5, "x", 2, "+", 1, 0]]
      },
      "4": {
        "pairs": [[8, "-", 3, "+", 2], [10, "-", 4, "+", 2], [12, "-", 5, "+", 3], [9, "-", 2, "+", 4], [11, "-", 3, "+", 2], [13, "-", 6, "+", 4], [10, "-", 2, "+", 5], [14, "-", 5, "+", 3]]
      }
    },
    "ops-order": {
      "2": {
        "exprs": [[3, "+", 4, "x", 5], [20, "-", 2, "x", 5], [2, "+", 3, "x", 4], [6, "+", 2, "x", 3], [4, "x", 5, "+", 3], [10, "-", 3, "x", 2], [5, "x", 2, "+", 4], [3, "+", 5, "x", 2]]
      },
      "3": {
        "exprs": [[20, "-", 12, "/", 4], [5, "x", 6, "+", 2], [18, "/", 3, "+", 7], [24, "/", 6, "+", 8], [4, "x", 7, "-", 5], [30, "/", 5, "+", 6]],
        "three": [[6, "+", 2, "x", 3, "-", 10, "/", 5], [8, "+", 3, "x", 2, "-", 12, "/", 4]]
      }
    },
    "ops-order-word": {
      "2": { "boxes": [[2, 3, 4], [3, 2, 5], [1, 4, 3], [4, 2, 6], [2, 5, 3], [3, 3, 4], [5, 2, 4], [1, 3, 5]] },
      "3": { "boxes": [[3, 4, 5], [2, 6, 3], [4, 3, 6], [5, 2, 7], [3, 5, 4], [2, 4, 8], [6, 3, 5], [4, 4, 6]] }
    },
    "unk-letter": {
      "2": {
        "add": [[8, 15], [6, 11], [9, 14], [7, 16], [5, 12], [8, 13]],
        "sub": [[14, 6], [12, 5], [16, 7], [13, 8], [15, 9], [11, 4]]
      },
      "3": {
        "mul": [[4, 36], [3, 27], [6, 48], [7, 35], [8, 40], [9, 54]],
        "div": [[5, 6], [4, 7], [6, 5], [3, 8], [8, 4], [7, 3]]
      },
      "4": {
        "brk": [[3, 2, 15], [2, 3, 16], [4, 1, 20], [2, 4, 18], [3, 1, 18], [5, 2, 25], [2, 5, 16], [4, 2, 20]]
      }
    },
    "unk-letter-word": {
      "2": { "packs": [[6, 30], [4, 20], [5, 25], [3, 18], [7, 35], [8, 40], [6, 24], [5, 30]] },
      "3": { "packs": [[6, 48], [9, 45], [7, 42], [8, 56], [6, 54], [9, 63], [7, 49], [8, 48]] }
    }
  },
  "extra": {}
};
