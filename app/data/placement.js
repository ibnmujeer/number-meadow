/*
 * Placement check ladder (step 8; JSON-compatible data only; ASCII only; docs/STYLE.md section 15).
 * EVERY number and ordering below is a DESIGN HYPOTHESIS with no source (the owner approved them as
 * defaults); an adult reviewer must check the ladder. The staircase numbers live in config.placement.
 *
 * The ladder is one climb of built content, easy to hard. A placement check starts at the rung for the
 * child's age band (startRung) and steps up after a correct first try and down after a mistake. All numbers
 * stay within 20, so a strong or older child reaches the top rung (a ceiling); the adult text says so.
 *
 * Step 9 (sub-build F) added the band-1 (ages 4 to 6) skills at the EASY end as four new rungs 1 to 4
 * (subitizing and sorting, number words and numerals, part-whole / ten-frame / number line, make-5 / make-10
 * / teen numbers / halves), so a 4-6 child now meets band-1 content first and the band is playable from the
 * placement check. The old rungs 1 to 12 are renumbered 5 to 16 (unchanged content). config.placement
 * startRung for 4-6 drops to the easiest new rung 1 and the 7-9 and 10-12 starts shift up by four (6 -> 10,
 * 9 -> 13) so each still begins at the same content. EVERY rung and number is a DESIGN HYPOTHESIS with no
 * source (the owner approved them as defaults); an adult reviewer must check the ladder.
 *
 * Step 11 (sub-build G) adds the band-3 (ages 10 to 12) skills at the HARD end as eight new rungs 25 to 32,
 * ABOVE the band-2 ceiling, in difficulty order (D11-4 = A): big numbers and the 6-to-9 and division facts
 * (25), bigger add/subtract, equivalent fractions and comparing negatives (26), the area model, tenths, a
 * fraction of an amount and factors (27), adding same-bottom fractions, hundredths, remainders and brackets
 * (28), percent meaning, comparing decimals, signed add/subtract and the letter sum (29), two-by-two area,
 * multi-digit division, benchmark percents and unlike fractions (30), adding decimals, the order of steps,
 * multiplying fractions and a percent of an amount (31), and long division, multiplying decimals and the
 * fraction/decimal/percent link (32). config.placement startRung for 10-12 rises from rung 13 (within-20
 * counters) to the first solid band-2 rung 17, so a 10-12 child meets band-2 content first and climbs into
 * the new band-3 rungs; 4-6 and 7-9 starts are unchanged. config.placement maxRung rises from 24 to 32 so a
 * strong or older child reaches the new top rung instead of the old band-2 ceiling. R-P (D11-4): with 32 rungs
 * an always-right child reaches the top rung after sixteen correct answers and then holds there, so the ceiling
 * run of four correct answers at the top lands exactly on the twenty-answer cap; the check stops by 'cap' at
 * the top rung, not by 'stable'. maxAnswers stays 20 (not raised); the adult text handles a 'cap' ending that
 * sits at the top rung as "reached the top of the built content". The existing rungs 1 to 24 and their content
 * are UNCHANGED. EVERY new rung and number is a DESIGN HYPOTHESIS with no source (the owner approved them as
 * defaults); an adult reviewer must check the ladder. All band-3 variants ask at level 2 (the easiest level
 * each band-3 activity declares), the first-encounter level for the placement probe.
 *
 * Step 10 (sub-build F) adds the band-2 (ages 7 to 9) skills at the HARD end as eight new rungs 17 to 24,
 * ABOVE the band-1 ceiling, in difficulty order (D10-5 = A): place value (17 to 18), multi-digit add/sub
 * without then with regrouping and three-digit (19 to 20), arrays and times tables for 2/5/10 then 3/4 (21),
 * division by grouping and the inverse (22), first fractions (23), and the first informal negatives, order of
 * operations and missing numbers (24). config.placement startRung for 7-9 rises from rung 10 (within-10
 * symbols) to the first solid band-2 rung 17, so a 7-9 child meets band-2 content first and the band is
 * playable from the placement check; 4-6 and 10-12 starts are unchanged (10-12 still has no band-3 content
 * built, so a 10-12 child climbs the band-2 rungs). config.placement maxRung rises from 16 to 24 so a strong
 * or older child reaches the new top rung instead of the old band-1 ceiling. The existing rungs 1 to 16 and
 * their content are UNCHANGED. EVERY new rung and number is a DESIGN HYPOTHESIS with no source (the owner
 * approved them as defaults); an adult reviewer must check the ladder. All band-2 variants ask at level 2
 * (the easiest level each band-2 activity declares), the first-encounter level for the placement probe.
 *
 *   rungs[i].n          the rung number (1 is the easiest), 1-based, in order
 *   rungs[i].variants   2 to 4 ways to ask at that rung, tried in turn (visits mod variants) so evidence
 *                       spreads over several skills and ways; the builder probes each with generator.generate
 *                       and drops one that throws (as prereqPick.probe does), so a variant that cannot build
 *                       is never shown
 *   variant.act         an activity id (app/data/activities.js)
 *   variant.level       a difficulty level the activity declares (build/bigger/groups/share declare 2 and 4 only)
 *   variant.template    sub-word only: 'take' (take away) or 'diff' (how many more); null otherwise
 *   variant.concepts    concepts this variant credits, the primary one first (A6: addsub.mixed and rep.transition
 *                       are never credited here); the service writes them as the attempt's lead concepts
 *   variant.words       short adult words for the way of the rung (D-A; used for "Settled around ...")
 *   startRung           the start rung per age band and the kind start when the band is unknown (also in
 *                       config.placement.startRung; the two must agree)
 */
