import {describe, expect, expectTypeOf, test} from 'vitest';

import type {QRCodeCenterImageLayout} from '@qrcodesdk/core';

import {type QRCodePNGCenterImage, type QRCodePNGRendererOptions, pngCenterImage} from '../src';

describe('public API types', () => {
  test('exports the PNG renderer options and opt-in center images', () => {
    expect(pngCenterImage).toBeTypeOf('function');
    expectTypeOf(pngCenterImage).parameters.toEqualTypeOf<
      [source: Buffer, layout?: QRCodeCenterImageLayout]
    >();
    expectTypeOf<QRCodePNGRendererOptions['centerImage']>().toEqualTypeOf<
      QRCodePNGCenterImage | undefined
    >();
    expectTypeOf<QRCodePNGRendererOptions['compression']>().toEqualTypeOf<
      {readonly level?: number} | undefined
    >();
  });
});
