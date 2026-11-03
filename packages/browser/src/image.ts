import type {QRCodeMatrix, QRCodeRenderer} from '@qrcodesdk/core';

import {downloadQRCode, ensureExtension, resolveDownloadOptions} from './download-helper';
import type {QRCodeDownloadRendererOptions} from './types';

export type {QRCodeImageAccessibilityOptions, QRCodeImageRendererOptions} from './image-base';

export type QRCodeDownloadImageRendererOptions = QRCodeDownloadRendererOptions<HTMLImageElement>;

const EXTENSIONS: Readonly<Record<string, string>> = {
  'image/gif': '.gif',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

/** Downloads the output of a PNG, WebP, GIF, or JPEG image renderer with the matching file extension. */
export function QRCodeDownloadImageRenderer(
  options: QRCodeDownloadImageRendererOptions,
): QRCodeRenderer<void> {
  const {renderer, filename} = resolveDownloadOptions(options);
  return (matrix: QRCodeMatrix) => {
    const image = renderer(matrix);
    const mimeType = /^data:([^;,]+)/u.exec(image.src)?.[1]?.toLowerCase() ?? '';
    const extension = EXTENSIONS[mimeType];

    downloadQRCode(image.src, extension ? ensureExtension(filename, extension) : filename);
  };
}
