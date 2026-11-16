const TOP = 2 ** 30;
const BOTTOM = 2 ** 24;
const DISTANCE_FIELD = 64;
const SIGN_CONTEXT = 128;

/**
 * Decodes a table written by `scripts/generate-kanji-table.mjs` into 13-bit Kanji mode values plus
 * one, indexed by UTF-16 code unit. `0` marks code units that Kanji mode cannot encode. When
 * several values decode to the same code unit, the lowest one wins.
 *
 * The table is the output of an adaptive binary range coder in base-64 digits. The script
 * describes the format.
 */
export function decodeKanjiTable(table: string): Uint16Array {
  const values = new Uint16Array(0x10000);
  const probabilities = new Uint16Array(SIGN_CONTEXT + 1).fill(2048);
  let index = 0;
  let range = TOP;
  let code = 0;

  // Printable ASCII from ( to i without backslash and backtick.
  const digit = (): number => {
    const value = table.charCodeAt(index++) - 40;
    return value - +(value > 52) - +(value > 56);
  };
  const bit = (context: number): number => {
    const probability = probabilities[context]!;
    const bound = (range >>> 12) * probability;
    const value = +(code >= bound);
    if (value) {
      code -= bound;
      range -= bound;
      probabilities[context] = probability - (probability >> 5);
    } else {
      range = bound;
      probabilities[context] = probability + ((4096 - probability) >> 5);
    }
    while (range < BOTTOM) {
      range *= 64;
      code = code * 64 + digit();
    }
    return value;
  };
  // A 5-bit length tree, then the bits below the leading one.
  const number = (field: number): number => {
    let length = 1;
    while (length < 32) length = length * 2 + bit(field + length);
    length -= 32;
    let value = +(length > 0);
    for (let remaining = length - 1; remaining > 0; remaining--) {
      value = value * 2 + bit(field + 32 + length);
    }
    return value;
  };

  for (let remaining = 5; remaining > 0; remaining--) code = code * 64 + digit();
  let value = -1;
  let codeUnit = 0;
  for (let count = number(0); count > 0; count--) {
    value += number(0) + 1;
    const negative = bit(SIGN_CONTEXT);
    const distance = number(DISTANCE_FIELD);
    codeUnit += (negative ? -distance - 1 : distance) + 1;
    values[codeUnit] ||= value + 1;
  }
  return values;
}
