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
    expect(() => QRCodePNGRenderer({compression: null} as never)).toThrowError(
      expect.objectContaining({details: expect.objectContaining({field: 'compression'})}),
    );
    expect(() => QRCodePNGRenderer({centerImage: []} as never)).toThrowError(
      expect.objectContaining({details: expect.objectContaining({field: 'centerImage'})}),
    );
  });

  test('rejects center-image PNG headers above the pixel budget before decoding', () => {
    const source = Buffer.alloc(24);
    source.write('89504e470d0a1a0a', 'hex');
    source.writeUInt32BE(13, 8);
    source.write('IHDR', 12, 'ascii');
    source.writeUInt32BE(10_000, 16);
    source.writeUInt32BE(10_000, 20);

    const render = QRCodePNGRenderer({centerImage: {source}});

    expect(() => render([[1]])).toThrowError(
      expect.objectContaining({code: 'INVALID_IMAGE_SOURCE'}),
    );
  });
});
