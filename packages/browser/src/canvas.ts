import type {
  QRCodeCenterImageLayout,
  QRCodeMatrix,
  QRCodeMatrixOptions,
  QRCodeRenderer,
  QRCodeVisualStyle,
} from '@qrcodesdk/core';
import {
  type QRCodeDrawing,
  type QRCodeStylePart,
  createQRCodeCenterImage,
  createQRCodeStyler,
  toQRCodePathData,
} from '@qrcodesdk/core/drawing';
import {QRCodeError} from '@qrcodesdk/core/error';
import {ɵassertCenterImage as assertCenterImage} from '@qrcodesdk/core/internal';

import {assertKnownKeys, assertOptionalString} from './options';

/** A center image for Canvas and Image output, created with `canvasCenterImage()`. */
export type QRCodeCanvasCenterImage = {
  readonly part: QRCodeStylePart;
  draw(context: CanvasRenderingContext2D, drawing: QRCodeDrawing): void;
};
export type QRCodeCanvasAccessibilityOptions = {
  readonly ariaLabel?: string;
  readonly title?: string;
};
export type QRCodeCanvasRendererOptions = {
  readonly style?: QRCodeVisualStyle;
  readonly accessibility?: QRCodeCanvasAccessibilityOptions;
  readonly centerImage?: QRCodeCanvasCenterImage;
};
export type QRCodeCanvasOptions = QRCodeCanvasRendererOptions & {
  readonly matrix?: QRCodeMatrixOptions;
};

export function QRCodeCanvasRenderer(
  options?: QRCodeCanvasRendererOptions,
): QRCodeRenderer<HTMLCanvasElement> {
  assertKnownKeys(options, 'options', ['style', 'accessibility', 'centerImage']);
  assertKnownKeys(options?.accessibility, 'accessibility', ['ariaLabel', 'title']);
  assertOptionalString(options?.accessibility?.ariaLabel, 'accessibility.ariaLabel');
  assertOptionalString(options?.accessibility?.title, 'accessibility.title');
  const centerImage = options?.centerImage;
  assertCenterImage(centerImage, 'draw', 'canvasCenterImage');
  const draw = createQRCodeStyler(options?.style, [centerImage?.part]);
  const accessibility = options?.accessibility ? {...options.accessibility} : undefined;

  return (matrix: QRCodeMatrix) => {
    const drawing = draw(matrix);
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
    // Draw in module units.
    context.setTransform(moduleSize, 0, 0, moduleSize, 0, 0);
    context.fillStyle = drawing.background;
    context.fillRect(0, 0, viewSize, viewSize);
    for (const layer of drawing.layers) {
      context.fillStyle = layer.color;
      context.fill(new Path2D(toQRCodePathData(layer)), 'evenodd');
    }
    centerImage?.draw(context, drawing);
    return canvas;
  };
}

/** Creates a Canvas and Image center image from a loaded image source. */
export function canvasCenterImage(
  source: CanvasImageSource,
  layout?: QRCodeCenterImageLayout,
): QRCodeCanvasCenterImage {
  const {part, place} = createQRCodeCenterImage(layout);
  return {
    part,
    draw(context, drawing) {
      const {width, height} = getCanvasImageSourceSize(source);
      const box = place(drawing);
      // The context draws in module units; fit the image inside its box.
      const scale = Math.min(box.size / width, box.size / height);
      context.drawImage(
        source,
        box.x + (box.size - width * scale) / 2,
        box.y + (box.size - height * scale) / 2,
        width * scale,
        height * scale,
      );
    },
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
