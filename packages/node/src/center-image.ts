import {inflateSync} from 'node:zlib';

import type {QRCodeCenterImageLayout} from '@qrcodesdk/core';
import {ɵcreateCenterImageStore as createCenterImageStore} from '@qrcodesdk/core/internal';
import {
  type ɵRasterCenterImageRenderer as RasterCenterImageRenderer,
  ɵcreateRasterCenterImage as createRasterCenterImage,
} from '@qrcodesdk/core/internal/raster';

declare const rasterCenterImageBrand: unique symbol;
/** A center image for PNG, WebP, and GIF output, created with `rasterCenterImage()`. */
export type QRCodeRasterCenterImage = {readonly [rasterCenterImageBrand]: true};

// Kept private so published declarations do not reference internal drawing types.
export const centerImages = createCenterImageStore<RasterCenterImageRenderer>();

/**
 * Creates a center image for PNG, WebP, and GIF output from PNG bytes, which are validated and
 * decoded once.
 */
export function rasterCenterImage(
  source: Uint8Array,
  layout?: QRCodeCenterImageLayout,
): QRCodeRasterCenterImage {
  return centerImages.create(
    createRasterCenterImage(source, layout, (data, maxOutputLength) =>
      inflateSync(data, {maxOutputLength}),
    ),
  ) as QRCodeRasterCenterImage;
}
