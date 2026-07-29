import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {type QRCodeErrorCorrectionLevel, type QRCodeMask, qrcode} from '@qrcodesdk/core';

import {
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

describe('explainQRCode', () => {
  test('classifies every module for all versions and error-correction levels', () => {
    for (const errorCorrectionLevel of ERROR_CORRECTION_LEVELS) {
      for (let version = 1; version <= 40; version++) {
        const explanation = explainQRCode({
          data: '1',
          version: version as QRCodeExplanation['version'],
          errorCorrectionLevel,
          mask: 0,
          size: 8,
          margin: 4,
        });

        assert.equal(explanation.version, version);
        assert.equal(explanation.errorCorrectionLevel, errorCorrectionLevel);
        assert.equal(explanation.modules.length, explanation.matrix.length ** 2);
        assert.equal(explanation.moduleGrid.length, explanation.matrix.length);

        for (const module of explanation.modules) {
          assert.ok(QR_CODE_EXPLAIN_ROLE_ORDER.includes(module.role));
          assert.equal(module.value, explanation.matrix[module.row]![module.column]);
        }
      }
    }
  });

  test('identifies version-dependent function patterns', () => {
    const version1 = explainQRCode({data: '1', version: 1, mask: 0});
    const version2 = explainQRCode({data: '1', version: 2, mask: 0});
    const version7 = explainQRCode({data: '1', version: 7, mask: 0});
    const version32 = explainQRCode({data: '1', version: 32, mask: 0});
    const version40 = explainQRCode({data: '1', version: 40, mask: 0});

    assert.equal(countRole(version1, 'finder'), 147);
    assert.equal(countRole(version1, 'separator'), 45);
    assert.equal(countRole(version1, 'alignment'), 0);
    assert.equal(countRole(version1, 'version'), 0);
    assert.equal(countRole(version2, 'alignment'), 25);
    assert.equal(countRole(version7, 'version'), 36);
    assert.equal(countRole(version32, 'version'), 36);
    assert.equal(countRole(version40, 'version'), 36);
    assert.ok(countRole(version40, 'alignment') > countRole(version7, 'alignment'));
  });

  test('maps mode, character count, payload, terminator, and padding bits', () => {
    const numeric = explainQRCode({data: '12345', version: 1, mask: 0});
    const alphanumeric = explainQRCode({data: 'HELLO', version: 1, mask: 0});
    const octet = explainQRCode({data: 'hello', version: 1, mask: 0});
    const utf8 = explainQRCode({data: 'Grüße', version: 2, mode: 'octet', mask: 0});

    assert.equal(numeric.mode, 'numeric');
    assert.equal(countRole(numeric, 'mode'), 4);
    assert.equal(countRole(numeric, 'character-count'), 10);
    assert.equal(countRole(numeric, 'payload'), 17);
    assert.equal(countRole(alphanumeric, 'character-count'), 9);
    assert.equal(countRole(alphanumeric, 'payload'), 28);
    assert.equal(octet.mode, 'octet');
    assert.equal(countRole(octet, 'payload'), 40);
    assert.equal(countRole(utf8, 'payload'), new TextEncoder().encode('Grüße').length * 8);
    assert.ok(countRole(numeric, 'terminator') > 0);
    assert.ok(countRole(numeric, 'padding') > 0);
  });

  test('maps semantic bits to their physical zig-zag placement coordinates', () => {
    const explanation = explainQRCode({data: '1', version: 1, mask: 0});

    assert.deepEqual(
      [
        explanation.moduleGrid[20]![20],
        explanation.moduleGrid[20]![19],
        explanation.moduleGrid[19]![20],
        explanation.moduleGrid[19]![19],
      ].map(({role, bitIndex, codewordIndex}) => ({role, bitIndex, codewordIndex})),
      [
        {role: 'mode', bitIndex: 0, codewordIndex: 0},
        {role: 'mode', bitIndex: 1, codewordIndex: 0},
        {role: 'mode', bitIndex: 2, codewordIndex: 0},
        {role: 'mode', bitIndex: 3, codewordIndex: 0},
      ],
    );
    assert.equal(explanation.moduleGrid[20]![20]!.sourceValue, 0);
    assert.equal(explanation.moduleGrid[20]![20]!.value, 1);
    assert.equal(explanation.moduleGrid[19]![19]!.sourceValue, 1);
    assert.equal(explanation.moduleGrid[19]![19]!.value, 0);
  });

  test('reports all forced masks and automatic mask selection', () => {
    for (let mask = 0; mask < 8; mask++) {
      const explanation = explainQRCode({
        data: 'MASK CHECK',
        errorCorrectionLevel: 'Q',
        mask: mask as QRCodeMask,
      });
      assert.equal(explanation.mask, mask);
      assert.equal(explanation.errorCorrectionLevel, 'Q');
    }

    const automatic = explainQRCode({data: 'AUTOMATIC MASK'});
    const forced = qrcode('AUTOMATIC MASK')
      .errorCorrection(automatic.errorCorrectionLevel)
      .version(automatic.version)
      .mask(automatic.mask)
      .matrix();
    assert.deepEqual(automatic.matrix, forced);
  });

  test('tracks interleaved data and error-correction codewords', () => {
    const explanation = explainQRCode({
      data: 'INTERLEAVED BLOCKS',
      version: 10,
      errorCorrectionLevel: 'H',
      mask: 5,
    });
    const dataModules = explanation.modules.filter(
      ({role}) =>
        role === 'mode' ||
        role === 'character-count' ||
        role === 'payload' ||
        role === 'terminator' ||
        role === 'padding',
    );
    const eccModules = explanation.modules.filter(({role}) => role === 'error-correction');

    assert.ok(dataModules.length > 0);
    assert.ok(eccModules.length > 0);
    assert.ok(dataModules.every(({codewordIndex}) => codewordIndex !== undefined));
    assert.ok(eccModules.every(({codewordIndex}) => codewordIndex !== undefined));
    assert.ok(new Set(dataModules.map(({codewordIndex}) => codewordIndex)).size > 1);
  });

  test('preserves contextual functional-pattern groups', () => {
    const explanation = explainQRCode({data: '1', version: 2, mask: 0});

    assert.equal(explanation.groups.get('finder:top-left')?.label, 'Top Left finder pattern');
    assert.equal(explanation.groups.get('separator:top-right')?.label, 'Top Right separator');
    assert.equal(explanation.groups.get('alignment:18:18')?.label, 'Alignment pattern at (18, 18)');
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
