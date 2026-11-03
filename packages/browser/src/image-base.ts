import type {QRCodeMatrix, QRCodeRenderer} from '@qrcodesdk/core';
import {QRCodeError} from '@qrcodesdk/core/error';

import {QRCodeCanvasRenderer, type QRCodeCanvasRendererOptions} from './canvas';

export type QRCodeImageAccessibilityOptions = {
  readonly alt?: string;
  readonly ariaLabel?: string;
  readonly title?: string;
};
/** Options shared by the PNG, WebP, GIF, and JPEG image renderers. */
export type QRCodeImageRendererOptions = Omit<QRCodeCanvasRendererOptions, 'accessibility'> & {
  readonly accessibility?: QRCodeImageAccessibilityOptions;
};

/** Creates an image renderer that encodes Canvas output as a data URL. */
export function createImageRenderer(
  options: QRCodeImageRendererOptions | undefined,
  toDataURL: (canvas: HTMLCanvasElement) => string,
): QRCodeRenderer<HTMLImageElement> {
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

    try {
      image.src = toDataURL(canvas);
    } catch (error) {
      if (error instanceof QRCodeError) throw error;
      throw new QRCodeError(
        'RENDER_FAILED',
        'QR code image rendering requires an origin-clean canvas. Use same-origin or CORS-enabled center images.',
        {cause: error},
      );
    }
    image.width = canvas.width;
    image.height = canvas.height;
    applyAccessibilityAttributes(image, accessibility);

    return image;
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
