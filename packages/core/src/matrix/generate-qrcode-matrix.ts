import {QRCodeError} from '../error';
import type {
  QRCodeErrorCorrectionLevel,
  QRCodeInputData,
  QRCodeMatrix,
  QRCodeMatrixOptions,
  QRCodeMode,
} from '../types';
import {assembleQRCodeMatrix, assembleQRCodeMatrixWithDetails} from './assemble-matrix';
import {createQRCodeFunctionalPatternGrid} from './create-functional-pattern-grid';
import {createQRCodeCodewords, createQRCodeCodewordsWithMetadata} from './create-qrcode-codewords';
import {ECC_LEVELS, ECC_LEVELS_MAP} from './error-correction';
import {getNumberOfAvailableBitsByVersion} from './get-number-of-available-bits-by-version';
import type {QRCodeMatrixGenerationMetadata, QRCodeMatrixModuleMetadata} from './metadata';
import {MODES, MODES_MAP} from './mode';
import {resolveQRCodeMatrixOptions} from './resolve-matrix-options';

export function generateQRCodeMatrix(
  data: QRCodeInputData,
  options?: QRCodeMatrixOptions,
): QRCodeMatrix {
  const resolved = resolveQRCodeMatrixOptions(data, options);
  const codewords = createQRCodeCodewords(resolved);
  return assembleQRCodeMatrix(
    resolved.version,
    resolved.errorCorrectionLevel,
    codewords,
    resolved.mask,
  );
}

export function generateQRCodeMatrixWithMetadata(
  data: QRCodeInputData,
  options?: QRCodeMatrixOptions,
): QRCodeMatrixGenerationMetadata {
  const resolved = resolveQRCodeMatrixOptions(data, options);
  const {codewords, bitMetadata} = createQRCodeCodewordsWithMetadata(resolved);
  const functionalGrid = createQRCodeFunctionalPatternGrid(resolved.version);
  const moduleGrid: (QRCodeMatrixModuleMetadata | undefined)[][] = functionalGrid.map((row) =>
    row.map((metadata) => metadata),
  );
  const remainderBitCount =
    getNumberOfAvailableBitsByVersion(resolved.version) - bitMetadata.length;

  const {matrix, reserved, mask} = assembleQRCodeMatrixWithDetails(
    resolved.version,
    resolved.errorCorrectionLevel,
    codewords,
    resolved.mask,
    (row, column, placementBitIndex, sourceValue) => {
      const encoded = bitMetadata[placementBitIndex];
      moduleGrid[row]![column] =
        encoded === undefined
          ? {
              role: 'remainder',
              groupId: 'remainder',
              bitIndex: placementBitIndex - bitMetadata.length,
              bitCount: remainderBitCount,
            }
          : {
              ...encoded,
              groupId: encoded.role,
              sourceValue,
            };
    },
  );

  validateMetadataGrid(functionalGrid, moduleGrid, reserved);
  return {
    matrix,
    moduleGrid: moduleGrid as QRCodeMatrixModuleMetadata[][],
    version: resolved.version,
    mode: resolveModeName(resolved.segments.map(({mode}) => mode)),
    errorCorrectionLevel: resolveErrorCorrectionLevelName(resolved.errorCorrectionLevel),
    mask,
  };
}

function resolveModeName(modes: readonly number[]): QRCodeMode | 'mixed' {
  const names = new Set(
    modes.map((mode) => MODES.find((candidate) => MODES_MAP[candidate] === mode)),
  );
  if (names.has(undefined)) {
    throw new QRCodeError('RENDER_FAILED', 'QRCode: Unable to resolve encoded mode', {
      details: {modes},
    });
  }
  if (names.size > 1) return 'mixed';
  return names.values().next().value!;
}

function resolveErrorCorrectionLevelName(level: number): QRCodeErrorCorrectionLevel {
  const name = ECC_LEVELS.find((candidate) => ECC_LEVELS_MAP[candidate] === level);
  if (name === undefined) {
    throw new QRCodeError('RENDER_FAILED', 'QRCode: Unable to resolve ECC level', {
      details: {level},
    });
  }
  return name;
}

function validateMetadataGrid(
  functionalGrid: readonly (readonly (QRCodeMatrixModuleMetadata | undefined)[])[],
  moduleGrid: readonly (readonly (QRCodeMatrixModuleMetadata | undefined)[])[],
  reserved: readonly (readonly number[])[],
): void {
  for (let row = 0; row < moduleGrid.length; row++) {
    for (let column = 0; column < moduleGrid.length; column++) {
      const isFunctional = functionalGrid[row]![column] !== undefined;
      if ((reserved[row]![column] === 1) !== isFunctional) {
        throw new QRCodeError(
          'RENDER_FAILED',
          'QRCode: Functional metadata does not match reserved matrix modules',
          {details: {row, column}},
        );
      }
      if (moduleGrid[row]![column] === undefined) {
        throw new QRCodeError('RENDER_FAILED', 'QRCode: Missing matrix module metadata', {
          details: {row, column},
        });
      }
    }
  }
}
