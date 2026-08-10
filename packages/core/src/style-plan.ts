import {calculateQRCodeRenderedSize} from './styling';
import type {
  QRCodeDotType,
  QRCodeMatrix,
  ɵQRCodeModuleShape,
  ɵQRCodeModuleStylePrimitive,
  ɵQRCodeParsedStylingOptions,
  ɵQRCodeStyleLayer,
  ɵQRCodeStylePlan,
  ɵQRCodeStylePrimitive,
  ɵQRCodeStyleRectangle,
  ɵQRCodeStyleRole,
  ɵQRCodeStyleRotation,
} from './types';

const FINDER_SIZE = 7;
const FINDER_CENTER_OFFSET = 2;
const FINDER_CENTER_SIZE = 3;

type Finder = {
  x: number;
  y: number;
  rotation: ɵQRCodeStyleRotation;
};

type ResolvedModuleShape = {shape: ɵQRCodeModuleShape; rotation: ɵQRCodeStyleRotation};

const RESOLVED_MODULE_SHAPE_CACHE = new Map<QRCodeDotType, ResolvedModuleShape[]>();

export function createQRCodeStylePlan(
  matrix: QRCodeMatrix,
  styling: ɵQRCodeParsedStylingOptions,
): ɵQRCodeStylePlan {
  if (
    styling.dotsOptions.type === 'square' &&
    styling.cornersSquareOptions.type === 'square' &&
    styling.cornersDotOptions.type === 'square'
  ) {
    return createSquareQRCodeStylePlan(matrix, styling);
  }

  return createQRCodeStylePlanWithPrimitives(matrix, styling);
}

function createSquareQRCodeStylePlan(
  matrix: QRCodeMatrix,
  styling: ɵQRCodeParsedStylingOptions,
): ɵQRCodeStylePlan {
  const moduleCount = matrix.length;
  const viewSize = moduleCount + 2 * styling.margin;
  const gridWidth = Math.max(
    viewSize,
    styling.margin + matrix.reduce((maximum, row) => Math.max(maximum, row.length), 0),
  );
  const finders = findFinderPatterns(matrix);
  const finderDarkCells = createFinderDarkCellMap(finders, moduleCount);
  const layersByColor = new Map<ɵQRCodeStylePrimitive['color'], MutableStyleLayer>();
  const mutableLayers: MutableStyleLayer[] = [];

  const addCell = (color: ɵQRCodeStylePrimitive['color'], x: number, y: number): void => {
    const layer = getMutableStyleLayer(color, gridWidth, viewSize, layersByColor, mutableLayers);
    layer.squareCells[y * gridWidth + x] = 1;
  };

  for (let row = 0; row < moduleCount; row++) {
    const matrixRow = matrix[row]!;
    const rowOffset = row * moduleCount;
    for (let column = 0; column < matrixRow.length; column++) {
      if (!matrixRow[column] || finderDarkCells[rowOffset + column] === 1) continue;
      addCell(styling.dotsOptions.color, styling.margin + column, styling.margin + row);
    }
  }

  for (let index = 0; index < finders.length; index++) {
    const finder = finders[index]!;
    forEachFinderRingCell((row, column) => {
      addCell(
        styling.cornersSquareOptions.color,
        styling.margin + finder.x + column,
        styling.margin + finder.y + row,
      );
    });
  }

  for (let index = 0; index < finders.length; index++) {
    const finder = finders[index]!;
    for (let row = 0; row < FINDER_CENTER_SIZE; row++) {
      for (let column = 0; column < FINDER_CENTER_SIZE; column++) {
        addCell(
          styling.cornersDotOptions.color,
          styling.margin + finder.x + FINDER_CENTER_OFFSET + column,
          styling.margin + finder.y + FINDER_CENTER_OFFSET + row,
        );
      }
    }
  }

  let compatibilityPrimitives: readonly ɵQRCodeStylePrimitive[] | undefined;
  return {
    moduleCount,
    viewSize,
    renderedSize: calculateQRCodeRenderedSize(matrix, styling),
    backgroundColor: styling.colors.colorLight,
    hasCurves: false,
    get primitives() {
      compatibilityPrimitives ??= createQRCodeStylePrimitives(matrix, styling).primitives;
      return compatibilityPrimitives;
    },
    layers: finishMutableStyleLayers(mutableLayers, gridWidth, viewSize),
  };
}