NBA.data.placement = {
  "startRung": { "4-6": 1, "7-9": 17, "10-12": 17, "unknown": 1 },
  "rungs": [
    { "n": 1, "variants": [
      { "act": "subitize-dots", "level": 2, "template": null, "concepts": ["sense.subitize-3"], "words": "seeing a small dot pattern" },
      { "act": "subitize-dice", "level": 2, "template": null, "concepts": ["sense.subitize-5"], "words": "seeing a dice face" },
      { "act": "match-count", "level": 2, "template": null, "concepts": ["sense.match-sort"], "words": "counting one sorted group" }
    ] },
    { "n": 2, "variants": [
      { "act": "count-next", "level": 2, "template": null, "concepts": ["count.rote-20"], "words": "saying the next number" },
      { "act": "count-back", "level": 2, "template": null, "concepts": ["count.back-20"], "words": "saying the number just before" },
      { "act": "numeral-say", "level": 2, "template": null, "concepts": ["sense.numerals-10"], "words": "finding a numeral" }
    ] },
    { "n": 3, "variants": [
      { "act": "part-bond", "level": 2, "template": null, "concepts": ["sense.part-whole-10"], "words": "finding the other part" },
      { "act": "ten-frame", "level": 2, "template": null, "concepts": ["sense.ten-frame"], "words": "reading a ten-frame" },
      { "act": "line-read", "level": 2, "template": null, "concepts": ["sense.line-10"], "words": "reading a number line" }
    ] },
    { "n": 4, "variants": [
      { "act": "make-5", "level": 2, "template": null, "concepts": ["add.make-5"], "words": "finding a partner that makes five" },
      { "act": "make-10", "level": 2, "template": null, "concepts": ["add.make-10"], "words": "finding how many more make ten" },
      { "act": "teen-ten", "level": 2, "template": null, "concepts": ["place.teen-numbers"], "words": "a teen as a ten and some ones" },
      { "act": "frac-share", "level": 2, "template": null, "concepts": ["frac.halves-quarters"], "words": "finding a half of a group" }
    ] },
    { "n": 5, "variants": [
      { "act": "build", "level": 2, "template": null, "concepts": ["num.count"], "words": "counting a group of counters" },
      { "act": "bigger", "level": 2, "template": null, "concepts": ["num.compare"], "words": "finding the bigger tower" }
    ] },
    { "n": 6, "variants": [
      { "act": "add", "level": 1, "template": null, "concepts": ["add.combine"], "words": "adding small groups with pictures" },
      { "act": "knock", "level": 1, "template": null, "concepts": ["sub.take-away"], "words": "taking a few away with pictures" }
    ] },
    { "n": 7, "variants": [
      { "act": "add-build", "level": 1, "template": null, "concepts": ["add.combine"], "words": "adding by building with counters" },
      { "act": "sub-build", "level": 1, "template": null, "concepts": ["sub.take-away"], "words": "taking away with counters" }
    ] },
    { "n": 8, "variants": [
      { "act": "add", "level": 2, "template": null, "concepts": ["add.within-10"], "words": "adding within 10 with pictures" },
      { "act": "knock", "level": 2, "template": null, "concepts": ["sub.within-10"], "words": "taking away within 10 with pictures" },
      { "act": "more", "level": 1, "template": null, "concepts": ["sub.difference"], "words": "finding how many more" }
    ] },
    { "n": 9, "variants": [
      { "act": "add-line", "level": 2, "template": null, "concepts": ["add.count-on"], "words": "adding by counting on a number line" },
      { "act": "sub-line", "level": 2, "template": null, "concepts": ["sub.take-away"], "words": "counting back on a number line" },
      { "act": "more", "level": 2, "template": null, "concepts": ["sub.difference"], "words": "finding how many more within 10" }
    ] },
    { "n": 10, "variants": [
      { "act": "add-sym", "level": 2, "template": null, "concepts": ["add.within-10"], "words": "adding within 10 with number symbols" },
      { "act": "sub-sym", "level": 2, "template": null, "concepts": ["sub.within-10"], "words": "taking away within 10 with number symbols" }
    ] },
    { "n": 11, "variants": [
      { "act": "add-word", "level": 2, "template": null, "concepts": ["add.combine"], "words": "adding in a short story" },
      { "act": "sub-word", "level": 2, "template": "take", "concepts": ["sub.take-away"], "words": "taking away in a short story" },
      { "act": "groups", "level": 2, "template": null, "concepts": ["mul.groups"], "words": "counting equal groups" },
      { "act": "share", "level": 2, "template": null, "concepts": ["div.share"], "words": "sharing fairly" }
    ] },
    { "n": 12, "variants": [
      { "act": "add", "level": 3, "template": null, "concepts": ["add.within-20"], "words": "adding within 20 with pictures" },
      { "act": "knock", "level": 3, "template": null, "concepts": ["sub.within-20"], "words": "taking away within 20 with pictures" }
    ] },
    { "n": 13, "variants": [
      { "act": "add-build", "level": 3, "template": null, "concepts": ["add.within-20"], "words": "adding within 20 with counters" },
      { "act": "sub-line", "level": 3, "template": null, "concepts": ["sub.within-20"], "words": "taking away within 20 on a number line" },
      { "act": "more", "level": 3, "template": null, "concepts": ["sub.difference"], "words": "finding how many more within 20" }
    ] },
    { "n": 14, "variants": [
      { "act": "add-sym", "level": 3, "template": null, "concepts": ["add.within-20"], "words": "adding within 20 with number symbols" },
      { "act": "sub-sym", "level": 3, "template": null, "concepts": ["sub.within-20"], "words": "taking away within 20 with number symbols" },
      { "act": "groups", "level": 4, "template": null, "concepts": ["mul.groups"], "words": "counting larger equal groups" }
    ] },
    { "n": 15, "variants": [
      { "act": "add-word", "level": 3, "template": null, "concepts": ["add.within-20"], "words": "adding within 20 in a short story" },
      { "act": "sub-word", "level": 3, "template": "diff", "concepts": ["sub.difference"], "words": "finding how many more in a story" },
      { "act": "share", "level": 4, "template": null, "concepts": ["div.share"], "words": "sharing larger amounts fairly" }
    ] },
    { "n": 16, "variants": [
      { "act": "add-sym", "level": 4, "template": null, "concepts": ["add.within-20"], "words": "adding within 20 with number symbols" },
      { "act": "sub-sym", "level": 4, "template": null, "concepts": ["sub.within-20"], "words": "taking away within 20 with number symbols" },
      { "act": "add-line", "level": 4, "template": null, "concepts": ["add.count-on"], "words": "adding within 20 on a number line" },
      { "act": "sub-line", "level": 4, "template": null, "concepts": ["sub.within-20"], "words": "taking away within 20 on a number line" }
    ] },
    { "n": 17, "variants": [
      { "act": "tens-ones", "level": 2, "template": null, "concepts": ["place.two-digit"], "words": "reading tens and ones to 99" },
      { "act": "skip-count", "level": 2, "template": null, "concepts": ["count.skip-2-5-10"], "words": "counting on in 2s, 5s or 10s" }
    ] },
    { "n": 18, "variants": [
      { "act": "hundreds", "level": 2, "template": null, "concepts": ["place.hundreds"], "words": "reading hundreds, tens and ones" },
      { "act": "compare-pv", "level": 2, "template": null, "concepts": ["place.compare-order"], "words": "comparing numbers to 1000" },
      { "act": "round-pv", "level": 2, "template": null, "concepts": ["place.round"], "words": "rounding to the nearest ten" }
    ] },
    { "n": 19, "variants": [
      { "act": "add2", "level": 2, "template": null, "concepts": ["add.two-digit"], "words": "adding two-digit numbers, no trade" },
      { "act": "sub2", "level": 2, "template": null, "concepts": ["sub.two-digit"], "words": "taking away two-digit numbers, no trade" },
      { "act": "add-fact", "level": 2, "template": null, "concepts": ["add.facts-20"], "words": "an adding fact to 20" }
    ] },
    { "n": 20, "variants": [
      { "act": "add2r", "level": 2, "template": null, "concepts": ["add.two-digit-regroup"], "words": "adding two-digit numbers with a trade" },
      { "act": "sub2r", "level": 2, "template": null, "concepts": ["sub.two-digit-regroup"], "words": "taking away two-digit numbers with a trade" },
      { "act": "add3", "level": 2, "template": null, "concepts": ["add.three-digit"], "words": "adding three-digit numbers" }
    ] },
    { "n": 21, "variants": [
      { "act": "mul-array", "level": 2, "template": null, "concepts": ["mul.arrays"], "words": "counting rows and columns in an array" },
      { "act": "mul-fact", "level": 2, "template": null, "concepts": ["mul.facts-2-5-10"], "words": "a times table for 2, 5 or 10" },
      { "act": "mul-fact34", "level": 2, "template": null, "concepts": ["mul.facts-3-4"], "words": "a times table for 3 or 4" }
    ] },
    { "n": 22, "variants": [
      { "act": "div-group", "level": 2, "template": null, "concepts": ["div.group"], "words": "making equal groups to divide" },
      { "act": "div-inverse", "level": 2, "template": null, "concepts": ["div.inverse"], "words": "dividing as the opposite of times" }
    ] },
    { "n": 23, "variants": [
      { "act": "frac-unit", "level": 2, "template": null, "concepts": ["frac.unit"], "words": "naming equal parts of a whole" },
      { "act": "frac-nonunit", "level": 2, "template": null, "concepts": ["frac.non-unit"], "words": "a fraction like three out of four" },
      { "act": "frac-line", "level": 2, "template": null, "concepts": ["frac.on-line"], "words": "a fraction on a number line" }
    ] },
    { "n": 24, "variants": [
      { "act": "neg", "level": 2, "template": null, "concepts": ["neg.meaning"], "words": "a number below zero" },
      { "act": "ops-steps", "level": 2, "template": null, "concepts": ["ops.left-to-right"], "words": "working a sum left to right" },
      { "act": "missing-num", "level": 2, "template": null, "concepts": ["unk.missing-number"], "words": "the missing number in a sum" }
    ] },
    { "n": 25, "variants": [
      { "act": "place-big", "level": 2, "template": null, "concepts": ["place.large"], "words": "reading a large number" },
      { "act": "mul-fact69", "level": 2, "template": null, "concepts": ["mul.facts-6-9"], "words": "a times table for 6 to 9" },
      { "act": "div-fact", "level": 2, "template": null, "concepts": ["div.facts"], "words": "a division fact" }
    ] },
    { "n": 26, "variants": [
      { "act": "add-big", "level": 2, "template": null, "concepts": ["add.large"], "words": "adding larger numbers" },
      { "act": "sub-big", "level": 2, "template": null, "concepts": ["sub.large"], "words": "taking away larger numbers" },
      { "act": "frac-equiv", "level": 2, "template": null, "concepts": ["frac.equivalent-compare"], "words": "an equivalent fraction" },
      { "act": "neg-compare", "level": 2, "template": null, "concepts": ["neg.compare-order"], "words": "comparing numbers below zero" }
    ] },
    { "n": 27, "variants": [
      { "act": "mul-area1", "level": 2, "template": null, "concepts": ["mul.two-by-one"], "words": "multiplying with the area model" },
      { "act": "dec-tenths", "level": 2, "template": null, "concepts": ["dec.tenths"], "words": "tenths as a decimal" },
      { "act": "frac-of", "level": 2, "template": null, "concepts": ["frac.of-amount"], "words": "a fraction of an amount" },
      { "act": "factors", "level": 2, "template": null, "concepts": ["mul.factors-multiples"], "words": "factors and multiples" }
    ] },
    { "n": 28, "variants": [
      { "act": "frac-addsame", "level": 2, "template": null, "concepts": ["frac.add-same"], "words": "adding fractions, same bottom number" },
      { "act": "dec-hundredths", "level": 2, "template": null, "concepts": ["dec.hundredths"], "words": "hundredths as a decimal" },
      { "act": "div-rem", "level": 2, "template": null, "concepts": ["div.remainder"], "words": "dividing with a remainder" },
      { "act": "ops-brackets", "level": 2, "template": null, "concepts": ["ops.brackets"], "words": "doing the bracket first" }
    ] },
    { "n": 29, "variants": [
      { "act": "pct-meaning", "level": 2, "template": null, "concepts": ["pct.meaning"], "words": "percent as parts of a hundred" },
      { "act": "dec-compare", "level": 2, "template": null, "concepts": ["dec.compare-order"], "words": "comparing decimals" },
      { "act": "neg-addsub", "level": 2, "template": null, "concepts": ["neg.add-sub"], "words": "adding and taking away below zero" },
      { "act": "unk-letter", "level": 2, "template": null, "concepts": ["unk.letter"], "words": "a letter standing for a number" }
    ] },
    { "n": 30, "variants": [
      { "act": "mul-area2", "level": 2, "template": null, "concepts": ["mul.two-by-two"], "words": "multiplying by a two-digit number" },
      { "act": "div-multi", "level": 2, "template": null, "concepts": ["div.multi-digit"], "words": "dividing a larger number" },
      { "act": "pct-bench", "level": 2, "template": null, "concepts": ["pct.benchmarks"], "words": "a common percent of an amount" },
      { "act": "frac-addunlike", "level": 2, "template": null, "concepts": ["frac.add-unlike"], "words": "adding fractions, different bottom numbers" }
    ] },
    { "n": 31, "variants": [
      { "act": "dec-addsub", "level": 2, "template": null, "concepts": ["dec.add-sub"], "words": "adding and taking away decimals" },
      { "act": "ops-order", "level": 2, "template": null, "concepts": ["ops.mul-before-add"], "words": "times and divide before add" },
      { "act": "frac-mul", "level": 2, "template": null, "concepts": ["frac.multiply"], "words": "multiplying fractions" },
      { "act": "pct-of", "level": 2, "template": null, "concepts": ["pct.of-amount"], "words": "a percent of an amount" }
    ] },
    { "n": 32, "variants": [
      { "act": "div-long", "level": 2, "template": null, "concepts": ["div.long"], "words": "dividing by a two-digit number" },
      { "act": "dec-muldiv", "level": 2, "template": null, "concepts": ["dec.multiply-divide"], "words": "multiplying and dividing decimals" },
      { "act": "pct-link", "level": 2, "template": null, "concepts": ["pct.fraction-decimal-link"], "words": "linking fractions, decimals and percents" }
    ] }
  ]
};
