import type {ImageURISource} from 'react-native';

import type {
  QRCodeCenterImageLayout,
  QRCodeDataImageURL,
  QRCodeSVGCenterImageLayout,
} from '@qrcodesdk/core';
import {QRCodeError} from '@qrcodesdk/core/error';
import {
  type ɵQRCodeDrawing as QRCodeDrawing,
  type ɵQRCodeStylePart as QRCodeStylePart,
  ɵcreateCenterImageStore as createCenterImageStore,
  ɵcreateQRCodeCenterImagePlacement as createQRCodeCenterImagePlacement,
} from '@qrcodesdk/core/internal';
import {
  type ɵRasterCenterImageRenderer as RasterCenterImageRenderer,
  ɵcreateRasterCenterImage as createRasterCenterImage,
} from '@qrcodesdk/core/internal/raster';
import {ɵzlibInflate as zlibInflate} from '@qrcodesdk/core/internal/zlib';

declare const svgCenterImageBrand: unique symbol;
/** A center image for `QRCodeSVG`, created with `svgCenterImage()`. */
export type QRCodeSVGCenterImage = {readonly [svgCenterImageBrand]: true};

declare const rasterCenterImageBrand: unique symbol;
/** A center image for the PNG, WebP, GIF, and JPEG components, created with `rasterCenterImage()`. */
export type QRCodeRasterCenterImage = {readonly [rasterCenterImageBrand]: true};

// Kept private so published declarations do not reference internal drawing types.
export const svgCenterImages = createCenterImageStore<{
  readonly part: QRCodeStylePart;
  readonly source: number | ImageURISource | QRCodeDataImageURL;
  place(drawing: QRCodeDrawing): {x: number; y: number; width: number; height: number};
}>();
export const rasterCenterImages = createCenterImageStore<RasterCenterImageRenderer>();

const SVG_DATA_URL = /^data:image\/svg\+xml(?:[;,]|$)/i;

/**
 * Creates a center image for `QRCodeSVG` from a raster image source, such as `require('./logo.png')`,
 * `{uri: 'https://…'}`, or an embedded PNG data URL. react-native-svg loads the image.
 */
export function svgCenterImage(
  source: number | ImageURISource | QRCodeDataImageURL,
  layout?: QRCodeSVGCenterImageLayout,
): QRCodeSVGCenterImage {
  if (!isImageSource(source)) {
    throw new QRCodeError(
      'INVALID_IMAGE_SOURCE',
      'QR code SVG center image requires a raster image source or an embedded raster image data URL',
      {details: {source}},
    );
  }
  const {part, place} = createQRCodeCenterImagePlacement(layout, layout?.aspectRatio);
  return svgCenterImages.create({part, source, place}) as QRCodeSVGCenterImage;
}

/**
 * Creates a center image for the PNG, WebP, GIF, and JPEG components from PNG bytes, which are
 * validated and decoded once.
 */
export function rasterCenterImage(
  source: Uint8Array,
  layout?: QRCodeCenterImageLayout,
): QRCodeRasterCenterImage {
  return rasterCenterImages.create(
    createRasterCenterImage(source, layout, zlibInflate),
  ) as QRCodeRasterCenterImage;
}

function isImageSource(source: unknown): boolean {
  if (typeof source === 'string')
    return source.startsWith('data:image/') && !SVG_DATA_URL.test(source);
  // Bundled assets from require() are numeric asset IDs.
  if (typeof source === 'number') return true;
  if (typeof source !== 'object' || source === null || Array.isArray(source)) return false;
  const uri = (source as {uri?: unknown}).uri;
  return typeof uri === 'string' && !SVG_DATA_URL.test(uri.trim());
}
