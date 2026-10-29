import {assertKnownKeys, throwInvalid} from '../options';
import {
  type QRCodeRGBA,
  calculateQRCodeOutputSize,
  parseQRCodeColor,
  resolveQRCodeVisualStyle,
} from '../styling';
import type {QRCodeColor, QRCodeFinderShape, QRCodeMatrix, QRCodeVisualStyle} from '../types';
import type {QRCodeStyledDrawing, QRCodeStyledDrawingTarget, QRCodeStyler} from './index';

type Rotation = 0 | 90 | 180 | 270;
type ModuleShape =
  | 'circle'
  | 'side-rounded'
  | 'corner-rounded'
  | 'corner-extra-rounded'
  | 'opposite-corners-rounded';
type ResolvedModuleShape = readonly [shape: ModuleShape | 'square', rotation: Rotation];
type Primitive =
  | {kind: 'module'; shape: ModuleShape; x: number; y: number; rotation: Rotation}
  | {kind: 'ring' | 'center'; shape: QRCodeFinderShape; x: number; y: number; size: number};
type Rectangle = {x: number; y: number; width: number; height: number};
type Layer = {
  rgba: QRCodeRGBA;
  squareModules: Uint8Array;
  rectangles: Rectangle[];
  primitives: Primitive[];
};
// Path points in local module coordinates: [x, y] for move/line and
// [centerX, centerY, radius, startAngle, endAngle] for counterclockwise arcs.
type PathCommand = readonly number[];

const FINDER_ROWS = [0x7f, 0x41, 0x5d, 0x5d, 0x5d, 0x41, 0x7f];
const HALF_PI = Math.PI / 2;
const MODULE_PATHS: Record<Exclude<ModuleShape, 'circle'>, readonly PathCommand[]> = {
  'side-rounded': [
    [0, 0],
    [0, 1],
    [0.5, 1],
    [0.5, 0.5, 0.5, HALF_PI, -HALF_PI],
  ],
  'corner-rounded': [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 0.5],
    [0.5, 0.5, 0.5, 0, -HALF_PI],
  ],
  'corner-extra-rounded': [
    [0, 0],
    [0, 1],
    [1, 1],
    [0, 1, 1, 0, -HALF_PI],
  ],
  'opposite-corners-rounded': [
    [0, 0],
    [0, 0.5],
    [0.5, 0.5, 0.5, Math.PI, HALF_PI],
    [1, 1],
    [1, 0.5],
    [0.5, 0.5, 0.5, 0, -HALF_PI],
  ],
};

