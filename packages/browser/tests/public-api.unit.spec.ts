import {describe, expectTypeOf, test} from 'vitest';

import type {QRCodeOptions} from '@qrcodesdk/core';

import type {
  QRCodeCanvasOptions,
  QRCodeCanvasRendererOptions,
  QRCodeImageOptions,
  QRCodeImageRendererOptions,
} from '../src';

describe('public API types', () => {
  test('exports canonical browser component option types', () => {
    expectTypeOf<QRCodeCanvasOptions>().toEqualTypeOf<QRCodeOptions<QRCodeCanvasRendererOptions>>();
    expectTypeOf<QRCodeImageOptions>().toEqualTypeOf<QRCodeOptions<QRCodeImageRendererOptions>>();
  });
});
