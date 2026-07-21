import {create} from 'qrcode';
import qrcodeGenerator from 'qrcode-generator';
import {describe, expect, test} from 'vitest';

import {qrcode} from '@qrcodesdk/core';
import type {QRCodeErrorCorrectionLevel, QRCodeMask, QRCodeMatrix} from '@qrcodesdk/core';

import {
  type QRCodeTestFixture,
  QR_CODE_TEST_FIXTURES,
  TOTAL_QR_CODE_AUTO_MASK_COMBINATIONS,
  TOTAL_QR_CODE_COMBINATIONS,
  getAllQRCodeAutoMaskCombinations,
  getAllQRCodeCombinations,
} from '../src';

const ECC_LEVELS: QRCodeErrorCorrectionLevel[] = ['L', 'M', 'Q', 'H'];
const MASKS: QRCodeMask[] = [0, 1, 2, 3, 4, 5, 6, 7];
const ALL_QR_CODE_COMBINATIONS = [...getAllQRCodeCombinations()];
const ALL_QR_CODE_AUTO_MASK_COMBINATIONS = [...getAllQRCodeAutoMaskCombinations()];

// `qrcode` uses an asymmetric ceiling calculation for N4 density penalties. QRCodeSDK keeps
// its symmetric N4 calculation, so these inputs intentionally choose a different best mask.
const AUTOMATIC_MASK_N4_DIVERGENCES = new Map<
  string,
  {qrcodeSdk: QRCodeMask; reference: QRCodeMask}
>([
  ['version-01_ecc-Q_mask-auto_mode-alphanumeric', {qrcodeSdk: 4, reference: 2}],
  ['version-01_ecc-Q_mask-auto_mode-octet', {qrcodeSdk: 4, reference: 0}],
  ['version-06_ecc-Q_mask-auto_mode-octet', {qrcodeSdk: 0, reference: 4}],
  ['version-07_ecc-L_mask-auto_mode-alphanumeric', {qrcodeSdk: 4, reference: 2}],
  ['version-10_ecc-L_mask-auto_mode-numeric', {qrcodeSdk: 4, reference: 2}],
  ['version-16_ecc-H_mask-auto_mode-alphanumeric', {qrcodeSdk: 0, reference: 2}],
]);

function referenceMatrixQRCodePackage(fixture: QRCodeTestFixture): QRCodeMatrix {
  const encodedData =
    fixture.mode === 'numeric'
      ? [{mode: 'numeric' as const, data: fixture.data}]
      : fixture.mode === 'alphanumeric'
        ? [{mode: 'alphanumeric' as const, data: fixture.data}]
        : fixture.mode === 'octet'
          ? [{mode: 'byte' as const, data: new TextEncoder().encode(fixture.data)}]
          : fixture.data;

  const qr = create(encodedData, {
    errorCorrectionLevel: fixture.errorCorrectionLevel ?? 'M',
    maskPattern: fixture.mask,
    version: fixture.version,
  });

  return Array.from({length: qr.modules.size}, (_, row) =>
    Array.from({length: qr.modules.size}, (_, column) => Number(qr.modules.get(row, column))),
  ) as QRCodeMatrix;
}

function referenceMatrixQRCodeGeneratorPackage(fixture: QRCodeTestFixture): QRCodeMatrix {
  qrcodeGenerator.stringToBytes = (value) => Array.from(new TextEncoder().encode(value));

  const qr = qrcodeGenerator(fixture.version ?? 0, fixture.errorCorrectionLevel ?? 'M');
  qr.addData(
    fixture.data,
    fixture.mode === 'numeric'
      ? 'Numeric'
      : fixture.mode === 'alphanumeric'
        ? 'Alphanumeric'
        : fixture.mode === 'octet'
          ? 'Byte'
          : 'Byte',
  );
  qr.make(fixture.mask);

  return Array.from({length: qr.getModuleCount()}, (_, row) =>
    Array.from({length: qr.getModuleCount()}, (_, column) => Number(qr.isDark(row, column))),
  ) as QRCodeMatrix;
}

