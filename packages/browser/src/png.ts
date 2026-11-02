import type {QRCodeMatrixOptions, QRCodeRenderer} from '@qrcodesdk/core';

import {type QRCodeImageRendererOptions, createImageRenderer} from './image-base';

export type QRCodePNGImageRendererOptions = QRCodeImageRendererOptions;
export type QRCodePNGImageOptions = QRCodePNGImageRendererOptions & {
  readonly matrix?: QRCodeMatrixOptions;
};

/** Renders an image element backed by a PNG data URL. */
export function QRCodePNGImageRenderer(
  options?: QRCodePNGImageRendererOptions,
): QRCodeRenderer<HTMLImageElement> {
  return createImageRenderer(options, (canvas) => canvas.toDataURL('image/png'));
}
