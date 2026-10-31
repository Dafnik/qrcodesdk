import type {QRCodeMask} from '../types';
import {DATA_ROLE} from './create-base-matrix';

/**
 * Applies a QR mask to the data modules of a matrix.
 */
export function applyMaskToMatrix(
  modules: Uint8Array,
  roles: Readonly<Uint8Array>,
  n: number,
  mask: QRCodeMask,
): Uint8Array {
  if (mask < 3) {
    const rowStep = mask === 1 ? 2 : 1;
    const columnStep = mask === 2 ? 3 : mask === 0 ? 2 : 1;
    for (let i = 0; i < n; i += rowStep) {
      const columnStart = mask === 0 ? i & 1 : 0;
      for (let j = columnStart; j < n; j += columnStep) {
        const index = i * n + j;
        if (roles[index] === DATA_ROLE) modules[index]! ^= 1;
      }
    }
    return modules;
  }

  // Inline the remaining predicates (JIS X 0510:2004 Table 20). Calling MASK_FUNCTIONS
  // here sees five closures at one call site, which V8 cannot inline.
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const index = i * n + j;
      const product = i * j;
      if (
        roles[index] === DATA_ROLE &&
        (mask === 3
          ? (i + j) % 3 === 0
          : mask === 4
            ? (((i >> 1) + ((j / 3) | 0)) & 1) === 0
            : mask === 5
              ? product % 6 === 0
              : mask === 6
                ? (((product & 1) + (product % 3)) & 1) === 0
                : ((((i + j) & 1) + (product % 3)) & 1) === 0)
      ) {
        modules[index]! ^= 1;
      }
    }
  }
  return modules;
}
