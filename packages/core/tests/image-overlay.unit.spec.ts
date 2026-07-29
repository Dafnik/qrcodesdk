import {describe, expect, test} from 'vitest';

import {ɵresolveQRCodeImageOverlay} from '../src';

describe('QR code image overlay geometry', () => {
  test('resolves centered defaults relative to the matrix area', () => {
    const resolved = ɵresolveQRCodeImageOverlay(21, 4, {
      source: 'prepared',
    })!;

    expect(resolved).toMatchObject({
      source: 'prepared',
      size: 0.4,
      padding: 1,
      clearBackground: true,
    });
    expect(resolved.imageX).toBeCloseTo(10.3);
    expect(resolved.imageY).toBeCloseTo(10.3);
    expect(resolved.imageSize).toBeCloseTo(8.4);
    expect(resolved.clearX).toBeCloseTo(9.3);
    expect(resolved.clearY).toBeCloseTo(9.3);
    expect(resolved.clearSize).toBeCloseTo(10.4);
  });

  test('allows a full-size image and clamps clearing to the matrix boundary', () => {
    expect(
      ɵresolveQRCodeImageOverlay(21, 4, {
        source: 'prepared',
        size: 1,
        padding: 10,
        clearBackground: false,
      }),
    ).toEqual({
      source: 'prepared',
      size: 1,
      padding: 10,
      clearBackground: false,
      imageX: 4,
      imageY: 4,
      imageSize: 21,
      clearX: 4,
      clearY: 4,
      clearSize: 21,
    });
  });

  test('returns undefined when no image is configured', () => {
    expect(ɵresolveQRCodeImageOverlay(21, 4)).toBeUndefined();
  });

  test.each([0, -0.1, 1.1, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid image size %s',
    (size) => {
      expect(() =>
        ɵresolveQRCodeImageOverlay(21, 4, {
          source: 'prepared',
          size,
        }),
      ).toThrow('QR code image size must be greater than 0 and at most 1');
    },
  );

  test.each([-0.1, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid image padding %s',
    (padding) => {
      expect(() =>
        ɵresolveQRCodeImageOverlay(21, 4, {
          source: 'prepared',
          padding,
        }),
      ).toThrow('QR code image padding must be a non-negative finite number');
    },
  );

  test('rejects a missing source and a non-boolean clearBackground value', () => {
    expect(() =>
      ɵresolveQRCodeImageOverlay(21, 4, {
        source: undefined,
      }),
    ).toThrow('QR code image source is required');

    expect(() =>
      ɵresolveQRCodeImageOverlay(21, 4, {
        source: 'prepared',
        clearBackground: 'yes' as unknown as boolean,
      }),
    ).toThrow('QR code image clearBackground must be a boolean');
  });
});
