import type {QRCodeCodewords} from '../types';
import {DATA_ROLE} from './create-base-matrix';

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
    dir = -1;
  for (let i = n - 1; i >= 0; i -= 2) {
    if (i == 6) i--; // skip the entire timing pattern column
    let jj = dir < 0 ? n - 1 : 0;
    for (let j = 0; j < n; j++) {
      for (let ii = i; ii > i - 2; --ii) {
        const index = jj * n + ii;
        if (roles[index] === DATA_ROLE) {
          // may overflow, but (undefined >> x) is 0, so it will auto-pad to zero.
          modules[index] = ((buffer[k >> 3] ?? 0) >> (~k & 7)) & 1;
          ++k;
        }
      }
      jj += dir;
    }
    dir = -dir;
  }
  return modules;
}
