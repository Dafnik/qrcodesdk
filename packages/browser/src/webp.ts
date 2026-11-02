import type {QRCodeMatrixOptions, QRCodeRenderer} from '@qrcodesdk/core';
import {ɵencodeWebP as encodeWebP} from '@qrcodesdk/core/internal/webp';

import {encodeCanvas} from './encoded-data-url';
import {type QRCodeImageRendererOptions, createImageRenderer} from './image-base';

export type QRCodeWebPImageRendererOptions = QRCodeImageRendererOptions;
export type QRCodeWebPImageOptions = QRCodeWebPImageRendererOptions & {
  readonly matrix?: QRCodeMatrixOptions;
};

/** Renders an image element backed by a lossless WebP data URL. */
export function QRCodeWebPImageRenderer(
  options?: QRCodeWebPImageRendererOptions,
): QRCodeRenderer<HTMLImageElement> {
  return createImageRenderer(options, (canvas) => encodeCanvas(canvas, 'image/webp', encodeWebP));
}
