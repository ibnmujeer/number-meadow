/*
 * At-home activities for the band 3 (ages 10 to 12) concepts (Step 11; JSON-compatible data only). Sibling of
 * data/home-activities.js, split out so that file stays under the 400-line limit. core/catalog.js merges this
 * bySkill map into the one it exposes (a concept id present in both files is a boot error), so every reader still
 * sees three offline activities for every concept in NBA.data.concepts.list. The shape of an entry, the household
 * item rules and the "design hypothesis" evidence note are documented in data/home-activities.js. Household items
 * only, no screens and nothing to buy; any small item (smallItems) says "with an adult watching". Sub-builds A to
 * F add the band-3 concept blocks here.
 */
NBA.data.homeActivitiesBand3 = {
  "bySkill": {
    "place.large": [
      { "id": "home-place-large-1", "name": "Say it in groups", "text": "Write 345678 on paper. Say it in groups of three digits: thousands first, then the rest.", "items": ["paper", "a pencil"] },
      { "id": "home-place-large-2", "name": "A zero holds a place", "text": "Write 305020 on paper. Point to each digit and say what that digit is worth.", "items": ["paper", "a pencil"] },
      { "id": "home-place-large-3", "name": "Just after", "text": "Write 99999 on paper. Say the number that comes right after it, then write it.", "items": ["paper", "a pencil"] }
    ],
    "mul.facts-6-9": [
      { "id": "home-mul-facts-6-9-1", "name": "Egg box sixes", "text": "Use an egg box with 6 cups. Count by sixes for 7 boxes and say each total as you go.", "items": ["egg boxes"] },
      { "id": "home-mul-facts-6-9-2", "name": "Nines on fingers", "text": "Hold up 10 fingers. For 9 times 4, fold down finger 4 and read the fingers either side.", "items": ["paper"] },
      { "id": "home-mul-facts-6-9-3", "name": "Cut the rows", "text": "Make 8 rows of 7 pegs. Count 5 rows, then the rest, and add the two parts.", "items": ["pegs"] }
    ],
    "add.large": [
      { "id": "home-add-large-1", "name": "Add in columns", "text": "Write 4687 and 2735 on paper, one under the other. Add column by column from the ones.", "items": ["paper", "a pencil"] },
      { "id": "home-add-large-2", "name": "Round to check", "text": "Round 4687 and 2735 to the nearest 1000 and add them. Is it close to the exact sum?", "items": ["paper", "a pencil"] },
      { "id": "home-add-large-3", "name": "Town story", "text": "A town has 125430 people and 48795 more move in. Work out how many live there now.", "items": ["paper", "a pencil"] }
    ],
    "sub.large": [
      { "id": "home-sub-large-1", "name": "Take away in columns", "text": "Write 7204 take away 3856 on paper in columns. Start with the ones and trade when you need to.", "items": ["paper", "a pencil"] },
      { "id": "home-sub-large-2", "name": "Across a zero", "text": "Write 500000 take away 123456 on paper. Trade from the next place that has something in it.", "items": ["paper", "a pencil"] },
      { "id": "home-sub-large-3", "name": "Seats left", "text": "A stadium has 82500 seats and 67845 tickets are sold. Work out how many seats are free.", "items": ["paper", "a pencil"] }
    ],
    "div.facts": [
      { "id": "home-div-facts-1", "name": "Fact family", "text": "Write 6 times 9 equals 54 on paper. Then write the two division facts that go with it.", "items": ["paper", "a pencil"] },
      { "id": "home-div-facts-2", "name": "Groups of four", "text": "Count out 24 pegs and put them in groups of 4. How many groups? Write the division fact.", "items": ["pegs", "paper"] },
      { "id": "home-div-facts-3", "name": "Check with rows", "text": "Make 6 rows of 8 pegs. Say the two times facts and the two division facts for it.", "items": ["pegs"] }
    ],
    "mul.factors-multiples": [
      { "id": "home-mul-factors-multiples-1", "name": "Equal rows", "text": "Make 12 pegs into rows of equal size. Find every way, like 2 rows of 6 and 3 rows of 4.", "items": ["pegs"] },
      { "id": "home-mul-factors-multiples-2", "name": "Count the multiples", "text": "Count by sevens on paper: 7, 14, 21 and on. Write the first ten multiples of 7.", "items": ["paper", "a pencil"] },
      { "id": "home-mul-factors-multiples-3", "name": "Is it a factor?", "text": "Is 7 a factor of 42? Make 42 pegs into rows of 7 and see if any are left over.", "items": ["pegs"] }
    ],
    "mul.two-by-one": [
      { "id": "home-mul-two-by-one-1", "name": "Split into tens and ones", "text": "Work out 24 times 6. First do 20 times 6, then 4 times 6, then add the two parts.", "items": ["paper", "a pencil"] },
      { "id": "home-mul-two-by-one-2", "name": "Draw the rectangle", "text": "Draw a rectangle 24 wide and 6 tall. Split the width into 20 and 4, and label each part.", "items": ["paper", "a pencil"] },
      { "id": "home-mul-two-by-one-3", "name": "Bags of beads", "text": "There are 6 bags with 124 beads in each. Work out how many beads there are in all.", "items": ["paper", "a pencil"] }
    ],
    "mul.two-by-two": [
      { "id": "home-mul-two-by-two-1", "name": "Times a ten", "text": "Work out 23 times 10, then 23 times 20. Say how the digits move each time.", "items": ["paper", "a pencil"] },
      { "id": "home-mul-two-by-two-2", "name": "Four parts", "text": "Draw a rectangle for 13 times 12. Split both sides into tens and ones to make four parts, then add them.", "items": ["paper", "a pencil"] },
      { "id": "home-mul-two-by-two-3", "name": "Rows of chairs", "text": "A hall has 24 rows with 35 chairs in each row. Work out how many chairs there are.", "items": ["paper", "a pencil"] }
    ],
    "div.remainder": [
      { "id": "home-div-remainder-1", "name": "Full bags", "text": "Put 17 pegs into bags of 5. How many full bags can you make, and how many pegs are left over?", "items": ["pegs"] },
      { "id": "home-div-remainder-2", "name": "What is left", "text": "Share 23 pegs into piles of 4. Say the number in each pile and the number left over.", "items": ["pegs"] },
      { "id": "home-div-remainder-3", "name": "Vans for a trip", "text": "40 children go on a trip. A van holds 6. Work out how many vans are needed, with no child left behind.", "items": ["paper", "a pencil"] }
    ],
    "div.multi-digit": [
      { "id": "home-div-multi-digit-1", "name": "Share the places", "text": "Work out 84 divided by 4. Share the tens first, then the ones, and write each step.", "items": ["paper", "a pencil"] },
      { "id": "home-div-multi-digit-2", "name": "Easy parts", "text": "Work out 96 divided by 6 by splitting it: 60 divided by 6, then 36 divided by 6, then add the answers.", "items": ["paper", "a pencil"] },
      { "id": "home-div-multi-digit-3", "name": "Eggs into boxes", "text": "A farmer packs 756 eggs into boxes of 6. Work out how many boxes the farmer fills.", "items": ["paper", "a pencil"] }
    ],
    "div.long": [
      { "id": "home-div-long-1", "name": "Divide by a ten", "text": "Work out 540 divided by 30, using the times tables to help.", "items": ["paper", "a pencil"] },
      { "id": "home-div-long-2", "name": "Guess and check", "text": "Work out 646 divided by 19. Guess how many times 19 fits, then check by multiplying.", "items": ["paper", "a pencil"] },
      { "id": "home-div-long-3", "name": "Buses for a trip", "text": "A bus carries 36 children. Work out how many full buses are filled by 500 children.", "items": ["paper", "a pencil"] }
    ],
    "frac.equivalent-compare": [
      { "id": "home-frac-equiv-1", "name": "Cut each part in two", "text": "Fold paper into 4 parts and shade 3. Fold it again into 8. How many eighths is that, so 3 quarters is how many eighths?", "items": ["paper"] },
      { "id": "home-frac-equiv-2", "name": "Same but smaller", "text": "Draw a bar in 8 parts and shade 6. Group the parts into fours. Write the shaded amount as a fraction with the smallest numbers you can.", "items": ["paper", "a pencil"] },
      { "id": "home-frac-equiv-3", "name": "Which fraction is bigger", "text": "Draw 2 thirds and 3 quarters on two bars the same length. Look at the shaded parts and say which fraction is bigger.", "items": ["paper", "a pencil"] }
    ],
    "frac.of-amount": [
      { "id": "home-frac-of-1", "name": "Share into the bottom parts", "text": "Put 12 buttons into 4 equal piles, with an adult watching. One pile is a quarter of 12. Count 3 piles to find 3 quarters of 12.", "items": ["buttons"] },
      { "id": "home-frac-of-2", "name": "A fifth of the pasta", "text": "Lay out 20 pieces of pasta in 5 equal rows, with an adult watching. One row is a fifth. How many is a fifth of 20?", "items": ["pasta"] },
      { "id": "home-frac-of-3", "name": "Two thirds", "text": "Share 15 coins into 3 equal piles, with an adult watching, then take 2 piles. How many is 2 thirds of 15?", "items": ["coins"] }
    ],
    "frac.add-same": [
      { "id": "home-frac-addsame-1", "name": "Shade and join", "text": "Draw a bar in 5 parts. Shade 1 part, then 3 more. How many fifths are shaded in all?", "items": ["paper", "a pencil"] },
      { "id": "home-frac-addsame-2", "name": "Take some away", "text": "Draw a bar in 8 parts and shade 5. Cross out 2. How many eighths are left?", "items": ["paper", "a pencil"] },
      { "id": "home-frac-addsame-3", "name": "More than one whole", "text": "Draw two bars in quarters. Shade 3 quarters on each. Count all the shaded quarters: how many quarters is that?", "items": ["paper", "a pencil"] }
    ],
    "frac.add-unlike": [
      { "id": "home-frac-addunlike-1", "name": "Make the parts match", "text": "Draw a half and a quarter on two bars the same length. Cut the half into quarters so both bars have the same size parts, then add them.", "items": ["paper", "a pencil"] },
      { "id": "home-frac-addunlike-2", "name": "Thirds and sixths", "text": "Draw 2 thirds and cut each third in two to make sixths. Take away 1 sixth. How many sixths are left?", "items": ["paper", "a pencil"] },
      { "id": "home-frac-addunlike-3", "name": "Line them up", "text": "Draw a quarter and an eighth on two equal bars. Change the quarter into eighths, then add the two amounts.", "items": ["paper", "a pencil"] }
    ],
    "frac.multiply": [
      { "id": "home-frac-mul-1", "name": "Half of a half", "text": "Fold a square of paper in half, then in half the other way. The part folded both ways is a half of a half. What fraction?", "items": ["paper"] },
      { "id": "home-frac-mul-2", "name": "Lots of a fraction", "text": "Draw 6 bars, each with 3 quarters shaded. Count all the shaded quarters. How many quarters is 6 lots of 3 quarters?", "items": ["paper", "a pencil"] },
      { "id": "home-frac-mul-3", "name": "A fraction of a fraction", "text": "Draw a square in 3 columns and 4 rows. Shade 2 columns and 3 rows. Count the cells shaded both ways out of all 12.", "items": ["paper", "a pencil"] }
    ],
    "dec.tenths": [
      { "id": "home-dec-tenths-1", "name": "Ten equal parts", "text": "Draw a bar and cut it into 10 equal parts. Shade 3 parts. That is 3 tenths, which we write 0.3.", "items": ["paper", "a pencil"] },
      { "id": "home-dec-tenths-2", "name": "Tenths on a line", "text": "Draw a line from 0 to 1 with 10 steps. Point to 0.7. How many tenths is that from zero?", "items": ["paper", "a pencil"] },
      { "id": "home-dec-tenths-3", "name": "Past one whole", "text": "Draw one full bar and 7 tenths of another. Write that number with a point. It is 1 and 7 tenths.", "items": ["paper", "a pencil"] }
    ],
    "dec.hundredths": [
      { "id": "home-dec-hundredths-1", "name": "A hundred squares", "text": "Draw a square in 10 rows of 10. Shade 1 small square. That is 1 hundredth, which we write 0.01.", "items": ["paper", "a pencil"] },
      { "id": "home-dec-hundredths-2", "name": "Tenths and hundredths", "text": "On a grid of 100, shade 3 whole columns and 4 more squares. Write the decimal for 3 tenths and 4 hundredths.", "items": ["paper", "a pencil"] },
      { "id": "home-dec-hundredths-3", "name": "Rupees and paise", "text": "A hundred paise make one rupee. Draw 275 paise as rupees. Write the amount with a point.", "items": ["paper", "a pencil"] }
    ],
    "dec.compare-order": [
      { "id": "home-dec-compare-1", "name": "Add a zero to compare", "text": "Write 0.7 and 0.35 one above the other. Add a zero to make 0.70. Now say which is bigger.", "items": ["paper", "a pencil"] },
      { "id": "home-dec-compare-2", "name": "Nearest to zero", "text": "Draw a line from 0 to 1. Mark 0.6, 0.06 and 0.66. Which one sits nearest to zero?", "items": ["paper", "a pencil"] },
      { "id": "home-dec-compare-3", "name": "Match the places", "text": "Write three decimals in a column with the points under each other. Put them in order from smallest.", "items": ["paper", "a pencil"] }
    ],
    "dec.add-sub": [
      { "id": "home-dec-addsub-1", "name": "Line up the points", "text": "Write 2.5 and 3.75 with the points under each other. Add a zero to 2.5, then add them place by place.", "items": ["paper", "a pencil"] },
      { "id": "home-dec-addsub-2", "name": "Across the point", "text": "Write 10 and 4.6 with the points lined up. Take 4.6 away from 10. What is left?", "items": ["paper", "a pencil"] },
      { "id": "home-dec-addsub-3", "name": "A ribbon story", "text": "A ribbon is 3.5 metres long. 1.25 metres are cut off. Draw it and work out how long the rest is.", "items": ["paper", "a pencil"] }
    ],
    "dec.multiply-divide": [
      { "id": "home-dec-muldiv-1", "name": "Tenths added again", "text": "Write 0.4 three times and add them up. That is 0.4 times 3. What do you get?", "items": ["paper", "a pencil"] },
      { "id": "home-dec-muldiv-2", "name": "Share it out", "text": "Draw 7.2 as 72 tenths. Share the 72 tenths into 4 equal piles. How many tenths in one pile?", "items": ["paper", "a pencil"] },
      { "id": "home-dec-muldiv-3", "name": "The price of pens", "text": "One pen costs 12.50 rupees. Work out the cost of 6 pens as if it were whole rupees, then put the point back.", "items": ["paper", "a pencil"] }
    ],
    "pct.meaning": [
      { "id": "home-pct-meaning-1", "name": "Out of a hundred", "text": "Draw a square in 10 rows of 10. Shade 35 small squares. That is 35 out of 100, which we write 35 percent.", "items": ["paper", "a pencil"] },
      { "id": "home-pct-meaning-2", "name": "A quarter is a percent", "text": "Draw a bar in 4 equal parts and shade 1. Cut each part so there are 100 parts. How many out of 100 are shaded?", "items": ["paper", "a pencil"] },
      { "id": "home-pct-meaning-3", "name": "Buttons out of fifty", "text": "Lay out 50 buttons, with an adult watching. Turn 25 of them face down. What percent of the buttons is face down?", "items": ["buttons"] }
    ],
    "pct.benchmarks": [
      { "id": "home-pct-bench-1", "name": "Half of the amount", "text": "To find 50 percent of 80, halve it. Share 80 into two equal piles on paper. How many in one pile?", "items": ["paper", "a pencil"] },
      { "id": "home-pct-bench-2", "name": "A quarter by halving twice", "text": "To find 25 percent of 60, halve it and halve again. Write each step on paper.", "items": ["paper", "a pencil"] },
      { "id": "home-pct-bench-3", "name": "A tenth by dividing by ten", "text": "To find 10 percent of 350, divide by ten. Say how the digits move, then write the answer.", "items": ["paper", "a pencil"] }
    ],
    "pct.fraction-decimal-link": [
      { "id": "home-pct-link-1", "name": "Three names for one amount", "text": "Draw a bar in 4 parts and shade 3. Write it as the fraction 3 quarters, as the decimal 0.75, and as 75 percent.", "items": ["paper", "a pencil"] },
      { "id": "home-pct-link-2", "name": "Decimal to percent", "text": "On a grid of 100, shade 0.6 of it (6 whole columns). How many out of 100 is that? Write it as a percent.", "items": ["paper", "a pencil"] },
      { "id": "home-pct-link-3", "name": "Percent back to a fraction", "text": "Write 45 percent as 45 over 100. Group the parts to make the numbers as small as you can.", "items": ["paper", "a pencil"] }
    ],
    "pct.of-amount": [
      { "id": "home-pct-of-1", "name": "One in a hundred first", "text": "To find 15 percent of 80, find 10 percent and 5 percent, then add them. Write each step.", "items": ["paper", "a pencil"] },
      { "id": "home-pct-of-2", "name": "A price taken off", "text": "A toy costs 400 rupees with 20 percent off. Work out 20 percent of 400, then take it off the price.", "items": ["paper", "a pencil"] },
      { "id": "home-pct-of-3", "name": "Marked beads in a bag", "text": "A bag has 250 beads and 40 percent are marked. Work out how many beads are marked.", "items": ["paper", "a pencil"] }
    ],
    "neg.compare-order": [
      { "id": "home-neg-compare-1", "name": "Colder on the line", "text": "Draw a line standing up with 0 in the middle and numbers down to minus 10. Mark minus 3 and minus 7. Which one is colder?", "items": ["paper", "a pencil"] },
      { "id": "home-neg-compare-2", "name": "Steps up to zero", "text": "On your line, start at minus 4 and count the steps up to 0. How many steps is it?", "items": ["paper", "a pencil"] },
      { "id": "home-neg-compare-3", "name": "Across zero", "text": "On your line, count the steps from minus 2 up to 3. Say the number as you cross zero.", "items": ["paper", "a pencil"] }
    ],
    "neg.add-sub": [
      { "id": "home-neg-addsub-1", "name": "Take more than you have", "text": "Draw a line through zero. Start at 4 and take away 9 by moving left. Where do you land?", "items": ["paper", "a pencil"] },
      { "id": "home-neg-addsub-2", "name": "Climb back up", "text": "On your line, start at minus 6 and add 10 by moving right. Where do you land?", "items": ["paper", "a pencil"] },
      { "id": "home-neg-addsub-3", "name": "A diver story", "text": "A diver is at minus 8 metres and swims up 5 metres. Draw it on a line and say where the diver is now.", "items": ["paper", "a pencil"] }
    ],
    "ops.brackets": [
      { "id": "home-ops-brackets-1", "name": "Do the bracket first", "text": "Write 20 take away bracket 6 plus 4 bracket. Work out the bracket first, then the rest.", "items": ["paper", "a pencil"] },
      { "id": "home-ops-brackets-2", "name": "Groups of a sum", "text": "Write bracket 3 plus 2 bracket times 4 with counters. Make 4 groups of the bracket amount and count them.", "items": ["pegs", "paper"] },
      { "id": "home-ops-brackets-3", "name": "With and without", "text": "Work out 8 take away 3 plus 2, then 8 take away bracket 3 plus 2 bracket. Say why the answers are not the same.", "items": ["paper", "a pencil"] }
    ],
    "ops.mul-before-add": [
      { "id": "home-ops-order-1", "name": "Loose and boxes", "text": "Put out 2 loose pegs and 3 boxes of 4 pegs, with an adult watching. Count the boxes first, then add the loose ones.", "items": ["pegs"] },
      { "id": "home-ops-order-2", "name": "Times before add", "text": "Write 3 plus 4 times 5. Do the times first, then add. What do you get?", "items": ["paper", "a pencil"] },
      { "id": "home-ops-order-3", "name": "Divide before take", "text": "Write 20 take away 12 divided by 4. Do the divide first, then take it away.", "items": ["paper", "a pencil"] }
    ],
    "unk.letter": [
      { "id": "home-unk-letter-1", "name": "A hidden number", "text": "Write n plus 8 equals 15. Cover a number with your thumb and find what n must be.", "items": ["paper", "a pencil"] },
      { "id": "home-unk-letter-2", "name": "Groups to find the letter", "text": "Write 4 times n equals 36. Think which times fact for 4 makes 36, with an adult watching, to find n.", "items": ["pegs", "paper"] },
      { "id": "home-unk-letter-3", "name": "Packs of pens", "text": "A pack holds 6 pens. p packs hold 30 pens. Work out how many packs p stands for.", "items": ["paper", "a pencil"] }
    ]
  }
};
