import {augmentBCH} from '../matrix/augment-bch';
import {
  DATA_ROLE,
  FINDER_CENTER_ROLE,
  FINDER_RING_ROLE,
  FORMAT_ROLE,
  type QRCodeBaseMatrix,
  SEPARATOR_ROLE,
  TIMING_ROLE,
} from '../matrix/create-base-matrix';
import {toPublicArray} from '../matrix/public-array';
import type {QRCodeCodewords} from '../matrix/types';
import type {QRCodeModuleRole} from '../types';
import {type QRCodeMicroVersionNumber, getMicroSize} from './tables';

const bases = new Map<QRCodeMicroVersionNumber, QRCodeBaseMatrix>();

/**
 * Returns the function patterns and module roles of a Micro QR version: one finder pattern, timing
 * patterns along row 0 and column 0, and the format information area. Callers must copy `modules`
 * before writing to it.
 */
export function createMicroBaseMatrix(version: QRCodeMicroVersionNumber): QRCodeBaseMatrix {
  let base = bases.get(version);
  if (!base) bases.set(version, (base = buildMicroBaseMatrix(version)));
  return base;
}

function buildMicroBaseMatrix(version: QRCodeMicroVersionNumber): QRCodeBaseMatrix {
  const n = getMicroSize(version);
  const modules = new Uint8Array(n * n);
  const roles = new Uint8Array(n * n);
  const set = (x: number, y: number, dark: number, role: QRCodeModuleRole) => {
    modules[y * n + x] = dark;
    roles[y * n + x] = role;
  };

  // Timing patterns first; the finder pattern and its separator overwrite their start.
  for (let i = 0; i < n; i++) {
    set(i, 0, ~i & 1, TIMING_ROLE);
    set(0, i, ~i & 1, TIMING_ROLE);
  }

  // The finder pattern with its separator on the right and bottom.
  for (let y = 0; y <= 7; y++) {
    for (let x = 0; x <= 7; x++) {
      const distance = Math.max(Math.abs(x - 3), Math.abs(y - 3));
      if (distance > 3) set(x, y, 0, SEPARATOR_ROLE);
      else set(x, y, +(distance !== 2), distance < 2 ? FINDER_CENTER_ROLE : FINDER_RING_ROLE);
    }
  }

  // Format information along row 8 and column 8, written for each symbol later.
  for (let i = 1; i <= 8; i++) {
    set(8, i, 0, FORMAT_ROLE);
    set(i, 8, 0, FORMAT_ROLE);
  }

  return {size: n, modules, roles, publicRoles: toPublicArray(roles)};
}

/**
 * Fills the data modules in two-column zigzag order from the bottom-right corner. Unlike standard
 * QR codes, no column is skipped. `dataBits` excludes the zero low nibble of a final 4-bit data
 * codeword, so error-correction bits follow the data bits directly.
 */
export function fillMicroData(
  modules: Uint8Array,
  roles: Readonly<Uint8Array>,
  n: number,
  codewords: QRCodeCodewords,
  dataBits: number,
): Uint8Array {
  const skippedBits = ((dataBits + 7) & ~7) - dataBits;
  let k = 0,
    dir = -1;
  for (let i = n - 1; i > 0; i -= 2) {
    let jj = dir < 0 ? n - 1 : 0;
    for (let j = 0; j < n; j++) {
      for (let ii = i; ii > i - 2; --ii) {
        const index = jj * n + ii;
        if (roles[index] === DATA_ROLE) {
          const bit = k < dataBits ? k : k + skippedBits;
          modules[index] = (codewords[bit >> 3]! >> (~bit & 7)) & 1;
          ++k;
        }
      }
      jj += dir;
    }
    dir = -dir;
  }
  return modules;
}

/**
 * Scores a masked symbol by its dark modules along the right and bottom edges, excluding the timing
 * patterns (ISO/IEC 18004:2015 section 7.8.3.2). Higher is better.
 */
export function evaluateMicroMatrix(modules: Readonly<Uint8Array>, n: number): number {
  let right = 0,
    bottom = 0;
  for (let i = 1; i < n; i++) {
    right += modules[i * n + n - 1]!;
    bottom += modules[(n - 1) * n + i]!;
  }
  return right <= bottom ? right * 16 + bottom : bottom * 16 + right;
}

/**
 * Writes the one copy of the 15 format bits: bit 14 to bit 7 along row 8 from column 1, and bit 6
 * to bit 0 up column 8 from row 7.
 */
export function fillMicroFormatInformation(
  modules: Uint8Array,
  n: number,
  symbolNumber: number,
  mask: number,
): Uint8Array {
  const code = augmentBCH((symbolNumber << 2) | mask, 5, 0x537, 10) ^ 0x4445;
  for (let i = 1; i <= 8; i++) {
    modules[8 * n + i] = (code >> (15 - i)) & 1;
    if (i < 8) modules[i * n + 8] = (code >> (i - 1)) & 1;
  }
  return modules;
}
