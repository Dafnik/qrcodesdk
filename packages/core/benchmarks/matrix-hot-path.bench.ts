import {describe, test} from 'vitest';

import {qrcode} from '../src';
import {applyMaskToMatrix} from '../src/matrix/apply-mask-to-matrix';
import {assembleQRCodeMatrix} from '../src/matrix/assemble-matrix';
import {createBaseMatrix} from '../src/matrix/create-base-matrix';
import {createQRCodeCodewords} from '../src/matrix/create-qrcode-codewords';
import {evaluateMatrix} from '../src/matrix/evaluate-matrix';
import {fillDataInMatrix} from '../src/matrix/fill-data-in-matrix';
import {fillFormatInformationInMatrix} from '../src/matrix/fill-format-information-in-matrix';
import {resolveQRCodeMatrixOptions} from '../src/matrix/resolve-matrix-options';
import type {QRCodeMask, QRCodeVersion} from '../src/types';

const VERSIONS = [1, 7, 20, 40] as const satisfies readonly QRCodeVersion[];
const MASKS = [0, 1, 2, 3, 4, 5, 6, 7] as const satisfies readonly QRCodeMask[];

function createDeterministicModules(version: QRCodeVersion): Uint8Array {
  const size = 17 + 4 * version;
  let state = version;

  return Uint8Array.from({length: size * size}, () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state >>> 31;
  });
}

describe('matrix hot paths', () => {
  for (const version of VERSIONS) {
    test(`version ${String(version)}`, async ({bench}) => {
      const modules = createDeterministicModules(version);
      const size = 17 + 4 * version;

      await bench.compare(
        bench('evaluate matrix', () => {
          evaluateMatrix(modules, size);
        }),
        bench('automatic mask', () => {
          qrcode('A').options({mode: 'alphanumeric', version}).matrix();
        }),
        bench('explicit mask', () => {
          qrcode('A').options({mask: 0, mode: 'alphanumeric', version}).matrix();
        }),
      );
    });
  }
});

describe('explicit mask variants', () => {
  test('version 20', async ({bench}) => {
    await bench.compare(
      ...MASKS.map((mask) =>
        bench(`mask ${String(mask)}`, () => {
          qrcode('A').options({mask, mode: 'alphanumeric', version: 20}).matrix();
        }),
      ),
    );
  });
});

describe('explicit mask stages', () => {
  for (const version of VERSIONS) {
    test(`version ${String(version)}`, async ({bench}) => {
      const options = {mask: 0 as const, mode: 'alphanumeric' as const, version};
      const resolved = resolveQRCodeMatrixOptions('A', options);
      const codewords = createQRCodeCodewords(resolved);
      const {size, modules: base, roles} = createBaseMatrix(version);
      const modules = base.slice();

      await bench.compare(
        bench('resolve options', () => {
          resolveQRCodeMatrixOptions('A', options);
        }),
        bench('create codewords', () => {
          createQRCodeCodewords(resolved);
        }),
        bench('copy cached base matrix', () => {
          createBaseMatrix(version).modules.slice();
        }),
        bench('fill data', () => {
          fillDataInMatrix(modules, roles, size, codewords);
        }),
        bench('apply mask', () => {
          applyMaskToMatrix(modules, roles, size, 0);
        }),
        bench('fill format', () => {
          fillFormatInformationInMatrix(modules, size, resolved.errorCorrectionLevel, 0);
        }),
        bench('assemble matrix', () => {
          assembleQRCodeMatrix(version, resolved.errorCorrectionLevel, codewords, 0);
        }),
      );
    });
  }
});
