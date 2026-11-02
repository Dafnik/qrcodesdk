import type {QRCodeMatrixOptions, QRCodeRenderer} from '@qrcodesdk/core';
import {
  ɵencodeGIF as encodeGIF,
  ɵresolveGIFTransparencyThreshold as resolveGIFTransparencyThreshold,
} from '@qrcodesdk/core/internal/gif';

import {encodeCanvas} from './encoded-data-url';
import {type QRCodeImageRendererOptions, createImageRenderer} from './image-base';

export type QRCodeGIFImageRendererOptions = QRCodeImageRendererOptions & {
  /** Pixels with an alpha value below `threshold` become transparent. Defaults to 128. */
  readonly transparency?: {readonly threshold?: number};
};
export type QRCodeGIFImageOptions = QRCodeGIFImageRendererOptions & {
  readonly matrix?: QRCodeMatrixOptions;
};

/**
 * Renders an image element backed by a single-frame GIF data URL. GIF supports 256 colors and
 * binary transparency, so prefer PNG or WebP for transparent backgrounds and photographic center
 * images.
 */
export function QRCodeGIFImageRenderer(
  options?: QRCodeGIFImageRendererOptions,
): QRCodeRenderer<HTMLImageElement> {
  const transparencyThreshold = resolveGIFTransparencyThreshold(options?.transparency?.threshold);
  return createImageRenderer(options, (canvas) =>
    encodeCanvas(canvas, 'image/gif', (image) => encodeGIF(image, {transparencyThreshold})),
  );
}
