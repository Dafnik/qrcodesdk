import {type QRCodeMatrix, type QRCodeMatrixOptions, type QRCodeRenderer} from '@qrcodesdk/core';

import {QRCodeCanvasRenderer, type QRCodeCanvasRendererOptions} from './canvas';
import {downloadQRCode, ensureExtension} from './download-helper';
import {assertKnownKeys, assertOptionalString} from './options';
import type {QRCodeDownloadRendererOptions} from './types';

export type QRCodeImageAccessibilityOptions = {
  readonly alt?: string;
  readonly ariaLabel?: string;
  readonly title?: string;
};
export type QRCodeImageRendererOptions = Omit<QRCodeCanvasRendererOptions, 'accessibility'> & {
  readonly accessibility?: QRCodeImageAccessibilityOptions;
};
export type QRCodeImageOptions = QRCodeImageRendererOptions & {
  readonly matrix?: QRCodeMatrixOptions;
};

export type QRCodeDownloadImageRendererOptions = QRCodeDownloadRendererOptions<HTMLImageElement>;

export function QRCodeImageRenderer(
  options?: QRCodeImageRendererOptions,
): QRCodeRenderer<HTMLImageElement> {
  assertKnownKeys(options, 'options', ['style', 'accessibility', 'centerImage']);
  assertKnownKeys(options?.accessibility, 'accessibility', ['alt', 'ariaLabel', 'title']);
  assertOptionalString(options?.accessibility?.alt, 'accessibility.alt');
  assertOptionalString(options?.accessibility?.ariaLabel, 'accessibility.ariaLabel');
  assertOptionalString(options?.accessibility?.title, 'accessibility.title');
  const accessibility: Required<QRCodeImageAccessibilityOptions> = {
    alt: options?.accessibility?.alt ?? '',
    ariaLabel: options?.accessibility?.ariaLabel ?? '',
    title: options?.accessibility?.title ?? '',
  };
  const canvasRenderer = QRCodeCanvasRenderer({
    style: options?.style,
    centerImage: options?.centerImage,
    accessibility: {
      ariaLabel: accessibility.ariaLabel,
      title: accessibility.title,
    },
  });

  return (matrix: QRCodeMatrix) => {
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
  options: Required<QRCodeImageAccessibilityOptions>,
): void {
  image.alt = options.alt;
  if (options.ariaLabel) image.setAttribute('aria-label', options.ariaLabel);
  if (options.title) image.title = options.title;
}
