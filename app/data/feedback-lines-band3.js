/*
 * Band 3 (ages 10 to 12) hint lines (JSON-compatible data; ASCII; docs/STYLE.md 15). This is the sibling of data/feedback-lines.js,
 * split out so that file stays under the 400-line limit (the band-3 sub-builds A to E add many kinds). core/catalog.js merges this
 * `hints` map into FEEDBACK_LINES.hints (a kind in both files is a boot error), so feedback.js still sees every rung template under
 * NBA.data.feedbackLines through the catalog. The shape is exactly as in feedback-lines.js: hints[kind][rung] a short template, no
 * rung says the answer; {a} {b} {n} and the rest become the question's numbers. Rung 1 points at the picture, rung 2 shows the steps,
 * rung 3 reveals the model (the child still taps the answer). The matching ladder SPEC (core/hint-ladder-band3*.js) and the rung
 * drawings (child/hint-draw-band3*.js) are keyed by the same kind.
 */
NBA.data.feedbackLinesBand3 = {
  "hints": {
    "place-big": { "1": "Look at each digit and the group it sits in.", "2": "Read the number in groups of three digits.", "3": "Here is the answer, shown on the chart." },
    "mul-fact69": { "1": "Look at the rows. The first five rows share one colour.", "2": "Look at the five rows first. Then look at the rest.", "3": "Here are the two parts and the total." },
    "add-big": { "1": "Look at the digits, place by place.", "2": "Add the ones first. Then tens, then hundreds.", "3": "Here is the whole sum, worked out." },
    "add-big-word": { "1": "Look at the two parts of the story.", "2": "Two parts make a whole. Look at each part.", "3": "Here is the whole, added up." },
    "sub-big": { "1": "Look at the digits, place by place.", "2": "Take the ones first. Open the next place if needed.", "3": "Here is the whole sum, worked out." },
    "sub-big-word": { "1": "Look at the whole and the part you know.", "2": "The whole is split in two. Find the missing part.", "3": "Here is the missing part, worked out." },
    "div-fact": { "1": "Look at the rows in the array.", "2": "Think of the times fact. Count one row.", "3": "Here is the answer, as counters." },
    "factors": { "1": "Look at the numbers in the question.", "2": "Think of equal groups. Do they fit evenly?", "3": "Here are the groups, so you can check." },
    "mul-area1": { "1": "Look at the rectangle, split into tens and ones.", "2": "Work out each part. Then look at the next part.", "3": "Here are the parts, added into the total." },
    "mul-area2": { "1": "Look at the rectangle, split into four parts.", "2": "Work out each part, one at a time.", "3": "Here are the four parts, added into the total." },
    "div-rem": { "1": "Look at the counters shared into piles.", "2": "Count the full piles. Look at what is left.", "3": "Here are the full piles and the leftover ones." },
    "div-multi": { "1": "Look at the number, place by place.", "2": "Share each place in turn, from the left.", "3": "Here is each place shared out, then the answer." },
    "div-multi-word": { "1": "Look at the number in the story.", "2": "Share it into the groups the story asks for.", "3": "Here is the story shared out, then the answer." },
    "div-long": { "1": "Look at the number and the divider.", "2": "Guess how many times it fits. Then check the guess.", "3": "Here is each step written out, then the answer." },
    "div-long-word": { "1": "Look at the number in the story.", "2": "Guess how many fit. Then check the guess.", "3": "Here is the story worked out, then the answer." },
    "frac-equiv": { "1": "Look at the equal parts of the bar.", "2": "Count the parts on each bar.", "3": "Here is the matching fraction, shaded on the bar." },
    "frac-of": { "1": "Look at the bar over the counters.", "2": "Share the counters into the bottom number of piles.", "3": "Here is one part, then all the taken parts." },
    "frac-addsame": { "1": "Look at the shaded parts of the bar.", "2": "Count the parts of each amount.", "3": "Here are the tops joined over the same bottom." },
    "frac-addunlike": { "1": "Look at the two bars.", "2": "Cut the first bar so the parts match.", "3": "Here are both in the same parts, then joined." },
    "frac-mul": { "1": "Look at the square cut both ways.", "2": "Point at the parts that overlap.", "3": "Here are the tops and bottoms multiplied." },
    "dec-tenths": { "1": "Look at the grid, split into tens.", "2": "Count the shaded columns of ten.", "3": "Here is the decimal the shading shows." },
    "dec-hundredths": { "1": "Look at the grid of a hundred squares.", "2": "Count the columns, then the single squares.", "3": "Here is the decimal the shading shows." },
    "dec-compare": { "1": "Look at where each one sits on the line.", "2": "Match the places, writing a zero if you need to.", "3": "Here they are, lined up on the line." },
    "dec-addsub": { "1": "Look at the two decimals.", "2": "Line up the points, place under place.", "3": "Here they are, lined up, then the answer." },
    "dec-addsub-word": { "1": "Look at the lengths in the story.", "2": "Line up the points, place under place.", "3": "Here is the story worked out, then the answer." },
    "dec-muldiv": { "1": "Look at the decimal and the whole number.", "2": "Work it out as whole numbers first.", "3": "Here it is worked out, then the point put back." },
    "dec-muldiv-word": { "1": "Look at the price in the story.", "2": "Work it out as whole numbers first.", "3": "Here is the story worked out, then the answer." },
    "pct-meaning": { "1": "Look at the grid of a hundred squares.", "2": "Count the squares that are coloured, out of a hundred.", "3": "Here is the percent the shading shows." },
    "pct-bench": { "1": "Look at the bar, split into equal parts.", "2": "A half, a quarter or a tenth is easy. Use that part.", "3": "Here is that part of the amount." },
    "pct-link": { "1": "Look at the grid of a hundred squares.", "2": "Make the bottom number a hundred. Then read it off.", "3": "Here is the matching form the grid shows." },
    "pct-of": { "1": "Look at the percent and the amount.", "2": "Find one in a hundred first. Then build up to the percent.", "3": "Here is the amount, worked out from the bar." },
    "pct-of-word": { "1": "Look at the percent in the story.", "2": "Find one in a hundred first. Then build up to the percent.", "3": "Here is the story worked out, then the answer." },
    "neg-compare": { "1": "Look at the line standing up.", "2": "Lower down the line means colder. Go down to each one.", "3": "Here is the colder one, marked on the line." },
    "neg-addsub": { "1": "Look at the line through zero.", "2": "Start on the first number. Move right to add, left to take away.", "3": "Here is where the move lands." },
    "ops-brackets": { "1": "Look at the part inside the brackets.", "2": "Do the brackets first. Then the rest.", "3": "Here is the sum worked out, then the answer." },
    "ops-order": { "1": "Look at the times and divide parts.", "2": "Do the times and divide first. Then add and take away.", "3": "Here is each part worked out, then the answer." },
    "ops-order-word": { "1": "Look at the loose counters and the boxes.", "2": "Work out the boxes first. Then add the loose ones.", "3": "Here are the boxes and the loose ones, counted." },
    "unk-letter": { "1": "Look at the letter and the sum.", "2": "Do the opposite step to free the letter.", "3": "Here is the number the letter stands for." },
    "unk-letter-word": { "1": "Look at how many are in each pack.", "2": "Think which times fact gives the total.", "3": "Here is the number of packs, worked out." }
  }
};
