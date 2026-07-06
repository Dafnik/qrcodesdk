import type {
  QRCodeAccessibilityOptions,
  QRCodeMatrix,
  QRCodeRenderer,
  QRCodeStylingOptions,
} from '@qrcodesdk/core';

import {CanvasQRCodeRenderer} from './canvas';
import {downloadQRCode, ensureExtension} from './download-helper';
import type {QRCodeDownloadRendererOptions} from './types';

export type QRCodeImageRendererOptions = QRCodeStylingOptions & QRCodeAccessibilityOptions;

export type QRCodeDownloadImageRendererOptions = QRCodeDownloadRendererOptions<HTMLImageElement>;

export function ImageQRCodeRenderer(
  options?: QRCodeImageRendererOptions,
): QRCodeRenderer<HTMLImageElement> {
  return (matrix: QRCodeMatrix) => {
    const canvas = CanvasQRCodeRenderer(options)(matrix);
    const image = document.createElement('img');

    image.src = canvas.toDataURL('image/png');
    image.width = canvas.width;
    image.height = canvas.height;
    applyAccessibilityAttributes(image, options);

    return image;
  };
}

export function DownloadImageQRCodeRenderer(
  options: QRCodeDownloadImageRendererOptions,
): QRCodeRenderer<void> {
  return (matrix: QRCodeMatrix) => {
    const image = options.renderer(matrix);

    downloadQRCode(image.src, ensureExtension(options?.filename ?? 'qrcode', '.png'));
  };
}

function applyAccessibilityAttributes(
  image: HTMLImageElement,
  options: QRCodeAccessibilityOptions | undefined,
): void {
  if (options?.alt !== undefined) image.alt = options.alt;
  if (options?.ariaLabel !== undefined) image.setAttribute('aria-label', options.ariaLabel);
  if (options?.title !== undefined) image.title = options.title;
}
