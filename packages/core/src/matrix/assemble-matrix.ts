import type {
  QRCodeCodewords,
  QRCodeErrorCorrectionLevelValue,
  QRCodeMask,
  QRCodeMatrix,
  QRCodeMutableMatrix,
  QRCodeVersion,
} from '../types';
import {applyMaskToMatrix} from './apply-mask-to-matrix';
import {createBaseMatrix} from './create-base-matrix';
import {evaluateMatrix} from './evaluate-matrix';
import {fillDataInMatrix} from './fill-data-in-matrix';
import {fillFormatInformationInMatrix} from './fill-format-information-in-matrix';

export function assembleQRCodeMatrix(
  version: QRCodeVersion,
  errorCorrectionLevel: QRCodeErrorCorrectionLevelValue,
  codewords: QRCodeCodewords,
  requestedMask: QRCodeMask | undefined,
): QRCodeMatrix {
  const {matrix, reserved} = createBaseMatrix(version);
  const unmaskedMatrix = fillDataInMatrix(matrix, reserved, codewords);
  if (requestedMask !== undefined) {
    applyMaskToMatrix(unmaskedMatrix, reserved, requestedMask);
    return fillFormatInformationInMatrix(unmaskedMatrix, errorCorrectionLevel, requestedMask);
  }

  let bestMatrix: QRCodeMutableMatrix | undefined;
  let bestScore = Infinity;
  for (let index = 0; index < 8; index++) {
    const mask = index as QRCodeMask;
    const candidate = unmaskedMatrix.map((row) => row.slice());
    applyMaskToMatrix(candidate, reserved, mask);
    fillFormatInformationInMatrix(candidate, errorCorrectionLevel, mask);
    const score = evaluateMatrix(candidate);
    if (score < bestScore) {
      bestScore = score;
      bestMatrix = candidate;
    }
  }

  return bestMatrix!;
}
