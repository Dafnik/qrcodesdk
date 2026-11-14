import type {ImageSourcePropType} from 'react-native';

import type {QRCodeCenterImageLayout, QRCodeDataImageURL} from '@qrcodesdk/core';
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

/** A square box in view coordinates. */
type Box = {readonly x: number; readonly y: number; readonly size: number};

// Kept private so published declarations do not reference internal drawing types.
export const svgCenterImages = createCenterImageStore<{
  readonly part: QRCodeStylePart;
  readonly source: ImageSourcePropType | QRCodeDataImageURL;
  place(drawing: QRCodeDrawing): Box;
}>();
export const rasterCenterImages = createCenterImageStore<RasterCenterImageRenderer>();

/**
 * Creates a center image for `QRCodeSVG` from an image source, such as `require('./logo.png')`,
 * `{uri: 'https://…'}`, or an embedded `data:image` URL. react-native-svg loads the image.
 */
export function svgCenterImage(
  source: ImageSourcePropType | QRCodeDataImageURL,
  layout?: QRCodeCenterImageLayout,
): QRCodeSVGCenterImage {
  if (!isImageSource(source)) {
    throw new QRCodeError(
      'INVALID_IMAGE_SOURCE',
      'QR code SVG image source must be an image source or an embedded data:image URL',
      {details: {source}},
    );
  }
  const {part, place} = createQRCodeCenterImagePlacement(layout);
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
  if (typeof source === 'string') return source.startsWith('data:image/');
  // Bundled assets from require() are numeric asset IDs.
  if (typeof source === 'number') return true;
  if (Array.isArray(source)) return source.length > 0 && source.every(isURISource);
  return isURISource(source);
}

function isURISource(source: unknown): boolean {
  return (
    typeof source === 'object' &&
    source !== null &&
    typeof (source as {uri?: unknown}).uri === 'string'
  );
}
