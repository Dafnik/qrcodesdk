import type {QRCodeMask, QRCodeMatrix, QRCodeVersion} from '../types';
import {applyMaskToMatrix} from './apply-mask-to-matrix';
import {createBaseMatrix} from './create-base-matrix';
import {evaluateMatrix} from './evaluate-matrix';
import {fillDataInMatrix} from './fill-data-in-matrix';
import {fillFormatInformationInMatrix} from './fill-format-information-in-matrix';
import type {QRCodeCodewords, QRCodeErrorCorrectionLevelValue} from './types';

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
      modules: toPublicModules(finish(unmasked, requestedMask)),
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

  return {
    size,
    modules: toPublicModules(bestModules!),
    roles: publicRoles,
  };
}

/** Copies modules into a frozen array. An indexed loop avoids the slow typed-array iterator. */
function toPublicModules(modules: Uint8Array): readonly (0 | 1)[] {
  const copy = new Array<0 | 1>(modules.length);
  for (let index = 0; index < modules.length; index++) copy[index] = modules[index] as 0 | 1;
  return Object.freeze(copy);
}
