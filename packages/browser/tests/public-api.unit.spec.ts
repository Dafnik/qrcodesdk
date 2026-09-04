import {describe, expectTypeOf, test} from 'vitest';

import type {QRCodeImageOverlayOptions, QRCodeMatrixOptions} from '@qrcodesdk/core';

import type {
  QRCodeCanvasImageOptions,
  QRCodeCanvasOptions,
  QRCodeCanvasRendererOptions,
  QRCodeImageOptions,
  QRCodeImageRendererOptions,
} from '../src';

describe('public API types', () => {
  test('exports canonical browser component option types', () => {
    expectTypeOf<QRCodeCanvasOptions>().toEqualTypeOf<
      QRCodeCanvasRendererOptions & {readonly matrix?: QRCodeMatrixOptions}
    >();
    expectTypeOf<QRCodeCanvasImageOptions>().toEqualTypeOf<
      QRCodeImageOverlayOptions<CanvasImageSource>
    >();
    expectTypeOf<QRCodeImageOptions>().toEqualTypeOf<
      QRCodeImageRendererOptions & {readonly matrix?: QRCodeMatrixOptions}
    >();
  });
});
