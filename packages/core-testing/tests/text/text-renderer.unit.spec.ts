import {describe, expect, test} from 'vitest';

import {QRCodeTextRenderer} from '@qrcodesdk/core';
import type {QRCodeMatrix} from '@qrcodesdk/core';

describe('QRCodeTextRenderer', () => {
  test('renders default text geometry from a hand-authored matrix', () => {
    const matrix: QRCodeMatrix = [
      [1, 0],
      [0, 1],
    ];

    expect(QRCodeTextRenderer({size: 1, margin: 1})(matrix)).toBe([' ▄  ', '  ▀ '].join('\n'));
  });

  test('renders scaled text with compact half-block characters', () => {
    const matrix: QRCodeMatrix = [
      [1, 0],
      [0, 1],
    ];

    expect(QRCodeTextRenderer({size: 2, margin: 0})(matrix)).toBe(['██  ', '  ██'].join('\n'));
  });

  test('renders custom sizing and margin', () => {
    const matrix: QRCodeMatrix = [
      [0, 1, 0],
      [1, 0, 1],
      [0, 0, 0],
    ];

    expect(
      QRCodeTextRenderer({
        size: 2,
        margin: 1,
      })(matrix),
    ).toBe(['          ', '    ██    ', '  ██  ██  ', '          ', '          '].join('\n'));
  });

  test('renders only blank cells when the matrix has no dark modules', () => {
    expect(
      QRCodeTextRenderer({
        size: 2,
        margin: 0,
      })([
        [0, 0],
        [0, 0],
      ]),
    ).toBe(['    ', '    '].join('\n'));
  });

  test('rejects text output that cannot map cleanly to terminal cells', () => {
    expect(() => QRCodeTextRenderer({size: 1.5})([[1]])).toThrow(
      'Text QR code size must be a positive integer',
    );
    expect(() => QRCodeTextRenderer({margin: -1})([[1]])).toThrow(
      'Text QR code margin must be a non-negative integer',
    );
  });
});
