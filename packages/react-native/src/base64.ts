const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Encodes bytes as base64 without relying on `btoa`, which older engines lack. */
export function encodeBase64(bytes: Uint8Array): string {
  const parts: string[] = [];
  // Joins in chunks to keep intermediate strings short.
  for (let start = 0; start < bytes.length; start += 0x6000) {
    const end = Math.min(start + 0x6000, bytes.length);
    let chunk = '';
    for (let index = start; index < end; index += 3) {
      const first = bytes[index]!;
      const second = index + 1 < end ? bytes[index + 1]! : 0;
      const third = index + 2 < end ? bytes[index + 2]! : 0;
      chunk +=
        ALPHABET[first >> 2]! +
        ALPHABET[((first & 3) << 4) | (second >> 4)]! +
        (index + 1 < end ? ALPHABET[((second & 15) << 2) | (third >> 6)]! : '=') +
        (index + 2 < end ? ALPHABET[third & 63]! : '=');
    }
    parts.push(chunk);
  }
  return parts.join('');
}
