import {
  type QRCodeImageOverlayOptions,
  type QRCodeMatrix,
  type QRCodeOptions,
  type QRCodeRenderer,
  type QRCodeStyleLayer,
  type QRCodeStylePrimitive,
  type QRCodeStylingOptions,
  ɵcreateQRCodeStylePlan,
  ɵparseQRCodeStylingOptions,
  ɵresolveQRCodeImageOverlay,
} from '@qrcodesdk/core';

export type QRCodeCanvasImageOptions = QRCodeImageOverlayOptions<CanvasImageSource>;
export type QRCodeCanvasRendererOptions = QRCodeStylingOptions & {
  image?: QRCodeCanvasImageOptions;
};
export type QRCodeCanvasOptions = QRCodeOptions<QRCodeCanvasRendererOptions>;

export function QRCodeCanvasRenderer(
  options?: QRCodeCanvasRendererOptions,
): QRCodeRenderer<HTMLCanvasElement> {
  let resolvedStyling: ReturnType<typeof ɵparseQRCodeStylingOptions> | undefined;

  return (matrix: QRCodeMatrix) => {
    const styling = (resolvedStyling ??= ɵparseQRCodeStylingOptions(options));
    const plan = ɵcreateQRCodeStylePlan(matrix, styling);
    const image = ɵresolveQRCodeImageOverlay(plan.moduleCount, styling.margin, options?.image);
    const scale = plan.renderedSize / plan.viewSize;
    const canvas = document.createElement('canvas');
    canvas.width = plan.renderedSize;
    canvas.height = plan.renderedSize;

    const context = canvas.getContext('2d', {alpha: false});
    if (!context) {
      throw new Error('Canvas QR code renderer requires a 2D canvas context');
    }

    context.fillStyle = plan.backgroundColor;
    context.fillRect(0, 0, plan.renderedSize, plan.renderedSize);

    for (let index = 0; index < plan.layers.length; index++) {
      drawLayer(context, plan.layers[index]!, scale);
    }

    if (image) {
      const sourceSize = getCanvasImageSourceSize(image.source);
      if (image.clearBackground) {
        context.fillStyle = plan.backgroundColor;
        context.fillRect(
          image.clearX * scale,
          image.clearY * scale,
          image.clearSize * scale,
          image.clearSize * scale,
        );
      }

      const boxX = image.imageX * scale;
      const boxY = image.imageY * scale;
      const boxSize = image.imageSize * scale;
      const imageScale = Math.min(boxSize / sourceSize.width, boxSize / sourceSize.height);
      const width = sourceSize.width * imageScale;
      const height = sourceSize.height * imageScale;

      context.drawImage(
        image.source,
        boxX + (boxSize - width) / 2,
        boxY + (boxSize - height) / 2,
        width,
        height,
      );
    }

    return canvas;
  };
}

type CanvasImageSourceDimensions = {
  width: number;
  height: number;
};

const CANVAS_IMAGE_DIMENSION_PAIRS = [
  ['naturalWidth', 'naturalHeight'],
  ['videoWidth', 'videoHeight'],
  ['displayWidth', 'displayHeight'],
  ['width', 'height'],
] as const;

function getCanvasImageSourceSize(source: CanvasImageSource): CanvasImageSourceDimensions {
  const candidate = source as unknown as Record<string, unknown>;

  if (candidate['complete'] === false) {
    throw new Error('QR code canvas image source must be loaded before rendering');
  }

  for (const [widthKey, heightKey] of CANVAS_IMAGE_DIMENSION_PAIRS) {
    const width = candidate[widthKey];
    const height = candidate[heightKey];
    if (typeof width !== 'number' || typeof height !== 'number') continue;
    if (width > 0 && height > 0) return {width, height};

    throw new Error(
      'QR code canvas image source must have positive intrinsic dimensions before rendering',
    );
  }

  const width = getSVGAnimatedLength(candidate['width']);
  const height = getSVGAnimatedLength(candidate['height']);
  if (width !== undefined || height !== undefined) {
    if (width !== undefined && height !== undefined && width > 0 && height > 0) {
      return {width, height};
    }
    throw new Error(
      'QR code canvas image source must have positive intrinsic dimensions before rendering',
    );
  }

  throw new Error('QR code canvas image source must expose intrinsic dimensions before rendering');
}

function getSVGAnimatedLength(value: unknown): number | undefined {
  if (!value || typeof value !== 'object') return undefined;

  const baseValue = (value as {baseVal?: {value?: unknown}}).baseVal?.value;
  return typeof baseValue === 'number' ? baseValue : undefined;
}

