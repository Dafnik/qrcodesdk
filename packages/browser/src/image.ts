import type {
  QRCodeAccessibilityOptions,
  QRCodeMatrix,
  QRCodeOptions,
  QRCodeRenderer,
} from '@qrcodesdk/core';

import {QRCodeCanvasRenderer, type QRCodeCanvasRendererOptions} from './canvas';
import {downloadQRCode, ensureExtension} from './download-helper';
import type {QRCodeDownloadRendererOptions} from './types';

export type QRCodeImageRendererOptions = QRCodeCanvasRendererOptions & QRCodeAccessibilityOptions;
export type QRCodeImageOptions = QRCodeOptions<QRCodeImageRendererOptions>;

export type QRCodeDownloadImageRendererOptions = QRCodeDownloadRendererOptions<HTMLImageElement>;

export function QRCodeImageRenderer(
  options?: QRCodeImageRendererOptions,
): QRCodeRenderer<HTMLImageElement> {
  const canvasRenderer = QRCodeCanvasRenderer(options);
  let resolvedAccessibility: Required<QRCodeAccessibilityOptions> | undefined;

  return (matrix: QRCodeMatrix) => {
    const accessibility = (resolvedAccessibility ??= {
      alt: options?.alt ?? '',
      ariaLabel: options?.ariaLabel ?? '',
      title: options?.title ?? '',
    });
    const canvas = canvasRenderer(matrix);
    const image = document.createElement('img');

    image.src = canvas.toDataURL('image/png');
    image.width = canvas.width;
    image.height = canvas.height;
    applyAccessibilityAttributes(image, accessibility);

    return image;
  };
}

export function QRCodeDownloadImageRenderer(
  options: QRCodeDownloadImageRendererOptions,
): QRCodeRenderer<void> {
  return (matrix: QRCodeMatrix) => {
    const image = options.renderer(matrix);

    downloadQRCode(image.src, ensureExtension(options.filename ?? 'qrcode', '.png'));
  };
}

function applyAccessibilityAttributes(
  image: HTMLImageElement,
  options: Required<QRCodeAccessibilityOptions>,
): void {
  image.alt = options.alt;
  if (options.ariaLabel) image.setAttribute('aria-label', options.ariaLabel);
  if (options.title) image.title = options.title;
}
