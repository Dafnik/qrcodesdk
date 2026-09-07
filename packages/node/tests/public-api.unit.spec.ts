import {describe, expectTypeOf, test} from 'vitest';

import type {QRCodeCenterImageOptions} from '@qrcodesdk/core';

import type {QRCodePNGCenterImageOptions, QRCodePNGRendererOptions} from '../src';

describe('public API types', () => {
  test('exports prepared PNG image option types', () => {
    expectTypeOf<QRCodePNGCenterImageOptions>().toEqualTypeOf<QRCodeCenterImageOptions<Buffer>>();
    expectTypeOf<QRCodePNGRendererOptions['centerImage']>().toEqualTypeOf<
      QRCodePNGCenterImageOptions | undefined
    >();
    expectTypeOf<QRCodePNGRendererOptions['compression']>().toEqualTypeOf<
      {readonly level?: number} | undefined
    >();
  });
});
