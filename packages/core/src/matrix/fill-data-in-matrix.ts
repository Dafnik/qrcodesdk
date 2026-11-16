import {DATA_ROLE} from './create-base-matrix';
import type {QRCodeCodewords} from './types';

/**
 * Fills the data modules of the matrix with the given code words in zigzag order. The size of
 * code words should be no more than available bits, and remaining bits are padded to 0
 * (cf. JIS X 0510:2004 sec 8.7.3).
 */
export function fillDataInMatrix(
  modules: Uint8Array,
  roles: Readonly<Uint8Array>,
  n: number,
  buffer: QRCodeCodewords,
): Uint8Array {
  let k = 0,
    dir = -1,
    // The current code word, shifted left once per placed bit, so bit 7 is the next module.
    codeword = buffer[0]!;
  for (let i = n - 1; i >= 0; i -= 2) {
    if (i == 6) i--; // skip the entire timing pattern column
    for (let index = (dir < 0 ? n - 1 : 0) * n + i, j = 0; j < n; j++, index += dir * n) {
      for (let ii = index; ii > index - 2; ii--) {
        if (roles[ii] === DATA_ROLE) {
          modules[ii] = (codeword >> 7) & 1;
          // Remainder bits after the last code word are 0.
          codeword = ++k & 7 ? codeword << 1 : (buffer[k >> 3] ?? 0);
        }
      }
    }
    dir = -dir;
  }
  return modules;
}
