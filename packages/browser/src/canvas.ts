import {
  QRCodeError,
  type QRCodeImageOverlayOptions,
  type QRCodeMatrix,
  type QRCodeMatrixOptions,
  type QRCodeRenderer,
  type QRCodeVisualStyle,
  createQRCodeStyler,
} from '@qrcodesdk/core';
import type {QRCodeDrawingTarget} from '@qrcodesdk/core/drawing';

export type QRCodeCanvasImageOptions = QRCodeImageOverlayOptions<CanvasImageSource>;
export type QRCodeCanvasAccessibilityOptions = {
  readonly ariaLabel?: string;
  readonly title?: string;
};
export type QRCodeCanvasRendererOptions = {
  readonly style?: QRCodeVisualStyle;
  readonly accessibility?: QRCodeCanvasAccessibilityOptions;
  readonly image?: QRCodeCanvasImageOptions;
};
export type QRCodeCanvasOptions = QRCodeCanvasRendererOptions & {
  readonly matrix?: QRCodeMatrixOptions;
};

export function QRCodeCanvasRenderer(
  options?: QRCodeCanvasRendererOptions,
): QRCodeRenderer<HTMLCanvasElement> {
  assertKeys(options, 'options', ['style', 'accessibility', 'image']);
  assertKeys(options?.accessibility, 'accessibility', ['ariaLabel', 'title']);
  assertKeys(options?.image, 'image', ['source', 'size', 'padding', 'clearBackground']);
  assertOptionalString(options?.accessibility?.ariaLabel, 'accessibility.ariaLabel');
  assertOptionalString(options?.accessibility?.title, 'accessibility.title');
  const styler = createQRCodeStyler(options?.style);
  const accessibility = options?.accessibility ? {...options.accessibility} : undefined;
  const imageOptions = options?.image ? {...options.image} : undefined;
  const imageLayout = imageOptions
    ? {
        size: imageOptions.size,
        padding: imageOptions.padding,
        clearBackground: imageOptions.clearBackground,
      }
    : undefined;
  if (imageOptions) styler.draw([[1]]).placeImage(imageLayout);

  return (matrix: QRCodeMatrix) => {
    const drawing = styler.draw(matrix);
    const placement = imageOptions ? drawing.placeImage(imageLayout) : undefined;
    const canvas = document.createElement('canvas');
    canvas.width = drawing.outputSize;
    canvas.height = drawing.outputSize;
    applyAccessibility(canvas, accessibility);

    const context = canvas.getContext('2d');
    if (!context) {
      throw new QRCodeError(
        'RENDER_FAILED',
        'Canvas QR code renderer requires a 2D canvas context',
      );
    }
    const target = new CanvasDrawingTarget(context, drawing.moduleSize, drawing.outputSize);
    drawing.paint(target);

    if (imageOptions && placement) {
      const sourceSize = getCanvasImageSourceSize(imageOptions.source);
      if (placement.clear) target.clearImageArea(placement.clear);
      const boxX = placement.image.x * drawing.moduleSize;
      const boxY = placement.image.y * drawing.moduleSize;
      const boxSize = placement.image.size * drawing.moduleSize;
      const scale = Math.min(boxSize / sourceSize.width, boxSize / sourceSize.height);
      const width = sourceSize.width * scale;
      const height = sourceSize.height * scale;
      context.drawImage(
        imageOptions.source,
        boxX + (boxSize - width) / 2,
        boxY + (boxSize - height) / 2,
        width,
        height,
      );
    }
    return canvas;
  };
}

class CanvasDrawingTarget implements QRCodeDrawingTarget {
  private background = 'rgba(255, 255, 255, 1)';
  private fillRule: CanvasFillRule = 'nonzero';

  constructor(
    private readonly context: CanvasRenderingContext2D,
    private readonly scale: number,
    private readonly outputSize: number,
  ) {}

  drawBackground(red: number, green: number, blue: number, alpha: number): void {
    this.background = rgba(red, green, blue, alpha);
    this.context.clearRect(0, 0, this.outputSize, this.outputSize);
    this.context.fillStyle = this.background;
    this.context.fillRect(0, 0, this.outputSize, this.outputSize);
  }

  beginLayer(red: number, green: number, blue: number, alpha: number): void {
    this.context.fillStyle = rgba(red, green, blue, alpha);
  }

  drawRectangle(x: number, y: number, width: number, height: number): void {
    this.context.fillRect(x * this.scale, y * this.scale, width * this.scale, height * this.scale);
  }

  beginPath(fillRule: 'nonzero' | 'evenodd'): void {
    this.fillRule = fillRule;
    this.context.beginPath();
  }

  moveTo(x: number, y: number): void {
    this.context.moveTo(x * this.scale, y * this.scale);
  }

  lineTo(x: number, y: number): void {
    this.context.lineTo(x * this.scale, y * this.scale);
  }

  arc(
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    counterclockwise: boolean,
  ): void {
    this.context.arc(
      centerX * this.scale,
      centerY * this.scale,
      radius * this.scale,
      startAngle,
      endAngle,
      counterclockwise,
    );
  }

  cubicTo(
    control1X: number,
    control1Y: number,
    control2X: number,
    control2Y: number,
    x: number,
    y: number,
  ): void {
    this.context.bezierCurveTo(
      control1X * this.scale,
      control1Y * this.scale,
      control2X * this.scale,
      control2Y * this.scale,
      x * this.scale,
      y * this.scale,
    );
  }

  closePath(): void {
    this.context.closePath();
  }

  endPath(): void {
    this.context.fill(this.fillRule);
  }

  endLayer(): void {}

  clearImageArea(area: {x: number; y: number; size: number}): void {
    this.context.clearRect(
      area.x * this.scale,
      area.y * this.scale,
      area.size * this.scale,
      area.size * this.scale,
    );
    this.context.fillStyle = this.background;
    this.context.fillRect(
      area.x * this.scale,
      area.y * this.scale,
      area.size * this.scale,
      area.size * this.scale,
    );
  }
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

export function assertOptionalString(
  value: unknown,
  field: string,
): asserts value is string | undefined {
  if (value !== undefined && typeof value !== 'string') {
    throw new QRCodeError('INVALID_OPTIONS', `QR code ${field} must be a string`, {
      details: {field, value},
    });
  }
}