function createQRCodeStylePlanWithPrimitives(
  matrix: QRCodeMatrix,
  styling: ɵQRCodeParsedStylingOptions,
): ɵQRCodeStylePlan {
  const {hasCurves, primitives} = createQRCodeStylePrimitives(matrix, styling);
  const moduleCount = matrix.length;
  const viewSize = moduleCount + 2 * styling.margin;
  const layers = createStyleLayers(primitives, viewSize);

  return {
    moduleCount,
    viewSize,
    renderedSize: calculateQRCodeRenderedSize(matrix, styling),
    backgroundColor: styling.colors.colorLight,
    hasCurves,
    primitives,
    layers,
  };
}

function createQRCodeStylePrimitives(
  matrix: QRCodeMatrix,
  styling: ɵQRCodeParsedStylingOptions,
): {hasCurves: boolean; primitives: ɵQRCodeStylePrimitive[]} {
  const moduleCount = matrix.length;
  const finders = findFinderPatterns(matrix);
  const finderDarkCells = createFinderDarkCellMap(finders, moduleCount);
  const primitives: ɵQRCodeStylePrimitive[] = [];
  let hasCurves = false;

  const isOrdinaryDark = (row: number, column: number): boolean => {
    if (row < 0 || column < 0) return false;
    return !!matrix[row]?.[column] && finderDarkCells[row * moduleCount + column] !== 1;
  };

  const dotsType = styling.dotsOptions.type;
  const dotsColor = styling.dotsOptions.color;

  if (dotsType === 'square' || dotsType === 'dots') {
    const shape: ɵQRCodeModuleShape = dotsType === 'square' ? 'square' : 'dot';
    for (let row = 0; row < moduleCount; row++) {
      const matrixRow = matrix[row]!;
      const rowOffset = row * moduleCount;
      for (let column = 0; column < matrixRow.length; column++) {
        if (!matrixRow[column] || finderDarkCells[rowOffset + column] === 1) continue;
        primitives.push(
          createResolvedModulePrimitive(column, row, styling.margin, 'dots', dotsColor, shape, 0),
        );
        if (shape !== 'square') hasCurves = true;
      }
    }
  } else {
    for (let row = 0; row < moduleCount; row++) {
      const matrixRow = matrix[row]!;
      for (let column = 0; column < matrixRow.length; column++) {
        if (!isOrdinaryDark(row, column)) continue;

        const primitive = createModulePrimitive(
          column,
          row,
          styling.margin,
          'dots',
          dotsColor,
          dotsType,
          isOrdinaryDark(row, column - 1),
          isOrdinaryDark(row, column + 1),
          isOrdinaryDark(row - 1, column),
          isOrdinaryDark(row + 1, column),
        );
        primitives.push(primitive);
        if (primitive.shape !== 'square') hasCurves = true;
      }
    }
  }

  for (let index = 0; index < finders.length; index++) {
    const finder = finders[index]!;
    const type = styling.cornersSquareOptions.type;
    if (type === 'dot' || type === 'square' || type === 'extra-rounded') {
      const primitive: ɵQRCodeStylePrimitive = {
        kind: 'finder-ring',
        role: 'cornersSquare',
        color: styling.cornersSquareOptions.color,
        shape: type,
        x: styling.margin + finder.x,
        y: styling.margin + finder.y,
        size: FINDER_SIZE,
        rotation: finder.rotation,
      };
      primitives.push(primitive);
      if (primitive.shape !== 'square') hasCurves = true;
    } else {
      forEachFinderRingCell((row, column) => {
        const primitive = createModulePrimitive(
          finder.x + column,
          finder.y + row,
          styling.margin,
          'cornersSquare',
          styling.cornersSquareOptions.color,
          type,
          isFinderRingCell(row, column - 1),
          isFinderRingCell(row, column + 1),
          isFinderRingCell(row - 1, column),
          isFinderRingCell(row + 1, column),
        );
        primitives.push(primitive);
        if (primitive.shape !== 'square') hasCurves = true;
      });
    }
  }

  for (let index = 0; index < finders.length; index++) {
    const finder = finders[index]!;
    const type = styling.cornersDotOptions.type;
    if (type === 'dot' || type === 'square') {
      const primitive: ɵQRCodeStylePrimitive = {
        kind: 'finder-center',
        role: 'cornersDot',
        color: styling.cornersDotOptions.color,
        shape: type,
        x: styling.margin + finder.x + FINDER_CENTER_OFFSET,
        y: styling.margin + finder.y + FINDER_CENTER_OFFSET,
        size: FINDER_CENTER_SIZE,
        rotation: finder.rotation,
      };
      primitives.push(primitive);
      if (primitive.shape !== 'square') hasCurves = true;
    } else {
      for (let row = 0; row < FINDER_CENTER_SIZE; row++) {
        for (let column = 0; column < FINDER_CENTER_SIZE; column++) {
          const primitive = createModulePrimitive(
            finder.x + FINDER_CENTER_OFFSET + column,
            finder.y + FINDER_CENTER_OFFSET + row,
            styling.margin,
            'cornersDot',
            styling.cornersDotOptions.color,
            type,
            isFinderCenterModuleCell(row, column - 1),
            isFinderCenterModuleCell(row, column + 1),
            isFinderCenterModuleCell(row - 1, column),
            isFinderCenterModuleCell(row + 1, column),
          );
          primitives.push(primitive);
          if (primitive.shape !== 'square') hasCurves = true;
        }
      }
    }
  }

  return {hasCurves, primitives};
}

