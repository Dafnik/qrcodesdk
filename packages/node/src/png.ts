import {deflateSync} from 'node:zlib';

import type {QRCodeMatrix, QRCodeRenderer} from '@qrcodesdk/core';
import {QRCodeError} from '@qrcodesdk/core/error';
import {ɵencodePNG as encodePNG} from '@qrcodesdk/core/internal/raster';

import {toBuffer} from './pixels';
import {type QRCodeRasterRendererOptions, createRGBARenderer} from './render-rgba';

export type QRCodePNGRendererOptions = QRCodeRasterRendererOptions & {
  readonly compression?: {readonly level?: number};
};

export function QRCodePNGRenderer(options?: QRCodePNGRendererOptions): QRCodeRenderer<Buffer> {
  const render = createRGBARenderer(options);
  const compressionLevel = resolveCompressionLevel(options?.compression?.level);
  const deflate = (data: Uint8Array) =>
    deflateSync(data, {chunkSize: 32 * 1024, level: compressionLevel, strategy: 3});
  return (matrix: QRCodeMatrix) => toBuffer(encodePNG(render(matrix), deflate));
}

function resolveCompressionLevel(value: number | undefined): number {
  const level = value ?? 9;
  if (!Number.isSafeInteger(level) || level < 0 || level > 9) {
    throw new QRCodeError(
      'INVALID_OPTIONS',
      `QR code compression.level must be an integer from 0 to 9, received ${String(level)}`,
      {details: {field: 'compression.level', value: level}},
    );
  }
  return level;
}