export function createQRCodeStyler(style?: QRCodeVisualStyle): QRCodeStyler {
  const resolved = resolveQRCodeVisualStyle(style);
  const {quietZone, moduleSize, modules, finder} = resolved;
  const background = parseQRCodeColor(resolved.background);
  const drawings = new WeakMap<QRCodeMatrix, QRCodeStyledDrawing>();

  return Object.freeze({
    draw(matrix: QRCodeMatrix) {
      const cached = drawings.get(matrix);
      if (cached) return cached;

      const moduleCount = matrix.length;
      const viewSize = moduleCount + 2 * quietZone;
      const gridWidth = Math.max(
        viewSize,
        quietZone + matrix.reduce((maximum, row) => Math.max(maximum, row.length), 0),
      );
      const finders =
        moduleCount >= 21 && matrix.every((row) => row.length === moduleCount)
          ? [
              [0, 0],
              [moduleCount - 7, 0],
              [0, moduleCount - 7],
            ].filter(([x, y]) => isCanonicalFinder(matrix, x!, y!))
          : [];
      const finderModules = new Uint8Array(moduleCount * moduleCount);
      for (const [x, y] of finders) {
        for (let row = 0; row < 7; row++) {
          finderModules.fill(1, (y! + row) * moduleCount + x!, (y! + row) * moduleCount + x! + 7);
        }
      }

      const layersByColor = new Map<QRCodeColor, Layer>();
      const layer = (color: QRCodeColor): Layer => {
        let existing = layersByColor.get(color);
        if (!existing) {
          existing = {
            rgba: parseQRCodeColor(color),
            squareModules: new Uint8Array(gridWidth * viewSize),
            rectangles: [],
            primitives: [],
          };
          layersByColor.set(color, existing);
        }
        return existing;
      };
      const fill = (target: Layer, x: number, y: number, width: number, height: number) => {
        for (let row = y; row < y + height; row++) {
          target.squareModules.fill(1, row * gridWidth + x, row * gridWidth + x + width);
        }
      };
      const isDark = (row: number, column: number): boolean =>
        row >= 0 &&
        column >= 0 &&
        !!matrix[row]?.[column] &&
        finderModules[row * moduleCount + column] !== 1;
      const resolvedShapes: ResolvedModuleShape[] = [];

      let moduleLayer: Layer | undefined;
      for (let row = 0; row < moduleCount; row++) {
        const matrixRow = matrix[row]!;
        for (let column = 0; column < matrixRow.length; column++) {
          if (!matrixRow[column] || finderModules[row * moduleCount + column] === 1) continue;
          let shape: ModuleShape | 'square' = modules.shape === 'circle' ? 'circle' : 'square';
          let rotation: Rotation = 0;
          if (modules.shape !== 'square' && modules.shape !== 'circle') {
            const left = isDark(row, column - 1);
            const right = isDark(row, column + 1);
            const top = isDark(row - 1, column);
            const bottom = isDark(row + 1, column);
            const neighborMask = +left | (+right << 1) | (+top << 2) | (+bottom << 3);
            [shape, rotation] = resolvedShapes[neighborMask] ??= resolveModuleShape(
              modules.shape,
              left,
              right,
              top,
              bottom,
            );
          }

          moduleLayer ??= layer(modules.color);
          const x = quietZone + column;
          const y = quietZone + row;
          if (shape === 'square') {
            moduleLayer.squareModules[y * gridWidth + x] = 1;
          } else {
            moduleLayer.primitives.push({kind: 'module', shape, x, y, rotation});
          }
        }
      }

      for (const kind of ['ring', 'center'] as const) {
        const {shape, color} = kind === 'ring' ? finder.outer : finder.center;
        const offset = kind === 'ring' ? 0 : 2;
        const size = kind === 'ring' ? 7 : 3;
        for (const [finderX, finderY] of finders) {
          const target = layer(color);
          const x = quietZone + finderX! + offset;
          const y = quietZone + finderY! + offset;
          if (shape !== 'square') {
            target.primitives.push({kind, shape, x, y, size});
          } else if (kind === 'center') {
            fill(target, x, y, 3, 3);
          } else {
            fill(target, x, y, 7, 1);
            fill(target, x, y + 6, 7, 1);
            fill(target, x, y + 1, 1, 5);
            fill(target, x + 6, y + 1, 1, 5);
          }
        }
      }

      const layers = [...layersByColor.values()];
      for (const target of layers) {
        target.rectangles = compactSquareModules(target.squareModules, gridWidth, viewSize);
      }
      const drawing: QRCodeStyledDrawing = Object.freeze({
        moduleCount,
        moduleSize,
        quietZone,
        viewSize,
        outputSize: calculateQRCodeOutputSize(matrix, resolved),
        paint(target: QRCodeStyledDrawingTarget) {
          target.drawBackground(...background);
          for (const {rgba, rectangles, primitives} of layers) {
            target.beginLayer(...rgba);
            for (const {x, y, width, height} of rectangles) {
              target.drawRectangle(x, y, width, height);
            }
            if (primitives.length > 0) {
              target.beginPath('evenodd');
              for (const primitive of primitives) paintPrimitive(target, primitive);
              target.endPath();
            }
            target.endLayer();
          }
        },
        placeCenterImage(options: Parameters<QRCodeStyledDrawing['placeCenterImage']>[0]) {
          return resolveCenterImagePlacement(moduleCount, quietZone, options);
        },
      });
      drawings.set(matrix, drawing);
      return drawing;
    },
  });
}

function isCanonicalFinder(matrix: QRCodeMatrix, x: number, y: number): boolean {
  for (let row = 0; row < 7; row++) {
    for (let column = 0; column < 7; column++) {
      if (!!matrix[y + row]![x + column] !== !!((FINDER_ROWS[row]! >> column) & 1)) return false;
    }
  }
  return true;
}

function resolveModuleShape(
  type: 'rounded' | 'extra-rounded' | 'diagonal' | 'diagonal-rounded',
  left: boolean,
  right: boolean,
  top: boolean,
  bottom: boolean,
): ResolvedModuleShape {
  const neighborCount = +left + +right + +top + +bottom;

  if (type === 'diagonal' || type === 'diagonal-rounded') {
    if (neighborCount === 0) return ['opposite-corners-rounded', 90];
    const corner = type === 'diagonal' ? 'corner-rounded' : 'corner-extra-rounded';
    if (!left && !top) return [corner, 270];
    if (!right && !bottom) return [corner, 90];
    return ['square', 0];
  }

  if (neighborCount === 0) return ['circle', 0];
  if (neighborCount > 2 || (left && right) || (top && bottom)) return ['square', 0];
  if (neighborCount === 2) {
    return [
      type === 'rounded' ? 'corner-rounded' : 'corner-extra-rounded',
      left && top ? 90 : top && right ? 180 : right && bottom ? 270 : 0,
    ];
  }
  return ['side-rounded', top ? 90 : right ? 180 : bottom ? 270 : 0];
}

