import type {QRCodeMatrix, QRCodeVisualStyle} from '@qrcodesdk/core';
import {
  type ɵRenderedRGBAImage as RenderedRGBAImage,
  ɵcreateRGBARenderer as createCoreRGBARenderer,
} from '@qrcodesdk/core/internal/raster';

import {type QRCodeRasterCenterImage, centerImages} from './center-image';

/** Options shared by the PNG, WebP, GIF, and JPEG renderers. */
export type QRCodeRasterRendererOptions = {
  readonly style?: QRCodeVisualStyle;
  readonly centerImage?: QRCodeRasterCenterImage;
};

/** Creates a renderer that draws a QR code into RGBA pixels for the raster encoders. */
export function createRGBARenderer(
  options: QRCodeRasterRendererOptions | undefined,
): (matrix: QRCodeMatrix) => RenderedRGBAImage {
  return createCoreRGBARenderer(options?.style, centerImages.resolve(options?.centerImage));
}