describe('qrcode().matrix()', () => {
  test('provides every unique explicit version, ECC level, mask, and mode combination', () => {
    const combinationKeys = ALL_QR_CODE_COMBINATIONS.map(
      ({version, errorCorrectionLevel, mask, mode}) =>
        `${version}-${errorCorrectionLevel}-${mask}-${mode}`,
    );

    expect(ALL_QR_CODE_COMBINATIONS).toHaveLength(TOTAL_QR_CODE_COMBINATIONS);
    expect(new Set(combinationKeys).size).toBe(TOTAL_QR_CODE_COMBINATIONS);
    expect(new Set(ALL_QR_CODE_COMBINATIONS.map(({name}) => name)).size).toBe(
      TOTAL_QR_CODE_COMBINATIONS,
    );
    for (const {data, version} of ALL_QR_CODE_COMBINATIONS) {
      expect(data).toHaveLength(version);
    }
  });

  test('provides every unique automatic-mask version, ECC level, and mode combination', () => {
    const combinationKeys = ALL_QR_CODE_AUTO_MASK_COMBINATIONS.map(
      ({version, errorCorrectionLevel, mode}) => `${version}-${errorCorrectionLevel}-${mode}`,
    );

    expect(ALL_QR_CODE_AUTO_MASK_COMBINATIONS).toHaveLength(TOTAL_QR_CODE_AUTO_MASK_COMBINATIONS);
    expect(new Set(combinationKeys).size).toBe(TOTAL_QR_CODE_AUTO_MASK_COMBINATIONS);
  });

  test('matches reference matrices for explicit modes, ECC levels, versions, and masks', () => {
    for (const fixture of QR_CODE_TEST_FIXTURES) {
      const matrix = qrcode(fixture.data).config(fixture).matrix();
      expect(matrix).toEqual(referenceMatrixQRCodePackage(fixture));
      expect(matrix).toEqual(referenceMatrixQRCodeGeneratorPackage(fixture));
    }
  });

  test('matches reference matrices for every mask and ECC level', () => {
    for (const errorCorrectionLevel of ECC_LEVELS) {
      for (const mask of MASKS) {
        const matrix = qrcode('MASK TEST 123')
          .errorCorrection(errorCorrectionLevel)
          .mask(mask)
          .matrix();
        const fixture = {
          name: `MASK TEST ${errorCorrectionLevel} ${mask}`,
          data: 'MASK TEST 123',
          mode: 'alphanumeric' as const,
          errorCorrectionLevel,
          mask,
        };
        expect(matrix).toEqual(referenceMatrixQRCodePackage(fixture));
        expect(matrix).toEqual(referenceMatrixQRCodeGeneratorPackage(fixture));
      }
    }
  });

  test('matches reference matrix mask selection when the mask is automatic', () => {
    const fixture = {
      name: 'automatic-mask',
      data: 'AUTO MASK 123',
      mode: 'alphanumeric' as const,
      version: 2 as const,
      errorCorrectionLevel: 'M' as const,
    };
    const matrix = qrcode(fixture.data).config(fixture).matrix();

    expect(matrix).toEqual(referenceMatrixQRCodePackage(fixture));
  });

  test('matches the reference automatic mask for the numeric version 1 regression', () => {
    const fixture = {
      name: 'automatic-mask-numeric-version-1',
      data: '1',
      mode: 'numeric' as const,
      version: 1 as const,
      errorCorrectionLevel: 'M' as const,
    };

    expect(qrcode(fixture.data).config(fixture).matrix()).toEqual(
      referenceMatrixQRCodePackage(fixture),
    );
  });

  test.each(ALL_QR_CODE_COMBINATIONS)(
    'matches explicit-mask reference matrices for $name',
    (fixture) => {
      const matrix = qrcode(fixture.data).config(fixture).matrix();

      expect(matrix).toEqual(referenceMatrixQRCodePackage(fixture));
      expect(matrix).toEqual(referenceMatrixQRCodeGeneratorPackage(fixture));
    },
  );

  test.each(ALL_QR_CODE_AUTO_MASK_COMBINATIONS)(
    'matches automatic-mask reference matrix for $name',
    (fixture) => {
      const matrix = qrcode(fixture.data).config(fixture).matrix();
      const referenceMatrix = referenceMatrixQRCodePackage(fixture);
      const knownDivergence = AUTOMATIC_MASK_N4_DIVERGENCES.get(fixture.name);

      if (!knownDivergence) {
        expect(matrix).toEqual(referenceMatrix);
        return;
      }

      expect(matrix).toEqual(
        qrcode(fixture.data).config(fixture).mask(knownDivergence.qrcodeSdk).matrix(),
      );
      expect(referenceMatrix).toEqual(
        qrcode(fixture.data).config(fixture).mask(knownDivergence.reference).matrix(),
      );
    },
  );
});
