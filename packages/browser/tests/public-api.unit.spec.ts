import {describe, expectTypeOf, test} from 'vitest';

import type {QRCodeCenterImageOptions, QRCodeMatrixOptions} from '@qrcodesdk/core';

import type {
  QRCodeCanvasCenterImageOptions,
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
    expectTypeOf<QRCodeCanvasCenterImageOptions>().toEqualTypeOf<
      QRCodeCenterImageOptions<CanvasImageSource>
    >();
    expectTypeOf<QRCodeImageOptions>().toEqualTypeOf<
      QRCodeImageRendererOptions & {readonly matrix?: QRCodeMatrixOptions}
    >();
  });
});
