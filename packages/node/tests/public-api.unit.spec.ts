import {describe, expect, expectTypeOf, test} from 'vitest';

import type {QRCodeCenterImageLayout} from '@qrcodesdk/core';

import {
  QRCodeGIFRenderer,
  type QRCodeGIFRendererOptions,
  QRCodePNGRenderer,
  type QRCodePNGRendererOptions,
  type QRCodeRasterCenterImage,
  QRCodeWebPRenderer,
  type QRCodeWebPRendererOptions,
  rasterCenterImage,
} from '../src';

describe('public API types', () => {
  test('exports the raster renderer options and opt-in center images', () => {
    expect(rasterCenterImage).toBeTypeOf('function');
    expectTypeOf(rasterCenterImage).parameters.toEqualTypeOf<
      [source: Uint8Array, layout?: QRCodeCenterImageLayout]
    >();
    expectTypeOf<QRCodePNGRendererOptions['centerImage']>().toEqualTypeOf<
      QRCodeRasterCenterImage | undefined
    >();
    expectTypeOf<QRCodeWebPRendererOptions['centerImage']>().toEqualTypeOf<
      QRCodeRasterCenterImage | undefined
    >();
    expectTypeOf<QRCodeGIFRendererOptions['centerImage']>().toEqualTypeOf<
      QRCodeRasterCenterImage | undefined
    >();
    expectTypeOf<QRCodePNGRendererOptions['compression']>().toEqualTypeOf<
      {readonly level?: number} | undefined
    >();
    expectTypeOf<QRCodeGIFRendererOptions['transparency']>().toEqualTypeOf<
      {readonly threshold?: number} | undefined
    >();
  });

  test('exports one Buffer renderer per raster format', () => {
    expectTypeOf(QRCodePNGRenderer).returns.toEqualTypeOf(QRCodeWebPRenderer({}));
    expectTypeOf(QRCodeGIFRenderer).returns.toEqualTypeOf(QRCodeWebPRenderer({}));
  });
});
