import {augmentBCH} from '../matrix/augment-bch';
import {
  ALIGNMENT_CENTER_ROLE,
  ALIGNMENT_RING_ROLE,
  DATA_ROLE,
  FINDER_CENTER_ROLE,
  FINDER_RING_ROLE,
  FORMAT_ROLE,
  SEPARATOR_ROLE,
  TIMING_ROLE,
} from '../matrix/create-base-matrix';
import {toPublicArray} from '../matrix/public-array';
import type {QRCodeCodewords} from '../matrix/types';
import type {QRCodeModuleRole} from '../types';
import {
  type QRCodeRMQRLevel,
  type QRCodeRMQRVersionIndex,
  getRMQRAlignmentColumns,
  getRMQRHeight,
  getRMQRWidth,
} from './tables';

/** Function patterns of one rMQR version. Every non-data module is reserved. */
export type QRCodeRMQRBaseMatrix = {
  readonly width: number;
  readonly height: number;
  readonly modules: Uint8Array;
  readonly roles: Uint8Array;
  readonly publicRoles: readonly QRCodeModuleRole[];
};

// Format information is XOR-masked differently beside the finder pattern and the finder
// sub-pattern (ISO/IEC 23941:2022 7.9).
const FINDER_SIDE_FORMAT_MASK = 0x1fab2;
const SUB_FINDER_SIDE_FORMAT_MASK = 0x20a7b;
// BCH(18,6) generator x^12+x^11+x^10+x^9+x^8+x^5+x^2+1, as for QR code version information.
const FORMAT_GENERATOR = 0x1f25;

const bases = new Map<QRCodeRMQRVersionIndex, QRCodeRMQRBaseMatrix>();

/**
 * Returns the function patterns and module roles of an rMQR version. Callers must copy `modules`
 * before writing to it.
 */
export function createRMQRBaseMatrix(version: QRCodeRMQRVersionIndex): QRCodeRMQRBaseMatrix {
  let base = bases.get(version);
  if (!base) bases.set(version, (base = buildRMQRBaseMatrix(version)));
  return base;
}

/**
 * Builds the function patterns. Module roles map to the standard roles: the finder sub-pattern takes
 * the alignment roles because it has the shape of a standard alignment pattern, and the corner
 * finder sub-patterns and the 3x3 alignment patterns are part of the timing patterns.
 */
function buildRMQRBaseMatrix(version: QRCodeRMQRVersionIndex): QRCodeRMQRBaseMatrix {
  const width = getRMQRWidth(version);
  const height = getRMQRHeight(version);
  const modules = new Uint8Array(width * height);
  const roles = new Uint8Array(width * height);
  const set = (x: number, y: number, dark: number, role: QRCodeModuleRole) => {
    modules[y * width + x] = dark;
    roles[y * width + x] = role;
  };

  // Timing patterns along all four edges; the other patterns overwrite parts of them.
  for (let x = 0; x < width; x++) {
    set(x, 0, ~x & 1, TIMING_ROLE);
    set(x, height - 1, ~x & 1, TIMING_ROLE);
  }
  for (let y = 0; y < height; y++) {
    set(0, y, ~y & 1, TIMING_ROLE);
    set(width - 1, y, ~y & 1, TIMING_ROLE);
  }

  // The finder pattern in the top-left corner.
  for (let y = 0; y < 7; y++) {
    for (let x = 0; x < 7; x++) {
      const distance = Math.max(Math.abs(x - 3), Math.abs(y - 3));
      set(x, y, +(distance !== 2), distance < 2 ? FINDER_CENTER_ROLE : FINDER_RING_ROLE);
    }
  }

  // The finder sub-pattern in the bottom-right corner: a dark ring, a light ring, and a dark center.
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 5; x++) {
      const distance = Math.max(Math.abs(x - 2), Math.abs(y - 2));
      set(
        width - 5 + x,
        height - 5 + y,
        +(distance !== 1),
        distance === 0 ? ALIGNMENT_CENTER_ROLE : ALIGNMENT_RING_ROLE,
      );
    }
  }

  // Corner finder sub-patterns in the bottom-left and top-right corners. In R7 symbols the
  // finder pattern fills the bottom-left corner, with the same colors.
  if (height > 7) {
    set(0, height - 2, 1, TIMING_ROLE);
    set(1, height - 2, 0, TIMING_ROLE);
    set(1, height - 1, 1, TIMING_ROLE);
  }
  set(width - 2, 0, 1, TIMING_ROLE);
  set(width - 2, 1, 0, TIMING_ROLE);
  set(width - 1, 1, 1, TIMING_ROLE);

  // The separator right of the finder pattern, and below it when the symbol is higher than 7
  // modules. In R9 symbols it replaces the bottom-left corner finder sub-pattern.
  for (let y = 0; y < 7; y++) set(7, y, 0, SEPARATOR_ROLE);
  if (height > 7) for (let x = 0; x < 8; x++) set(x, 7, 0, SEPARATOR_ROLE);

  // Vertical timing patterns with a 3x3 alignment pattern at each end.
  for (const column of getRMQRAlignmentColumns(width)) {
    for (let y = 0; y < height; y++) set(column, y, ~y & 1, TIMING_ROLE);
    for (const y of [1, 2, height - 3, height - 2]) {
      set(column - 1, y, 1, TIMING_ROLE);
      set(column + 1, y, 1, TIMING_ROLE);
    }
  }

  // Format information beside the finder pattern and beside the finder sub-pattern.
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 3; x++) {
      set(8 + x, 1 + y, 0, FORMAT_ROLE);
      set(width - 8 + x, height - 6 + y, 0, FORMAT_ROLE);
    }
  }
  for (let i = 0; i < 3; i++) {
    set(11, 1 + i, 0, FORMAT_ROLE);
    set(width - 5 + i, height - 6, 0, FORMAT_ROLE);
  }

  return {width, height, modules, roles, publicRoles: toPublicArray(roles)};
}

