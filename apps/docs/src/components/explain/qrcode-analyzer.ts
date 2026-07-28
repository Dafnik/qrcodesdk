import {
  type QRCodeErrorCorrectionLevel,
  type QRCodeMask,
  type QRCodeMatrix,
  type QRCodeMatrixOptions,
  type QRCodeMode,
  type QRCodeStylingOptions,
  type QRCodeVersion,
  parseQRCodeStylingOptions,
  qrcode,
} from '@qrcodesdk/core';

type QRCodeModule = QRCodeMatrix[number][number];

export type QRCodeExplainRole =
  | 'finder'
  | 'separator'
  | 'timing'
  | 'alignment'
  | 'format'
  | 'version'
  | 'dark-module'
  | 'mode'
  | 'character-count'
  | 'payload'
  | 'terminator'
  | 'padding'
  | 'error-correction'
  | 'remainder';

export interface QRCodeExplainConfig
  extends QRCodeMatrixOptions, Pick<QRCodeStylingOptions, 'size' | 'margin'> {
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
  readonly bitIndex?: number;
  readonly bitCount?: number;
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
  readonly mode: QRCodeMode;
  readonly errorCorrectionLevel: QRCodeErrorCorrectionLevel;
  readonly mask: QRCodeMask;
  readonly size: number;
  readonly margin: number;
  readonly viewSize: number;
}

type FunctionalCell = {
  role: QRCodeExplainRole;
  groupId: string;
};

type EncodedBit = {
  role: QRCodeExplainRole;
  bitIndex: number;
  bitCount: number;
  codewordIndex?: number;
};

const ERROR_CORRECTION_LEVELS = ['L', 'M', 'Q', 'H'] as const;
const ERROR_CORRECTION_FORMAT_VALUES = {
  L: 1,
  M: 0,
  Q: 3,
  H: 2,
} as const satisfies Record<QRCodeErrorCorrectionLevel, number>;

// QR Model 2, versions 1-40, ordered by L/M/Q/H. These are deliberately local to the
// docs explainer so it exercises only @qrcodesdk/core's public matrix API.
const ECC_CODEWORDS_PER_BLOCK = [
  [
    7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30,
    26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  ],
  [
    10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28,
    28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
  ],
  [
    13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30,
    30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  ],
  [
    17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  ],
] as const;

const ERROR_CORRECTION_BLOCKS = [
  [
    1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15,
    16, 17, 18, 19, 19, 20, 21, 22, 24, 25,
  ],
  [
    1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25,
    26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49,
  ],
  [
    1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34,
    35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68,
  ],
  [
    1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37,
    40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81,
  ],
] as const;

export const QR_CODE_EXPLAIN_ROLE_ORDER = [
  'finder',
  'separator',
  'timing',
  'alignment',
  'format',
  'version',
  'dark-module',
  'mode',
  'character-count',
  'payload',
  'terminator',
  'padding',
  'error-correction',
  'remainder',
] as const satisfies readonly QRCodeExplainRole[];

export const QR_CODE_EXPLAIN_ROLE_DETAILS = {
  finder: {
    label: 'Finder pattern',
    description: 'A 7×7 target that lets scanners locate and orient the symbol.',
  },
  separator: {
    label: 'Finder separator',
    description: 'A one-module light border that isolates each finder pattern.',
  },
  timing: {
    label: 'Timing pattern',
    description: 'Alternating modules that establish the QR code grid.',
  },
  alignment: {
    label: 'Alignment pattern',
    description: 'A 5×5 target that corrects perspective and distortion.',
  },
  format: {
    label: 'Format information',
    description: 'Two protected copies of the error-correction level and mask number.',
  },
  version: {
    label: 'Version information',
    description: 'Two protected copies of the version number, present from version 7.',
  },
  'dark-module': {
    label: 'Dark module',
    description: 'A fixed dark reference module required by the QR specification.',
  },
  mode: {
    label: 'Mode indicator',
    description: 'Four bits that identify numeric, alphanumeric, or octet encoding.',
  },
  'character-count': {
    label: 'Character count',
    description: 'The encoded payload length; its bit width depends on mode and version.',
  },
  payload: {
    label: 'Payload data',
    description: 'The input data after mode-specific encoding.',
  },
  terminator: {
    label: 'Terminator',
    description: 'Up to four zero bits marking the end of encoded payload data.',
  },
  padding: {
    label: 'Padding',
    description: 'Byte alignment and alternating pad codewords that fill data capacity.',
  },
  'error-correction': {
    label: 'Error correction',
    description: 'Reed–Solomon codewords that allow damaged modules to be recovered.',
  },
  remainder: {
    label: 'Remainder bits',
    description: 'Unused zero modules that complete the matrix placement path.',
  },
} as const satisfies Record<QRCodeExplainRole, {label: string; description: string}>;

