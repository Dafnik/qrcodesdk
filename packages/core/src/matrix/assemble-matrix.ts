import type {
  QRCodeCodewords,
  QRCodeErrorCorrectionLevelValue,
  QRCodeMask,
  QRCodeMatrix,
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
  const {size, modules: base, roles, publicRoles} = createBaseMatrix(version);
  const unmasked = fillDataInMatrix(base.slice(), roles, size, codewords);
  const finish = (modules: Uint8Array, mask: QRCodeMask) => {
    applyMaskToMatrix(modules, roles, size, mask);
    return fillFormatInformationInMatrix(modules, size, errorCorrectionLevel, mask);
  };
  if (requestedMask !== undefined) {
    return {
      size,
      modules: Object.freeze(Array.from(finish(unmasked, requestedMask))),
      roles: publicRoles,
    };
  }

  let bestModules: Uint8Array | undefined;
  let bestScore = Infinity;
  for (let index = 0; index < 8; index++) {
    const candidate = finish(unmasked.slice(), index as QRCodeMask);
    const score = evaluateMatrix(candidate, size, bestScore);
    if (score < bestScore) {
      bestScore = score;
      bestModules = candidate;
    }
  }

  return {size, modules: Object.freeze(Array.from(bestModules!)), roles: publicRoles};
}
