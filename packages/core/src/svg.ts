import {QRCodeError} from './error';
import {resolveQRCodeImageOverlay} from './image-overlay';
import {createQRCodeStylePlan} from './style-plan';
import {parseQRCodeStylingOptions} from './styling';
import type {
  QRCodeAccessibilityOptions,
  QRCodeImageOverlayOptions,
  QRCodeMatrix,
  QRCodeOptions,
  QRCodeRenderer,
  QRCodeStylingOptions,
  ɵQRCodeStyleLayer,
  ɵQRCodeStylePrimitive,
} from './types';

export type QRCodeDataImageURL = `data:image/${string}`;
export type QRCodeSVGImageOptions = QRCodeImageOverlayOptions<QRCodeDataImageURL>;
export type QRCodeSVGRendererOptions = QRCodeStylingOptions &
  QRCodeAccessibilityOptions & {
    image?: QRCodeSVGImageOptions;
  };
export type QRCodeSVGOptions = QRCodeOptions<QRCodeSVGRendererOptions>;

export function QRCodeSVGRenderer(options?: QRCodeSVGRendererOptions): QRCodeRenderer<string> {
  let resolvedOptions:
    | {
        styling: ReturnType<typeof parseQRCodeStylingOptions>;
        image: QRCodeSVGImageOptions | undefined;
        alt: string | undefined;
        ariaLabel: string | undefined;
        title: string | undefined;
      }
    | undefined;

  return (matrix: QRCodeMatrix) => {
    const resolved = (resolvedOptions ??= {
      styling: parseQRCodeStylingOptions(options),
      image: options?.image ? {...options.image} : undefined,
      alt: options?.alt,
      ariaLabel: options?.ariaLabel,
      title: options?.title,
    });
    const styling = resolved.styling;
    const plan = createQRCodeStylePlan(matrix, styling);
    const image = resolveQRCodeImageOverlay(plan.moduleCount, styling.margin, resolved.image);
    if (image && !isQRCodeDataImageURL(image.source)) {
      throw new QRCodeError(
        'INVALID_IMAGE_SOURCE',
        'QR code SVG image source must be an embedded data:image URL',
        {details: {source: image.source}},
      );
    }
    const shapeRendering = !plan.hasCurves ? ' shape-rendering="crispEdges"' : '';
    const accessibleName = resolved.ariaLabel ?? resolved.alt;
    const isLabeled = Boolean(accessibleName?.trim() || resolved.title?.trim());
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${plan.renderedSize}" height="${plan.renderedSize}" viewBox="0 0 ${plan.viewSize} ${plan.viewSize}"${isLabeled ? ' role="img"' : ' aria-hidden="true"'}${shapeRendering}`;

    if (accessibleName) svg += ` aria-label="${escapeAttributeValue(accessibleName)}"`;

    svg += '>';
    if (resolved.title) svg += `<title>${escapeTextContent(resolved.title)}</title>`;
    svg += `<path fill="${escapeAttributeValue(plan.backgroundColor)}" d="M0 0h${plan.viewSize}v${plan.viewSize}H0z"/>`;
    const pathsByColor = createPathsByColor(plan.layers);
    for (let index = 0; index < pathsByColor.length; index++) {
      const {color, path} = pathsByColor[index]!;
      svg += `<path fill="${escapeAttributeValue(color)}" fill-rule="evenodd" d="${path}"/>`;
    }

    if (image) {
      if (image.clearBackground) {
        svg += `<rect fill="${escapeAttributeValue(plan.backgroundColor)}" x="${formatNumber(
          image.clearX,
        )}" y="${formatNumber(image.clearY)}" width="${formatNumber(
          image.clearSize,
        )}" height="${formatNumber(image.clearSize)}"/>`;
      }
      svg += `<image href="${escapeAttributeValue(image.source)}" x="${formatNumber(
        image.imageX,
      )}" y="${formatNumber(image.imageY)}" width="${formatNumber(
        image.imageSize,
      )}" height="${formatNumber(image.imageSize)}" preserveAspectRatio="xMidYMid meet"/>`;
    }

    return `${svg}</svg>`;
  };
}

