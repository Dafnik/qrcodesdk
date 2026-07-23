import {createQRCodeStylePlan} from './style-plan';
import {parseQRCodeStylingOptions} from './styling';
import type {
  QRCodeAccessibilityOptions,
  QRCodeMatrix,
  QRCodeOptions,
  QRCodeRenderer,
  QRCodeStylePrimitive,
  QRCodeStyleRotation,
  QRCodeStylingOptions,
} from './types';

export type QRCodeSVGRendererOptions = QRCodeStylingOptions & QRCodeAccessibilityOptions;
export type QRCodeSVGOptions = QRCodeOptions<QRCodeSVGRendererOptions>;

export function QRCodeSVGRenderer(options?: QRCodeSVGRendererOptions): QRCodeRenderer<string> {
  return (matrix: QRCodeMatrix) => {
    const styling = parseQRCodeStylingOptions(options);
    const plan = createQRCodeStylePlan(matrix, styling);
    const shapeRendering = !plan.hasCurves ? ' shape-rendering="crispEdges"' : '';
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${plan.renderedSize}" height="${plan.renderedSize}" viewBox="0 0 ${plan.viewSize} ${plan.viewSize}"${shapeRendering}`;

    if (options?.alt) svg += ` alt="${escapeAttributeValue(options.alt)}"`;
    if (options?.ariaLabel) svg += ` aria-label="${escapeAttributeValue(options.ariaLabel)}"`;
    if (options?.title) svg += ` title="${escapeAttributeValue(options.title)}"`;

    svg += `><path fill="${escapeAttributeValue(plan.backgroundColor)}" d="M0 0h${plan.viewSize}v${plan.viewSize}H0z"/>`;
    const pathsByColor = createPathsByColor(plan.primitives, plan.viewSize);
    for (let index = 0; index < pathsByColor.length; index++) {
      const {color, path} = pathsByColor[index]!;
      svg += `<path fill="${escapeAttributeValue(color)}" fill-rule="evenodd" d="${path}"/>`;
    }

    return `${svg}</svg>`;
  };
}

type SVGPathGroup = {
  color: string;
  squareCells: Uint8Array;
  curvedPaths: string[];
};

type SVGPathByColor = {
  color: string;
  path: string;
};

function createPathsByColor(
  primitives: readonly QRCodeStylePrimitive[],
  viewSize: number,
): SVGPathByColor[] {
  let squareGridWidth = viewSize;
  let squareGridHeight = viewSize;
  for (let index = 0; index < primitives.length; index++) {
    const primitive = primitives[index]!;
    if (primitive.shape !== 'square') continue;
    const size = primitive.kind === 'module' ? 1 : primitive.size;
    squareGridWidth = Math.max(squareGridWidth, primitive.x + size);
    squareGridHeight = Math.max(squareGridHeight, primitive.y + size);
  }

  const groupsByColor = new Map<string, SVGPathGroup>();
  const groups: SVGPathGroup[] = [];

  for (let index = 0; index < primitives.length; index++) {
    const primitive = primitives[index]!;
    let group = groupsByColor.get(primitive.color);
    if (!group) {
      group = {
        color: primitive.color,
        squareCells: new Uint8Array(squareGridWidth * squareGridHeight),
        curvedPaths: [],
      };
      groupsByColor.set(primitive.color, group);
      groups.push(group);
    }

    if (primitive.shape === 'square') {
      addSquarePrimitiveCells(group.squareCells, squareGridWidth, primitive);
    } else {
      group.curvedPaths.push(primitiveToPath(primitive));
    }
  }

  const paths: SVGPathByColor[] = [];
  for (let index = 0; index < groups.length; index++) {
    const group = groups[index]!;
    paths.push({
      color: group.color,
      path: `${compactSquareCells(group.squareCells, squareGridWidth, squareGridHeight)}${group.curvedPaths.join('')}`,
    });
  }

  return paths;
}

function addSquarePrimitiveCells(
  cells: Uint8Array,
  viewSize: number,
  primitive: QRCodeStylePrimitive,
): void {
  const x = primitive.x;
  const y = primitive.y;

  if (primitive.kind === 'module') {
    cells[y * viewSize + x] = 1;
    return;
  }

  if (primitive.kind === 'finder-center') {
    for (let row = 0; row < primitive.size; row++) {
      const start = (y + row) * viewSize + x;
      cells.fill(1, start, start + primitive.size);
    }
    return;
  }

  const top = y * viewSize + x;
  const bottom = (y + primitive.size - 1) * viewSize + x;
  cells.fill(1, top, top + primitive.size);
  cells.fill(1, bottom, bottom + primitive.size);
  for (let row = 1; row < primitive.size - 1; row++) {
    const start = (y + row) * viewSize + x;
    cells[start] = 1;
    cells[start + primitive.size - 1] = 1;
  }
}

