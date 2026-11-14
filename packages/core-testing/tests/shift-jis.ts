let codes: Map<string, number> | undefined;

/**
 * Returns the double-byte Shift JIS code of a Kanji mode character from the platform's WHATWG
 * Shift_JIS decoder, so reference generators do not depend on QRCodeSDK's table. The lowest code
 * wins for duplicates.
 */
export function shiftJISCode(character: string): number {
  if (!codes) {
    codes = new Map();
    const decoder = new TextDecoder('shift_jis', {fatal: true});
    for (let code = 0x8140; code <= 0xebbf; code++) {
      const trail = code & 0xff;
      if ((code > 0x9ffc && code < 0xe040) || trail < 0x40 || trail === 0x7f || trail > 0xfc) {
        continue;
      }
      try {
        const decoded = decoder.decode(new Uint8Array([code >> 8, trail]));
        if (decoded.length === 1 && !codes.has(decoded)) codes.set(decoded, code);
      } catch {
        // Unassigned code.
      }
    }
  }
  const code = codes.get(character);
  if (code === undefined) throw new Error(`No Shift JIS code for ${character}`);
  return code;
}

export function shiftJISBytes(text: string): number[] {
  return Array.from(text).flatMap((character) => {
    const code = shiftJISCode(character);
    return [code >> 8, code & 0xff];
  });
}
