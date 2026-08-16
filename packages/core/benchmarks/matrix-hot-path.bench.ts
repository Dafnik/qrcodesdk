import {bench, describe} from 'vitest';

import {qrcode} from '../src';
import {applyMaskToMatrix} from '../src/matrix/apply-mask-to-matrix';
import {assembleQRCodeMatrix} from '../src/matrix/assemble-matrix';
import {createBaseMatrix} from '../src/matrix/create-base-matrix';
import {createQRCodeCodewords} from '../src/matrix/create-qrcode-codewords';
import {evaluateMatrix} from '../src/matrix/evaluate-matrix';
import {fillDataInMatrix} from '../src/matrix/fill-data-in-matrix';
import {fillFormatInformationInMatrix} from '../src/matrix/fill-format-information-in-matrix';
import {resolveQRCodeMatrixOptions} from '../src/matrix/resolve-matrix-options';
import type {QRCodeMask, QRCodeMatrix, QRCodeModule, QRCodeVersion} from '../src/types';

const VERSIONS = [1, 7, 20, 40] as const satisfies readonly QRCodeVersion[];
const MASKS = [0, 1, 2, 3, 4, 5, 6, 7] as const satisfies readonly QRCodeMask[];

function createDeterministicMatrix(version: QRCodeVersion): QRCodeMatrix {
  const size = 17 + 4 * version;
  let state = version;

  return Array.from({length: size}, () =>
    Array.from({length: size}, () => {
      state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
      return (state >>> 31) as QRCodeModule;
    }),
  );
}

describe('matrix hot paths', () => {
  for (const version of VERSIONS) {
    const matrix = createDeterministicMatrix(version);

    bench(`evaluateMatrix version ${String(version)}`, () => {
      evaluateMatrix(matrix);
    });

    bench(`automatic mask version ${String(version)}`, () => {
      qrcode('A').config({mode: 'alphanumeric', version}).matrix();
    });

    bench(`explicit mask version ${String(version)}`, () => {
      qrcode('A').config({mask: 0, mode: 'alphanumeric', version}).matrix();
    });
  }
});

describe('explicit mask variants', () => {
  for (const mask of MASKS) {
    bench(`explicit mask ${String(mask)} version 20`, () => {
      qrcode('A').config({mask, mode: 'alphanumeric', version: 20}).matrix();
    });
  }
});

describe('explicit mask stages', () => {
  for (const version of VERSIONS) {
    const options = {mask: 0 as const, mode: 'alphanumeric' as const, version};
    const resolved = resolveQRCodeMatrixOptions('A', options);
    const codewords = createQRCodeCodewords(resolved);
    const {matrix, reserved} = createBaseMatrix(version);

    bench(`resolve options version ${String(version)}`, () => {
      resolveQRCodeMatrixOptions('A', options);
    });

    bench(`create codewords version ${String(version)}`, () => {
      createQRCodeCodewords(resolved);
    });

    bench(`create base matrix version ${String(version)}`, () => {
      createBaseMatrix(version);
    });

    bench(`fill data version ${String(version)}`, () => {
      fillDataInMatrix(matrix, reserved, codewords);
    });

    bench(`apply mask version ${String(version)}`, () => {
      applyMaskToMatrix(matrix, reserved, 0);
    });

    bench(`fill format version ${String(version)}`, () => {
      fillFormatInformationInMatrix(matrix, resolved.errorCorrectionLevel, 0);
    });

    bench(`assemble matrix version ${String(version)}`, () => {
      assembleQRCodeMatrix(version, resolved.errorCorrectionLevel, codewords, 0);
    });
  }
});
