import type {
  QRCodeCenterImageOptions,
  QRCodeMatrix,
  QRCodeMatrixOptions,
  QRCodeRenderer,
  QRCodeVisualStyle,
} from '@qrcodesdk/core';
import {createQRCodeStyler} from '@qrcodesdk/core/drawing';
import {QRCodeError} from '@qrcodesdk/core/error';

import {assertKnownKeys, assertOptionalString} from './options';

export type QRCodeCanvasCenterImageOptions = QRCodeCenterImageOptions<CanvasImageSource>;
export type QRCodeCanvasAccessibilityOptions = {
  readonly ariaLabel?: string;
  readonly title?: string;
};
export type QRCodeCanvasRendererOptions = {
  readonly style?: QRCodeVisualStyle;
  readonly accessibility?: QRCodeCanvasAccessibilityOptions;
  readonly centerImage?: QRCodeCanvasCenterImageOptions;
};
export type QRCodeCanvasOptions = QRCodeCanvasRendererOptions & {
  readonly matrix?: QRCodeMatrixOptions;
};

export function QRCodeCanvasRenderer(
  options?: QRCodeCanvasRendererOptions,
): QRCodeRenderer<HTMLCanvasElement> {
  assertKnownKeys(options, 'options', ['style', 'accessibility', 'centerImage']);
  assertKnownKeys(options?.accessibility, 'accessibility', ['ariaLabel', 'title']);
  assertKnownKeys(options?.centerImage, 'centerImage', [
    'source',
    'size',
    'padding',
    'clearBackground',
  ]);
  assertOptionalString(options?.accessibility?.ariaLabel, 'accessibility.ariaLabel');
  assertOptionalString(options?.accessibility?.title, 'accessibility.title');
  const styler = createQRCodeStyler(options?.style);
  const accessibility = options?.accessibility ? {...options.accessibility} : undefined;
  const hasCenterImage = !!options?.centerImage;
  const {source, ...centerImageLayout} = options?.centerImage ?? {};
  if (hasCenterImage) styler.draw([[1]]).placeCenterImage(centerImageLayout);

  return (matrix: QRCodeMatrix) => {
    const drawing = styler.draw(matrix);
    const {moduleSize, viewSize} = drawing;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = drawing.outputSize;
    applyAccessibility(canvas, accessibility);

    const context = canvas.getContext('2d');
    if (!context) {
      throw new QRCodeError(
        'RENDER_FAILED',
        'Canvas QR code renderer requires a 2D canvas context',
      );
    }
    let background = '';
    const fillBackground = (x: number, y: number, width: number, height: number) => {
      context.clearRect(x, y, width, height);
      context.fillStyle = background;
      context.fillRect(x, y, width, height);
    };
    // Draw in module units.
    context.setTransform(moduleSize, 0, 0, moduleSize, 0, 0);
    drawing.paint({
      drawBackground(red, green, blue, alpha) {
        background = rgba(red, green, blue, alpha);
        fillBackground(0, 0, viewSize, viewSize);
      },
      beginLayer(red, green, blue, alpha) {
        context.fillStyle = rgba(red, green, blue, alpha);
      },
      drawRectangle: context.fillRect.bind(context),
      beginPath: () => context.beginPath(),
      moveTo: context.moveTo.bind(context),
      lineTo: context.lineTo.bind(context),
      arc: context.arc.bind(context),
      closePath: context.closePath.bind(context),
      endPath: () => context.fill('evenodd'),
      endLayer() {},
    });

    if (hasCenterImage) {
      const {centerImage, clear} = drawing.placeCenterImage(centerImageLayout);
      const sourceSize = getCanvasImageSourceSize(source!);
      if (clear) fillBackground(clear.x, clear.y, clear.size, clear.size);
      const boxX = centerImage.x * moduleSize;
      const boxY = centerImage.y * moduleSize;
      const boxSize = centerImage.size * moduleSize;
      const scale = Math.min(boxSize / sourceSize.width, boxSize / sourceSize.height);
      const width = sourceSize.width * scale;
      const height = sourceSize.height * scale;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.drawImage(
        source!,
        boxX + (boxSize - width) / 2,
        boxY + (boxSize - height) / 2,
        width,
        height,
      );
    }
    return canvas;
  };
}

function applyAccessibility(
  canvas: HTMLCanvasElement,
  accessibility: QRCodeCanvasAccessibilityOptions | undefined,
): void {
  const accessibleName = accessibility?.ariaLabel?.trim() || accessibility?.title?.trim();
  if (!accessibleName) {
    canvas.setAttribute('aria-hidden', 'true');
    return;
  }
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', accessibleName);
  if (accessibility?.title !== undefined) canvas.title = accessibility.title;
}

type CanvasImageSourceDimensions = {width: number; height: number};
const DIMENSION_PAIRS = [
  ['naturalWidth', 'naturalHeight'],
  ['videoWidth', 'videoHeight'],
  ['displayWidth', 'displayHeight'],
  ['width', 'height'],
] as const;

function getCanvasImageSourceSize(source: CanvasImageSource): CanvasImageSourceDimensions {
  if (source === null || source === undefined) {
    throw new QRCodeError(
      'INVALID_IMAGE_SOURCE',
      'QR code canvas image source is required when centerImage is configured',
    );
  }
  const candidate = source as unknown as Record<string, unknown>;
  if (candidate['complete'] === false) {
    throw new QRCodeError(
      'INVALID_IMAGE_SOURCE',
      'QR code canvas image source must be loaded before rendering',
    );
  }
  for (const [widthKey, heightKey] of DIMENSION_PAIRS) {
    const width = candidate[widthKey];
    const height = candidate[heightKey];
    if (typeof width !== 'number' || typeof height !== 'number') continue;
    if (width > 0 && height > 0) return {width, height};
    throwInvalidImageDimensions();
  }
  const width = animatedLength(candidate['width']);
  const height = animatedLength(candidate['height']);
  if (width !== undefined || height !== undefined) {
    if (width !== undefined && height !== undefined && width > 0 && height > 0) {
      return {width, height};
    }
    throwInvalidImageDimensions();
  }
  throw new QRCodeError(
    'INVALID_IMAGE_SOURCE',
    'QR code canvas image source must expose intrinsic dimensions before rendering',
  );
}

function animatedLength(value: unknown): number | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const baseValue = (value as {baseVal?: {value?: unknown}}).baseVal?.value;
  return typeof baseValue === 'number' ? baseValue : undefined;
}

function throwInvalidImageDimensions(): never {
  throw new QRCodeError(
    'INVALID_IMAGE_SOURCE',
    'QR code canvas image source must have positive intrinsic dimensions before rendering',
  );
}

function rgba(red: number, green: number, blue: number, alpha: number): string {
  return `rgba(${red}, ${green}, ${blue}, ${alpha / 255})`;
}
