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
import {fillDataInMatrix} from './fill-data-in-matrix';
import {fillFormatInformationInMatrix} from './fill-format-information-in-matrix';

const QR_CODE_MASKS = [0, 1, 2, 3, 4, 5, 6, 7] as const;

export function assembleQRCodeMatrix(
  version: QRCodeVersion,
  errorCorrectionLevel: QRCodeErrorCorrectionLevelValue,
  codewords: QRCodeCodewords,
  requestedMask: QRCodeMask | undefined,
): QRCodeMatrix {
  const {matrix, reserved} = createBaseMatrix(version);
  const unmaskedMatrix = fillDataInMatrix(matrix, reserved, codewords);
  const selectedMask =
    requestedMask ?? selectBestMask(unmaskedMatrix, reserved, errorCorrectionLevel);
  const finalMatrix = cloneMatrix(unmaskedMatrix);

  applyMaskToMatrix(finalMatrix, reserved, selectedMask);
  fillFormatInformationInMatrix(finalMatrix, errorCorrectionLevel, selectedMask);

  return finalMatrix;
}

function selectBestMask(
  unmaskedMatrix: QRCodeMatrix,
  reserved: QRCodeReservedMatrix,
  errorCorrectionLevel: QRCodeErrorCorrectionLevelValue,
): QRCodeMask {
  let bestMask: QRCodeMask = 0;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const mask of QR_CODE_MASKS) {
    const candidateMatrix = cloneMatrix(unmaskedMatrix);
    applyMaskToMatrix(candidateMatrix, reserved, mask);
    fillFormatInformationInMatrix(candidateMatrix, errorCorrectionLevel, mask);

    const score = evaluateMatrix(candidateMatrix);
    if (score < bestScore) {
      bestScore = score;
      bestMask = mask;
    }
  }

  return bestMask;
}

function cloneMatrix(matrix: QRCodeMatrix): QRCodeMatrix {
  return matrix.map((row) => row.slice()) as QRCodeMatrix;
}
