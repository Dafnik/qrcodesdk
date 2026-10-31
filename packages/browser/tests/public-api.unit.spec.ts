import {describe, expect, expectTypeOf, test} from 'vitest';

import type {QRCodeCenterImageLayout, QRCodeMatrixOptions} from '@qrcodesdk/core';

import {
  type QRCodeCanvasCenterImage,
  type QRCodeCanvasOptions,
  type QRCodeCanvasRendererOptions,
  type QRCodeImageOptions,
  type QRCodeImageRendererOptions,
  canvasCenterImage,
} from '../src';

describe('public API types', () => {
  test('exports canonical browser component option types', () => {
    expectTypeOf<QRCodeCanvasOptions>().toEqualTypeOf<
      QRCodeCanvasRendererOptions & {readonly matrix?: QRCodeMatrixOptions}
    >();
    expectTypeOf<QRCodeImageOptions>().toEqualTypeOf<
      QRCodeImageRendererOptions & {readonly matrix?: QRCodeMatrixOptions}
    >();
  });

  test('creates center images with an opt-in factory', () => {
    expect(canvasCenterImage).toBeTypeOf('function');
    expectTypeOf(canvasCenterImage).parameters.toEqualTypeOf<
      [source: CanvasImageSource, layout?: QRCodeCenterImageLayout]
    >();
    expectTypeOf<QRCodeCanvasRendererOptions['centerImage']>().toEqualTypeOf<
      QRCodeCanvasCenterImage | undefined
    >();
    expectTypeOf<QRCodeImageRendererOptions['centerImage']>().toEqualTypeOf<
      QRCodeCanvasCenterImage | undefined
    >();
  });
});
