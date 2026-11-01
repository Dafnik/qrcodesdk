import type {QRCodeMatrix, QRCodeRenderer} from '@qrcodesdk/core';

import {downloadQRCode, ensureExtension, resolveDownloadOptions} from './download-helper';
import type {QRCodeDownloadRendererOptions} from './types';

// Some browsers start downloads asynchronously and cancel them when the URL is revoked too early.
const REVOKE_DELAY_MS = 40_000;

export type QRCodeDownloadSVGRendererOptions = QRCodeDownloadRendererOptions<string>;

export function QRCodeDownloadSVGRenderer(
  options: QRCodeDownloadSVGRendererOptions,
): QRCodeRenderer<void> {
  const {renderer, filename} = resolveDownloadOptions(options);
  return (matrix: QRCodeMatrix) => {
    const svg = renderer(matrix);

    const blob = new Blob([svg], {
      type: 'image/svg+xml;charset=utf-8',
    });

    const url = URL.createObjectURL(blob);

    downloadQRCode(url, ensureExtension(filename, '.svg'));

    setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
  };
}
