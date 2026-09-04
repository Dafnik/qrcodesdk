import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {type QRCodeMask, qrcode} from '@qrcodesdk/core';

import {QR_CODE_EXPLAIN_ROLE_ORDER, explainQRCode} from './qrcode-analyzer.ts';

describe('explainQRCode', () => {
  test('classifies every matrix module using QR placement rules', () => {
    const explanation = explainQRCode({
      data: 'EXPLAIN',
      version: 5,
      errorCorrectionLevel: 'H',
      mask: 3,
      moduleSize: 8,
      quietZone: 4,
    });
    assert.equal(explanation.modules.length, explanation.matrix.length ** 2);
    assert.equal(explanation.moduleGrid.length, explanation.matrix.length);
    assert.ok(explanation.modules.some(({role}) => role === 'functional'));
    assert.ok(explanation.modules.some(({role}) => role === 'encoded'));
    for (const module of explanation.modules) {
      assert.ok(QR_CODE_EXPLAIN_ROLE_ORDER.includes(module.role));
      assert.equal(module.value, explanation.matrix[module.row]![module.column]);
    }
  });

  test('reports public matrix and style settings', () => {
    const explanation = explainQRCode({
      data: '12345',
      version: 1,
      mask: 0,
      moduleSize: 8,
      quietZone: 4,
    });
    assert.equal(explanation.mode, 'numeric');
    assert.equal(explanation.version, 1);
    assert.equal(explanation.errorCorrectionLevel, 'M');
    assert.equal(explanation.mask, 0);
    assert.equal(explanation.moduleSize, 8);
    assert.equal(explanation.quietZone, 4);
    assert.equal(explanation.viewSize, explanation.matrix.length + 8);
  });

  test('maps encoded bits to zig-zag coordinates and stable unmasked values', () => {
    const first = explainQRCode({data: 'MASK CHECK', version: 3, mask: 0});
    const second = explainQRCode({data: 'MASK CHECK', version: 3, mask: 1});
    const encodedFirst = first.modules.filter(({role}) => role === 'encoded').sort(byPlacement);
    const encodedSecond = second.modules.filter(({role}) => role === 'encoded').sort(byPlacement);
    assert.deepEqual(
      encodedFirst.slice(0, 4).map(({row, column}) => ({row, column})),
      [
        {row: 28, column: 28},
        {row: 28, column: 27},
        {row: 27, column: 28},
        {row: 27, column: 27},
      ],
    );
    assert.deepEqual(
      encodedFirst.map(({sourceValue}) => sourceValue),
      encodedSecond.map(({sourceValue}) => sourceValue),
    );
  });

  test('resolves every forced mask and the automatic mask through the public builder', () => {
    for (let mask = 0; mask < 8; mask++) {
      const typedMask = mask as QRCodeMask;
      const explanation = explainQRCode({data: 'MASK CHECK', mask: typedMask});
      assert.equal(explanation.mask, typedMask);
      assert.deepEqual(explanation.matrix, qrcode('MASK CHECK').mask(typedMask).matrix());
    }
    const automatic = explainQRCode({data: 'AUTOMATIC MASK'});
    assert.deepEqual(
      automatic.matrix,
      qrcode('AUTOMATIC MASK').version(automatic.version).mask(automatic.mask).matrix(),
    );
  });

  test('validates matrix and styling inputs through public APIs', () => {
    assert.throws(() => explainQRCode({data: 'ABC', mode: 'numeric'}), /Invalid data format/);
    assert.throws(() => explainQRCode({data: '1', moduleSize: 0}), /moduleSize/);
    assert.throws(() => explainQRCode({data: '1', quietZone: -1}), /quietZone/);
  });
});

function byPlacement(
  first: {placementBitIndex?: number},
  second: {placementBitIndex?: number},
): number {
  return first.placementBitIndex! - second.placementBitIndex!;
}