function compactSquareModules(modules: Uint8Array, width: number, height: number): Rectangle[] {
  const rectangles: Rectangle[] = [];
  let previousWidths = new Uint16Array(width);
  let previousRectangleIndexes = new Int32Array(width);
  let currentWidths = new Uint16Array(width);
  let currentRectangleIndexes = new Int32Array(width);

  for (let y = 0; y < height; y++) {
    currentWidths.fill(0);
    const rowOffset = y * width;
    let x = 0;

    while (x < width) {
      while (x < width && modules[rowOffset + x] === 0) x++;
      if (x === width) break;

      const start = x;
      while (x < width && modules[rowOffset + x] === 1) x++;
      const runWidth = x - start;
      let rectangleIndex: number;
      if (previousWidths[start] === runWidth) {
        rectangleIndex = previousRectangleIndexes[start]!;
        rectangles[rectangleIndex]!.height++;
      } else {
        rectangleIndex = rectangles.length;
        rectangles.push({x: start, y, width: runWidth, height: 1});
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

  return rectangles;
}

function resolveCenterImagePlacement(
  moduleCount: number,
  quietZone: number,
  options?: Parameters<QRCodeStyledDrawing['placeCenterImage']>[0],
): ReturnType<QRCodeStyledDrawing['placeCenterImage']> {
  assertKnownKeys(options, 'centerImage', ['size', 'padding', 'clearBackground']);
  const size = options?.size ?? 0.4;
  const padding = options?.padding ?? 1;
  const clearBackground = options?.clearBackground ?? true;
  if (!Number.isFinite(size) || size <= 0 || size > 1) {
    throwInvalid('centerImage.size', 'greater than 0 and at most 1', size);
  }
  if (!Number.isFinite(padding) || padding < 0) {
    throwInvalid('centerImage.padding', 'a non-negative finite number', padding);
  }
  if (typeof clearBackground !== 'boolean') {
    throwInvalid('centerImage.clearBackground', 'a boolean', clearBackground);
  }

  const centerImageSize = moduleCount * size;
  const position = quietZone + (moduleCount - centerImageSize) / 2;
  const clearStart = Math.max(quietZone, position - padding);
  const clearEnd = Math.min(quietZone + moduleCount, position + centerImageSize + padding);
  return {
    centerImage: {x: position, y: position, size: centerImageSize},
    clear: clearBackground
      ? {x: clearStart, y: clearStart, size: clearEnd - clearStart}
      : undefined,
  };
}

function paintPrimitive(target: QRCodeStyledDrawingTarget, primitive: Primitive): void {
  const {x, y} = primitive;
  if (primitive.kind !== 'module') {
    const {size, shape} = primitive;
    for (let inset = 0; inset <= (primitive.kind === 'ring' ? 1 : 0); inset++) {
      const insetSize = size - 2 * inset;
      if (shape === 'circle') {
        circle(target, x + inset, y + inset, insetSize);
      } else {
        roundedSquare(
          target,
          x + inset,
          y + inset,
          insetSize,
          // Keep straight edges and a one-module ring thickness around the corners.
          shape === 'square'
            ? 0
            : shape === 'rounded'
              ? Math.min(1, insetSize / 2)
              : size * 0.4 - inset,
        );
      }
    }
    return;
  }

  if (primitive.shape === 'circle') {
    circle(target, x, y, 1);
    return;
  }
  const rotation = (primitive.rotation * Math.PI) / 180;
  const commands = MODULE_PATHS[primitive.shape];
  for (let index = 0; index < commands.length; index++) {
    const command = commands[index]!;
    let localX = command[0]!;
    let localY = command[1]!;
    for (let turn = primitive.rotation; turn > 0; turn -= 90) {
      const previousX = localX;
      localX = 1 - localY;
      localY = previousX;
    }
    if (command.length > 2) {
      target.arc(
        x + localX,
        y + localY,
        command[2]!,
        command[3]! + rotation,
        command[4]! + rotation,
        true,
      );
    } else if (index) {
      target.lineTo(x + localX, y + localY);
    } else {
      target.moveTo(x + localX, y + localY);
    }
  }
  target.closePath();
}

function circle(target: QRCodeStyledDrawingTarget, x: number, y: number, size: number): void {
  const radius = size / 2;
  target.moveTo(x + radius + radius, y + radius);
  target.arc(x + radius, y + radius, radius, 0, Math.PI * 2, false);
  target.closePath();
}

function roundedSquare(
  target: QRCodeStyledDrawingTarget,
  x: number,
  y: number,
  size: number,
  radius: number,
): void {
  target.moveTo(x + radius, y);
  target.lineTo(x + size - radius, y);
  if (radius > 0) target.arc(x + size - radius, y + radius, radius, -HALF_PI, 0, false);
  target.lineTo(x + size, y + size - radius);
  if (radius > 0) target.arc(x + size - radius, y + size - radius, radius, 0, HALF_PI, false);
  target.lineTo(x + radius, y + size);
  if (radius > 0) target.arc(x + radius, y + size - radius, radius, HALF_PI, Math.PI, false);
  target.lineTo(x, y + radius);
  if (radius > 0) target.arc(x + radius, y + radius, radius, Math.PI, Math.PI * 1.5, false);
  target.closePath();
}
