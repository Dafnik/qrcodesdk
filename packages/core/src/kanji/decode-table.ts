const BASE = 45;

/**
 * Decodes a table written by `scripts/generate-kanji-table.mjs` into 13-bit Kanji mode values plus
 * one, indexed by UTF-16 code unit. `0` marks code units that Kanji mode cannot encode. When
 * several values decode to the same code unit, the lowest one wins.
 */
export function decodeKanjiTable(table: string): Uint16Array {
  const values = new Uint16Array(0x10000);
  let index = 0;
  const read = (): number => {
    let value = 0;
    let factor = 1;
    for (;;) {
      const code = table.charCodeAt(index++);
      // Printable ASCII without " ' \ ` and ~.
      const digit = code - 32 - +(code > 0x22) - +(code > 0x27) - +(code > 0x5c) - +(code > 0x60);
      if (digit < BASE) return value + digit * factor;
      value += (digit - BASE) * factor;
      factor *= BASE;
    }
  };

  let value = -1;
  let codeUnit = 0;
  while (index < table.length) {
    value += read() + 1;
    const difference = read();
    codeUnit += (difference & 1 ? -(difference + 1) / 2 : difference / 2) + 1;
    values[codeUnit] ||= value + 1;
  }
  return values;
}
