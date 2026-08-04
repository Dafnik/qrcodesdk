import {
  type QRCodeErrorCorrectionLevel,
  type QRCodeMask,
  type QRCodeMatrix,
  type QRCodeMatrixOptions,
  type QRCodeMode,
  type QRCodeStylingOptions,
  type QRCodeVersion,
  type ɵQRCodeMatrixMetadataRole,
  ɵgenerateQRCodeMatrixWithMetadata,
  ɵparseQRCodeStylingOptions,
} from '@qrcodesdk/core';

type QRCodeModule = QRCodeMatrix[number][number];

export type QRCodeExplainRole = ɵQRCodeMatrixMetadataRole;

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
  readonly mode: QRCodeMode | 'mixed';
  readonly errorCorrectionLevel: QRCodeErrorCorrectionLevel;
  readonly mask: QRCodeMask;
  readonly size: number;
  readonly margin: number;
  readonly viewSize: number;
}

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
  const styling = ɵparseQRCodeStylingOptions({size: config.size, margin: config.margin});
  const generated = ɵgenerateQRCodeMatrixWithMetadata(config.data, {
    mode: config.mode,
    version: config.version,
    errorCorrectionLevel: config.errorCorrectionLevel,
    mask: config.mask,
  });
  const moduleGrid = generated.moduleGrid.map((row, rowIndex) =>
    row.map(
      (metadata, columnIndex) =>
        ({
          ...metadata,
          key: `${rowIndex}:${columnIndex}`,
          row: rowIndex,
          column: columnIndex,
          value: generated.matrix[rowIndex]![columnIndex]!,
        }) satisfies QRCodeExplainModule,
    ),
  );
  const modules = moduleGrid.flat();
  const groups = createGroups(modules);

  return {
    matrix: generated.matrix,
    modules,
    moduleGrid,
    groups,
    version: generated.version,
    mode: generated.mode,
    errorCorrectionLevel: generated.errorCorrectionLevel,
    mask: generated.mask,
    size: styling.size,
    margin: styling.margin,
    viewSize: generated.matrix.length + styling.margin * 2,
  };
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
