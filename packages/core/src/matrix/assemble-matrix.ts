import type {
  QRCodeCodewords,
  QRCodeErrorCorrectionLevelValue,
  QRCodeMask,
  QRCodeMatrix,
  QRCodeReservedMatrix,
  QRCodeVersion,
} from '../types';
import {applyMaskToMatrix} from './apply-mask-to-matrix';
import {createBaseMatrix} from './create-base-matrix';
import {evaluateMatrix} from './evaluate-matrix';
import {type QRCodeDataModuleVisitor, fillDataInMatrix} from './fill-data-in-matrix';
import {fillFormatInformationInMatrix} from './fill-format-information-in-matrix';
import {QR_CODE_MASKS} from './mask';

export function assembleQRCodeMatrix(
  version: QRCodeVersion,
  errorCorrectionLevel: QRCodeErrorCorrectionLevelValue,
  codewords: QRCodeCodewords,
  requestedMask: QRCodeMask | undefined,
): QRCodeMatrix {
  return assembleQRCodeMatrixWithDetails(version, errorCorrectionLevel, codewords, requestedMask)
    .matrix;
}

export type QRCodeMatrixAssembly = {
  readonly matrix: QRCodeMatrix;
  readonly reserved: QRCodeReservedMatrix;
  readonly mask: QRCodeMask;
};

export function assembleQRCodeMatrixWithDetails(
  version: QRCodeVersion,
  errorCorrectionLevel: QRCodeErrorCorrectionLevelValue,
  codewords: QRCodeCodewords,
  requestedMask: QRCodeMask | undefined,
  visitDataModule?: QRCodeDataModuleVisitor,
): QRCodeMatrixAssembly {
  const {matrix, reserved} = createBaseMatrix(version);
  const unmaskedMatrix = fillDataInMatrix(matrix, reserved, codewords, visitDataModule);
  if (requestedMask === undefined) {
    const selected = selectBestMask(unmaskedMatrix, reserved, errorCorrectionLevel);
    return {matrix: selected.matrix, reserved, mask: selected.mask};
  }

  applyMaskToMatrix(unmaskedMatrix, reserved, requestedMask);
  fillFormatInformationInMatrix(unmaskedMatrix, errorCorrectionLevel, requestedMask);

  return {matrix: unmaskedMatrix, reserved, mask: requestedMask};
}

function selectBestMask(
  unmaskedMatrix: QRCodeMatrix,
  reserved: QRCodeReservedMatrix,
  errorCorrectionLevel: QRCodeErrorCorrectionLevelValue,
): Pick<QRCodeMatrixAssembly, 'matrix' | 'mask'> {
  let bestMask: QRCodeMask = 0;
  let bestMatrix: QRCodeMatrix | undefined;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let index = 0; index < QR_CODE_MASKS.length; index++) {
    const mask = QR_CODE_MASKS[index]!;
    const candidateMatrix = cloneMatrix(unmaskedMatrix);
    applyMaskToMatrix(candidateMatrix, reserved, mask);
    fillFormatInformationInMatrix(candidateMatrix, errorCorrectionLevel, mask);

    const score = evaluateMatrix(candidateMatrix);
    if (score < bestScore) {
      bestScore = score;
      bestMask = mask;
      bestMatrix = candidateMatrix;
    }
  }

  return {matrix: bestMatrix!, mask: bestMask};
}

function cloneMatrix(matrix: QRCodeMatrix): QRCodeMatrix {
  return matrix.map((row) => row.slice()) as QRCodeMatrix;
}