export function explainQRCode(config: QRCodeExplainConfig): QRCodeExplanation {
  const styling = parseQRCodeStylingOptions({size: config.size, margin: config.margin});
  const matrix = qrcode(config.data)
    .config({
      mode: config.mode,
      version: config.version,
      errorCorrectionLevel: config.errorCorrectionLevel,
      mask: config.mask,
    })
    .matrix();

  const version = ((matrix.length - 17) / 4) as QRCodeVersion;
  const mode = resolveMode(config.data, config.mode);
  const {errorCorrectionLevel, mask} = decodeFormatInformation(matrix);
  const functionalGrid = createFunctionalGrid(version);
  const dataCoordinates = getDataCoordinates(functionalGrid);
  const levelIndex = ERROR_CORRECTION_LEVELS.indexOf(errorCorrectionLevel);
  const eccCodewordsPerBlock = ECC_CODEWORDS_PER_BLOCK[levelIndex]![version - 1]!;
  const blockCount = ERROR_CORRECTION_BLOCKS[levelIndex]![version - 1]!;
  const totalCodewords = Math.floor(dataCoordinates.length / 8);
  const dataCodewordCount = totalCodewords - eccCodewordsPerBlock * blockCount;
  const encodedBits = createEncodedBitMap(
    config.data,
    mode,
    version,
    dataCodewordCount,
    blockCount,
    totalCodewords,
    dataCoordinates.length,
  );

  const moduleGrid: QRCodeExplainModule[][] = matrix.map(() => []);
  const modules: QRCodeExplainModule[] = [];
  let dataIndex = 0;

  for (let row = 0; row < matrix.length; row++) {
    for (let column = 0; column < matrix.length; column++) {
      const functional = functionalGrid[row]![column];
      const encoded = functional === undefined ? encodedBits[dataIndex++] : undefined;
      const role = functional?.role ?? encoded!.role;
      const groupId = functional?.groupId ?? role;
      const value = matrix[row]![column]!;
      const isEncodedModule = functional === undefined && role !== 'remainder';
      const module: QRCodeExplainModule = {
        key: `${row}:${column}`,
        row,
        column,
        value,
        sourceValue: isEncodedModule
          ? ((value ^ (maskApplies(mask, row, column) ? 1 : 0)) as QRCodeModule)
          : undefined,
        role,
        groupId,
        bitIndex: encoded?.bitIndex,
        bitCount: encoded?.bitCount,
        codewordIndex: encoded?.codewordIndex,
      };

      moduleGrid[row]!.push(module);
      modules.push(module);
    }
  }

  const groups = createGroups(modules);
  return {
    matrix,
    modules,
    moduleGrid,
    groups,
    version,
    mode,
    errorCorrectionLevel,
    mask,
    size: styling.size,
    margin: styling.margin,
    viewSize: matrix.length + styling.margin * 2,
  };
}

