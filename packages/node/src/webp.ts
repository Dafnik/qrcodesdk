import type {QRCodeMatrix, QRCodeRenderer} from '@qrcodesdk/core';
import {ɵencodeWebP as encodeWebP} from '@qrcodesdk/core/internal/webp';

import {toBuffer} from './pixels';
import {type QRCodeRasterRendererOptions, createRGBARenderer} from './render-rgba';

export type QRCodeWebPRendererOptions = QRCodeRasterRendererOptions;

/** Renders lossless WebP bytes. */
export function QRCodeWebPRenderer(options?: QRCodeWebPRendererOptions): QRCodeRenderer<Buffer> {
  const render = createRGBARenderer(options);
  return (matrix: QRCodeMatrix) => toBuffer(encodeWebP(render(matrix)));
}
