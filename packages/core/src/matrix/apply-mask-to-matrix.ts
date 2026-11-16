import type {QRCodeMask} from '../types';

// Flipped columns by mask and row, as `step << 6 | columns`: bit j of `columns` flips columns j,
// j + step, and so on. Every mask predicate (JIS X 0510:2004 Table 20) repeats every 12 rows and 6
// columns, and the step is the shortest period of the row: 1, 2, 3, or 6.
// Entries need nine bits to hold a step of 6 above the six column bits.
let flips: Uint16Array | undefined;

/**
 * Applies a QR mask to the data modules of a matrix.
 */
export function applyMaskToMatrix(
  modules: Uint8Array,
  roles: Readonly<Uint8Array>,
  n: number,
  mask: QRCodeMask,
): Uint8Array {
  flips ??= createFlips();
  for (let i = 0; i < n; i++) {
    const entry = flips[mask * 12 + (i % 12)]!;
    for (let j = 0, columns = entry & 63; columns; j++, columns >>= 1) {
      for (
        let index = i * n + j, end = i * n + n;
        columns & 1 && index < end;
        index += entry >> 6
      ) {
        // Only data modules (role 0) are masked: `role - 1 >>> 31` is 1 for them and 0 otherwise.
        modules[index]! ^= (roles[index]! - 1) >>> 31;
      }
    }
  }
  return modules;
}

function createFlips(): Uint16Array {
  const result = new Uint16Array(96);
  for (let row = 0; row < 96; row++) {
    const i = row % 12;
    const mask = (row / 12) | 0;
    let columns = 0;
    for (let j = 0; j < 6; j++) {
      const product = i * j;
      const keep =
        mask === 0
          ? (i + j) % 2
          : mask === 1
            ? i % 2
            : mask === 2
              ? j % 3
              : mask === 3
                ? (i + j) % 3
                : mask === 4
                  ? ((i >> 1) + ((j / 3) | 0)) % 2
                  : mask === 5
                    ? product % 6
                    : mask === 6
                      ? ((product % 2) + (product % 3)) % 2
                      : (((i + j) % 2) + (product % 3)) % 2;
      if (!keep) columns |= 1 << j;
    }
    // The shortest step whose first columns repeat across all 6.
    let step = 1;
    while (6 % step || ((columns >> step) ^ columns) & ((1 << (6 - step)) - 1)) step++;
    result[row] = (step << 6) | (columns & ((1 << step) - 1));
  }
  return result;
}
