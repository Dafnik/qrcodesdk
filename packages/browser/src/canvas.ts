import type {
  QRCodeCenterImageLayout,
  QRCodeMatrix,
  QRCodeMatrixOptions,
  QRCodeRenderer,
  QRCodeVisualStyle,
} from '@qrcodesdk/core';
import {QRCodeError} from '@qrcodesdk/core/error';
import type {
  ɵQRCodeDrawing as QRCodeDrawing,
  ɵQRCodeStylePart as QRCodeStylePart,
} from '@qrcodesdk/core/internal';
import {ɵcreateCenterImageStore as createCenterImageStore} from '@qrcodesdk/core/internal';
import {
  ɵcreateQRCodeCenterImagePlacement as createQRCodeCenterImagePlacement,
  ɵcreateQRCodeStyler as createQRCodeStyler,
  ɵtoQRCodePathData as toQRCodePathData,
} from '@qrcodesdk/core/internal';

declare const canvasCenterImageBrand: unique symbol;
/** A center image for Canvas and Image output, created with `canvasCenterImage()`. */
export type QRCodeCanvasCenterImage = {readonly [canvasCenterImageBrand]: true};

const centerImages = createCenterImageStore<{
  readonly part: QRCodeStylePart;
  draw(context: CanvasRenderingContext2D, drawing: QRCodeDrawing): void;
}>();
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
  const centerImage = centerImages.resolve(options?.centerImage);
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
  const {part, place} = createQRCodeCenterImagePlacement(layout);
  return centerImages.create({
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
  }) as QRCodeCanvasCenterImage;
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
function getCanvasImageSourceSize(source: CanvasImageSource): CanvasImageSourceDimensions {
  let width: number;
  let height: number;
  if ('naturalWidth' in source) {
    if (!source.complete) {
      throw new QRCodeError(
        'INVALID_IMAGE_SOURCE',
        'QR code canvas image source must be loaded before rendering',
      );
    }
    width = source.naturalWidth;
    height = source.naturalHeight;
  } else if ('videoWidth' in source) {
    width = source.videoWidth;
    height = source.videoHeight;
  } else if ('displayWidth' in source) {
    width = source.displayWidth;
    height = source.displayHeight;
  } else {
    width = typeof source.width === 'number' ? source.width : source.width.baseVal.value;
    height = typeof source.height === 'number' ? source.height : source.height.baseVal.value;
  }
  if (width <= 0 || height <= 0) throwInvalidImageDimensions();
  return {width, height};
}

function throwInvalidImageDimensions(): never {
  throw new QRCodeError(
    'INVALID_IMAGE_SOURCE',
    'QR code canvas image source must have positive intrinsic dimensions before rendering',
  );
}
