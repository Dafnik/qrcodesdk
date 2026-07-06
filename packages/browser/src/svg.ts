import type {QRCodeMatrix, QRCodeRenderer} from '@qrcodesdk/core';

import {downloadQRCode, ensureExtension} from './download-helper';
import type {QRCodeDownloadRendererOptions} from './types';

export type QRCodeDownloadSVGRendererOptions = QRCodeDownloadRendererOptions<string>;

export function DownloadSVGQRCodeRenderer(
  options: QRCodeDownloadSVGRendererOptions,
): QRCodeRenderer<void> {
  return (matrix: QRCodeMatrix) => {
    const svg = options.renderer(matrix);

    const blob = new Blob([svg], {
      type: 'image/svg+xml;charset=utf-8',
    });

    const url = URL.createObjectURL(blob);

    downloadQRCode(url, ensureExtension(options?.filename ?? 'qrcode', '.svg'));

    URL.revokeObjectURL(url);
  };
}
