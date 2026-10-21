/*
 * At-home activities (JSON-compatible data only; brief O10). Exactly three offline activities for every
 * concept in NBA.data.concepts.list, shown on the Grown-ups child page. Household items only, no screens and
 * nothing to buy. Any activity that uses a small item (smallItems) says "with an adult watching".
 * The library is a design hypothesis (no research source): it is not a tested teaching method. The band 3 (ages
 * 10 to 12) concept blocks live in the sibling data/home-activities-band3.js (split out for the 400-line limit);
 * core/catalog.js merges the two bySkill maps into HOME_ACTIVITIES, which the Grown-ups page and the tests read.
 *   evidence    the evidence label
 *   smallItems  items a young child could choke on
 *   household   every item an activity may name
 *   bySkill     conceptId -> [{ id, name, text, items }] x 3
 */
NBA.data.homeActivities = {
  "evidence": "design hypothesis (no research source)",
  "smallItems": ["buttons", "pasta", "coins", "dried beans"],
  "household": ["spoons", "socks", "buttons", "pasta", "coins", "egg boxes", "paper", "cups", "toy cars", "shoes", "pegs", "a pencil"],
  "bySkill": {
    "add.combine": [
      { "id": "home-add-combine-1", "name": "Two piles of spoons", "text": "Put 3 spoons in one pile and 2 in another. Push the piles together and count all the spoons.", "items": ["spoons"] },
      { "id": "home-add-combine-2", "name": "More socks", "text": "Lay out 4 socks, then 3 more socks. Ask how many socks there are now, and count them together.", "items": ["socks"] },
      { "id": "home-add-combine-3", "name": "Car park", "text": "Put 2 toy cars on one sheet of paper and 3 on another. Move them onto one sheet and count them all.", "items": ["toy cars", "paper"] }
    ],
    "add.count-on": [
      { "id": "home-add-count-on-1", "name": "Peg line", "text": "Put 5 pegs in a row and say five. Add 3 more pegs one at a time, counting on: six, seven, eight.", "items": ["pegs"] },
      { "id": "home-add-count-on-2", "name": "Spoons in a cup", "text": "Put 7 spoons in a cup and say seven. Add 2 more spoons, counting on from seven.", "items": ["spoons", "cups"] },
      { "id": "home-add-count-on-3", "name": "Dot hops", "text": "Draw 10 dots in a line on paper. Start on dot 4 and hop the pencil on 3 dots, counting on.", "items": ["paper", "a pencil"] }
    ],
    "add.within-10": [
      { "id": "home-add-within-10-1", "name": "Egg box ten", "text": "With an adult watching, put buttons in 4 cups of an egg box, then in 3 more. How many cups have a button?", "items": ["egg boxes", "buttons"] },
      { "id": "home-add-within-10-2", "name": "Make ten with socks", "text": "Lay out 6 socks. How many more socks make 10? Add them one by one to check.", "items": ["socks"] },
      { "id": "home-add-within-10-3", "name": "Write and check", "text": "Write two numbers that make 8 on paper. Check the sum with pegs.", "items": ["paper", "a pencil", "pegs"] }
    ],
    "add.within-20": [
      { "id": "home-add-within-20-1", "name": "Pasta in two cups", "text": "With an adult watching, put 10 pasta shapes in one cup and 5 in another. Count on from 10 to find how many in all.", "items": ["pasta", "cups"] },
      { "id": "home-add-within-20-2", "name": "Ten cars first", "text": "Line up 8 toy cars and 7 more. Make a group of 10 first, then count the cars left over.", "items": ["toy cars"] },
      { "id": "home-add-within-20-3", "name": "Two egg boxes", "text": "Use two egg boxes as a frame of 20. Put pegs in 9 spaces, then in 6 more. How many spaces are full?", "items": ["egg boxes", "pegs"] }
    ],
    "sub.take-away": [
      { "id": "home-sub-take-away-1", "name": "Spoons away", "text": "Put 7 spoons on the table. Take 2 away and put them in a drawer. How many are left?", "items": ["spoons"] },
      { "id": "home-sub-take-away-2", "name": "Sock line", "text": "Peg 8 socks on a line. Take 3 socks off. How many still hang there?", "items": ["socks", "pegs"] },
      { "id": "home-sub-take-away-3", "name": "Cars drive off", "text": "Park 6 toy cars on a sheet of paper. Drive 4 of them away. How many stay?", "items": ["toy cars", "paper"] }
    ],
    "sub.difference": [
      { "id": "home-sub-difference-1", "name": "Two peg rows", "text": "Make a row of 7 pegs and a row of 4 pegs side by side. How many more pegs are in the long row?", "items": ["pegs"] },
      { "id": "home-sub-difference-2", "name": "Shoes and socks", "text": "Put 5 shoes in one line and 8 socks in another. Match them up. How many socks have no shoe?", "items": ["shoes", "socks"] },
      { "id": "home-sub-difference-3", "name": "Join the dots", "text": "Draw a row of 9 dots and a row of 6 dots on paper. Join pairs with a pencil line. How many dots are not joined?", "items": ["paper", "a pencil"] }
    ],
    "sub.within-10": [
      { "id": "home-sub-within-10-1", "name": "Coins in a box", "text": "With an adult watching, put 10 coins in an egg box. Take out 4. How many are still in the box?", "items": ["coins", "egg boxes"] },
      { "id": "home-sub-within-10-2", "name": "Cup stack", "text": "Stack 9 cups. Take 3 off the top. How many cups are in the stack now?", "items": ["cups"] },
      { "id": "home-sub-within-10-3", "name": "Hidden spoons", "text": "Hold 8 spoons. Hide 5 behind your back. How many spoons can your child still see?", "items": ["spoons"] }
    ],
    "sub.within-20": [
      { "id": "home-sub-within-20-1", "name": "Pasta rows", "text": "With an adult watching, lay 15 pasta shapes in rows of 5. Take away 7. Count the pasta that is left.", "items": ["pasta"] },
      { "id": "home-sub-within-20-2", "name": "Pegs on a cup", "text": "Clip 12 pegs around the rim of a cup. Take off 5. How many pegs are still on?", "items": ["pegs", "cups"] },
      { "id": "home-sub-within-20-3", "name": "Cross them out", "text": "Draw 18 dots on paper. Cross out 9 with a pencil. Count the dots that are left.", "items": ["paper", "a pencil"] }
    ],
    "addsub.mixed": [
      { "id": "home-addsub-mixed-1", "name": "Give and get back", "text": "With an adult watching, hold 10 coins. Give 3 to a toy, then get 2 back. How many coins now?", "items": ["coins"] },
      { "id": "home-addsub-mixed-2", "name": "Sock pile", "text": "Start with 6 socks in a pile. Add 4 socks, then take 3 away. Say each step out loud.", "items": ["socks"] },
      { "id": "home-addsub-mixed-3", "name": "Car story", "text": "Tell a story with toy cars: 5 cars park, 2 more come, then 4 drive away. How many stay?", "items": ["toy cars"] }
    ],
    "rep.transition": [
      { "id": "home-rep-transition-1", "name": "Spoons, picture, numbers", "text": "Make 4 and 3 with spoons. Then draw the spoons on paper. Then write the numbers and the answer.", "items": ["spoons", "paper", "a pencil"] },
      { "id": "home-rep-transition-2", "name": "Numbers to pegs", "text": "Write 6 take away 2 on paper. Show it with pegs, then say the answer.", "items": ["paper", "a pencil", "pegs"] },
      { "id": "home-rep-transition-3", "name": "Paper number line", "text": "Draw a number line from 0 to 10 on paper. Show 3 and 4 more with hops of a toy car.", "items": ["paper", "a pencil", "toy cars"] }
    ],
    "num.count": [
      { "id": "home-num-count-1", "name": "Shoes by the door", "text": "Count the shoes by the door. Touch each shoe as you say its number.", "items": ["shoes"] },
      { "id": "home-num-count-2", "name": "Cup tower", "text": "Choose a number, then build a stack of that many cups. Count the stack to check.", "items": ["cups"] },
      { "id": "home-num-count-3", "name": "One in each", "text": "With an adult watching, put one button in each cup of an egg box and count as you go.", "items": ["buttons", "egg boxes"] }
    ],
    "num.compare": [
      { "id": "home-num-compare-1", "name": "Taller stack", "text": "Make a stack of 5 cups and a stack of 3 cups. Which stack is taller? Which has more cups?", "items": ["cups"] },
      { "id": "home-num-compare-2", "name": "Spoon rows", "text": "Make two rows of spoons. Match them up one to one. Which row has more?", "items": ["spoons"] },
      { "id": "home-num-compare-3", "name": "Two peg piles", "text": "Make two piles of pegs. Line each pile up in a row to see which pile has more.", "items": ["pegs"] }
    ],
    "mul.groups": [
      { "id": "home-mul-groups-1", "name": "Spoon piles", "text": "Make 3 piles with 2 spoons in each pile. How many spoons are there in all?", "items": ["spoons"] },
      { "id": "home-mul-groups-2", "name": "Shoes in pairs", "text": "Count shoes in pairs: 2, 4, 6, 8. How many pairs did you count?", "items": ["shoes"] },
      { "id": "home-mul-groups-3", "name": "Pasta in cups", "text": "With an adult watching, put 4 pasta shapes in each of 3 cups. How many pasta shapes in all?", "items": ["pasta", "cups"] }
    ],
    "div.share": [
      { "id": "home-div-share-1", "name": "Share the spoons", "text": "Share 8 spoons fairly between 2 cups, one at a time. How many spoons in each cup?", "items": ["spoons", "cups"] },
      { "id": "home-div-share-2", "name": "Parking spaces", "text": "Share 6 toy cars fairly between 3 sheets of paper. How many cars on each sheet?", "items": ["toy cars", "paper"] },
      { "id": "home-div-share-3", "name": "Pegs on socks", "text": "Share 12 pegs fairly onto 4 socks. Is it fair? How many pegs on each sock?", "items": ["pegs", "socks"] }
    ],
    "count.rote-20": [
      { "id": "home-count-rote-20-1", "name": "Peg count", "text": "Clip pegs on a cup one at a time, saying each number up to 20. Then start at 12 and say the next one.", "items": ["pegs", "cups"] },
      { "id": "home-count-rote-20-2", "name": "Spoon steps", "text": "Lay spoons in a long line. Walk your fingers along, counting on from a number your child picks.", "items": ["spoons"] },
      { "id": "home-count-rote-20-3", "name": "Dot ladder", "text": "Draw 20 dots up the paper like a ladder. Point to each dot and say the next number.", "items": ["paper", "a pencil"] }
    ],
    "count.back-20": [
      { "id": "home-count-back-20-1", "name": "Cups come down", "text": "Stack cups and take one off at a time, counting back out loud until none are left.", "items": ["cups"] },
      { "id": "home-count-back-20-2", "name": "Pegs off the line", "text": "Peg socks on a line, then take them off one at a time, counting back as each one comes down.", "items": ["pegs", "socks"] },
      { "id": "home-count-back-20-3", "name": "Backwards line", "text": "Write a row of numbers to 20 on paper. Point and say the one just before a number your child picks.", "items": ["paper", "a pencil"] }
    ],
    "count.rote-100": [
      { "id": "home-count-rote-100-1", "name": "Spoon tens", "text": "Make piles of ten spoons. Count each pile, then keep counting on past thirty and forty.", "items": ["spoons"] },
      { "id": "home-count-rote-100-2", "name": "After which?", "text": "Say a number like forty-nine and ask your child what comes just after it. Use pegs to check.", "items": ["pegs"] },
      { "id": "home-count-rote-100-3", "name": "Number path", "text": "Write a path of numbers to one hundred on paper. Walk a toy car along it, saying each number.", "items": ["paper", "a pencil", "toy cars"] }
    ],
    "count.tens-100": [
      { "id": "home-count-tens-100-1", "name": "Cups of ten", "text": "Make groups of ten with cups. Count by tens: ten, twenty, thirty. What comes after thirty?", "items": ["cups"] },
      { "id": "home-count-tens-100-2", "name": "Ten in each", "text": "With an adult watching, put ten coins in each cup. Count the cups by tens up to a hundred.", "items": ["coins", "cups"] },
      { "id": "home-count-tens-100-3", "name": "Tens on paper", "text": "Write ten, twenty, thirty up to a hundred on paper. Point and say the next ten each time.", "items": ["paper", "a pencil"] }
    ],
    "sense.numerals-10": [
      { "id": "home-sense-numerals-10-1", "name": "Find the number", "text": "Write the numerals 0 to 10 on paper. Say a number and ask your child to point to the right numeral.", "items": ["paper", "a pencil"] },
      { "id": "home-sense-numerals-10-2", "name": "Match the pile", "text": "Write a numeral on paper, then make a pile of that many spoons beside it to match.", "items": ["paper", "a pencil", "spoons"] },
      { "id": "home-sense-numerals-10-3", "name": "Missing numeral", "text": "Write 3, 4, then a gap, then 6 on paper. Ask your child which numeral is missing.", "items": ["paper", "a pencil"] }
    ],
    "sense.match-sort": [
      { "id": "home-sense-match-sort-1", "name": "Sort the socks", "text": "Mix up a basket of socks. Sort them into groups that match, then say how you sorted them.", "items": ["socks"] },
      { "id": "home-sense-match-sort-2", "name": "Spoons and cups", "text": "Put spoons in one group and cups in another. Count each group. Which group has more?", "items": ["spoons", "cups"] },
      { "id": "home-sense-match-sort-3", "name": "A pair for each", "text": "Line up shoes. Match a sock to each shoe one to one. Are there more shoes or more socks?", "items": ["shoes", "socks"] }
    ],
    "sense.subitize-3": [
      { "id": "home-sense-subitize-3-1", "name": "Quick spoons", "text": "Drop 1, 2 or 3 spoons on the table. Ask how many before your child counts. Then count to check.", "items": ["spoons"] },
      { "id": "home-sense-subitize-3-2", "name": "Dot cards", "text": "Draw cards with 1, 2 or 3 dots on paper. Show one and ask how many, then show the next card.", "items": ["paper", "a pencil"] },
      { "id": "home-sense-subitize-3-3", "name": "Peg flash", "text": "Hold up 1, 2 or 3 pegs in your hand. Ask how many at a glance, then line them up to check.", "items": ["pegs"] }
    ],
    "sense.subitize-5": [
      { "id": "home-sense-subitize-5-1", "name": "Dice faces", "text": "Draw dice faces for 1 to 6 dots on paper. Point to a face and ask how many dots are on it.", "items": ["paper", "a pencil"] },
      { "id": "home-sense-subitize-5-2", "name": "Spoon flash", "text": "Lay out 4 or 5 spoons in a dice pattern. Ask how many at a glance, then count them to check.", "items": ["spoons"] },
      { "id": "home-sense-subitize-5-3", "name": "Cup groups", "text": "Put up to 5 cups in a group. Ask how many at a glance, then count the cups together to check.", "items": ["cups"] }
    ],
    "sense.part-whole-10": [
      { "id": "home-sense-part-whole-10-1", "name": "Two hands", "text": "Hold 6 spoons. Put some in each hand. Ask how many in one hand, then how many are hiding in the other.", "items": ["spoons"] },
      { "id": "home-sense-part-whole-10-2", "name": "Split the socks", "text": "Take 8 socks and split them into two piles. Count one pile. How many are in the other pile?", "items": ["socks"] },
      { "id": "home-sense-part-whole-10-3", "name": "Cup cover", "text": "Lay out 7 pegs. Cover some with a cup. Count the ones you can see. How many are under the cup?", "items": ["pegs", "cups"] }
    ],
    "sense.ten-frame": [
      { "id": "home-sense-ten-frame-1", "name": "Egg box frame", "text": "With an adult watching, use ten holes of an egg box as a frame. Put in some buttons. How many holes are empty?", "items": ["egg boxes", "buttons"] },
      { "id": "home-sense-ten-frame-2", "name": "Two rows of five", "text": "Draw two rows of five boxes on paper. Fill some from the top left with pegs. How many pegs did you put in?", "items": ["paper", "a pencil", "pegs"] },
      { "id": "home-sense-ten-frame-3", "name": "Fill to ten", "text": "Make a frame of ten boxes. Put in 6 spoons. How many more spoons fill the frame to ten?", "items": ["paper", "a pencil", "spoons"] }
    ],
    "sense.line-10": [
      { "id": "home-sense-line-10-1", "name": "Number line on paper", "text": "Write 0 to 10 in a row on paper. Point to a number with a peg and ask your child which number it is.", "items": ["paper", "a pencil", "pegs"] },
      { "id": "home-sense-line-10-2", "name": "Toy on the line", "text": "Lay spoons in a line for 0 to 10. Stand a toy on one spoon and ask what number it is standing on.", "items": ["spoons", "toy cars"] },
      { "id": "home-sense-line-10-3", "name": "Hidden number", "text": "Write 0 to 10 and cover one number with a cup. Ask your child which number is hiding under the cup.", "items": ["paper", "a pencil", "cups"] }
    ],
    "sense.even-odd": [
      { "id": "home-sense-even-odd-1", "name": "Pair the socks", "text": "Take a handful of socks and make pairs. If one sock is left over the number is odd, if none is left it is even.", "items": ["socks"] },
      { "id": "home-sense-even-odd-2", "name": "Share with a toy", "text": "Share some spoons fairly between two toys. If they share with none left over the number is even.", "items": ["spoons", "toy cars"] },
      { "id": "home-sense-even-odd-3", "name": "Two by two", "text": "Lay pegs in twos. Say even when every peg has a partner and odd when one peg is left alone.", "items": ["pegs"] }
    ],
    "add.make-5": [
      { "id": "home-add-make-5-1", "name": "Five spoons, two groups", "text": "Lay out 5 spoons. Move some to one side. How many here and how many there? They always make 5.", "items": ["spoons"] },
      { "id": "home-add-make-5-2", "name": "Split five spoons", "text": "Count out 5 spoons. Put some in each hand. Count one hand, then say how many are in the other.", "items": ["spoons"] },
      { "id": "home-add-make-5-3", "name": "Partners to five", "text": "Lay out 5 pegs. Hide some under a cup. Count the ones left and say how many are hiding.", "items": ["pegs", "cups"] }
    ],
    "add.make-10": [
      { "id": "home-add-make-10-1", "name": "Ten in the box", "text": "With an adult watching, put some buttons in a row of ten egg-box holes. How many more fill it to ten?", "items": ["egg boxes", "buttons"] },
      { "id": "home-add-make-10-2", "name": "Ten pegs together", "text": "Clip some pegs on a cup. How many more pegs make ten? Add them one by one to check.", "items": ["pegs", "cups"] },
      { "id": "home-add-make-10-3", "name": "Fill the frame to ten", "text": "Draw a row of ten boxes on paper. Put pegs in some. How many more pegs make ten?", "items": ["paper", "a pencil", "pegs"] }
    ],
    "place.teen-numbers": [
      { "id": "home-place-teen-numbers-1", "name": "A ten and some more", "text": "With an adult watching, make a group of ten buttons, then a few loose ones. How many ones are with the ten?", "items": ["buttons"] },
      { "id": "home-place-teen-numbers-2", "name": "Bundle of ten", "text": "Bundle ten spoons together. Add some loose spoons. Say the teen number as a ten and the loose ones.", "items": ["spoons"] },
      { "id": "home-place-teen-numbers-3", "name": "Ten cup and ones", "text": "Fill a cup with ten pegs. Put a few more beside it. How many ones are next to the full ten?", "items": ["pegs", "cups"] }
    ],
    "frac.halves-quarters": [
      { "id": "home-frac-halves-quarters-1", "name": "Half the spoons", "text": "Lay out 6 spoons. Share them fairly between two plates. How many spoons is half of six?", "items": ["spoons"] },
      { "id": "home-frac-halves-quarters-2", "name": "Four fair piles", "text": "Deal 8 socks into four equal piles, one at a time. How many socks is a quarter of eight?", "items": ["socks"] },
      { "id": "home-frac-halves-quarters-3", "name": "Fold the paper", "text": "Fold a sheet of paper into two equal parts. Each part is a half. Fold again for quarters.", "items": ["paper"] }
    ],
    "count.skip-2-5-10": [
      { "id": "home-count-skip-2-5-10-1", "name": "Pairs of socks", "text": "Line up socks in pairs. Count them two at a time: two, four, six. How far can you go?", "items": ["socks"] },
      { "id": "home-count-skip-2-5-10-2", "name": "Spoons by fives", "text": "Make little piles of five spoons. Count them five at a time: five, ten, fifteen.", "items": ["spoons"] },
      { "id": "home-count-skip-2-5-10-3", "name": "Count pegs by tens", "text": "Put ten pegs in each cup. Count the pegs ten at a time as you fill each cup.", "items": ["cups", "pegs"] }
    ],
    "place.two-digit": [
      { "id": "home-place-two-digit-1", "name": "Bundles of ten", "text": "Make bundles of ten spoons and some loose ones. Say how many tens and how many ones you have.", "items": ["spoons"] },
      { "id": "home-place-two-digit-2", "name": "Cups and loose pegs", "text": "Fill cups with ten pegs each, then count loose pegs. Say the number as tens and ones.", "items": ["cups", "pegs"] },
      { "id": "home-place-two-digit-3", "name": "Tens of socks", "text": "Lay out 3 tens of socks and 4 loose socks. Ask what number that makes.", "items": ["socks"] }
    ],
    "place.regroup": [
      { "id": "home-place-regroup-1", "name": "Trade ten for a bundle", "text": "Count out 14 spoons. Bundle ten of them together. How many loose spoons are left over?", "items": ["spoons"] },
      { "id": "home-place-regroup-2", "name": "Open a bundle", "text": "Take a bundle of ten pegs and 5 loose pegs. Open the bundle. How many loose pegs now?", "items": ["pegs"] },
      { "id": "home-place-regroup-3", "name": "Make a new ten", "text": "Put 9 socks with 6 more. Bundle ten of them. How many loose socks are left?", "items": ["socks"] }
    ],
    "place.hundreds": [
      { "id": "home-place-hundreds-1", "name": "Ten tens make a hundred", "text": "Fill ten cups with ten pegs each. Count the cups. Ten tens make one hundred.", "items": ["cups", "pegs"] },
      { "id": "home-place-hundreds-2", "name": "Hundreds, tens and ones", "text": "Lay out some full cups of ten, some loose pegs. Say how many tens and ones there are.", "items": ["cups", "pegs"] },
      { "id": "home-place-hundreds-3", "name": "Say the number", "text": "Set out 4 bundles of ten socks and 3 loose socks. Ask what number that makes.", "items": ["socks"] }
    ],
    "place.compare-order": [
      { "id": "home-place-compare-order-1", "name": "Which pile is bigger?", "text": "Make two piles of spoons. Count each one. Ask which pile has more and which has fewer.", "items": ["spoons"] },
      { "id": "home-place-compare-order-2", "name": "Order the cups", "text": "Put different numbers of pegs in three cups. Line the cups up from fewest to most.", "items": ["cups", "pegs"] },
      { "id": "home-place-compare-order-3", "name": "Ten more", "text": "Lay out some socks and count them. Add ten more socks. Say the new number together.", "items": ["socks"] }
    ],
    "place.round": [
      { "id": "home-place-round-1", "name": "Nearer ten", "text": "Count out 23 pegs. Is that nearer to twenty or to thirty? Line them up to see.", "items": ["pegs"] },
      { "id": "home-place-round-2", "name": "About how many?", "text": "Scoop up a handful of spoons and count them. Say about how many, to the nearest ten.", "items": ["spoons"] },
      { "id": "home-place-round-3", "name": "Round the socks", "text": "Count a pile of socks. Round the number to the nearest ten. Is it nearer up or down?", "items": ["socks"] }
    ],
    "count.to-1000": [
      { "id": "home-count-to-1000-1", "name": "Count on by ones", "text": "Start at a number like 98 and count on by ones. Say the number after ninety-nine.", "items": ["a pencil"] },
      { "id": "home-count-to-1000-2", "name": "Count by tens", "text": "Fill cups with ten pegs. Count the pegs by tens: ten, twenty, thirty, and keep going.", "items": ["cups", "pegs"] },
      { "id": "home-count-to-1000-3", "name": "Count back by hundreds", "text": "Say the hundreds together, counting back: three hundred, two hundred, one hundred.", "items": ["a pencil"] }
    ],
    "add.facts-20": [
      { "id": "home-add-facts-20-1", "name": "Doubles with spoons", "text": "Lay out two equal rows of spoons, like 6 and 6. Count them all to find the double. Try other doubles too.", "items": ["spoons"] },
      { "id": "home-add-facts-20-2", "name": "Make ten first", "text": "Clip 9 pegs on a cup, then 4 more. Move one over to make ten first, then count on the rest.", "items": ["pegs", "cups"] },
      { "id": "home-add-facts-20-3", "name": "Missing partner", "text": "Write 8 and ? make 15 on paper. Count on from 8 to 15 to find the missing number.", "items": ["paper", "a pencil"] }
    ],
    "sub.facts-20": [
      { "id": "home-sub-facts-20-1", "name": "Think the adding fact", "text": "Ask what 15 take away 6 is. Say it as 6 and what make 15? Use pegs to count up and check.", "items": ["pegs"] },
      { "id": "home-sub-facts-20-2", "name": "Fact family socks", "text": "Make a pile of 6 socks and a pile of 9 socks. Together they are 15. Say the two take-away facts.", "items": ["socks"] },
      { "id": "home-sub-facts-20-3", "name": "Count back to check", "text": "Write 17 take away 9 on paper. Count back from 17 nine times, or count up from 9 to 17.", "items": ["paper", "a pencil"] }
    ],
    "add.two-digit": [
      { "id": "home-add-two-digit-1", "name": "Add the tens", "text": "Make 34 spoons as 3 tens and 4 ones. Add 2 more tens. Count the tens, then the ones.", "items": ["spoons"] },
      { "id": "home-add-two-digit-2", "name": "Add in cups", "text": "Show 32 as 3 cups of ten and 2 pegs, and 46 as 4 cups and 6 pegs. Add the tens, then the ones.", "items": ["cups", "pegs"] },
      { "id": "home-add-two-digit-3", "name": "Books on a shelf", "text": "Tell a story: a shelf has 41 socks and 36 more go on. Add the tens, then the ones, to find how many.", "items": ["socks"] }
    ],
    "add.two-digit-regroup": [
      { "id": "home-add-two-digit-regroup-1", "name": "Bundle a new ten", "text": "Show 27 pegs and add 5 more. The ones make more than ten, so bundle ten into a cup. How many now?", "items": ["pegs", "cups"] },
      { "id": "home-add-two-digit-regroup-2", "name": "Trade and count", "text": "Make 38 and 25 with cups of ten and loose spoons. Add the ones, trade ten of them for a cup, then count.", "items": ["cups", "spoons"] },
      { "id": "home-add-two-digit-regroup-3", "name": "Bus story", "text": "A bus has 47 socks and 36 more get on. Add the ones first, trade for a ten, then add the tens.", "items": ["socks"] }
    ],
    "add.three-digit": [
      { "id": "home-add-three-digit-1", "name": "Three places with cups", "text": "Use cups of ten for tens and single pegs for ones. Add 243 and 125 one place at a time.", "items": ["cups", "pegs"] },
      { "id": "home-add-three-digit-2", "name": "Add the hundreds", "text": "Write 240 add 300 on paper. Add just the hundreds together to find the answer.", "items": ["paper", "a pencil"] },
      { "id": "home-add-three-digit-3", "name": "Pens and pencils", "text": "A box holds 347 pegs. Put in 125 more. Add the ones, then tens, then hundreds, trading where needed.", "items": ["pegs", "paper"] }
    ],
    "sub.two-digit": [
      { "id": "home-sub-two-digit-1", "name": "Take the tens", "text": "Make 74 as 7 cups of ten pegs and 4 loose. Take away 3 tens. Count what is left.", "items": ["cups", "pegs"] },
      { "id": "home-sub-two-digit-2", "name": "Take tens and ones", "text": "Show 68 with spoons as 6 tens and 8 ones. Take away 35: take 3 tens, then 5 ones.", "items": ["spoons"] },
      { "id": "home-sub-two-digit-3", "name": "Eggs sold", "text": "A tray has 87 socks and 42 are taken away. Take the tens, then the ones, to find how many are left.", "items": ["socks"] }
    ],
    "sub.two-digit-regroup": [
      { "id": "home-sub-two-digit-regroup-1", "name": "Open a ten", "text": "Make 42 as 4 cups of ten pegs and 2 loose. To take 5 ones, open a cup for ten more ones first.", "items": ["cups", "pegs"] },
      { "id": "home-sub-two-digit-regroup-2", "name": "Trade then take", "text": "Show 52 with spoons. To take away 27, open a ten into ten ones first, then take the ones and tens.", "items": ["spoons"] },
      { "id": "home-sub-two-digit-regroup-3", "name": "Eggs story", "text": "A farmer has 63 socks and sells 28. Open a ten for more ones, then take the ones and the tens.", "items": ["socks"] }
    ],
    "sub.three-digit": [
      { "id": "home-sub-three-digit-1", "name": "Take the hundreds", "text": "Write 580 take away 300 on paper. Take just the hundreds away to find the answer.", "items": ["paper", "a pencil"] },
      { "id": "home-sub-three-digit-2", "name": "One place at a time", "text": "Use cups of ten and single pegs. Take 128 from 352, trading a ten for ten ones where needed.", "items": ["cups", "pegs"] },
      { "id": "home-sub-three-digit-3", "name": "Beads used", "text": "A bag holds 503 pegs and 258 are used. Trade across the zero, then take each place away.", "items": ["paper", "a pencil"] }
    ],
    "sub.stories-two-step": [
      { "id": "home-sub-stories-two-step-1", "name": "Birds on a wall", "text": "Act it out with spoons: 15 birds sit, 6 fly away, then 4 more land. How many birds now?", "items": ["spoons"] },
      { "id": "home-sub-stories-two-step-2", "name": "Two steps with pegs", "text": "Start with 12 pegs. Take some away, then add some. Do one step, then the next, and say the total.", "items": ["pegs"] },
      { "id": "home-sub-stories-two-step-3", "name": "Draw the bars", "text": "Draw a bar for the start on paper, then a bar for each step. Work out each step in order.", "items": ["paper", "a pencil"] }
    ],
    "mul.arrays": [
      { "id": "home-mul-arrays-1", "name": "Egg box rows", "text": "Lay spoons in an egg box in 2 rows of 3. How many spoons are there in all?", "items": ["spoons", "egg boxes"] },
      { "id": "home-mul-arrays-2", "name": "Shoes in rows", "text": "Put shoes in 3 rows with 2 shoes in each row. How many shoes is that all together?", "items": ["shoes"] },
      { "id": "home-mul-arrays-3", "name": "Add it again", "text": "Make 4 cups with 2 spoons in each. Add 2 again and again: 2, 4, 6, 8. How many in all?", "items": ["cups", "spoons"] }
    ],
    "mul.facts-2-5-10": [
      { "id": "home-mul-facts-2-5-10-1", "name": "Count socks in twos", "text": "Count socks in twos: 2, 4, 6, 8. For 5 pairs of socks, how many socks is that?", "items": ["socks"] },
      { "id": "home-mul-facts-2-5-10-2", "name": "Fives on fingers", "text": "Each hand has 5 fingers. Count by fives for 4 hands: 5, 10, 15, 20. What do you reach?", "items": ["paper"] },
      { "id": "home-mul-facts-2-5-10-3", "name": "Tens in cups", "text": "Put 10 spoons in each cup. For 3 cups, count by tens and say how many spoons in all.", "items": ["cups", "spoons"] }
    ],
    "mul.facts-3-4": [
      { "id": "home-mul-facts-3-4-1", "name": "Threes in cups", "text": "Put 3 spoons in each of 4 cups. Count by threes: 3, 6, 9, 12. How many spoons in all?", "items": ["cups", "spoons"] },
      { "id": "home-mul-facts-3-4-2", "name": "Legs on chairs", "text": "A chair has 4 legs. Count by fours for 3 chairs: 4, 8, 12. How many legs is that?", "items": ["paper"] },
      { "id": "home-mul-facts-3-4-3", "name": "Double the twos", "text": "Four of something is double two of it. For 4 lots of 6, first find 2 lots, then double it.", "items": ["spoons"] }
    ],
    "div.group": [
      { "id": "home-div-group-1", "name": "Spoons into cups", "text": "Put 12 spoons into cups, 3 spoons in each cup. How many cups did you fill?", "items": ["spoons", "cups"] },
      { "id": "home-div-group-2", "name": "Shoes in twos", "text": "Line up 10 shoes in pairs of 2. How many pairs of shoes did you make?", "items": ["shoes"] },
      { "id": "home-div-group-3", "name": "Pegs in groups", "text": "Take 18 pegs and make groups of 3. How many groups of pegs are there?", "items": ["pegs"] }
    ],
    "div.inverse": [
      { "id": "home-div-inverse-1", "name": "Undo the rows", "text": "Make 4 rows of 5 spoons, so 20 in all. Now share 20 into rows of 5. How many rows?", "items": ["spoons"] },
      { "id": "home-div-inverse-2", "name": "Think the times fact", "text": "To find 30 shared into fives, think: five times what makes 30? Say the answer.", "items": ["paper"] },
      { "id": "home-div-inverse-3", "name": "Packs of ten", "text": "Put 40 spoons into packs of 10 in cups. How many packs can you make?", "items": ["spoons", "cups"] }
    ],
    "frac.unit": [
      { "id": "home-frac-unit-1", "name": "Fold into thirds", "text": "Fold a strip of paper into three equal parts. Each part is one third. Fold a new strip into five equal fifths.", "items": ["paper"] },
      { "id": "home-frac-unit-2", "name": "Which part is bigger", "text": "Fold one paper strip into thirds and one into fifths. Which single part is bigger, a third or a fifth?", "items": ["paper"] },
      { "id": "home-frac-unit-3", "name": "Make a whole", "text": "Cut a paper strip into four equal parts. How many parts do you put back together to make one whole again?", "items": ["paper"] }
    ],
    "frac.non-unit": [
      { "id": "home-frac-non-unit-1", "name": "Three of four parts", "text": "Fold a paper strip into four equal parts and colour three of them. Say the fraction you coloured.", "items": ["paper"] },
      { "id": "home-frac-non-unit-2", "name": "Slices left", "text": "Draw a pizza cut into eight equal slices. Cross out five slices. How many slices are left?", "items": ["paper"] },
      { "id": "home-frac-non-unit-3", "name": "Beans in a part", "text": "Lay six dried beans in a row, with an adult watching. Two are the first part. How many beans are not in it?", "items": ["dried beans"] }
    ],
    "frac.on-line": [
      { "id": "home-frac-on-line-1", "name": "Hops to one", "text": "Draw a line from 0 to 1 and split it into four equal parts. Hop three parts from zero. Say the fraction.", "items": ["paper"] },
      { "id": "home-frac-on-line-2", "name": "Mark the fraction", "text": "Draw a line from 0 to 1 split into six equal parts. Mark the point five parts along. Say the fraction.", "items": ["paper"] },
      { "id": "home-frac-on-line-3", "name": "Further along", "text": "On a line split into fifths, mark two fifths and four fifths. Which mark is further along the line?", "items": ["paper"] }
    ],
    "frac.compare-wall": [
      { "id": "home-frac-compare-wall-1", "name": "Build a fraction wall", "text": "Cut paper strips the same length into halves, quarters and eighths. Stack them to make a fraction wall.", "items": ["paper"] },
      { "id": "home-frac-compare-wall-2", "name": "Cover one half", "text": "On your fraction wall, see how many eighths lie along one half. How many eighths cover a half?", "items": ["paper"] },
      { "id": "home-frac-compare-wall-3", "name": "Which is bigger", "text": "Use your fraction wall to line up three eighths and five eighths. Which one is bigger?", "items": ["paper"] }
    ],
    "neg.meaning": [
      { "id": "home-neg-meaning-1", "name": "Steps below zero", "text": "Draw a line on paper with zero in the middle. Mark steps below zero and say them with the word minus.", "items": ["paper", "a pencil"] },
      { "id": "home-neg-meaning-2", "name": "Lift floors", "text": "Talk about a lift that goes below the ground floor. Floor minus one is one floor below the ground floor.", "items": ["paper"] },
      { "id": "home-neg-meaning-3", "name": "Opposite numbers", "text": "Write 5 on paper, then its opposite, minus 5, the same distance below zero. Try other numbers too.", "items": ["paper", "a pencil"] }
    ],
    "ops.left-to-right": [
      { "id": "home-ops-left-to-right-1", "name": "Spoons step by step", "text": "Start with 3 spoons, add 4, then add 2 more. Do each step in order and say the running total.", "items": ["spoons"] },
      { "id": "home-ops-left-to-right-2", "name": "Add then take", "text": "Start with 12 pegs, take away 5, then add 4. Do each step in order, left to right.", "items": ["pegs"] },
      { "id": "home-ops-left-to-right-3", "name": "Write each step", "text": "Write 20 take away 8 plus 5 on paper. Work out each step on its own line, in order.", "items": ["paper", "a pencil"] }
    ],
    "unk.missing-number": [
      { "id": "home-unk-missing-number-1", "name": "Some spoons under a cup", "text": "Show 3 spoons, then hide some more under a cup so there are 7 in all. How many are hidden?", "items": ["spoons", "cups"] },
      { "id": "home-unk-missing-number-2", "name": "Box in the sum", "text": "Write 4 plus a box equals 9 on paper. Use pegs to find the number that goes in the box.", "items": ["paper", "a pencil", "pegs"] },
      { "id": "home-unk-missing-number-3", "name": "Box at the start", "text": "Write a box take away 5 equals 3 on paper. Count up with socks to find the missing number.", "items": ["paper", "a pencil", "socks"] }
    ],
    "unk.equals-balance": [
      { "id": "home-unk-equals-balance-1", "name": "Spoon see-saw", "text": "Put 4 spoons on one side of a ruler balanced on a pencil, and 4 on the other. Check both sides match.", "items": ["spoons", "a pencil"] },
      { "id": "home-unk-equals-balance-2", "name": "True or not", "text": "Write 5 plus 2 equals 7 on paper, and 5 plus 2 equals 8 on another. Say which is true.", "items": ["paper", "a pencil"] },
      { "id": "home-unk-equals-balance-3", "name": "Both sides equal", "text": "Write 6 plus 4 equals a box plus 3 on paper. Use pegs to find the number that makes both sides equal.", "items": ["paper", "a pencil", "pegs"] }
    ],
    "unk.missing-mul-div": [
      { "id": "home-unk-missing-mul-div-1", "name": "Hidden rows", "text": "Make 12 pegs into rows of 3. How many rows did it take? Write it as 3 times a box equals 12.", "items": ["pegs"] },
      { "id": "home-unk-missing-mul-div-2", "name": "Missing group size", "text": "Share 20 spoons into 5 equal cups. How many in each cup? Write it as a box times 5 equals 20.", "items": ["spoons", "cups"] },
      { "id": "home-unk-missing-mul-div-3", "name": "Sharing box", "text": "Write 20 shared by a box makes 4 each on paper. Use socks to find the missing number.", "items": ["paper", "a pencil", "socks"] }
    ]
  }
};
