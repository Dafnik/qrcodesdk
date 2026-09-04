import type {QRCodeDrawingTarget} from './drawing';
import {createQRCodeStyler} from './drawing/styler';
import {QRCodeError} from './error';
import {assertKnownKeys} from './styling';
import type {
  QRCodeImageOverlayOptions,
  QRCodeMatrix,
  QRCodeMatrixOptions,
  QRCodeRenderer,
  QRCodeVisualStyle,
} from './types';

export type QRCodeDataImageURL = `data:image/${string}`;
export type QRCodeSVGImageOptions = QRCodeImageOverlayOptions<QRCodeDataImageURL>;
export type QRCodeSVGAccessibilityOptions = {
  readonly ariaLabel?: string;
  readonly title?: string;
};
export type QRCodeSVGRendererOptions = {
  readonly style?: QRCodeVisualStyle;
  readonly accessibility?: QRCodeSVGAccessibilityOptions;
  readonly image?: QRCodeSVGImageOptions;
};
export type QRCodeSVGOptions = QRCodeSVGRendererOptions & {
  readonly matrix?: QRCodeMatrixOptions;
};

export function QRCodeSVGRenderer(options?: QRCodeSVGRendererOptions): QRCodeRenderer<string> {
  assertKnownKeys(options, 'options', ['style', 'accessibility', 'image']);
  assertKnownKeys(options?.accessibility, 'accessibility', ['ariaLabel', 'title']);
  assertKnownKeys(options?.image, 'image', ['source', 'size', 'padding', 'clearBackground']);
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
  if (imageOptions && !isQRCodeDataImageURL(imageOptions.source)) {
    throw new QRCodeError(
      'INVALID_IMAGE_SOURCE',
      'QR code SVG image source must be an embedded data:image URL',
      {details: {source: imageOptions.source}},
    );
  }
  if (imageOptions) {
    styler.draw([[1]]).placeImage(imageLayout);
  }

  return (matrix: QRCodeMatrix) => {
    const drawing = styler.draw(matrix);
    const target = new SVGDrawingTarget(drawing.viewSize);
    drawing.paint(target);
    const accessibleName = accessibility?.ariaLabel?.trim();
    const title = accessibility?.title;
    const isLabeled = Boolean(accessibleName || title?.trim());
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${drawing.outputSize}" height="${drawing.outputSize}" viewBox="0 0 ${drawing.viewSize} ${drawing.viewSize}"${isLabeled ? ' role="img"' : ' aria-hidden="true"'}${target.hasCurves ? '' : ' shape-rendering="crispEdges"'}`;
    if (accessibleName) svg += ` aria-label="${escapeAttributeValue(accessibleName)}"`;
    svg += '>';
    if (title) svg += `<title>${escapeTextContent(title)}</title>`;
    svg += target.backgroundString();

    const placement = imageOptions ? drawing.placeImage(imageLayout) : undefined;
    if (placement?.clear) {
      const maskId =
        `qrcodesdk-clear-${drawing.viewSize}-${formatNumber(placement.clear.x)}-${formatNumber(placement.clear.size)}`.replace(
          /\./g,
          '-',
        );
      svg += `<defs><mask id="${maskId}"><rect width="${drawing.viewSize}" height="${drawing.viewSize}" fill="#fff"/><rect x="${formatNumber(placement.clear.x)}" y="${formatNumber(placement.clear.y)}" width="${formatNumber(placement.clear.size)}" height="${formatNumber(placement.clear.size)}" fill="#000"/></mask></defs><g mask="url(#${maskId})">${target.layersString()}</g>`;
    } else {
      svg += target.layersString();
    }

    if (imageOptions && placement) {
      svg += `<image href="${escapeAttributeValue(imageOptions.source)}" x="${formatNumber(placement.image.x)}" y="${formatNumber(placement.image.y)}" width="${formatNumber(placement.image.size)}" height="${formatNumber(placement.image.size)}" preserveAspectRatio="xMidYMid meet"/>`;
    }
    return `${svg}</svg>`;
  };
}

class SVGDrawingTarget implements QRCodeDrawingTarget {
  hasCurves = false;
  backgroundFill = '#000000';
  backgroundOpacity = '';
  private backgroundMarkup = '';
  private layerMarkup = '';
  private path = '';
  private fill = '#000000';
  private opacity = '';
  private fillRule: 'nonzero' | 'evenodd' = 'evenodd';

  constructor(private readonly viewSize: number) {}

