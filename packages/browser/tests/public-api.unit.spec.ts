import {describe, expect, expectTypeOf, test} from 'vitest';

import type {QRCodeCenterImageLayout, QRCodeMatrixOptions} from '@qrcodesdk/core';

import {
  type QRCodeCanvasCenterImage,
  type QRCodeCanvasOptions,
  type QRCodeCanvasRendererOptions,
  type QRCodeGIFImageOptions,
  type QRCodeGIFImageRendererOptions,
  type QRCodeImageRendererOptions,
  type QRCodePNGImageOptions,
  type QRCodePNGImageRendererOptions,
  type QRCodeWebPImageOptions,
  type QRCodeWebPImageRendererOptions,
  canvasCenterImage,
} from '../src';

describe('public API types', () => {
  test('exports canonical browser component option types', () => {
    expectTypeOf<QRCodeCanvasOptions>().toEqualTypeOf<
      QRCodeCanvasRendererOptions & {readonly matrix?: QRCodeMatrixOptions}
    >();
    expectTypeOf<QRCodePNGImageOptions>().toEqualTypeOf<
      QRCodePNGImageRendererOptions & {readonly matrix?: QRCodeMatrixOptions}
    >();
    expectTypeOf<QRCodeWebPImageOptions>().toEqualTypeOf<
      QRCodeWebPImageRendererOptions & {readonly matrix?: QRCodeMatrixOptions}
    >();
    expectTypeOf<QRCodeGIFImageOptions>().toEqualTypeOf<
      QRCodeGIFImageRendererOptions & {readonly matrix?: QRCodeMatrixOptions}
    >();
    expectTypeOf<QRCodeGIFImageRendererOptions['transparency']>().toEqualTypeOf<
      {readonly threshold?: number} | undefined
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
