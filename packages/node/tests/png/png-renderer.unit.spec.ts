import {PNG} from 'pngjs';
import {describe, expect, test} from 'vitest';

import {QRCodeError} from '@qrcodesdk/core';

import {QRCodePNGRenderer} from '../../src';

describe('QRCodePNGRenderer', () => {
  test('renders production dimensions and RGBA colors', () => {
    const bytes = QRCodePNGRenderer({
      style: {
        moduleSize: 4,
        quietZone: 1,
        foreground: '#112233cc',
        background: '#ffffff80',
      },
    })([[1]]);
    const png = PNG.sync.read(bytes);
    expect(png.width).toBe(12);
    expect(png.height).toBe(12);
    expect([...png.data.subarray(0, 4)]).toEqual([255, 255, 255, 128]);
  });

  test('renders curved finder and module shapes through the drawing protocol', () => {
    const png = PNG.sync.read(
      QRCodePNGRenderer({
        style: {
          moduleSize: 8,
          quietZone: 0,
          modules: {shape: 'circle'},
          finder: {outer: {shape: 'extra-rounded'}, center: {shape: 'rounded'}},
        },
      })([[1]]),
    );
    expect([...png.data.subarray(0, 3)]).toEqual([255, 255, 255]);
    const center = (4 * png.width + 4) * 4;
    expect([...png.data.subarray(center, center + 3)]).toEqual([0, 0, 0]);
  });

  test('validates nested compression and rejects legacy fields eagerly', () => {
    expect(() => QRCodePNGRenderer({compression: {level: 10}})).toThrowError(QRCodeError);
    expect(() => QRCodePNGRenderer({compressionLevel: 9} as never)).toThrowError(
      expect.objectContaining({
        details: expect.objectContaining({field: 'options.compressionLevel'}),
      }),
    );
  });
});
