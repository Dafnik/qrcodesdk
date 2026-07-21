import {describe, expect, test} from 'vitest';

import {QRCodeTextRenderer} from '@qrcodesdk/core';
import type {QRCodeMatrix} from '@qrcodesdk/core';

const ANSI_RESET = '\u001b[0m';
const ANSI_PATTERN = new RegExp(`${String.fromCodePoint(27)}\\[[\\d;]+m`, 'g');

describe('QRCodeTextRenderer', () => {
  test('renders compact plain UTF-8 text by default', () => {
    const matrix: QRCodeMatrix = [
      [1, 0],
      [0, 1],
    ];

    expect(QRCodeTextRenderer({size: 1, margin: 1})(matrix)).toBe([' ▄  ', '  ▀ '].join('\n'));
  });

  test('renders every compact upper and lower module combination', () => {
    expect(
      QRCodeTextRenderer({size: 1, margin: 0})([
        [0, 1],
        [0, 0],
      ]),
    ).toBe(' ▀');
    expect(
      QRCodeTextRenderer({size: 1, margin: 0})([
        [0, 1],
        [1, 1],
      ]),
    ).toBe('▄█');
  });

  test('treats a missing lower compact row as light', () => {
    expect(QRCodeTextRenderer({size: 1, margin: 0})([[1]])).toBe('▀');
  });

  test('scales compact modules and margins', () => {
    const matrix: QRCodeMatrix = [
      [1, 0],
      [0, 1],
    ];

    expect(QRCodeTextRenderer({size: 2, margin: 1})(matrix)).toBe(
      ['        ', '  ██    ', '    ██  ', '        '].join('\n'),
    );
  });

  test('renders full modules with two characters per scaled module', () => {
    const matrix: QRCodeMatrix = [
      [1, 0],
      [0, 1],
    ];

    expect(QRCodeTextRenderer({size: 1, margin: 0, small: false})(matrix)).toBe(
      ['██  ', '  ██'].join('\n'),
    );
  });

  test('scales full modules and margins', () => {
    const matrix: QRCodeMatrix = [
      [1, 0],
      [0, 1],
    ];

    expect(QRCodeTextRenderer({size: 2, margin: 1, small: false})(matrix)).toBe(
      [
        '                ',
        '                ',
        '    ████        ',
        '    ████        ',
        '        ████    ',
        '        ████    ',
        '                ',
        '                ',
      ].join('\n'),
    );
  });

  test('applies custom ANSI foreground and background colors to every line', () => {
    const matrix: QRCodeMatrix = [
      [1, 0],
      [0, 1],
    ];
    const prefix = '\u001b[38;2;26;43;60m\u001b[48;2;221;238;255m';

    expect(
      QRCodeTextRenderer({
        size: 1,
        margin: 0,
        ansiColors: true,
        colors: {colorDark: '#1A2b3C', colorLight: '#DdeEfF'},
      })(matrix),
    ).toBe(`${prefix}▀▄${ANSI_RESET}`);

    const full = QRCodeTextRenderer({
      size: 1,
      margin: 1,
      small: false,
      ansiColors: true,
    })([[1]]);
    expect(full.split('\n')).toHaveLength(3);
    expect(full.split('\n').every((line) => line.endsWith(ANSI_RESET))).toBe(true);
  });

  test('ANSI styling preserves the rendered geometry', () => {
    const options = {size: 1, margin: 0, small: false} as const;
    const matrix: QRCodeMatrix = [
      [1, 0],
      [0, 1],
    ];
    const plain = QRCodeTextRenderer(options)(matrix);
    const styled = QRCodeTextRenderer({...options, ansiColors: true})(matrix);

    expect(plain).not.toContain('\u001b[');
    expect(styled.replaceAll(ANSI_PATTERN, '')).toBe(plain);
  });

  test('renders ANSI-background-only cells without UTF-8 block glyphs', () => {
    const matrix: QRCodeMatrix = [
      [1, 0],
      [0, 1],
    ];
    const darkBackground = '\u001b[48;2;17;34;51m';
    const lightBackground = '\u001b[48;2;221;238;255m';
    const rendererOptions = {
      size: 1,
      margin: 0,
      onlyAnsiColors: true,
      colors: {colorDark: '#112233', colorLight: '#DDEEFF'},
    } as const;
    const expected = [
      `${darkBackground}  ${lightBackground}  ${ANSI_RESET}`,
      `${lightBackground}  ${darkBackground}  ${ANSI_RESET}`,
    ].join('\n');

    expect(QRCodeTextRenderer(rendererOptions)(matrix)).toBe(expected);
    expect(QRCodeTextRenderer({...rendererOptions, small: false})(matrix)).toBe(expected);
    expect(expected).not.toMatch(/[▀▄█]/);
    expect(expected).not.toContain('\u001b[38;');
  });

  test('rejects disabling ANSI for ANSI-background-only output', () => {
    expect(() => QRCodeTextRenderer({onlyAnsiColors: true, ansiColors: false})([[1]])).toThrow(
      'Text QR code onlyAnsiColors requires ansiColors to be enabled',
    );
  });

  test('rejects text output that cannot map cleanly to terminal cells', () => {
    expect(() => QRCodeTextRenderer({size: 1.5})([[1]])).toThrow(
      'Text QR code size must be a positive integer',
    );
    expect(() => QRCodeTextRenderer({margin: -1})([[1]])).toThrow(
      'Text QR code margin must be a non-negative integer',
    );
  });

  test('rejects unsupported colors when ANSI styling is enabled', () => {
    expect(() =>
      QRCodeTextRenderer({ansiColors: true, colors: {colorDark: '#abc'}})([[1]]),
    ).toThrow('Text QR code dark color must be a six-digit hex color');
    expect(() =>
      QRCodeTextRenderer({ansiColors: true, colors: {colorLight: '#not-a-color'}})([[1]]),
    ).toThrow('Text QR code light color must be a six-digit hex color');
  });
});
