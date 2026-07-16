import {create} from 'qrcode';
import qrcodeGenerator from 'qrcode-generator';
import {describe, expect, test} from 'vitest';

import {qrcode} from '@qrcodesdk/core';
import type {QRCodeErrorCorrectionLevel, QRCodeMask, QRCodeMatrix} from '@qrcodesdk/core';

import {
  type QRCodeTestFixture,
  QR_CODE_TEST_FIXTURES,
  TOTAL_QR_CODE_COMBINATIONS,
  getAllQRCodeCombinations,
} from '../src';

const ECC_LEVELS: QRCodeErrorCorrectionLevel[] = ['L', 'M', 'Q', 'H'];
const MASKS: QRCodeMask[] = [0, 1, 2, 3, 4, 5, 6, 7];
const ALL_QR_CODE_COMBINATIONS = [...getAllQRCodeCombinations()];

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
  test('provides every unique version, ECC level, mask, and mode combination', () => {
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

  test.each(ALL_QR_CODE_COMBINATIONS)('matches reference matrices for $name', (fixture) => {
    const matrix = qrcode(fixture.data).config(fixture).matrix();

    expect(matrix).toEqual(referenceMatrixQRCodePackage(fixture));
    expect(matrix).toEqual(referenceMatrixQRCodeGeneratorPackage(fixture));
  });
});
