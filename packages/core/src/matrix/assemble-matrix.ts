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
import {QR_CODE_MASKS} from './mask';

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

  applyMaskToMatrix(unmaskedMatrix, reserved, selectedMask);
  fillFormatInformationInMatrix(unmaskedMatrix, errorCorrectionLevel, selectedMask);

  return unmaskedMatrix;
}

function selectBestMask(
  unmaskedMatrix: QRCodeMatrix,
  reserved: QRCodeReservedMatrix,
  errorCorrectionLevel: QRCodeErrorCorrectionLevelValue,
): QRCodeMask {
  let bestMask: QRCodeMask = 0;
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
    }
  }

  return bestMask;
}

function cloneMatrix(matrix: QRCodeMatrix): QRCodeMatrix {
  return matrix.map((row) => row.slice()) as QRCodeMatrix;
}