function createFunctionalGrid(version: QRCodeVersion): (FunctionalCell | undefined)[][] {
  const matrixSize = version * 4 + 17;
  const grid: (FunctionalCell | undefined)[][] = Array.from({length: matrixSize}, () =>
    Array.from({length: matrixSize}),
  );

  placeFinder(grid, 0, 0, 'top-left');
  placeFinder(grid, 0, matrixSize - 7, 'top-right');
  placeFinder(grid, matrixSize - 7, 0, 'bottom-left');

  for (let index = 8; index <= matrixSize - 9; index++) {
    grid[6]![index] = {role: 'timing', groupId: 'timing'};
    grid[index]![6] = {role: 'timing', groupId: 'timing'};
  }

  const alignmentCenters = getAlignmentPatternCenters(version);
  for (const row of alignmentCenters) {
    for (const column of alignmentCenters) {
      if (grid[row]![column] !== undefined) continue;
      const groupId = `alignment:${row}:${column}`;
      fillRegion(grid, row - 2, column - 2, 5, 5, {role: 'alignment', groupId});
    }
  }

  if (version >= 7) {
    fillRegion(grid, 0, matrixSize - 11, 6, 3, {role: 'version', groupId: 'version'});
    fillRegion(grid, matrixSize - 11, 0, 3, 6, {role: 'version', groupId: 'version'});
  }

  const formatRows = [
    0,
    1,
    2,
    3,
    4,
    5,
    7,
    8,
    matrixSize - 7,
    matrixSize - 6,
    matrixSize - 5,
    matrixSize - 4,
    matrixSize - 3,
    matrixSize - 2,
    matrixSize - 1,
  ];
  const formatColumns = [
    matrixSize - 1,
    matrixSize - 2,
    matrixSize - 3,
    matrixSize - 4,
    matrixSize - 5,
    matrixSize - 6,
    matrixSize - 7,
    matrixSize - 8,
    7,
    5,
    4,
    3,
    2,
    1,
    0,
  ];
  for (let index = 0; index < 15; index++) {
    grid[formatRows[index]!]![8] = {role: 'format', groupId: 'format'};
    grid[8]![formatColumns[index]!] = {role: 'format', groupId: 'format'};
  }

  grid[matrixSize - 8]![8] = {role: 'dark-module', groupId: 'dark-module'};
  return grid;
}

function placeFinder(
  grid: (FunctionalCell | undefined)[][],
  row: number,
  column: number,
  position: string,
): void {
  fillRegion(grid, row, column, 7, 7, {
    role: 'finder',
    groupId: `finder:${position}`,
  });

  const separatorCells =
    position === 'top-left'
      ? [
          ...Array.from({length: 8}, (_, index) => [7, index] as const),
          ...Array.from({length: 7}, (_, index) => [index, 7] as const),
        ]
      : position === 'top-right'
        ? [
            ...Array.from({length: 8}, (_, index) => [7, grid.length - 8 + index] as const),
            ...Array.from({length: 7}, (_, index) => [index, grid.length - 8] as const),
          ]
        : [
            ...Array.from({length: 8}, (_, index) => [grid.length - 8, index] as const),
            ...Array.from({length: 7}, (_, index) => [grid.length - 7 + index, 7] as const),
          ];

  for (const [separatorRow, separatorColumn] of separatorCells) {
    grid[separatorRow]![separatorColumn] = {
      role: 'separator',
      groupId: `separator:${position}`,
    };
  }
}

function fillRegion(
  grid: (FunctionalCell | undefined)[][],
  row: number,
  column: number,
  height: number,
  width: number,
  cell: FunctionalCell,
): void {
  for (let rowOffset = 0; rowOffset < height; rowOffset++) {
    for (let columnOffset = 0; columnOffset < width; columnOffset++) {
      grid[row + rowOffset]![column + columnOffset] = cell;
    }
  }
}

function getAlignmentPatternCenters(version: QRCodeVersion): readonly number[] {
  if (version === 1) return [];
  const count = Math.floor(version / 7) + 2;
  const step = version === 32 ? 26 : Math.ceil((version * 4 + count * 2 + 1) / (count * 2 - 2)) * 2;
  const result = [6];
  for (let position = version * 4 + 10; result.length < count; position -= step) {
    result.splice(1, 0, position);
  }
  return result;
}

function getDataCoordinates(
  functionalGrid: readonly (readonly (FunctionalCell | undefined)[])[],
): readonly (readonly [row: number, column: number])[] {
  const size = functionalGrid.length;
  const coordinates: [number, number][] = [];
  let direction = -1;

  for (let rightColumn = size - 1; rightColumn >= 0; rightColumn -= 2) {
    if (rightColumn === 6) rightColumn--;
    let row = direction < 0 ? size - 1 : 0;

    for (let index = 0; index < size; index++) {
      for (let column = rightColumn; column > rightColumn - 2; column--) {
        if (functionalGrid[row]![column] === undefined) coordinates.push([row, column]);
      }
      row += direction;
    }

    direction = -direction;
  }

  return coordinates;
}