type MutableStyleLayer = {
  color: ɵQRCodeStylePrimitive['color'];
  squareCells: Uint8Array;
  curvedPrimitives: ɵQRCodeStylePrimitive[];
};

function createStyleLayers(
  primitives: readonly ɵQRCodeStylePrimitive[],
  viewSize: number,
): ɵQRCodeStyleLayer[] {
  let gridWidth = viewSize;
  let gridHeight = viewSize;
  for (let index = 0; index < primitives.length; index++) {
    const primitive = primitives[index]!;
    if (primitive.shape !== 'square') continue;
    gridWidth = Math.max(gridWidth, primitive.x + primitive.size);
    gridHeight = Math.max(gridHeight, primitive.y + primitive.size);
  }

  const layersByColor = new Map<ɵQRCodeStylePrimitive['color'], MutableStyleLayer>();
  const mutableLayers: MutableStyleLayer[] = [];
  for (let index = 0; index < primitives.length; index++) {
    const primitive = primitives[index]!;
    const layer = getMutableStyleLayer(
      primitive.color,
      gridWidth,
      gridHeight,
      layersByColor,
      mutableLayers,
    );

    if (primitive.shape === 'square') {
      addSquarePrimitiveCells(layer.squareCells, gridWidth, primitive);
    } else {
      layer.curvedPrimitives.push(primitive);
    }
  }

  return finishMutableStyleLayers(mutableLayers, gridWidth, gridHeight);
}

function getMutableStyleLayer(
  color: ɵQRCodeStylePrimitive['color'],
  gridWidth: number,
  gridHeight: number,
  layersByColor: Map<ɵQRCodeStylePrimitive['color'], MutableStyleLayer>,
  mutableLayers: MutableStyleLayer[],
): MutableStyleLayer {
  const existing = layersByColor.get(color);
  if (existing) return existing;

  const layer = {
    color,
    squareCells: new Uint8Array(gridWidth * gridHeight),
    curvedPrimitives: [],
  };
  layersByColor.set(color, layer);
  mutableLayers.push(layer);
  return layer;
}

