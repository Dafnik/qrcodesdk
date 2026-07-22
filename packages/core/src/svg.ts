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
    for (const [color, path] of createPathsByColor(plan.primitives)) {
      svg += `<path fill="${escapeAttributeValue(color)}" fill-rule="evenodd" d="${path}"/>`;
    }

    return `${svg}</svg>`;
  };
}

function createPathsByColor(primitives: readonly QRCodeStylePrimitive[]): Map<string, string> {
  const groups = new Map<string, {squareCells: Map<number, Set<number>>; curvedPath: string}>();

  for (const primitive of primitives) {
    let group = groups.get(primitive.color);
    if (!group) {
      group = {squareCells: new Map(), curvedPath: ''};
      groups.set(primitive.color, group);
    }

    if (primitive.shape === 'square') {
      addSquarePrimitiveCells(group.squareCells, primitive);
    } else {
      group.curvedPath += primitiveToPath(primitive);
    }
  }

  const paths = new Map<string, string>();
  for (const [color, group] of groups) {
    paths.set(color, `${compactSquareCells(group.squareCells)}${group.curvedPath}`);
  }

  return paths;
}

function addSquarePrimitiveCells(
  rows: Map<number, Set<number>>,
  primitive: QRCodeStylePrimitive,
): void {
  if (primitive.kind === 'module') {
    addSquareCell(rows, primitive.x, primitive.y);
    return;
  }

  for (let row = 0; row < primitive.size; row++) {
    for (let column = 0; column < primitive.size; column++) {
      if (
        primitive.kind === 'finder-center' ||
        row === 0 ||
        row === primitive.size - 1 ||
        column === 0 ||
        column === primitive.size - 1
      ) {
        addSquareCell(rows, primitive.x + column, primitive.y + row);
      }
    }
  }
}

function addSquareCell(rows: Map<number, Set<number>>, x: number, y: number): void {
  let columns = rows.get(y);
  if (!columns) {
    columns = new Set();
    rows.set(y, columns);
  }
  columns.add(x);
}

type SquareRectangle = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function compactSquareCells(rows: Map<number, Set<number>>): string {
  const rectangles: SquareRectangle[] = [];
  let activeRectangles = new Map<string, number>();
  let previousRow: number | undefined;

  for (const [y, columns] of [...rows].sort(([left], [right]) => left - right)) {
    const currentRectangles = new Map<string, number>();
    for (const run of createHorizontalRuns(columns)) {
      const key = `${run.x}:${run.width}`;
      const activeIndex = previousRow === y - 1 ? activeRectangles.get(key) : undefined;

      if (activeIndex === undefined) {
        rectangles.push({x: run.x, y, width: run.width, height: 1});
        currentRectangles.set(key, rectangles.length - 1);
      } else {
        rectangles[activeIndex]!.height++;
        currentRectangles.set(key, activeIndex);
      }
    }
    activeRectangles = currentRectangles;
    previousRow = y;
  }

  return rectangles
    .map(
      ({x, y, width, height}) =>
        `M${formatPoint(x, y)}h${formatNumber(width)}v${formatNumber(height)}h${formatNumber(-width)}Z`,
    )
    .join('');
}

function createHorizontalRuns(columns: Set<number>): {x: number; width: number}[] {
  const sortedColumns = [...columns].sort((left, right) => left - right);
  const runs: {x: number; width: number}[] = [];

  for (const column of sortedColumns) {
    const lastRun = runs.at(-1);
    if (lastRun && lastRun.x + lastRun.width === column) {
      lastRun.width++;
    } else {
      runs.push({x: column, width: 1});
    }
  }

  return runs;
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
  for (const command of commands) {
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
