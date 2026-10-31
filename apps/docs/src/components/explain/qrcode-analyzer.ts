import {
  type QRCodeErrorCorrectionLevel,
  type QRCodeMask,
  type QRCodeMatrix,
  type QRCodeMatrixOptions,
  type QRCodeMode,
  type QRCodeTextStyle,
  type QRCodeVersion,
  qrcode,
} from '@qrcodesdk/core';
import {QR_CODE_MODULE_ROLES, createQRCodeStyler} from '@qrcodesdk/core/drawing';

/** `1` for a dark module and `0` for a light module. */
export type QRCodeExplainModuleValue = 0 | 1;

export type QRCodeExplainRole = 'functional' | 'encoded' | 'remainder';

export interface QRCodeExplainOptions extends QRCodeMatrixOptions, QRCodeTextStyle {
  payload: string;
}

export interface QRCodeExplainModule {
  readonly key: string;
  readonly row: number;
  readonly column: number;
  readonly value: QRCodeExplainModuleValue;
  readonly sourceValue?: QRCodeExplainModuleValue;
  readonly role: QRCodeExplainRole;
  readonly groupId: string;
  readonly placementBitIndex?: number;
  readonly codewordIndex?: number;
}

export interface QRCodeExplainGroup {
  readonly id: string;
  readonly role: QRCodeExplainRole | 'quiet-zone';
  readonly label: string;
  readonly description: string;
  readonly modules: readonly QRCodeExplainModule[];
}

export interface QRCodeExplanation {
  readonly matrix: QRCodeMatrix;
  readonly modules: readonly QRCodeExplainModule[];
  readonly moduleGrid: readonly (readonly QRCodeExplainModule[])[];
  readonly groups: ReadonlyMap<string, QRCodeExplainGroup>;
  readonly version: QRCodeVersion;
  readonly mode: QRCodeMode | 'mixed';
  readonly errorCorrectionLevel: QRCodeErrorCorrectionLevel;
  readonly mask: QRCodeMask;
  readonly moduleSize: number;
  readonly quietZone: number;
  readonly viewSize: number;
}

export const QR_CODE_EXPLAIN_ROLE_ORDER = [
  'functional',
  'encoded',
  'remainder',
] as const satisfies readonly QRCodeExplainRole[];

export const QR_CODE_EXPLAIN_ROLE_DETAILS = {
  functional: {
    label: 'Functional modules',
    description:
      'Reserved modules used to locate, orient, and configure the QR code during scanning.',
  },
  encoded: {
    label: 'Encoded modules',
    description: 'Placed codeword bits containing headers, payload, padding, and error correction.',
  },
  remainder: {
    label: 'Remainder bits',
    description: 'Unused zero modules that complete the matrix placement path.',
  },
} as const satisfies Record<QRCodeExplainRole, {label: string; description: string}>;

const MASKS = [
  (row: number, column: number) => (row + column) % 2 === 0,
  (row: number) => row % 2 === 0,
  (_row: number, column: number) => column % 3 === 0,
  (row: number, column: number) => (row + column) % 3 === 0,
  (row: number, column: number) => (Math.floor(row / 2) + Math.floor(column / 3)) % 2 === 0,
  (row: number, column: number) => ((row * column) % 2) + ((row * column) % 3) === 0,
  (row: number, column: number) => (((row * column) % 2) + ((row * column) % 3)) % 2 === 0,
  (row: number, column: number) => (((row + column) % 2) + ((row * column) % 3)) % 2 === 0,
] as const;

