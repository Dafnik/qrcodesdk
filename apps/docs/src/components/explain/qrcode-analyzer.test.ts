import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
  type QRCodeErrorCorrectionLevel,
  type QRCodeMask,
  type QRCodeMatrixOptions,
  type QRCodeVersion,
  qrcode,
  ɵassembleQRCodeMatrixWithDetails,
  ɵcreateQRCodeCodewords,
  ɵresolveQRCodeMatrixOptions,
} from '@qrcodesdk/core';

import {
  type QRCodeExplainConfig,
  type QRCodeExplainRole,
  type QRCodeExplanation,
  QR_CODE_EXPLAIN_ROLE_ORDER,
  explainQRCode,
} from './qrcode-analyzer.ts';

const ERROR_CORRECTION_LEVELS = [
  'L',
  'M',
  'Q',
  'H',
] as const satisfies readonly QRCodeErrorCorrectionLevel[];

function countRole(explanation: QRCodeExplanation, role: QRCodeExplainRole): number {
  return explanation.modules.filter((module) => module.role === role).length;
}

function getRawGeneration(data: string, options: QRCodeMatrixOptions = {}) {
  const resolved = ɵresolveQRCodeMatrixOptions(data, options);
  const codewords = ɵcreateQRCodeCodewords(resolved);
  const assembled = ɵassembleQRCodeMatrixWithDetails(
    resolved.version,
    resolved.errorCorrectionLevel,
    codewords,
    resolved.mask,
  );
  return {resolved, codewords, assembled};
}

describe('explainQRCode', () => {
  test('classifies every module from raw generation results', () => {
    for (const errorCorrectionLevel of ERROR_CORRECTION_LEVELS) {
      for (let version = 1; version <= 40; version++) {
        const config = {
          data: '1',
          version: version as QRCodeVersion,
          errorCorrectionLevel,
          mask: 0,
          size: 8,
          margin: 4,
        } as const satisfies QRCodeExplainConfig;
        const explanation = explainQRCode(config);
        const raw = getRawGeneration(config.data, config);
        const functionalCount = raw.assembled.reserved.flat().filter((value) => value === 1).length;
        const remainderCount =
          explanation.matrix.length ** 2 - functionalCount - raw.codewords.length * 8;

        assert.equal(explanation.version, version);
        assert.equal(explanation.errorCorrectionLevel, errorCorrectionLevel);
        assert.equal(explanation.modules.length, explanation.matrix.length ** 2);
        assert.equal(explanation.moduleGrid.length, explanation.matrix.length);
        assert.equal(countRole(explanation, 'functional'), functionalCount);
        assert.equal(countRole(explanation, 'encoded'), raw.codewords.length * 8);
        assert.equal(countRole(explanation, 'remainder'), remainderCount);

        for (const module of explanation.modules) {
          assert.ok(QR_CODE_EXPLAIN_ROLE_ORDER.includes(module.role));
          assert.equal(module.value, explanation.matrix[module.row]![module.column]);
        }
      }
    }
  });

  test('reports resolved matrix and styling settings', () => {
    const numeric = explainQRCode({data: '12345', version: 1, mask: 0, size: 8, margin: 4});
    const octet = explainQRCode({data: 'hello', version: 1, mask: 1, mode: 'octet'});
    const mixed = explainQRCode({data: 'ABCDE12345678?A1A', version: 2, mask: 2, eci: true});

    assert.equal(numeric.mode, 'numeric');
    assert.equal(numeric.version, 1);
    assert.equal(numeric.errorCorrectionLevel, 'M');
    assert.equal(numeric.mask, 0);
    assert.equal(numeric.size, 8);
    assert.equal(numeric.margin, 4);
    assert.equal(numeric.viewSize, numeric.matrix.length + 8);
    assert.equal(octet.mode, 'octet');
    assert.equal(mixed.mode, 'mixed');
  });

  test('maps encoded bits to zig-zag coordinates and codewords', () => {
    const explanation = explainQRCode({data: '1', version: 1, mask: 0});
    const encoded = explanation.modules
      .filter((module) => module.role === 'encoded')
      .sort((first, second) => first.placementBitIndex! - second.placementBitIndex!);

    assert.deepEqual(
      encoded.slice(0, 4).map(({row, column, placementBitIndex, codewordIndex}) => ({
        row,
        column,
        placementBitIndex,
        codewordIndex,
      })),
      [
        {row: 20, column: 20, placementBitIndex: 0, codewordIndex: 0},
        {row: 20, column: 19, placementBitIndex: 1, codewordIndex: 0},
        {row: 19, column: 20, placementBitIndex: 2, codewordIndex: 0},
        {row: 19, column: 19, placementBitIndex: 3, codewordIndex: 0},
      ],
    );
    for (let index = 0; index < encoded.length; index++) {
      assert.equal(encoded[index]!.placementBitIndex, index);
      assert.equal(encoded[index]!.codewordIndex, Math.floor(index / 8));
      assert.notEqual(encoded[index]!.sourceValue, undefined);
    }
  });

  test('keeps source bits stable across masks while rendered values change', () => {
    const mask0 = explainQRCode({data: 'MASK CHECK', version: 3, mask: 0});
    const mask1 = explainQRCode({data: 'MASK CHECK', version: 3, mask: 1});
    const encoded0 = mask0.modules.filter((module) => module.role === 'encoded');
    const encoded1 = mask1.modules.filter((module) => module.role === 'encoded');

    assert.deepEqual(
      encoded0.map(({sourceValue}) => sourceValue),
      encoded1.map(({sourceValue}) => sourceValue),
    );
    assert.ok(encoded0.some((module, index) => module.value !== encoded1[index]!.value));
  });

  test('reports forced masks and automatic mask selection', () => {
    for (let mask = 0; mask < 8; mask++) {
      const explanation = explainQRCode({
        data: 'MASK CHECK',
        errorCorrectionLevel: 'Q',
        mask: mask as QRCodeMask,
      });
      assert.equal(explanation.mask, mask);
      assert.equal(explanation.errorCorrectionLevel, 'Q');
      assert.deepEqual(
        explanation.matrix,
        qrcode('MASK CHECK')
          .errorCorrection('Q')
          .mask(mask as QRCodeMask)
          .matrix(),
      );
    }

    const automatic = explainQRCode({data: 'AUTOMATIC MASK'});
    const forced = qrcode('AUTOMATIC MASK')
      .errorCorrection(automatic.errorCorrectionLevel)
      .version(automatic.version)
      .mask(automatic.mask)
      .matrix();
    assert.deepEqual(automatic.matrix, forced);
  });

  test('groups the reduced module categories and quiet zone', () => {
    const explanation = explainQRCode({data: '1', version: 2, mask: 0});

    for (const role of QR_CODE_EXPLAIN_ROLE_ORDER) {
      const group = explanation.groups.get(role);
      assert.equal(group?.role, role);
      assert.equal(group?.modules.length, countRole(explanation, role));
    }
    assert.equal(explanation.groups.get('margin')?.label, 'Quiet zone');
  });

  test('validates data, size, and margin through shared core APIs', () => {
    assert.throws(
      () => explainQRCode({data: 'ABC', mode: 'numeric'}),
      /QRCode: Invalid data format/,
    );
    assert.throws(() => explainQRCode({data: '1', size: 0}), /size must be a positive integer/);
    assert.throws(
      () => explainQRCode({data: '1', margin: -1}),
      /margin must be a non-negative integer/,
    );
  });
});
