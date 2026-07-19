import {describe, expect, test} from 'vitest';

import {QRCodeTextRenderer} from '@qrcodesdk/core';
import type {QRCodeMatrix} from '@qrcodesdk/core';

const BLACK_BACKGROUND = '\u001b[48;2;0;0;0m';
const WHITE_BACKGROUND = '\u001b[48;2;255;255;255m';
const RESET = '\u001b[0m';

function fullSizeCell(dark: boolean): string {
  return `${dark ? BLACK_BACKGROUND : WHITE_BACKGROUND}  `;
}

function fullSizeLine(...modules: boolean[]): string {
  return `${modules.map(fullSizeCell).join('')}${RESET}`;
}

describe('QRCodeTextRenderer', () => {
  test('renders ANSI background cells by default', () => {
    const matrix: QRCodeMatrix = [
      [1, 0],
      [0, 1],
    ];

    expect(QRCodeTextRenderer({size: 1, margin: 1})(matrix)).toBe(
      [
        fullSizeLine(false, false, false, false),
        fullSizeLine(false, true, false, false),
        fullSizeLine(false, false, true, false),
        fullSizeLine(false, false, false, false),
      ].join('\n'),
    );
  });

  test('renders scaled modules as repeated ANSI background cells', () => {
    const matrix: QRCodeMatrix = [
      [1, 0],
      [0, 1],
    ];

    expect(QRCodeTextRenderer({size: 2, margin: 0})(matrix)).toBe(
      [
        fullSizeLine(true, true, false, false),
        fullSizeLine(true, true, false, false),
        fullSizeLine(false, false, true, true),
        fullSizeLine(false, false, true, true),
      ].join('\n'),
    );
  });

  test('renders only white background cells when the matrix has no dark modules', () => {
    expect(
      QRCodeTextRenderer({
        size: 1,
        margin: 0,
      })([
        [0, 0],
        [0, 0],
      ]),
    ).toBe([fullSizeLine(false, false), fullSizeLine(false, false)].join('\n'));
  });

  test('renders matching compact modules with plain Unicode characters', () => {
    const matrix: QRCodeMatrix = [
      [0, 1],
      [0, 1],
    ];

    expect(QRCodeTextRenderer({size: 1, margin: 0, small: true})(matrix)).toBe(' █');
  });

  test('renders differing compact modules with plain Unicode half blocks', () => {
    const matrix: QRCodeMatrix = [
      [0, 1],
      [1, 0],
    ];

    expect(QRCodeTextRenderer({size: 1, margin: 0, small: true})(matrix)).toBe('▄▀');
  });

  test('treats a missing lower compact row as light', () => {
    expect(QRCodeTextRenderer({size: 1, margin: 0, small: true})([[1]])).toBe('▀');
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
