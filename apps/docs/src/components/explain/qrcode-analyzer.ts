import {
  type QRCodeErrorCorrectionLevel,
  type QRCodeMatrix,
  type QRCodeMatrixOptions,
  type QRCodeMode,
  type QRCodeStylingOptions,
  type QRCodeVersion,
  ɵECC_LEVELS,
  ɵECC_LEVELS_MAP,
  ɵMODES,
  ɵMODES_MAP,
  type ɵQRCodeResolvedMatrixOptions,
  ɵassembleQRCodeMatrixWithDetails,
  ɵcreateQRCodeCodewords,
  ɵparseQRCodeStylingOptions,
  ɵresolveQRCodeMatrixOptions,
} from '@qrcodesdk/core';

type QRCodeModule = QRCodeMatrix[number][number];

export type QRCodeExplainRole = 'functional' | 'encoded' | 'remainder';

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
  readonly mask: NonNullable<QRCodeMatrixOptions['mask']>;
  readonly size: number;
  readonly margin: number;
  readonly viewSize: number;
}

type QRCodePlacement = {
  readonly placementBitIndex: number;
  readonly sourceValue: QRCodeModule;
};

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

export function explainQRCode(config: QRCodeExplainConfig): QRCodeExplanation {
  const styling = ɵparseQRCodeStylingOptions({size: config.size, margin: config.margin});
  const resolved = ɵresolveQRCodeMatrixOptions(config.data, {
    mode: config.mode,
    version: config.version,
    errorCorrectionLevel: config.errorCorrectionLevel,
    mask: config.mask,
    eci: config.eci,
  });
  const codewords = ɵcreateQRCodeCodewords(resolved);
  const matrixSize = resolved.version * 4 + 17;
  const placementGrid = Array.from({length: matrixSize}, () =>
    Array.from<QRCodePlacement | undefined>({length: matrixSize}),
  );
  const generated = ɵassembleQRCodeMatrixWithDetails(
    resolved.version,
    resolved.errorCorrectionLevel,
    codewords,
    resolved.mask,
    (row, column, placementBitIndex, sourceValue) => {
      placementGrid[row]![column] = {placementBitIndex, sourceValue};
    },
  );
  const moduleGrid = generated.matrix.map((row, rowIndex) =>
    row.map((value, columnIndex) =>
      createModule(
        rowIndex,
        columnIndex,
        value,
        generated.reserved[rowIndex]![columnIndex] === 1,
        placementGrid[rowIndex]![columnIndex],
        codewords.length * 8,
      ),
    ),
  );
  const modules = moduleGrid.flat();

  return {
    matrix: generated.matrix,
    modules,
    moduleGrid,
    groups: createGroups(modules),
    version: resolved.version,
    mode: resolveModeName(resolved),
    errorCorrectionLevel: resolveErrorCorrectionLevelName(resolved),
    mask: generated.mask,
    size: styling.size,
    margin: styling.margin,
    viewSize: generated.matrix.length + styling.margin * 2,
  };
}

function createModule(
  row: number,
  column: number,
  value: QRCodeModule,
  reserved: boolean,
  placement: QRCodePlacement | undefined,
  codewordBitCount: number,
): QRCodeExplainModule {
  if (reserved) {
    if (placement !== undefined) throwInvalidPlacement(row, column);
    return {key: `${row}:${column}`, row, column, value, role: 'functional', groupId: 'functional'};
  }
  if (placement === undefined) throwInvalidPlacement(row, column);

  if (placement.placementBitIndex >= codewordBitCount) {
    return {key: `${row}:${column}`, row, column, value, role: 'remainder', groupId: 'remainder'};
  }

  return {
    key: `${row}:${column}`,
    row,
    column,
    value,
    sourceValue: placement.sourceValue,
    role: 'encoded',
    groupId: 'encoded',
    placementBitIndex: placement.placementBitIndex,
    codewordIndex: Math.floor(placement.placementBitIndex / 8),
  };
}

function throwInvalidPlacement(row: number, column: number): never {
  throw new Error(
    `QRCode explain: Matrix placement mismatch at (${String(column)}, ${String(row)})`,
  );
}

function resolveModeName(resolved: ɵQRCodeResolvedMatrixOptions): QRCodeMode | 'mixed' {
  const names = new Set(
    resolved.segments.map(({mode}) => ɵMODES.find((candidate) => ɵMODES_MAP[candidate] === mode)),
  );
  if (names.has(undefined)) throw new Error('QRCode explain: Unable to resolve encoded mode');
  return names.size > 1 ? 'mixed' : names.values().next().value!;
}

function resolveErrorCorrectionLevelName(
  resolved: ɵQRCodeResolvedMatrixOptions,
): QRCodeErrorCorrectionLevel {
  const name = ɵECC_LEVELS.find(
    (candidate) => ɵECC_LEVELS_MAP[candidate] === resolved.errorCorrectionLevel,
  );
  if (name === undefined) throw new Error('QRCode explain: Unable to resolve error correction');
  return name;
}

function createGroups(
  modules: readonly QRCodeExplainModule[],
): ReadonlyMap<string, QRCodeExplainGroup> {
  const groups = new Map<string, QRCodeExplainGroup>();
  for (const role of QR_CODE_EXPLAIN_ROLE_ORDER) {
    const details = QR_CODE_EXPLAIN_ROLE_DETAILS[role];
    groups.set(role, {
      id: role,
      role,
      label: details.label,
      description: details.description,
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