function isQRCodeDataImageURL(value: unknown): value is QRCodeDataImageURL {
  if (typeof value !== 'string' || !value.startsWith('data:')) return false;

  const commaIndex = value.indexOf(',');
  if (commaIndex < 0 || commaIndex === value.length - 1) return false;

  const mediaType = value.slice(5, commaIndex).split(';', 1)[0];
  return /^image\/[a-z0-9.+-]+$/i.test(mediaType ?? '');
}

type SVGPathByColor = {
  color: string;
  path: string;
};

function createPathsByColor(layers: readonly ɵQRCodeStyleLayer[]): SVGPathByColor[] {
  const paths: SVGPathByColor[] = [];
  for (let index = 0; index < layers.length; index++) {
    const layer = layers[index]!;
    let path = '';
    for (let rectangleIndex = 0; rectangleIndex < layer.rectangles.length; rectangleIndex++) {
      const rectangle = layer.rectangles[rectangleIndex]!;
      path += `M${rectangle.x} ${rectangle.y}h${rectangle.width}v${rectangle.height}h-${rectangle.width}Z`;
    }
    for (let primitiveIndex = 0; primitiveIndex < layer.curvedPrimitives.length; primitiveIndex++) {
      path += primitiveToPath(layer.curvedPrimitives[primitiveIndex]!);
    }
    paths.push({
      color: layer.color,
      path,
    });
  }

  return paths;
}

type LocalPathCommand =
  | readonly ['M' | 'L', number, number]
  | readonly ['A', number, 0 | 1, number, number]
  | readonly ['Z'];

const SIDE_ROUNDED_COMMANDS = [
  ['M', 0, 0],
  ['L', 0, 1],
  ['L', 0.5, 1],
  ['A', 0.5, 0, 0.5, 0],
  ['Z'],
] as const satisfies readonly LocalPathCommand[];
const CORNER_ROUNDED_COMMANDS = [
  ['M', 0, 0],
  ['L', 0, 1],
  ['L', 1, 1],
  ['L', 1, 0.5],
  ['A', 0.5, 0, 0.5, 0],
  ['Z'],
] as const satisfies readonly LocalPathCommand[];
const CORNER_EXTRA_ROUNDED_COMMANDS = [
  ['M', 0, 0],
  ['L', 0, 1],
  ['L', 1, 1],
  ['A', 1, 0, 0, 0],
  ['Z'],
] as const satisfies readonly LocalPathCommand[];
const OPPOSITE_CORNERS_ROUNDED_COMMANDS = [
  ['M', 0, 0],
  ['L', 0, 0.5],
  ['A', 0.5, 0, 0.5, 1],
  ['L', 1, 1],
  ['L', 1, 0.5],
  ['A', 0.5, 0, 0.5, 0],
  ['Z'],
] as const satisfies readonly LocalPathCommand[];

function primitiveToPath(primitive: ɵQRCodeStylePrimitive): string {
  if (primitive.kind === 'finder-ring') {
    return primitive.shape === 'dot'
      ? `${circlePath(primitive, primitive.size / 2)}${circlePath(
          {...primitive, x: primitive.x + 1, y: primitive.y + 1, size: primitive.size - 2},
          (primitive.size - 2) / 2,
        )}`
      : `${roundedSquarePath(
          primitive,
          primitive.shape === 'extra-rounded' ? 2.5 : 0,
        )}${roundedSquarePath(
          {...primitive, x: primitive.x + 1, y: primitive.y + 1, size: primitive.size - 2},
          primitive.shape === 'extra-rounded' ? 1.5 : 0,
        )}`;
  }

  if (primitive.kind === 'finder-center') {
    return primitive.shape === 'dot'
      ? circlePath(primitive, primitive.size / 2)
      : roundedSquarePath(primitive, 0);
  }

  switch (primitive.shape) {
    case 'dot':
      return circlePath(primitive, primitive.size / 2);
    case 'side-rounded':
      return localPath(primitive, SIDE_ROUNDED_COMMANDS);
    case 'corner-rounded':
      return localPath(primitive, CORNER_ROUNDED_COMMANDS);
    case 'corner-extra-rounded':
      return localPath(primitive, CORNER_EXTRA_ROUNDED_COMMANDS);
    case 'opposite-corners-rounded':
      return localPath(primitive, OPPOSITE_CORNERS_ROUNDED_COMMANDS);
    default:
      return roundedSquarePath(primitive, 0);
  }
}

