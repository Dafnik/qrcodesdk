import type {QRCodeColor, QRCodeMatrix, QRCodeRenderer} from '@qrcodesdk/core';
import {
  ɵencodeJPEG as encodeJPEG,
  ɵresolveJPEGOptions as resolveJPEGOptions,
} from '@qrcodesdk/core/internal/jpeg';

import {toBuffer} from './pixels';
import {type QRCodeRasterRendererOptions, createRGBARenderer} from './render-rgba';

export type QRCodeJPEGRendererOptions = QRCodeRasterRendererOptions & {
  /** JPEG quality from 1 to 100. Defaults to 92. */
  readonly quality?: number;
  /** Opaque color that transparent pixels are blended onto. Defaults to `#ffffff`. */
  readonly transparency?: {readonly matte?: QRCodeColor};
};

/**
 * Renders baseline JPEG bytes. JPEG is lossy and has no transparency, so transparent pixels are
 * blended onto the matte color. Prefer PNG or WebP unless JPEG is required.
 */
export function QRCodeJPEGRenderer(options?: QRCodeJPEGRendererOptions): QRCodeRenderer<Buffer> {
  const render = createRGBARenderer(options);
  const jpegOptions = resolveJPEGOptions({
    quality: options?.quality,
    matte: options?.transparency?.matte,
  });
  return (matrix: QRCodeMatrix) => toBuffer(encodeJPEG(render(matrix), jpegOptions));
}