function drawLayer(
  context: CanvasRenderingContext2D,
  layer: QRCodeStyleLayer,
  scale: number,
): void {
  context.fillStyle = layer.color;
  for (let index = 0; index < layer.rectangles.length; index++) {
    const rectangle = layer.rectangles[index]!;
    context.fillRect(
      rectangle.x * scale,
      rectangle.y * scale,
      rectangle.width * scale,
      rectangle.height * scale,
    );
  }

  if (layer.curvedPrimitives.length === 0) return;

  context.beginPath();
  for (let index = 0; index < layer.curvedPrimitives.length; index++) {
    addCurvedPrimitive(context, layer.curvedPrimitives[index]!, scale);
  }
  context.fill('evenodd');
}

function addCurvedPrimitive(
  context: CanvasRenderingContext2D,
  primitive: QRCodeStylePrimitive,
  scale: number,
): void {
  const x = primitive.x * scale;
  const y = primitive.y * scale;
  const size = primitive.size * scale;
  const rotated = primitive.rotation !== 0;

  if (rotated) {
    context.save();
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    context.translate(centerX, centerY);
    context.rotate((primitive.rotation * Math.PI) / 180);
    context.translate(-centerX, -centerY);
  }

  if (primitive.kind === 'finder-ring') {
    if (primitive.shape === 'dot') {
      addCircle(context, x, y, size);
      addCircle(context, x + scale, y + scale, size - 2 * scale);
    } else {
      addRoundedSquare(context, x, y, size, primitive.shape === 'extra-rounded' ? 2.5 * scale : 0);
      addRoundedSquare(
        context,
        x + scale,
        y + scale,
        size - 2 * scale,
        primitive.shape === 'extra-rounded' ? 1.5 * scale : 0,
      );
    }
    if (rotated) context.restore();
    return;
  }

  if (primitive.kind === 'finder-center') {
    if (primitive.shape === 'dot') addCircle(context, x, y, size);
    else addRoundedSquare(context, x, y, size, 0);
    if (rotated) context.restore();
    return;
  }

  addModuleShape(context, primitive.shape, x, y, size);
  if (rotated) context.restore();
}

function addModuleShape(
  context: CanvasRenderingContext2D,
  shape: Extract<QRCodeStylePrimitive, {kind: 'module'}>['shape'],
  x: number,
  y: number,
  size: number,
): void {
  switch (shape) {
    case 'dot':
      addCircle(context, x, y, size);
      return;
    case 'side-rounded':
      context.moveTo(x, y);
      context.lineTo(x, y + size);
      context.lineTo(x + size / 2, y + size);
      context.arc(x + size / 2, y + size / 2, size / 2, Math.PI / 2, -Math.PI / 2, true);
      context.closePath();
      return;
    case 'corner-rounded':
      context.moveTo(x, y);
      context.lineTo(x, y + size);
      context.lineTo(x + size, y + size);
      context.lineTo(x + size, y + size / 2);
      context.arc(x + size / 2, y + size / 2, size / 2, 0, -Math.PI / 2, true);
      context.closePath();
      return;
    case 'corner-extra-rounded':
      context.moveTo(x, y);
      context.lineTo(x, y + size);
      context.lineTo(x + size, y + size);
      context.arc(x, y + size, size, 0, -Math.PI / 2, true);
      context.closePath();
      return;
    case 'opposite-corners-rounded':
      context.moveTo(x, y);
      context.lineTo(x, y + size / 2);
      context.arc(x + size / 2, y + size / 2, size / 2, Math.PI, Math.PI / 2, true);
      context.lineTo(x + size, y + size);
      context.lineTo(x + size, y + size / 2);
      context.arc(x + size / 2, y + size / 2, size / 2, 0, -Math.PI / 2, true);
      context.closePath();
      return;
    default:
      addRoundedSquare(context, x, y, size, 0);
  }
}

function addCircle(context: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  context.moveTo(x + size, y + size / 2);
  context.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  context.closePath();
}

function addRoundedSquare(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  radius: number,
): void {
  context.moveTo(x + radius, y);
  context.lineTo(x + size - radius, y);
  context.quadraticCurveTo(x + size, y, x + size, y + radius);
  context.lineTo(x + size, y + size - radius);
  context.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
  context.lineTo(x + radius, y + size);
  context.quadraticCurveTo(x, y + size, x, y + size - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}
