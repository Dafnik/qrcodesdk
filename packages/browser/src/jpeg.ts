import type {QRCodeColor, QRCodeMatrixOptions, QRCodeRenderer} from '@qrcodesdk/core';
import {
  ɵencodeJPEG as encodeJPEG,
  ɵresolveJPEGOptions as resolveJPEGOptions,
} from '@qrcodesdk/core/internal/jpeg';

import {encodeCanvas} from './encoded-data-url';
import {type QRCodeImageRendererOptions, createImageRenderer} from './image-base';

export type QRCodeJPEGImageRendererOptions = QRCodeImageRendererOptions & {
  /** JPEG quality from 1 to 100. Defaults to 92. */
  readonly quality?: number;
  /** Opaque color that transparent pixels are blended onto. Defaults to `#ffffff`. */
  readonly transparency?: {readonly matte?: QRCodeColor};
};
export type QRCodeJPEGImageOptions = QRCodeJPEGImageRendererOptions & {
  readonly matrix?: QRCodeMatrixOptions;
};

/**
 * Renders an image element backed by a baseline JPEG data URL. JPEG is lossy and has no
 * transparency, so transparent pixels are blended onto the matte color. Prefer PNG or WebP unless
 * JPEG is required.
 */
export function QRCodeJPEGImageRenderer(
  options?: QRCodeJPEGImageRendererOptions,
): QRCodeRenderer<HTMLImageElement> {
  const jpegOptions = resolveJPEGOptions({
    quality: options?.quality,
    matte: options?.transparency?.matte,
  });
  return createImageRenderer(options, (canvas) =>
    encodeCanvas(canvas, 'image/jpeg', (image) => encodeJPEG(image, jpegOptions)),
  );
}