/**
 * Fills the data modules in two-module columns from the right, starting upward at the bottom-right
 * and skipping the timing pattern in the rightmost column. Modules after the codewords are
 * remainder bits and stay light.
 */
export function fillRMQRData(
  modules: Uint8Array,
  roles: Readonly<Uint8Array>,
  width: number,
  height: number,
  codewords: QRCodeCodewords,
): Uint8Array {
  const bitCount = codewords.length * 8;
  let k = 0,
    up = true;
  for (let right = width - 2; right > 0; right -= 2, up = !up) {
    for (let step = 0; step < height; step++) {
      const y: number = up ? height - 1 - step : step;
      for (let x = right; x > right - 2; x--) {
        const index = y * width + x;
        if (roles[index] === DATA_ROLE) {
          modules[index] = k < bitCount ? (codewords[k >> 3]! >> (~k & 7)) & 1 : 0;
          k++;
        }
      }
    }
  }
  return modules;
}

/** Applies the only rMQR data mask, `(floor(y / 2) + floor(x / 3)) mod 2 = 0` (7.8.2). */
export function applyRMQRMask(
  modules: Uint8Array,
  roles: Readonly<Uint8Array>,
  width: number,
  height: number,
): Uint8Array {
  for (let y = 0; y < height; y++) {
    for (let x = 0, index = y * width; x < width; x++, index++) {
      if (roles[index] === DATA_ROLE && (((y >> 1) + ((x / 3) | 0)) & 1) === 0) {
        modules[index]! ^= 1;
      }
    }
  }
  return modules;
}

/** Returns the 18 format bits of a version and level, before masking. */
export function getRMQRFormatBits(version: QRCodeRMQRVersionIndex, level: QRCodeRMQRLevel): number {
  return augmentBCH((level << 5) | version, 6, FORMAT_GENERATOR, 12);
}

/**
 * Writes both copies of the format information. Bit `x * 5 + y` goes to column `8 + x` and row
 * `1 + y` beside the finder pattern, and bits 15 to 17 down column 11. Beside the finder
 * sub-pattern, the same bits start at column `width - 8` and row `height - 6`, and bits 15 to 17
 * run right along row `height - 6`.
 */
export function fillRMQRFormatInformation(
  modules: Uint8Array,
  width: number,
  height: number,
  version: QRCodeRMQRVersionIndex,
  level: QRCodeRMQRLevel,
): Uint8Array {
  const format = getRMQRFormatBits(version, level);
  const left = format ^ FINDER_SIDE_FORMAT_MASK;
  const right = format ^ SUB_FINDER_SIDE_FORMAT_MASK;
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 3; x++) {
      modules[(1 + y) * width + 8 + x] = (left >> (x * 5 + y)) & 1;
      modules[(height - 6 + y) * width + width - 8 + x] = (right >> (x * 5 + y)) & 1;
    }
  }
  for (let i = 0; i < 3; i++) {
    modules[(1 + i) * width + 11] = (left >> (15 + i)) & 1;
    modules[(height - 6) * width + width - 5 + i] = (right >> (15 + i)) & 1;
  }
  return modules;
}
