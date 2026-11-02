import type {QRCodeMatrix, QRCodeRenderer} from '@qrcodesdk/core';
import {
  ɵencodeGIF as encodeGIF,
  ɵresolveGIFTransparencyThreshold as resolveGIFTransparencyThreshold,
} from '@qrcodesdk/core/internal/gif';

import {toBuffer} from './pixels';
import {type QRCodeRasterRendererOptions, createRGBARenderer} from './render-rgba';

export type QRCodeGIFRendererOptions = QRCodeRasterRendererOptions & {
  /** Pixels with an alpha value below `threshold` become transparent. Defaults to 128. */
  readonly transparency?: {readonly threshold?: number};
};

/**
 * Renders single-frame GIF bytes. GIF supports 256 colors and binary transparency, so prefer PNG or
 * WebP for transparent backgrounds and photographic center images.
 */
export function QRCodeGIFRenderer(options?: QRCodeGIFRendererOptions): QRCodeRenderer<Buffer> {
  const render = createRGBARenderer(options);
  const transparencyThreshold = resolveGIFTransparencyThreshold(options?.transparency?.threshold);
  return (matrix: QRCodeMatrix) => toBuffer(encodeGIF(render(matrix), {transparencyThreshold}));
}