function finishMutableStyleLayers(
  mutableLayers: readonly MutableStyleLayer[],
  gridWidth: number,
  gridHeight: number,
): ɵQRCodeStyleLayer[] {
  return mutableLayers.map(({color, squareCells, curvedPrimitives}) => ({
    color,
    rectangles: compactSquareCells(squareCells, gridWidth, gridHeight),
    curvedPrimitives,
  }));
}

function addSquarePrimitiveCells(
  cells: Uint8Array,
  gridWidth: number,
  primitive: ɵQRCodeStylePrimitive,
): void {
  const {x, y} = primitive;
  if (primitive.kind === 'module') {
    cells[y * gridWidth + x] = 1;
    return;
  }

  if (primitive.kind === 'finder-center') {
    for (let row = 0; row < primitive.size; row++) {
      const start = (y + row) * gridWidth + x;
      cells.fill(1, start, start + primitive.size);
    }
    return;
  }

  const top = y * gridWidth + x;
  const bottom = (y + primitive.size - 1) * gridWidth + x;
  cells.fill(1, top, top + primitive.size);
  cells.fill(1, bottom, bottom + primitive.size);
  for (let row = 1; row < primitive.size - 1; row++) {
    const start = (y + row) * gridWidth + x;
    cells[start] = 1;
    cells[start + primitive.size - 1] = 1;
  }
}

