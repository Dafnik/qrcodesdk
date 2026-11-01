import {createCenterImageStore} from './center-image-store';
import {createQRCodeCenterImagePlacement} from './drawing/center-image';
import {toQRCodePathData} from './drawing/path-data';
import {createQRCodeStyler} from './drawing/styler';
import type {QRCodeStylePart} from './drawing/types';
import type {QRCodeDrawing} from './drawing/types';
import {QRCodeError} from './error';
import type {
  QRCodeCenterImageLayout,
  QRCodeColor,
  QRCodeMatrix,
  QRCodeMatrixOptions,
  QRCodeRenderer,
  QRCodeVisualStyle,
} from './types';

export type {QRCodeCenterImageLayout} from './types';

export type QRCodeDataImageURL = `data:image/${string}`;
declare const svgCenterImageBrand: unique symbol;
/** A center image for SVG output, created with `svgCenterImage()`. */
export type QRCodeSVGCenterImage = {readonly [svgCenterImageBrand]: true};

const centerImages = createCenterImageStore<{
  readonly part: QRCodeStylePart;
  markup(drawing: QRCodeDrawing): string;
}>();
export type QRCodeSVGAccessibilityOptions = {
  readonly ariaLabel?: string;
  readonly title?: string;
};
export type QRCodeSVGRendererOptions = {
  readonly style?: QRCodeVisualStyle;
  readonly accessibility?: QRCodeSVGAccessibilityOptions;
  readonly centerImage?: QRCodeSVGCenterImage;
};
export type QRCodeSVGOptions = QRCodeSVGRendererOptions & {
  readonly matrix?: QRCodeMatrixOptions;
};

export function QRCodeSVGRenderer(options?: QRCodeSVGRendererOptions): QRCodeRenderer<string> {
  const {ariaLabel, title} = options?.accessibility ?? {};
  validateOptionalXMLText(ariaLabel, 'accessibility.ariaLabel');
  validateOptionalXMLText(title, 'accessibility.title');
  const centerImage = centerImages.resolve(options?.centerImage);
  const draw = createQRCodeStyler(options?.style, [centerImage?.part]);
  const accessibleName = ariaLabel?.trim();

  return (matrix: QRCodeMatrix) => {
    const drawing = draw(matrix);
    const {viewSize, outputSize} = drawing;
    let layers = '';
    let needsAntialiasing = false;
    for (const layer of drawing.layers) {
      needsAntialiasing ||=
        layer.tiles.length > 0 || layer.rects.some((value) => !Number.isInteger(value));
      layers += `<path${fill(layer.color)} fill-rule="evenodd" d="${toQRCodePathData(layer)}"/>`;
    }
    const background = `<path${fill(drawing.background)} d="M0 0h${viewSize}v${viewSize}H0z"/>`;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${outputSize}" height="${outputSize}" viewBox="0 0 ${viewSize} ${viewSize}"${accessibleName || title?.trim() ? ' role="img"' : ' aria-hidden="true"'}${needsAntialiasing ? '' : ' shape-rendering="crispEdges"'}`;
    if (accessibleName) svg += ` aria-label="${escapeXML(accessibleName, true)}"`;
    svg += '>';
    if (title) svg += `<title>${escapeXML(title)}</title>`;
    svg += background;

    return `${svg}${layers}${centerImage?.markup(drawing) ?? ''}</svg>`;
  };
}

/** Creates an SVG center image from an embedded `data:image` URL. */
export function svgCenterImage(
  source: QRCodeDataImageURL,
  layout?: QRCodeCenterImageLayout,
): QRCodeSVGCenterImage {
  if (!isValidImageDataURL(source) || !isXMLString(source)) {
    throw new QRCodeError(
      'INVALID_IMAGE_SOURCE',
      'QR code SVG image source must be an embedded data:image URL',
      {details: {source}},
    );
  }
  const {part, place} = createQRCodeCenterImagePlacement(layout);
  const href = escapeXML(source, true);
  return centerImages.create({
    part,
    markup(drawing) {
      const {x, y, size} = place(drawing);
      return `<image href="${href}" x="${formatNumber(x)}" y="${formatNumber(y)}" width="${formatNumber(size)}" height="${formatNumber(size)}" preserveAspectRatio="xMidYMid meet"/>`;
    },
  }) as QRCodeSVGCenterImage;
}

function isValidImageDataURL(value: QRCodeDataImageURL): boolean {
  if (!value.startsWith('data:')) return false;
  const commaIndex = value.indexOf(',');
  if (commaIndex < 0 || commaIndex === value.length - 1) return false;
  return /^image\/[a-z0-9.+-]+$/i.test(value.slice(5, commaIndex).split(';', 1)[0] ?? '');
}

function validateOptionalXMLText(value: string | undefined, field: string): void {
  if (value !== undefined && !isXMLString(value)) {
    throw new QRCodeError('INVALID_OPTIONS', `QR code ${field} must contain valid XML characters`, {
      details: {field, value},
    });
  }
}

function isXMLString(value: string): boolean {
  return /^[\t\n\r\u0020-\ud7ff\ue000-\ufffd\u{10000}-\u{10ffff}]*$/u.test(value);
}

function fill(color: QRCodeColor): string {
  return ` fill="${color.slice(0, 7)}"${
    color.length === 9 ? ` fill-opacity="${formatNumber(parseInt(color.slice(7), 16) / 255)}"` : ''
  }`;
}

function roundNumber(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function formatNumber(value: number): string {
  return String(roundNumber(value));
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
