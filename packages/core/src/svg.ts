import {createQRCodeStyler} from './drawing/styler';
import {QRCodeError} from './error';
import {assertKnownKeys, assertOptionalString} from './options';
import type {
  QRCodeCenterImageOptions,
  QRCodeMatrix,
  QRCodeMatrixOptions,
  QRCodeRenderer,
  QRCodeVisualStyle,
} from './types';

export type QRCodeDataImageURL = `data:image/${string}`;
export type QRCodeSVGCenterImageOptions = QRCodeCenterImageOptions<QRCodeDataImageURL>;
export type QRCodeSVGAccessibilityOptions = {
  readonly ariaLabel?: string;
  readonly title?: string;
};
export type QRCodeSVGRendererOptions = {
  readonly style?: QRCodeVisualStyle;
  readonly accessibility?: QRCodeSVGAccessibilityOptions;
  readonly centerImage?: QRCodeSVGCenterImageOptions;
};
export type QRCodeSVGOptions = QRCodeSVGRendererOptions & {
  readonly matrix?: QRCodeMatrixOptions;
};

export function QRCodeSVGRenderer(options?: QRCodeSVGRendererOptions): QRCodeRenderer<string> {
  assertKnownKeys(options, 'options', ['style', 'accessibility', 'centerImage']);
  assertKnownKeys(options?.accessibility, 'accessibility', ['ariaLabel', 'title']);
  assertKnownKeys(options?.centerImage, 'centerImage', [
    'source',
    'size',
    'padding',
    'clearBackground',
  ]);
  const {ariaLabel, title} = options?.accessibility ?? {};
  assertOptionalXMLString(ariaLabel, 'accessibility.ariaLabel');
  assertOptionalXMLString(title, 'accessibility.title');
  const styler = createQRCodeStyler(options?.style);
  const centerImage = options?.centerImage;
  const {source, ...centerImageLayout} = centerImage ?? {};
  if (centerImage) {
    if (!isQRCodeDataImageURL(source) || !isXMLString(source)) {
      throw new QRCodeError(
        'INVALID_IMAGE_SOURCE',
        'QR code SVG image source must be an embedded data:image URL',
        {details: {source}},
      );
    }
    styler.draw([[1]]).placeCenterImage(centerImageLayout);
  }
  const accessibleName = ariaLabel?.trim();

  return (matrix: QRCodeMatrix) => {
    const {viewSize, outputSize, paint, placeCenterImage} = styler.draw(matrix);
    let background = '';
    let layers = '';
    let layer = '';
    let path = '';
    let hasCurves = false;
    paint({
      drawBackground(red, green, blue, alpha) {
        background = `<path fill="${rgbHex(red, green, blue)}"${opacityAttribute(alpha)} d="M0 0h${viewSize}v${viewSize}H0z"/>`;
      },
      beginLayer(red, green, blue, alpha) {
        layer = `<path fill="${rgbHex(red, green, blue)}"${opacityAttribute(alpha)} fill-rule="evenodd" d="`;
        path = '';
      },
      drawRectangle(x, y, width, height) {
        path += `M${point(x, y)}h${formatNumber(width)}v${formatNumber(height)}h-${formatNumber(width)}Z`;
      },
      beginPath() {
        hasCurves = true;
      },
      moveTo(x, y) {
        path += `M${point(x, y)}`;
      },
      lineTo(x, y) {
        path += `L${point(x, y)}`;
      },
      arc(centerX, centerY, radius, startAngle, endAngle, counterclockwise) {
        let delta = endAngle - startAngle;
        if (counterclockwise) {
          while (delta >= 0) delta -= Math.PI * 2;
        } else {
          while (delta <= 0) delta += Math.PI * 2;
        }
        if (Math.abs(delta) >= Math.PI * 2 - 1e-10) {
          path += arcTo(centerX, centerY, radius, startAngle + delta / 2, counterclockwise, true);
          path += arcTo(centerX, centerY, radius, endAngle, counterclockwise, true);
        } else {
          path += arcTo(
            centerX,
            centerY,
            radius,
            endAngle,
            counterclockwise,
            Math.abs(delta) > Math.PI,
          );
        }
      },
      closePath() {
        path += 'Z';
      },
      endPath() {},
      endLayer() {
        if (path) layers += `${layer}${path}"/>`;
      },
    });

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${outputSize}" height="${outputSize}" viewBox="0 0 ${viewSize} ${viewSize}"${accessibleName || title?.trim() ? ' role="img"' : ' aria-hidden="true"'}${hasCurves ? '' : ' shape-rendering="crispEdges"'}`;
    if (accessibleName) svg += ` aria-label="${escapeXML(accessibleName, true)}"`;
    svg += '>';
    if (title) svg += `<title>${escapeXML(title)}</title>`;
    svg += background;

    if (!centerImage) return `${svg}${layers}</svg>`;
    const {centerImage: image, clear} = placeCenterImage(centerImageLayout);
    if (clear) {
      const maskId =
        `qrcodesdk-clear-${viewSize}-${formatNumber(clear.x)}-${formatNumber(clear.size)}`.replace(
          /\./g,
          '-',
        );
      svg += `<defs><mask id="${maskId}"><rect width="${viewSize}" height="${viewSize}" fill="#fff"/><rect x="${formatNumber(clear.x)}" y="${formatNumber(clear.y)}" width="${formatNumber(clear.size)}" height="${formatNumber(clear.size)}" fill="#000"/></mask></defs><g mask="url(#${maskId})">${layers}</g>`;
    } else {
      svg += layers;
    }
    return `${svg}<image href="${escapeXML(source!, true)}" x="${formatNumber(image.x)}" y="${formatNumber(image.y)}" width="${formatNumber(image.size)}" height="${formatNumber(image.size)}" preserveAspectRatio="xMidYMid meet"/></svg>`;
  };
}

function isQRCodeDataImageURL(value: unknown): value is QRCodeDataImageURL {
  if (typeof value !== 'string' || !value.startsWith('data:')) return false;
  const commaIndex = value.indexOf(',');
  if (commaIndex < 0 || commaIndex === value.length - 1) return false;
  return /^image\/[a-z0-9.+-]+$/i.test(value.slice(5, commaIndex).split(';', 1)[0] ?? '');
}

function assertOptionalXMLString(
  value: unknown,
  field: string,
): asserts value is string | undefined {
  assertOptionalString(value, field);
  if (typeof value === 'string' && !isXMLString(value)) {
    throw new QRCodeError('INVALID_OPTIONS', `QR code ${field} must contain valid XML characters`, {
      details: {field, value},
    });
  }
}

function isXMLString(value: string): boolean {
  return /^[\t\n\r\u0020-\ud7ff\ue000-\ufffd\u{10000}-\u{10ffff}]*$/u.test(value);
}

function arcTo(
  centerX: number,
  centerY: number,
  radius: number,
  angle: number,
  counterclockwise: boolean,
  largeArc: boolean,
): string {
  return `A${formatNumber(radius)} ${formatNumber(radius)} 0 ${largeArc ? 1 : 0} ${counterclockwise ? 0 : 1} ${point(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius)}`;
}

function rgbHex(red: number, green: number, blue: number): string {
  return `#${((1 << 24) | (red << 16) | (green << 8) | blue).toString(16).slice(1)}`;
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

function escapeXML(value: string, attribute?: boolean): string {
  return value.replace(attribute ? /[&"<>]/g : /[&<>]/g, (character) =>
    character === '&'
      ? '&amp;'
      : character === '"'
        ? '&quot;'
        : character === '<'
          ? '&lt;'
          : '&gt;',
  );
}
