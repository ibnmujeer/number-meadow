/*
 * Representations (DESIGN 7, D7; JSON-compatible data only). Each activity has exactly one,
 * and it is recorded on every attempt.
 *   order   the concreteness order the adaptive engine uses (most to least concrete);
 *           word-problem is a separate branch, never the first step down from symbolic
 *   list    id, adult-facing name and the exact definition
 */
NBA.data.representations = {
  "order": ["concrete", "shape-fraction", "dot-pattern", "dice-pattern", "ten-frame", "number-bond", "array", "area-model", "hundred-grid", "base-ten-blocks", "place-value-chart", "fraction-bar", "vertical-number-line", "visual", "number-line", "symbolic"],
  "list": [
    { "id": "concrete", "name": "Concrete (build with counters)",
      "definition": "The child acts on counters to make the answer: adds counters with +1 or removes them with Undo, then taps Done. The answer is the number of counters the child ends with. No equation is shown." },
    { "id": "shape-fraction", "name": "Shapes and sets in equal parts (halves and quarters)",
      "definition": "A shape split into equal parts, with one part shaded, sits beside a group of counters dealt fairly into the same number of equal plates. The child counts one plate and taps how many are in it. The picture shows the equal parts with no equation." },
    { "id": "dot-pattern", "name": "Dot patterns (see a small group at a glance)",
      "definition": "A small group of 1 to 5 dots in a fixed set pattern (a line, a triangle, or a scattered layout) stays on the card with no timer and no flash. The child sees how many at a glance and taps the number. No counting prompt and no equation." },
    { "id": "dice-pattern", "name": "Dice patterns (the dot layout of a dice face)",
      "definition": "The familiar dot layout of a dice face, 1 to 6, stays on the card with no timer and no flash. The child names the face at a glance and taps the number. No counting prompt and no equation." },
    { "id": "ten-frame", "name": "Ten-frame (two rows of five boxes)",
      "definition": "A frame of two rows of five boxes, filled from the top left, shows a number up to 10 as a full row of five and some more. The child counts the filled boxes, or the empty ones, and taps the number. The picture carries the task with no counting prompt and no equation." },
    { "id": "number-bond", "name": "Number bond (a whole and its two parts)",
      "definition": "A whole number joined to its two parts: the whole in a top circle, two part circles below it, one part shown and one left blank. The child says the hidden part and taps the number. The picture shows the parts with no equation." },
    { "id": "array", "name": "Array (rows and columns of counters)",
      "definition": "Counters laid out in equal rows and columns, so a times fact is seen as so many rows of so many. The child reads the rows and the columns, or how many groups the counters make, and taps the number. A short times or sharing sum may appear under the array, but the picture alone is enough to answer." },
    { "id": "area-model", "name": "Area model (a rectangle cut into tens and ones)",
      "definition": "A rectangle whose two sides are the numbers being multiplied, cut into tens and ones (and hundreds) so each cell is one smaller product. The child reads the cells, or the total of all the cells, and taps the number. The partial products are labelled inside the cells; the picture carries the task with no equation." },
    { "id": "hundred-grid", "name": "Hundred grid (a 10 by 10 grid, some squares shaded)",
      "definition": "A square cut into 10 rows of 10, so the whole is 100 small squares. A shaded column of ten is one tenth and a single shaded square is one hundredth, so a decimal is seen as so many tenths and hundredths of one whole. The child reads how many squares are shaded, or which decimal the shading shows, and taps the number or the decimal. No counters and no equation." },
    { "id": "base-ten-blocks", "name": "Base-ten pieces (seeds, bead rods and flat tiles)",
      "definition": "The Meadow place-value pieces: single seeds for ones, bead rods for tens and flat tiles for hundreds, laid out in hundreds, tens and ones columns. The child reads how many of each or how a trade changes them, and taps the number. The picture shows the quantity with no equation." },
    { "id": "place-value-chart", "name": "Place value chart (hundreds, tens and ones columns)",
      "definition": "A chart with hundreds, tens and ones columns and a digit under each, so a two or three digit number is seen as what each digit is worth. The child reads a value, compares two charts, or finds 10 or 100 more or less, and taps the number. No counters and no equation." },
    { "id": "fraction-bar", "name": "Fraction bar (a bar split into equal parts, some shaded)",
      "definition": "A bar split into equal parts with some parts shaded, so a fraction is seen as so many parts of a whole. A fraction wall is a stack of these bars, cut into halves, quarters, eighths and so on, lined up to the same length. The child reads how many parts are shaded, which bar is longer, or how many small parts cover a half, and taps the number or the fraction. No counters and no equation." },
    { "id": "vertical-number-line", "name": "Vertical number line (a number line standing up, zero marked)",
      "definition": "A number line standing up, with zero marked part way down and the rows below it going down into negative numbers, like a thermometer or the floors below ground in a lift. The child reads a marked row, or where a story's number sits, and taps the number. No equation is shown." },
    { "id": "visual", "name": "Visual (count the counter picture)",
      "definition": "A picture of counters the child can count shows the quantities. The child answers with number buttons or by tapping a stack. A short equation may appear under the picture, but the picture alone is enough to answer." },
    { "id": "number-line", "name": "Number line",
      "definition": "A numbered line of tiles with the start marked by the buddy face and the jumps drawn as arcs (forward for addition, back for subtraction). The landing tile shows ? instead of its number. No countable counter groups." },
    { "id": "symbolic", "name": "Symbolic (numbers and signs only)",
      "definition": "Numerals and operation signs only, on a plain card. No counters, no line and no pictures of quantity. Speech says the sum in words." },
    { "id": "word-problem", "name": "Word problem",
      "definition": "A short story (at most 2 sentences and a question), read aloud, with names and objects from the game. The stage shows the faces and one object only, with no countable quantities and no equation." }
  ]
};
