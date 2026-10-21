/*
 * Buddies (JSON-compatible data only; docs/STYLE.md section 8). The praise and gentle lines moved to feedback-lines.js.
 *   list          the 12 buddies in display order: id (stored, equal to the colour token name),
 *                 name (shown and spoken), colour (token name), feature (drawn by art.buddySVG)
 *   defaultBuddy  drawn while no buddy is picked, and for an unknown id (the first in the list)
 */
NBA.data.buddies = {
  "list": [
    { "id": "coral", "name": "Pip", "colour": "coral", "feature": "leaf" },
    { "id": "apricot", "name": "Bean", "colour": "apricot", "feature": "round-ears" },
    { "id": "sunflower", "name": "Dot", "colour": "sunflower", "feature": "antenna" },
    { "id": "moss", "name": "Fig", "colour": "moss", "feature": "curly-tail" },
    { "id": "teal", "name": "Nib", "colour": "teal", "feature": "side-fins" },
    { "id": "sky", "name": "Wisp", "colour": "sky", "feature": "floppy-ear" },
    { "id": "lavender", "name": "Clover", "colour": "lavender", "feature": "flower" },
    { "id": "plum", "name": "Twirl", "colour": "plum", "feature": "curl" },
    { "id": "rose", "name": "Dapple", "colour": "rose", "feature": "spots" },
    { "id": "sand", "name": "Biscuit", "colour": "sand", "feature": "stripes" },
    { "id": "slateblue", "name": "Puff", "colour": "slateblue", "feature": "pom-pom" },
    { "id": "mint", "name": "Tuft", "colour": "mint", "feature": "tuft" }
  ],
  "defaultBuddy": "coral"
};