  drawBackground(red: number, green: number, blue: number, alpha: number): void {
    this.backgroundFill = rgbHex(red, green, blue);
    this.backgroundOpacity = opacityAttribute(alpha);
    this.backgroundMarkup = `<path fill="${this.backgroundFill}"${this.backgroundOpacity} d="M0 0h${this.viewSize}v${this.viewSize}H0z"/>`;
  }

  beginLayer(red: number, green: number, blue: number, alpha: number): void {
    this.fill = rgbHex(red, green, blue);
    this.opacity = opacityAttribute(alpha);
    this.path = '';
  }

  drawRectangle(x: number, y: number, width: number, height: number): void {
    this.path += `M${point(x, y)}h${formatNumber(width)}v${formatNumber(height)}h-${formatNumber(width)}Z`;
  }

  beginPath(fillRule: 'nonzero' | 'evenodd'): void {
    this.fillRule = fillRule;
    this.hasCurves = true;
  }

  moveTo(x: number, y: number): void {
    this.path += `M${point(x, y)}`;
  }

  lineTo(x: number, y: number): void {
    this.path += `L${point(x, y)}`;
  }

  arc(
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    counterclockwise: boolean,
  ): void {
    let delta = endAngle - startAngle;
    if (counterclockwise) {
      while (delta >= 0) delta -= Math.PI * 2;
    } else {
      while (delta <= 0) delta += Math.PI * 2;
    }
    if (Math.abs(delta) >= Math.PI * 2 - 1e-10) {
      const middle = startAngle + delta / 2;
      this.appendArc(centerX, centerY, radius, middle, counterclockwise, true);
      this.appendArc(centerX, centerY, radius, endAngle, counterclockwise, true);
      return;
    }
    this.appendArc(centerX, centerY, radius, endAngle, counterclockwise, Math.abs(delta) > Math.PI);
  }

  cubicTo(
    control1X: number,
    control1Y: number,
    control2X: number,
    control2Y: number,
    x: number,
    y: number,
  ): void {
    this.path += `C${point(control1X, control1Y)} ${point(control2X, control2Y)} ${point(x, y)}`;
  }

  closePath(): void {
    this.path += 'Z';
  }

  endPath(): void {}

  endLayer(): void {
    if (this.path) {
      this.layerMarkup += `<path fill="${this.fill}"${this.opacity} fill-rule="${this.fillRule}" d="${this.path}"/>`;
    }
  }

  backgroundString(): string {
    return this.backgroundMarkup;
  }

  layersString(): string {
    return this.layerMarkup;
  }

  private appendArc(
    centerX: number,
    centerY: number,
    radius: number,
    endAngle: number,
    counterclockwise: boolean,
    largeArc: boolean,
  ): void {
    const x = centerX + Math.cos(endAngle) * radius;
    const y = centerY + Math.sin(endAngle) * radius;
    this.path += `A${formatNumber(radius)} ${formatNumber(radius)} 0 ${largeArc ? 1 : 0} ${counterclockwise ? 0 : 1} ${point(x, y)}`;
  }
}

function isQRCodeDataImageURL(value: unknown): value is QRCodeDataImageURL {
  if (typeof value !== 'string' || !value.startsWith('data:')) return false;
  const commaIndex = value.indexOf(',');
  if (commaIndex < 0 || commaIndex === value.length - 1) return false;
  return /^image\/[a-z0-9.+-]+$/i.test(value.slice(5, commaIndex).split(';', 1)[0] ?? '');
}

function assertOptionalString(value: unknown, field: string): asserts value is string | undefined {
  if (value !== undefined && typeof value !== 'string') {
    throw new QRCodeError('INVALID_OPTIONS', `QR code ${field} must be a string`, {
      details: {field, value},
    });
  }
}

function rgbHex(red: number, green: number, blue: number): string {
  return `#${red.toString(16).padStart(2, '0')}${green.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`;
}

function opacityAttribute(alpha: number): string {
  return alpha === 255 ? '' : ` fill-opacity="${formatNumber(alpha / 255)}"`;
}

function point(x: number, y: number): string {
  return `${formatNumber(x)} ${formatNumber(y)}`;
}

function formatNumber(value: number): string {
  return String(Math.round(value * 1_000_000) / 1_000_000);
}

function escapeAttributeValue(value: string): string {
  return value.replace(/[&"<>]/g, (character) =>
    character === '&'
      ? '&amp;'
      : character === '"'
        ? '&quot;'
        : character === '<'
          ? '&lt;'
          : '&gt;',
  );
}

function escapeTextContent(value: string): string {
  return value.replace(/[&<>]/g, (character) =>
    character === '&' ? '&amp;' : character === '<' ? '&lt;' : '&gt;',
  );
}