function createEncodedBitMap(
  data: string,
  mode: QRCodeMode,
  version: QRCodeVersion,
  dataCodewordCount: number,
  blockCount: number,
  totalCodewordCount: number,
  availableModuleCount: number,
): readonly EncodedBit[] {
  const capacity = dataCodewordCount * 8;
  const characterCountBits = getCharacterCountBits(mode, version);
  const payloadBits = getPayloadBitCount(data, mode);
  const originalRoles: QRCodeExplainRole[] = [
    ...Array.from<QRCodeExplainRole>({length: 4}).fill('mode'),
    ...Array.from<QRCodeExplainRole>({length: characterCountBits}).fill('character-count'),
    ...Array.from<QRCodeExplainRole>({length: payloadBits}).fill('payload'),
  ];
  const terminatorLength = Math.min(4, capacity - originalRoles.length);
  originalRoles.push(
    ...Array.from<QRCodeExplainRole>({length: terminatorLength}).fill('terminator'),
  );
  originalRoles.push(
    ...Array.from<QRCodeExplainRole>({length: capacity - originalRoles.length}).fill('padding'),
  );

  const roleCounts = countRoles(originalRoles);
  const roleOffsets = new Map<QRCodeExplainRole, number>();
  const originalBits = originalRoles.map((role, sourceBitIndex) => {
    const bitIndex = roleOffsets.get(role) ?? 0;
    roleOffsets.set(role, bitIndex + 1);
    return {
      role,
      bitIndex,
      bitCount: roleCounts.get(role)!,
      codewordIndex: Math.floor(sourceBitIndex / 8),
    } satisfies EncodedBit;
  });

  const result: EncodedBit[] = [];
  for (const sourceCodewordIndex of getInterleavedDataCodewordIndices(
    dataCodewordCount,
    blockCount,
  )) {
    for (let bit = 0; bit < 8; bit++) {
      result.push(originalBits[sourceCodewordIndex * 8 + bit]!);
    }
  }

  const errorCorrectionBitCount = (totalCodewordCount - dataCodewordCount) * 8;
  for (let bitIndex = 0; bitIndex < errorCorrectionBitCount; bitIndex++) {
    result.push({
      role: 'error-correction',
      bitIndex,
      bitCount: errorCorrectionBitCount,
      codewordIndex: dataCodewordCount + Math.floor(bitIndex / 8),
    });
  }

  const remainderBitCount = availableModuleCount - totalCodewordCount * 8;
  for (let bitIndex = 0; bitIndex < remainderBitCount; bitIndex++) {
    result.push({role: 'remainder', bitIndex, bitCount: remainderBitCount});
  }
  return result;
}

function getInterleavedDataCodewordIndices(
  dataCodewordCount: number,
  blockCount: number,
): readonly number[] {
  const shortBlockLength = Math.floor(dataCodewordCount / blockCount);
  const longBlockStart = blockCount - (dataCodewordCount % blockCount);
  const offsets: number[] = [];
  let offset = 0;

  for (let block = 0; block < blockCount; block++) {
    offsets.push(offset);
    offset += shortBlockLength + (block >= longBlockStart ? 1 : 0);
  }

  const result: number[] = [];
  for (let index = 0; index < shortBlockLength; index++) {
    for (let block = 0; block < blockCount; block++) {
      result.push(offsets[block]! + index);
    }
  }
  for (let block = longBlockStart; block < blockCount; block++) {
    result.push(offsets[block]! + shortBlockLength);
  }
  return result;
}

function countRoles(roles: readonly QRCodeExplainRole[]): ReadonlyMap<QRCodeExplainRole, number> {
  const counts = new Map<QRCodeExplainRole, number>();
  for (const role of roles) counts.set(role, (counts.get(role) ?? 0) + 1);
  return counts;
}

function getCharacterCountBits(mode: QRCodeMode, version: QRCodeVersion): number {
  if (mode === 'numeric') return version < 10 ? 10 : version < 27 ? 12 : 14;
  if (mode === 'alphanumeric') return version < 10 ? 9 : version < 27 ? 11 : 13;
  return version < 10 ? 8 : 16;
}

