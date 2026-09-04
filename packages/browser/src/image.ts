import {
  QRCodeError,
  type QRCodeMatrix,
  type QRCodeMatrixOptions,
  type QRCodeRenderer,
} from '@qrcodesdk/core';

import {
  QRCodeCanvasRenderer,
  type QRCodeCanvasRendererOptions,
  assertOptionalString,
} from './canvas';
import {downloadQRCode, ensureExtension} from './download-helper';
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
  assertKeys(options, 'options', ['style', 'accessibility', 'image']);
  assertKeys(options?.accessibility, 'accessibility', ['alt', 'ariaLabel', 'title']);
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
    image: options?.image,
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

function assertKeys(value: object | undefined, path: string, keys: readonly string[]): void {
  if (!value) return;
  const known = new Set(keys);
  const unknown = Object.keys(value).find((key) => !known.has(key));
  if (unknown !== undefined) {
    const field = `${path}.${unknown}`;
    throw new QRCodeError('INVALID_OPTIONS', `Unknown QR code option ${field}`, {
      details: {field, value: (value as Record<string, unknown>)[unknown]},
    });
  }
}
