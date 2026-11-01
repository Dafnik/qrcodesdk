import {describe, expect, test} from 'vitest';

import {QRCodeError, QRCodeSVGRenderer, QRCodeTextRenderer, svgCenterImage} from '../src';
import {ɵcreateQRCodeStyler as createQRCodeStyler} from '../src/internal';
import {customShape} from '../src/style';
import {fromRows} from './helpers';

describe('styling validation', () => {
  test.each([
    [{moduleSize: 0}, 'style.moduleSize'],
    [{quietZone: -1}, 'style.quietZone'],
    [{foreground: '#12345'}, 'style.foreground'],
    [{background: '#gggggg'}, 'style.background'],
  ])('rejects invalid visual style %#', (style, field) => {
    expect(() => createQRCodeStyler(style as never)).toThrowError(
      expect.objectContaining<Partial<QRCodeError>>({
        code: 'INVALID_OPTIONS',
        details: expect.objectContaining({field}),
      }),
    );
  });

  test('accepts RGB and RGBA colors case-insensitively', () => {
    expect(() =>
      createQRCodeStyler({foreground: '#AaBbCc', background: '#00112280'}),
    ).not.toThrow();
  });

  test.each([
    'm0 0hz',
    'm0 0l1z',
    'm0 0h1v1h-1az',
    'm0 0a1 1 0 2 1 1 1z',
    'm0 0h1e999z',
    'm0 0m1 1z',
    'm0 0h1zz',
    'm0,,0z',
    'm0\u000b0h1v1h-1z',
    'm0\u00a00h1v1h-1z',
  ])('rejects malformed relative paths: %s', (module) => {
    expect(() => customShape({module})).toThrowError(
      expect.objectContaining({
        code: 'INVALID_OPTIONS',
        details: {field: 'customShape.module', value: module},
      }),
    );
  });

  test('validates value constraints when the renderer is created', () => {
    expect(() => QRCodeSVGRenderer({style: {moduleSize: 0}})).toThrowError(QRCodeError);
    expect(() => QRCodeTextRenderer({style: {quietZone: -1}})).toThrowError(QRCodeError);
    expect(() => QRCodeSVGRenderer({accessibility: {title: '\0'}})).toThrowError(
      expect.objectContaining({code: 'INVALID_OPTIONS'}),
    );
    expect(() => svgCenterImage('data:image/png;base64,a\0')).toThrowError(
      expect.objectContaining({code: 'INVALID_IMAGE_SOURCE'}),
    );
  });

  test.each(['foreground', 'background'] as const)(
    'reports the ANSI option path for invalid %s colors',
    (color) => {
      const field = `ansi.${color}`;
      expect(() => QRCodeTextRenderer({ansi: {[color]: '#gggggg'}})).toThrowError(
        expect.objectContaining({
          code: 'INVALID_OPTIONS',
          message: expect.stringContaining(`QR code ${field} must be`),
          details: {field, value: '#gggggg'},
        }),
      );
    },
  );

  test('composites ANSI RGBA colors instead of dropping alpha', () => {
    const output = QRCodeTextRenderer({
      style: {moduleSize: 1, quietZone: 0},
      ansi: {foreground: '#ff000080', background: '#0000ff80'},
    })(fromRows([[1]]));

    expect(output).toContain('\u001b[38;2;191;63;127m');
    expect(output).toContain('\u001b[48;2;127;127;255m');
  });
});