function compactSquareCells(
  cells: Uint8Array,
  width: number,
  height: number,
): ɵQRCodeStyleRectangle[] {
  const rectangles: ɵQRCodeStyleRectangle[] = [];
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

function createModulePrimitive(
  column: number,
  row: number,
  margin: number,
  role: ɵQRCodeStyleRole,
  color: ɵQRCodeModuleStylePrimitive['color'],
  type: QRCodeDotType,
  left: boolean,
  right: boolean,
  top: boolean,
  bottom: boolean,
): ɵQRCodeModuleStylePrimitive {
  const {shape, rotation} = resolveModuleShape(type, left, right, top, bottom);

  return createResolvedModulePrimitive(column, row, margin, role, color, shape, rotation);
}

function createResolvedModulePrimitive(
  column: number,
  row: number,
  margin: number,
  role: ɵQRCodeStyleRole,
  color: ɵQRCodeModuleStylePrimitive['color'],
  shape: ɵQRCodeModuleShape,
  rotation: ɵQRCodeStyleRotation,
): ɵQRCodeModuleStylePrimitive {
  return {
    kind: 'module',
    role,
    color,
    shape,
    x: margin + column,
    y: margin + row,
    size: 1,
    rotation,
  };
}

function resolveModuleShape(
  type: QRCodeDotType,
  left: boolean,
  right: boolean,
  top: boolean,
  bottom: boolean,
): ResolvedModuleShape {
  const neighborMask = +left | (+right << 1) | (+top << 2) | (+bottom << 3);
  let cachedByNeighborMask = RESOLVED_MODULE_SHAPE_CACHE.get(type);
  if (!cachedByNeighborMask) {
    cachedByNeighborMask = [];
    RESOLVED_MODULE_SHAPE_CACHE.set(type, cachedByNeighborMask);
  }
  const cached = cachedByNeighborMask[neighborMask];
  if (cached) return cached;

  const resolved = resolveUncachedModuleShape(type, left, right, top, bottom);
  cachedByNeighborMask[neighborMask] = resolved;
  return resolved;
}

function resolveUncachedModuleShape(
  type: QRCodeDotType,
  left: boolean,
  right: boolean,
  top: boolean,
  bottom: boolean,
): ResolvedModuleShape {
  if (type === 'square') return {shape: 'square', rotation: 0};
  if (type === 'dots') return {shape: 'dot', rotation: 0};

  const neighborsCount = +left + +right + +top + +bottom;

  if (type === 'classy' || type === 'classy-rounded') {
    if (neighborsCount === 0) {
      return {shape: 'opposite-corners-rounded', rotation: 90};
    }
    if (!left && !top) {
      return {
        shape: type === 'classy' ? 'corner-rounded' : 'corner-extra-rounded',
        rotation: 270,
      };
    }
    if (!right && !bottom) {
      return {
        shape: type === 'classy' ? 'corner-rounded' : 'corner-extra-rounded',
        rotation: 90,
      };
    }
    return {shape: 'square', rotation: 0};
  }

  if (neighborsCount === 0) return {shape: 'dot', rotation: 0};
  if (neighborsCount > 2 || (left && right) || (top && bottom)) {
    return {shape: 'square', rotation: 0};
  }
  if (neighborsCount === 2) {
    return {
      shape: type === 'rounded' ? 'corner-rounded' : 'corner-extra-rounded',
      rotation: cornerRotation(left, right, top, bottom),
    };
  }

  return {
    shape: 'side-rounded',
    rotation: sideRotation(left, right, top, bottom),
  };
}

function cornerRotation(
  left: boolean,
  right: boolean,
  top: boolean,
  bottom: boolean,
): ɵQRCodeStyleRotation {
  if (left && top) return 90;
  if (top && right) return 180;
  if (right && bottom) return 270;
  return 0;
}

function sideRotation(
  _left: boolean,
  right: boolean,
  top: boolean,
  bottom: boolean,
): ɵQRCodeStyleRotation {
  if (top) return 90;
  if (right) return 180;
  if (bottom) return 270;
  return 0;
}

function findFinderPatterns(matrix: QRCodeMatrix): Finder[] {
  const size = matrix.length;
  if (size < 21 || matrix.some((row) => row.length !== size)) {
    return [];
  }

  return [
    {x: 0, y: 0, rotation: 0},
    {x: size - FINDER_SIZE, y: 0, rotation: 90},
    {x: 0, y: size - FINDER_SIZE, rotation: 270},
  ].filter((finder) => isCanonicalFinder(matrix, finder.x, finder.y)) as Finder[];
}

function isCanonicalFinder(matrix: QRCodeMatrix, x: number, y: number): boolean {
  for (let row = 0; row < FINDER_SIZE; row++) {
    for (let column = 0; column < FINDER_SIZE; column++) {
      const expected = isFinderRingCell(row, column) || isFinderCenterCell(row, column);
      if (!!matrix[y + row]?.[x + column] !== expected) return false;
    }
  }
  return true;
}

function createFinderDarkCellMap(finders: readonly Finder[], moduleCount: number): Uint8Array {
  const cells = new Uint8Array(moduleCount * moduleCount);
  for (const finder of finders) {
    for (let row = 0; row < FINDER_SIZE; row++) {
      for (let column = 0; column < FINDER_SIZE; column++) {
        if (isFinderRingCell(row, column) || isFinderCenterCell(row, column)) {
          cells[(finder.y + row) * moduleCount + finder.x + column] = 1;
        }
      }
    }
  }
  return cells;
}

function forEachFinderRingCell(callback: (row: number, column: number) => void): void {
  for (let row = 0; row < FINDER_SIZE; row++) {
    for (let column = 0; column < FINDER_SIZE; column++) {
      if (isFinderRingCell(row, column)) callback(row, column);
    }
  }
}

function isFinderRingCell(row: number, column: number): boolean {
  return (
    row >= 0 &&
    row < FINDER_SIZE &&
    column >= 0 &&
    column < FINDER_SIZE &&
    (row === 0 || row === FINDER_SIZE - 1 || column === 0 || column === FINDER_SIZE - 1)
  );
}

function isFinderCenterCell(row: number, column: number): boolean {
  return (
    row >= FINDER_CENTER_OFFSET &&
    row < FINDER_CENTER_OFFSET + FINDER_CENTER_SIZE &&
    column >= FINDER_CENTER_OFFSET &&
    column < FINDER_CENTER_OFFSET + FINDER_CENTER_SIZE
  );
}

function isFinderCenterModuleCell(row: number, column: number): boolean {
  return row >= 0 && row < FINDER_CENTER_SIZE && column >= 0 && column < FINDER_CENTER_SIZE;
}