function compactSquareCells(cells: Uint8Array, width: number, height: number): string {
  const rectangleXs: number[] = [];
  const rectangleYs: number[] = [];
  const rectangleWidths: number[] = [];
  const rectangleHeights: number[] = [];
  let previousWidths = new Uint16Array(width);
  let previousRectangleIndexes = new Int32Array(width);
  let currentWidths = new Uint16Array(width);
  let currentRectangleIndexes = new Int32Array(width);

  for (let y = 0; y < height; y++) {
    currentWidths.fill(0);
    const rowOffset = y * width;
    let x = 0;

    while (x < width) {
      while (x < width && cells[rowOffset + x] === 0) x++;
      if (x === width) break;

      const start = x;
      while (x < width && cells[rowOffset + x] === 1) x++;
      const runWidth = x - start;
      let rectangleIndex: number;

      if (previousWidths[start] === runWidth) {
        rectangleIndex = previousRectangleIndexes[start]!;
        rectangleHeights[rectangleIndex]!++;
      } else {
        rectangleIndex = rectangleXs.length;
        rectangleXs.push(start);
        rectangleYs.push(y);
        rectangleWidths.push(runWidth);
        rectangleHeights.push(1);
      }

      currentWidths[start] = runWidth;
      currentRectangleIndexes[start] = rectangleIndex;
    }

    [previousWidths, currentWidths] = [currentWidths, previousWidths];
    [previousRectangleIndexes, currentRectangleIndexes] = [
      currentRectangleIndexes,
      previousRectangleIndexes,
    ];
  }

  let path = '';
  for (let index = 0; index < rectangleXs.length; index++) {
    path += `M${rectangleXs[index]} ${rectangleYs[index]}h${rectangleWidths[index]}v${rectangleHeights[index]}h-${rectangleWidths[index]}Z`;
  }
  return path;
}

function primitiveToPath(primitive: QRCodeStylePrimitive): string {
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
      return localPath(primitive, [
        ['M', 0, 0],
        ['L', 0, 1],
        ['L', 0.5, 1],
        ['A', 0.5, 0, 0.5, 0],
        ['Z'],
      ]);
    case 'corner-rounded':
      return localPath(primitive, [
        ['M', 0, 0],
        ['L', 0, 1],
        ['L', 1, 1],
        ['L', 1, 0.5],
        ['A', 0.5, 0, 0.5, 0],
        ['Z'],
      ]);
    case 'corner-extra-rounded':
      return localPath(primitive, [
        ['M', 0, 0],
        ['L', 0, 1],
        ['L', 1, 1],
        ['A', 1, 0, 0, 0],
        ['Z'],
      ]);
    case 'opposite-corners-rounded':
      return localPath(primitive, [
        ['M', 0, 0],
        ['L', 0, 0.5],
        ['A', 0.5, 0, 0.5, 1],
        ['L', 1, 1],
        ['L', 1, 0.5],
        ['A', 0.5, 0, 0.5, 0],
        ['Z'],
      ]);
    default:
      return roundedSquarePath(primitive, 0);
  }
}

type LocalPathCommand =
  | readonly ['M' | 'L', number, number]
  | readonly ['A', number, 0 | 1, number, number]
  | readonly ['Z'];

function localPath(primitive: QRCodeStylePrimitive, commands: readonly LocalPathCommand[]): string {
  let path = '';
  for (let index = 0; index < commands.length; index++) {
    const command = commands[index]!;
    if (command[0] === 'Z') {
      path += 'Z';
      continue;
    }

    if (command[0] === 'A') {
      const point = rotateLocalPoint(command[3], command[4], primitive.rotation);
      const x = primitive.x + point.x * primitive.size;
      const y = primitive.y + point.y * primitive.size;
      path += `A${formatNumber(command[1] * primitive.size)} ${formatNumber(
        command[1] * primitive.size,
      )} 0 ${command[2]} 0 ${formatPoint(x, y)}`;
    } else {
      const point = rotateLocalPoint(command[1], command[2], primitive.rotation);
      const x = primitive.x + point.x * primitive.size;
      const y = primitive.y + point.y * primitive.size;
      path += `${command[0]}${formatPoint(x, y)}`;
    }
  }
  return path;
}

function circlePath(primitive: QRCodeStylePrimitive, radius: number): string {
  const centerX = primitive.x + primitive.size / 2;
  const centerY = primitive.y + primitive.size / 2;
  return `M${formatPoint(centerX, centerY - radius)}A${formatNumber(radius)} ${formatNumber(
    radius,
  )} 0 1 1 ${formatPoint(centerX, centerY + radius)}A${formatNumber(radius)} ${formatNumber(
    radius,
  )} 0 1 1 ${formatPoint(centerX, centerY - radius)}Z`;
}

function roundedSquarePath(primitive: QRCodeStylePrimitive, radius: number): string {
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

function rotateLocalPoint(
  x: number,
  y: number,
  rotation: QRCodeStyleRotation,
): {x: number; y: number} {
  switch (rotation) {
    case 90:
      return {x: 1 - y, y: x};
    case 180:
      return {x: 1 - x, y: 1 - y};
    case 270:
      return {x: y, y: 1 - x};
    default:
      return {x, y};
  }
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