function localPath(
  primitive: ɵQRCodeStylePrimitive,
  commands: readonly LocalPathCommand[],
): string {
  let path = '';
  for (let index = 0; index < commands.length; index++) {
    const command = commands[index]!;
    if (command[0] === 'Z') {
      path += 'Z';
      continue;
    }

    const pointX = command[0] === 'A' ? command[3] : command[1];
    const pointY = command[0] === 'A' ? command[4] : command[2];
    let rotatedX: number;
    let rotatedY: number;
    switch (primitive.rotation) {
      case 90:
        rotatedX = 1 - pointY;
        rotatedY = pointX;
        break;
      case 180:
        rotatedX = 1 - pointX;
        rotatedY = 1 - pointY;
        break;
      case 270:
        rotatedX = pointY;
        rotatedY = 1 - pointX;
        break;
      default:
        rotatedX = pointX;
        rotatedY = pointY;
    }
    const x = primitive.x + rotatedX * primitive.size;
    const y = primitive.y + rotatedY * primitive.size;

    if (command[0] === 'A') {
      path += `A${formatNumber(command[1] * primitive.size)} ${formatNumber(
        command[1] * primitive.size,
      )} 0 ${command[2]} 0 ${formatPoint(x, y)}`;
    } else {
      path += `${command[0]}${formatPoint(x, y)}`;
    }
  }
  return path;
}

function circlePath(primitive: ɵQRCodeStylePrimitive, radius: number): string {
  const centerX = primitive.x + primitive.size / 2;
  const centerY = primitive.y + primitive.size / 2;
  return `M${formatPoint(centerX, centerY - radius)}A${formatNumber(radius)} ${formatNumber(
    radius,
  )} 0 1 1 ${formatPoint(centerX, centerY + radius)}A${formatNumber(radius)} ${formatNumber(
    radius,
  )} 0 1 1 ${formatPoint(centerX, centerY - radius)}Z`;
}

function roundedSquarePath(primitive: ɵQRCodeStylePrimitive, radius: number): string {
  if (radius === 0) {
    return `M${formatPoint(primitive.x, primitive.y)}h${formatNumber(
      primitive.size,
    )}v${formatNumber(primitive.size)}h${formatNumber(-primitive.size)}Z`;
  }

  const x = primitive.x;
  const y = primitive.y;
  const size = primitive.size;
  return `M${formatPoint(x + radius, y)}H${formatNumber(x + size - radius)}A${radius} ${radius} 0 0 1 ${formatPoint(
    x + size,
    y + radius,
  )}V${formatNumber(y + size - radius)}A${radius} ${radius} 0 0 1 ${formatPoint(
    x + size - radius,
    y + size,
  )}H${formatNumber(x + radius)}A${radius} ${radius} 0 0 1 ${formatPoint(
    x,
    y + size - radius,
  )}V${formatNumber(y + radius)}A${radius} ${radius} 0 0 1 ${formatPoint(x + radius, y)}Z`;
}

function formatPoint(x: number, y: number): string {
  return `${formatNumber(x)} ${formatNumber(y)}`;
}

function formatNumber(value: number): string {
  return String(Math.round(value * 1_000_000) / 1_000_000);
}

function escapeAttributeValue(value: string): string {
  return value.replace(/[&"<>]/g, (character) => {
    switch (character) {
      case '&':
        return '&amp;';
      case '"':
        return '&quot;';
      case '<':
        return '&lt;';
      default:
        return '&gt;';
    }
  });
}

function escapeTextContent(value: string): string {
  return value.replace(/[&<>]/g, (character) => {
    switch (character) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      default:
        return '&gt;';
    }
  });
}