export function explainQRCode(options: QRCodeExplainOptions): QRCodeExplanation {
  const matrixOptions: QRCodeMatrixOptions = {
    mode: options.mode,
    version: options.version,
    errorCorrectionLevel: options.errorCorrectionLevel,
    mask: options.mask,
    eci: options.eci,
  };
  const matrix = qrcode(options.payload).options(matrixOptions).matrix();
  const {size} = matrix;
  const version = ((size - 17) / 4) as QRCodeVersion;
  const mask = options.mask ?? resolveMask(options.payload, matrixOptions, matrix, version);
  const drawing = createQRCodeStyler({
    moduleSize: options.moduleSize,
    quietZone: options.quietZone,
  })(matrix);
  const placements = createPlacements(matrix);
  const codewordBitCount = Math.floor(placements.length / 8) * 8;
  const placementByIndex = new Map(
    placements.map((index, placementBitIndex) => [index, placementBitIndex]),
  );
  const moduleGrid = Array.from({length: size}, (_, row) =>
    Array.from({length: size}, (_, column): QRCodeExplainModule => {
      const index = row * size + column;
      const value = matrix.modules[index] as QRCodeExplainModuleValue;
      const placementBitIndex = placementByIndex.get(index);
      if (placementBitIndex === undefined) {
        return createModule(row, column, value, 'functional');
      }
      if (placementBitIndex >= codewordBitCount) {
        return {...createModule(row, column, value, 'remainder'), placementBitIndex};
      }
      const sourceValue = (value ^ +MASKS[mask](row, column)) as QRCodeExplainModuleValue;
      return {
        ...createModule(row, column, value, 'encoded'),
        sourceValue,
        placementBitIndex,
        codewordIndex: Math.floor(placementBitIndex / 8),
      };
    }),
  );
  const modules = moduleGrid.flat();
  return {
    matrix,
    modules,
    moduleGrid,
    groups: createGroups(modules),
    version,
    mode: resolveMode(options),
    errorCorrectionLevel: options.errorCorrectionLevel ?? 'M',
    mask,
    moduleSize: drawing.moduleSize,
    quietZone: drawing.quietZone,
    viewSize: drawing.viewSize,
  };
}

function createModule(
  row: number,
  column: number,
  value: QRCodeExplainModuleValue,
  role: QRCodeExplainRole,
): QRCodeExplainModule {
  return {key: `${row}:${column}`, row, column, value, role, groupId: role};
}

/**
 * Returns the matrix indexes of the data region in QR placement order: two-module columns from
 * the right, zig-zagging up and down and skipping the vertical timing pattern. Every module with
 * the data role belongs to the placement path; all other roles are reserved function patterns.
 */
function createPlacements({size, roles}: QRCodeMatrix): number[] {
  const placements: number[] = [];
  let direction = -1;
  for (let right = size - 1; right >= 0; right -= 2) {
    if (right === 6) right--;
    let row = direction < 0 ? size - 1 : 0;
    for (let step = 0; step < size; step++) {
      for (let column = right; column > right - 2; column--) {
        const index = row * size + column;
        if (roles[index] === QR_CODE_MODULE_ROLES.data) placements.push(index);
      }
      row += direction;
    }
    direction = -direction;
  }
  return placements;
}

function resolveMask(
  payload: string,
  options: QRCodeMatrixOptions,
  matrix: QRCodeMatrix,
  version: QRCodeVersion,
): QRCodeMask {
  for (let mask = 0; mask < 8; mask++) {
    const candidate = qrcode(payload)
      .options({...options, version, mask: mask as QRCodeMask})
      .matrix();
    if (candidate.modules.every((value, index) => value === matrix.modules[index])) {
      return mask as QRCodeMask;
    }
  }
  throw new Error('QRCode explain: Unable to resolve mask');
}

function resolveMode(options: QRCodeExplainOptions): QRCodeMode | 'mixed' {
  if (options.mode) return options.mode;
  if (/^\d+$/.test(options.payload)) return 'numeric';
  if (/^[0-9A-Z $%*+\-./:]+$/.test(options.payload)) return 'alphanumeric';
  return /[0-9A-Z]{4,}/.test(options.payload) ? 'mixed' : 'octet';
}

function createGroups(
  modules: readonly QRCodeExplainModule[],
): ReadonlyMap<string, QRCodeExplainGroup> {
  const groups = new Map<string, QRCodeExplainGroup>();
  for (const role of QR_CODE_EXPLAIN_ROLE_ORDER) {
    const details = QR_CODE_EXPLAIN_ROLE_DETAILS[role];
    groups.set(role, {
      ...details,
      id: role,
      role,
      modules: modules.filter((module) => module.role === role),
    });
  }
  groups.set('quiet-zone', {
    id: 'quiet-zone',
    role: 'quiet-zone',
    label: 'Quiet zone',
    description:
      'A clear light border that helps scanners isolate the QR code from its surroundings.',
    modules: [],
  });
  return groups;
}
