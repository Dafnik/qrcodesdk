import type {QRCodeModuleRole, QRCodeVersion} from '../types';
import {augmentBCH} from './augment-bch';
import {getSizeByVersion} from './get-size-by-version';
import {needsVersionInfo} from './needs-version-info';
import {getAlignmentPatternPositions} from './version-config';

export const DATA_ROLE = 0;
const FINDER_RING_ROLE = 1;
const FINDER_CENTER_ROLE = 2;
const SEPARATOR_ROLE = 3;
const ALIGNMENT_RING_ROLE = 4;
const ALIGNMENT_CENTER_ROLE = 5;
const TIMING_ROLE = 6;
const FORMAT_ROLE = 7;
const VERSION_ROLE = 8;

/** Function patterns of one version. Every non-data module is reserved. */
export type QRCodeBaseMatrix = {
  readonly size: number;
  readonly modules: Uint8Array;
  readonly roles: Uint8Array;
  readonly publicRoles: readonly number[];
};

const bases = new Map<QRCodeVersion, QRCodeBaseMatrix>();

/**
 * Returns the function patterns and module roles of a version. Both depend only on the version, so
 * they are built once and shared. Callers must copy `modules` before writing to it.
 */
export function createBaseMatrix(version: QRCodeVersion): QRCodeBaseMatrix {
  let base = bases.get(version);
  if (!base) bases.set(version, (base = buildBaseMatrix(version)));
  return base;
}

function buildBaseMatrix(version: QRCodeVersion): QRCodeBaseMatrix {
  const n = getSizeByVersion(version);
  const modules = new Uint8Array(n * n);
  const roles = new Uint8Array(n * n);
  const set = (x: number, y: number, dark: number, role: QRCodeModuleRole) => {
    modules[y * n + x] = dark;
    roles[y * n + x] = role;
  };

  // Timing patterns first; finders, separators, and alignment patterns overwrite their crossings.
  for (let i = 0; i < n; i++) {
    set(i, 6, ~i & 1, TIMING_ROLE);
    set(6, i, ~i & 1, TIMING_ROLE);
  }

  // Finder patterns with their separators.
  for (const [left, top] of [
    [0, 0],
    [n - 7, 0],
    [0, n - 7],
  ] as const) {
    for (let dy = -1; dy <= 7; dy++) {
      for (let dx = -1; dx <= 7; dx++) {
        const x = left + dx;
        const y = top + dy;
        if (x < 0 || y < 0 || x >= n || y >= n) continue;
        const distance = Math.max(Math.abs(dx - 3), Math.abs(dy - 3));
        if (distance > 3) set(x, y, 0, SEPARATOR_ROLE);
        else set(x, y, +(distance !== 2), distance < 2 ? FINDER_CENTER_ROLE : FINDER_RING_ROLE);
      }
    }
  }

  // Alignment patterns, except where they would overlap a finder pattern.
  const positions = getAlignmentPatternPositions(version);
  const m = positions.length;
  for (let i = 0; i < m; i++) {
    const minJ = i == 0 || i == m - 1 ? 1 : 0,
      maxJ = i == 0 ? m - 1 : m;
    for (let j = minJ; j < maxJ; j++) {
      for (let dy = 0; dy < 5; dy++) {
        for (let dx = 0; dx < 5; dx++) {
          const distance = Math.max(Math.abs(dx - 2), Math.abs(dy - 2));
          set(
            positions[j]! + dx,
            positions[i]! + dy,
            +(distance !== 1),
            distance === 0 ? ALIGNMENT_CENTER_ROLE : ALIGNMENT_RING_ROLE,
          );
        }
      }
    }
  }

  // Format information areas, written for each mask later, and the always-dark module.
  for (let i = 0; i <= 8; i++) {
    if (i === 6) continue;
    set(8, i, 0, FORMAT_ROLE);
    set(i, 8, 0, FORMAT_ROLE);
  }
  for (let i = n - 8; i < n; i++) {
    set(8, i, 0, FORMAT_ROLE);
    set(i, 8, 0, FORMAT_ROLE);
  }
  set(8, n - 8, 1, FORMAT_ROLE);

  if (needsVersionInfo(version)) {
    const code = augmentBCH(version, 6, 0x1f25, 12);
    let k = 0;
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 3; j++) {
        const bit = (code >> k++) & 1;
        set(n - 11 + j, i, bit, VERSION_ROLE);
        set(i, n - 11 + j, bit, VERSION_ROLE);
      }
    }
  }

  return {size: n, modules, roles, publicRoles: Object.freeze(Array.from(roles))};
}
