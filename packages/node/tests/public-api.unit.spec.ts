import {describe, expectTypeOf, test} from 'vitest';

import type {QRCodeImageOverlayOptions} from '@qrcodesdk/core';

import type {QRCodePNGImageOptions, QRCodePNGRendererOptions} from '../src';

describe('public API types', () => {
  test('exports prepared PNG image option types', () => {
    expectTypeOf<QRCodePNGImageOptions>().toEqualTypeOf<QRCodeImageOverlayOptions<Buffer>>();
    expectTypeOf<QRCodePNGRendererOptions['image']>().toEqualTypeOf<
      QRCodePNGImageOptions | undefined
    >();
    expectTypeOf<QRCodePNGRendererOptions['compressionLevel']>().toEqualTypeOf<
      number | undefined
    >();
  });
});
