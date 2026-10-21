/*
 * numberWords (L2): plain words for numbers, for speech and for text read aloud (Step 11, D11-10). Pure: no DOM, no storage.
 * Speech never holds a maths symbol, so every band-3 question speaks its numbers through these functions. Numbers are grouped in
 * thousands and millions (never lakhs or crores); no "and" inside a number; a space (not a hyphen) joins tens and ones.
 *   integer(n)            a whole number, |n| below 1,000,000,000,000: 7 'seven', 40250 'forty thousand two hundred fifty', -5 'minus five'
 *   decimal(x)            a decimal as a string or number: '2.75' 'two point seven five', '0.5' 'zero point five', '12.05' 'twelve point zero five'
 *                         (digits after the point are read one by one, a trailing zero of a string is kept)
 *   percent(x)            integer or decimal, then 'percent': 25 'twenty five percent', '12.5' 'twelve point five percent'
 *   fraction(num, den)    '1/2' 'one half', '3/4' 'three quarters', '1/10' 'one tenth', '7/12' 'seven twelfths', 5/4 'five quarters',
 *                         den 1 is a whole number; any whole top number over a bottom number up to 1,000 ('1/13' 'one thirteenth', '3/100' 'three hundredths')
 *   ordinal(n)            1 'first' ... 12 'twelfth', 20 'twentieth', 100 'one hundredth' (a positive whole number)
 *   letter(l)             one letter a to z (either case): 'the number n' (a letter in an equation is a number nobody has told us yet)
 * A value outside these ranges throws a TypeError, so a bad call fails loudly instead of speaking nonsense.
 */
(function () {
  'use strict';
  NBA.define('numberWords', [], () => {
    const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen',
      'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const GROUPS = ['', 'thousand', 'million', 'billion'];
    const IRREGULAR = { one: 'first', two: 'second', three: 'third', five: 'fifth', eight: 'eighth', nine: 'ninth', twelve: 'twelfth' };
    const NAMED = { 2: ['half', 'halves'], 4: ['quarter', 'quarters'] };
    const LIMIT = 1e12;

    const bad = (what, x) => new TypeError('numberWords.' + what + ': cannot read ' + String(x));
    const isWhole = (n) => typeof n === 'number' && Number.isInteger(n);

    function below1000(n) { // 1..999
      const parts = [];
      if (n >= 100) { parts.push(ONES[Math.floor(n / 100)], 'hundred'); n %= 100; }
      if (n >= 20) { parts.push(TENS[Math.floor(n / 10)]); n %= 10; }
      if (n > 0) parts.push(ONES[n]);
      return parts.join(' ');
    }
    function integer(n) {
      if (!isWhole(n) || Math.abs(n) >= LIMIT) throw bad('integer', n);
      if (n === 0) return 'zero';
      const out = [];
      let rest = Math.abs(n), g = 0;
      const chunks = [];
      while (rest > 0) { chunks.push(rest % 1000); rest = Math.floor(rest / 1000); }
      for (g = chunks.length - 1; g >= 0; g--) {
        if (chunks[g] > 0) out.push(below1000(chunks[g]) + (GROUPS[g] ? ' ' + GROUPS[g] : ''));
      }
      return (n < 0 ? 'minus ' : '') + out.join(' ');
    }
    function ordinal(n) {
      if (!isWhole(n) || n < 1 || n >= LIMIT) throw bad('ordinal', n);
      const words = integer(n).split(' ');
      const last = words.pop();
      let o;
      if (Object.prototype.hasOwnProperty.call(IRREGULAR, last)) o = IRREGULAR[last];
      else if (/y$/.test(last)) o = last.slice(0, -1) + 'ieth';
      else o = last + 'th';
      return words.concat([o]).join(' ');
    }
    function decimal(x) {
      const s = typeof x === 'number' && Number.isFinite(x) ? String(x) : x;
      const m = typeof s === 'string' ? /^(-?)(\d{1,12})(?:\.(\d{1,12}))?$/.exec(s) : null;
      if (!m) throw bad('decimal', x);
      const whole = integer(Number(m[2]));
      const sign = m[1] && (Number(m[2]) > 0 || /[1-9]/.test(m[3] || '')) ? 'minus ' : '';
      if (m[3] === undefined) return sign + whole;
      return sign + whole + ' point ' + m[3].split('').map((d) => ONES[Number(d)]).join(' ');
    }
    function percent(x) { return decimal(x) + ' percent'; }
    function fraction(num, den) {
      if (!isWhole(num) || !isWhole(den) || num < 0 || den < 1 || den > 1000) throw bad('fraction', num + '/' + den);
      if (den === 1) return integer(num);
      const plural = num !== 1;
      const named = Object.prototype.hasOwnProperty.call(NAMED, den) ? NAMED[den] : null;
      let bottom = named ? named[plural ? 1 : 0] : ordinal(den) + (plural ? 's' : '');
      if (den === 100 || den === 1000) bottom = bottom.replace(/^one /, ''); // 'hundredth', not 'one hundredth'
      return integer(num) + ' ' + bottom;
    }
    function letter(l) {
      if (typeof l !== 'string' || !/^[a-zA-Z]$/.test(l)) throw bad('letter', l);
      return 'the number ' + l.toLowerCase();
    }

    return { integer, decimal, percent, fraction, ordinal, letter };
  });
}());
