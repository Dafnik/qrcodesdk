import {
  type QRCodeErrorCorrectionLevel,
  type QRCodeMask,
  type QRCodeMatrix,
  type QRCodeMatrixOptions,
  type QRCodeMode,
  type QRCodeTextStyle,
  type QRCodeVersion,
  createQRCodeStyler,
  qrcode,
} from '@qrcodesdk/core';

type QRCodeModule = QRCodeMatrix[number][number];

export type QRCodeExplainRole = 'functional' | 'encoded' | 'remainder';

export interface QRCodeExplainConfig extends QRCodeMatrixOptions, QRCodeTextStyle {
  data: string;
}

export interface QRCodeExplainModule {
  readonly key: string;
  readonly row: number;
  readonly column: number;
  readonly value: QRCodeModule;
  readonly sourceValue?: QRCodeModule;
  readonly role: QRCodeExplainRole;
  readonly groupId: string;
  readonly placementBitIndex?: number;
  readonly codewordIndex?: number;
}

export interface QRCodeExplainGroup {
  readonly id: string;
  readonly role: QRCodeExplainRole | 'margin';
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
    description:
      'Placed codeword bits containing headers, payload data, padding, and error correction.',
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

export function explainQRCode(config: QRCodeExplainConfig): QRCodeExplanation {
  const matrixOptions: QRCodeMatrixOptions = {
    mode: config.mode,
    version: config.version,
    errorCorrectionLevel: config.errorCorrectionLevel,
    mask: config.mask,
    eci: config.eci,
  };
  const matrix = qrcode(config.data).config(matrixOptions).matrix();
  const version = ((matrix.length - 17) / 4) as QRCodeVersion;
  const mask = config.mask ?? resolveMask(config.data, matrixOptions, matrix, version);
  const drawing = createQRCodeStyler({
    moduleSize: config.moduleSize,
    quietZone: config.quietZone,
  }).draw(matrix);
  const reserved = createReservedGrid(version);
  const placements = createPlacements(reserved);
  const codewordBitCount = Math.floor(placements.length / 8) * 8;
  const placementByPosition = new Map(
    placements.map(([row, column], placementBitIndex) => [
      row * matrix.length + column,
      placementBitIndex,
    ]),
  );
  const moduleGrid = matrix.map((row, rowIndex) =>
    row.map((value, columnIndex) => {
      const placementBitIndex = placementByPosition.get(rowIndex * matrix.length + columnIndex);
      if (placementBitIndex === undefined) {
        return createModule(rowIndex, columnIndex, value, 'functional');
      }
      if (placementBitIndex >= codewordBitCount) {
        return createModule(rowIndex, columnIndex, value, 'remainder');
      }
      const sourceValue = (value ^ +MASKS[mask](rowIndex, columnIndex)) as QRCodeModule;
      return {
        ...createModule(rowIndex, columnIndex, value, 'encoded'),
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
    mode: resolveMode(config),
    errorCorrectionLevel: config.errorCorrectionLevel ?? 'M',
    mask,
    moduleSize: drawing.moduleSize,
    quietZone: drawing.quietZone,
    viewSize: drawing.viewSize,
  };
}

function createModule(
  row: number,
  column: number,
  value: QRCodeModule,
  role: QRCodeExplainRole,
): QRCodeExplainModule {
  return {key: `${row}:${column}`, row, column, value, role, groupId: role};
}

function createReservedGrid(version: QRCodeVersion): boolean[][] {
  const size = version * 4 + 17;
  const grid = Array.from({length: size}, () => Array<boolean>(size).fill(false));
  mark(grid, 0, 0, 9, 9);
  mark(grid, size - 8, 0, 8, 9);
  mark(grid, 0, size - 8, 9, 8);
  for (let index = 9; index < size - 8; index++) {
    grid[6]![index] = true;
    grid[index]![6] = true;
  }
  const alignments = alignmentPositions(version);
  for (let rowIndex = 0; rowIndex < alignments.length; rowIndex++) {
    const minimumColumn = rowIndex === 0 || rowIndex === alignments.length - 1 ? 1 : 0;
    const maximumColumn = rowIndex === 0 ? alignments.length - 1 : alignments.length;
    for (let columnIndex = minimumColumn; columnIndex < maximumColumn; columnIndex++) {
      mark(grid, alignments[columnIndex]!, alignments[rowIndex]!, 5, 5);
    }
  }
  if (version >= 7) {
    mark(grid, size - 11, 0, 3, 6);
    mark(grid, 0, size - 11, 6, 3);
  }
  return grid;
}

function mark(grid: boolean[][], x: number, y: number, width: number, height: number): void {
  for (let row = y; row < y + height; row++) {
    for (let column = x; column < x + width; column++) grid[row]![column] = true;
  }
}

function alignmentPositions(version: QRCodeVersion): number[] {
  if (version === 1) return [];
  const count = Math.floor(version / 7) + 2;
  const step = Math.floor((version * 8 + count * 3 + 5) / (count * 4 - 4)) * 2;
  const positions = [4];
  for (let position = version * 4 + 8; positions.length < count; position -= step) {
    positions.splice(1, 0, position);
  }
  return positions;
}

function createPlacements(reserved: readonly (readonly boolean[])[]): [number, number][] {
  const placements: [number, number][] = [];
  const size = reserved.length;
  let direction = -1;
  for (let right = size - 1; right >= 0; right -= 2) {
    if (right === 6) right--;
    let row = direction < 0 ? size - 1 : 0;
    for (let step = 0; step < size; step++) {
      for (let column = right; column > right - 2; column--) {
        if (!reserved[row]![column]) placements.push([row, column]);
      }
      row += direction;
    }
    direction = -direction;
  }
  return placements;
}

function resolveMask(
  data: string,
  options: QRCodeMatrixOptions,
  matrix: QRCodeMatrix,
  version: QRCodeVersion,
): QRCodeMask {
  for (let mask = 0; mask < 8; mask++) {
    const candidate = qrcode(data)
      .config({...options, version, mask: mask as QRCodeMask})
      .matrix();
    if (
      candidate.every((row, index) =>
        row.every((value, column) => value === matrix[index]?.[column]),
      )
    ) {
      return mask as QRCodeMask;
    }
  }
  throw new Error('QRCode explain: Unable to resolve mask');
}

function resolveMode(config: QRCodeExplainConfig): QRCodeMode | 'mixed' {
  if (config.mode) return config.mode;
  if (/^\d+$/.test(config.data)) return 'numeric';
  if (/^[0-9A-Z $%*+\-./:]+$/.test(config.data)) return 'alphanumeric';
  return /[0-9A-Z]{4,}/.test(config.data) ? 'mixed' : 'octet';
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
  groups.set('margin', {
    id: 'margin',
    role: 'margin',
    label: 'Quiet zone',
    description:
      'A clear light border that helps scanners isolate the QR code from its surroundings.',
    modules: [],
  });
  return groups;
}