function getPayloadBitCount(data: string, mode: QRCodeMode): number {
  if (mode === 'numeric') {
    const remainder = data.length % 3;
    return Math.floor(data.length / 3) * 10 + (remainder === 1 ? 4 : remainder === 2 ? 7 : 0);
  }
  if (mode === 'alphanumeric') return Math.floor(data.length / 2) * 11 + (data.length % 2) * 6;
  return new TextEncoder().encode(data).length * 8;
}

function resolveMode(data: string, requestedMode: QRCodeMode | undefined): QRCodeMode {
  if (requestedMode !== undefined) return requestedMode;
  if (/^\d*$/.test(data)) return 'numeric';
  if (/^[A-Z0-9 $%*+\-./:]*$/.test(data)) return 'alphanumeric';
  return 'octet';
}

function decodeFormatInformation(matrix: QRCodeMatrix): {
  errorCorrectionLevel: QRCodeErrorCorrectionLevel;
  mask: QRCodeMask;
} {
  const size = matrix.length;
  const rows = [
    0,
    1,
    2,
    3,
    4,
    5,
    7,
    8,
    size - 7,
    size - 6,
    size - 5,
    size - 4,
    size - 3,
    size - 2,
    size - 1,
  ];
  let actualCode = 0;
  for (let index = 0; index < 15; index++) {
    actualCode |= matrix[rows[index]!]![8]! << index;
  }

  for (const errorCorrectionLevel of ERROR_CORRECTION_LEVELS) {
    for (let mask = 0; mask < 8; mask++) {
      const formatValue = (ERROR_CORRECTION_FORMAT_VALUES[errorCorrectionLevel] << 3) | mask;
      const expectedCode = augmentBch(formatValue, 5, 0x537, 10) ^ 0x5412;
      if (actualCode === expectedCode) {
        return {errorCorrectionLevel, mask: mask as QRCodeMask};
      }
    }
  }
  throw new Error('QRCode explain: Unable to decode format information');
}

function augmentBch(value: number, dataBits: number, generator: number, errorBits: number): number {
  let remainder = value << errorBits;
  for (let index = dataBits - 1; index >= 0; index--) {
    if ((remainder >> (errorBits + index)) & 1) remainder ^= generator << index;
  }
  return (value << errorBits) | remainder;
}

function maskApplies(mask: QRCodeMask, row: number, column: number): boolean {
  switch (mask) {
    case 0:
      return (row + column) % 2 === 0;
    case 1:
      return row % 2 === 0;
    case 2:
      return column % 3 === 0;
    case 3:
      return (row + column) % 3 === 0;
    case 4:
      return (Math.floor(row / 2) + Math.floor(column / 3)) % 2 === 0;
    case 5:
      return ((row * column) % 2) + ((row * column) % 3) === 0;
    case 6:
      return (((row * column) % 2) + ((row * column) % 3)) % 2 === 0;
    case 7:
      return (((row + column) % 2) + ((row * column) % 3)) % 2 === 0;
  }
}

function createGroups(
  modules: readonly QRCodeExplainModule[],
): ReadonlyMap<string, QRCodeExplainGroup> {
  const modulesByGroup = new Map<string, QRCodeExplainModule[]>();
  for (const module of modules) {
    const group = modulesByGroup.get(module.groupId) ?? [];
    group.push(module);
    modulesByGroup.set(module.groupId, group);
  }

  const groups = new Map<string, QRCodeExplainGroup>();
  for (const [id, groupModules] of modulesByGroup) {
    const role = groupModules[0]!.role;
    const details = QR_CODE_EXPLAIN_ROLE_DETAILS[role];
    groups.set(id, {
      id,
      role,
      label: getContextualLabel(id, details.label),
      description: details.description,
      modules: groupModules,
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

function getContextualLabel(groupId: string, fallback: string): string {
  if (groupId.startsWith('finder:')) return `${titleCasePosition(groupId.slice(7))} finder pattern`;
  if (groupId.startsWith('separator:')) return `${titleCasePosition(groupId.slice(10))} separator`;
  if (groupId.startsWith('alignment:')) {
    const [, row, column] = groupId.split(':');
    return `Alignment pattern at (${column}, ${row})`;
  }
  return fallback;
}

function titleCasePosition(position: string): string {
  return position
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}
