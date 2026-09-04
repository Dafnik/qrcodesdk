import {describe, expect, test} from 'vitest';

import {QRCodeError, QRCodeSVGRenderer, QRCodeTextRenderer, createQRCodeStyler} from '../src';

describe('styling validation', () => {
  test.each([
    [{moduleSize: 0}, 'style.moduleSize'],
    [{quietZone: -1}, 'style.quietZone'],
    [{foreground: '#12345'}, 'style.foreground'],
    [{background: 'red'}, 'style.background'],
    [{modules: {shape: 'hexagon'}}, 'style.modules.shape'],
    [{finder: {outer: {shape: 'diagonal'}}}, 'style.finder.outer.shape'],
    [{unknown: true}, 'style.unknown'],
    [{modules: {unknown: true}}, 'style.modules.unknown'],
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

  test('validates renderer options when the factory is called', () => {
    expect(() => QRCodeSVGRenderer({style: {moduleSize: 0}})).toThrowError(QRCodeError);
    expect(() => QRCodeTextRenderer({style: {quietZone: -1}})).toThrowError(QRCodeError);
    expect(() => QRCodeSVGRenderer({style: {}, extra: true} as never)).toThrowError(
      expect.objectContaining({details: expect.objectContaining({field: 'options.extra'})}),
    );
    expect(() => QRCodeSVGRenderer({accessibility: {title: 1 as never}})).toThrowError(
      expect.objectContaining({
        details: expect.objectContaining({field: 'accessibility.title'}),
      }),
    );
  });

  test('rejects text layout for ANSI background mode', () => {
    expect(() =>
      QRCodeTextRenderer({layout: 'compact', ansi: {mode: 'background'}} as never),
    ).toThrowError(expect.objectContaining({details: expect.objectContaining({field: 'layout'})}));
  });

  test('composites ANSI RGBA colors instead of dropping alpha', () => {
    const output = QRCodeTextRenderer({
      style: {moduleSize: 1, quietZone: 0},
      ansi: {foreground: '#ff000080', background: '#0000ff80'},
    })([[1]]);

    expect(output).toContain('\u001b[38;2;191;63;127m');
    expect(output).toContain('\u001b[48;2;127;127;255m');
  });
});
