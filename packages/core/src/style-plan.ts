import {calculateQRCodeOutputSize} from './styling';
import type {
  QRCodeMatrix,
  QRCodeModuleShape,
  QRCodeModuleStylePrimitive,
  QRCodePaintShape,
  QRCodeResolvedVisualStyle,
  QRCodeStyleLayer,
  QRCodeStylePlan,
  QRCodeStylePrimitive,
  QRCodeStyleRectangle,
  QRCodeStyleRole,
  QRCodeStyleRotation,
} from './types';

const FINDER_SIZE = 7;
const FINDER_CENTER_OFFSET = 2;
const FINDER_CENTER_SIZE = 3;

type Finder = {
  x: number;
  y: number;
  rotation: QRCodeStyleRotation;
};

type ResolvedModuleShape = {shape: QRCodePaintShape; rotation: QRCodeStyleRotation};

const RESOLVED_MODULE_SHAPE_CACHE = new Map<QRCodeModuleShape, ResolvedModuleShape[]>();

export function createQRCodeStylePlan(
  matrix: QRCodeMatrix,
  styling: QRCodeResolvedVisualStyle,
): QRCodeStylePlan {
  if (
    styling.modules.shape === 'square' &&
    styling.finder.outer.shape === 'square' &&
    styling.finder.center.shape === 'square'
  ) {
    return createSquareQRCodeStylePlan(matrix, styling);
  }

  return createStyledQRCodeStylePlan(matrix, styling);
}

function createSquareQRCodeStylePlan(
  matrix: QRCodeMatrix,
  styling: QRCodeResolvedVisualStyle,
): QRCodeStylePlan {
  const moduleCount = matrix.length;
  const viewSize = moduleCount + 2 * styling.quietZone;
  const gridWidth = Math.max(
    viewSize,
    styling.quietZone + matrix.reduce((maximum, row) => Math.max(maximum, row.length), 0),
  );
  const finders = findFinderPatterns(matrix);
  const finderDarkCells = createFinderDarkCellMap(finders, moduleCount);
  const layersByColor = new Map<QRCodeStylePrimitive['color'], MutableStyleLayer>();
  const mutableLayers: MutableStyleLayer[] = [];

  const addCell = (color: QRCodeStylePrimitive['color'], x: number, y: number): void => {
    const layer = getMutableStyleLayer(color, gridWidth, viewSize, layersByColor, mutableLayers);
    layer.squareCells[y * gridWidth + x] = 1;
  };

  for (let row = 0; row < moduleCount; row++) {
    const matrixRow = matrix[row]!;
    const rowOffset = row * moduleCount;
    for (let column = 0; column < matrixRow.length; column++) {
      if (!matrixRow[column] || finderDarkCells[rowOffset + column] === 1) continue;
      addCell(styling.modules.color, styling.quietZone + column, styling.quietZone + row);
    }
  }

  for (let index = 0; index < finders.length; index++) {
    const finder = finders[index]!;
    forEachFinderRingCell((row, column) => {
      addCell(
        styling.finder.outer.color,
        styling.quietZone + finder.x + column,
        styling.quietZone + finder.y + row,
      );
    });
  }

  for (let index = 0; index < finders.length; index++) {
    const finder = finders[index]!;
    for (let row = 0; row < FINDER_CENTER_SIZE; row++) {
      for (let column = 0; column < FINDER_CENTER_SIZE; column++) {
        addCell(
          styling.finder.center.color,
          styling.quietZone + finder.x + FINDER_CENTER_OFFSET + column,
          styling.quietZone + finder.y + FINDER_CENTER_OFFSET + row,
        );
      }
    }
  }

  return {
    moduleCount,
    viewSize,
    outputSize: calculateQRCodeOutputSize(matrix, styling),
    backgroundColor: styling.background,
    hasCurves: false,
    layers: finishMutableStyleLayers(mutableLayers, gridWidth, viewSize),
  };
}

function createStyledQRCodeStylePlan(
  matrix: QRCodeMatrix,
  styling: QRCodeResolvedVisualStyle,
): QRCodeStylePlan {
  const moduleCount = matrix.length;
  const viewSize = moduleCount + 2 * styling.quietZone;
  const gridWidth = Math.max(
    viewSize,
    styling.quietZone + matrix.reduce((maximum, row) => Math.max(maximum, row.length), 0),
  );
  const finders = findFinderPatterns(matrix);
  const finderDarkCells = createFinderDarkCellMap(finders, moduleCount);
  const layersByColor = new Map<QRCodeStylePrimitive['color'], MutableStyleLayer>();
  const mutableLayers: MutableStyleLayer[] = [];
  let hasCurves = false;

  const addPrimitive = (primitive: QRCodeStylePrimitive): void => {
    const layer = getMutableStyleLayer(
      primitive.color,
      gridWidth,
      viewSize,
      layersByColor,
      mutableLayers,
    );
    if (primitive.shape === 'square') {
      addSquarePrimitiveCells(layer.squareCells, gridWidth, primitive);
    } else {
      layer.curvedPrimitives.push(primitive);
      hasCurves = true;
    }
  };

  const isOrdinaryDark = (row: number, column: number): boolean => {
    if (row < 0 || column < 0) return false;
    return !!matrix[row]?.[column] && finderDarkCells[row * moduleCount + column] !== 1;
  };

  const dotsType = styling.modules.shape;
  const dotsColor = styling.modules.color;

  if (dotsType === 'square' || dotsType === 'circle') {
    const shape: QRCodePaintShape = dotsType === 'square' ? 'square' : 'circle';
    for (let row = 0; row < moduleCount; row++) {
      const matrixRow = matrix[row]!;
      const rowOffset = row * moduleCount;
      for (let column = 0; column < matrixRow.length; column++) {
        if (!matrixRow[column] || finderDarkCells[rowOffset + column] === 1) continue;
        addPrimitive(
          createResolvedModulePrimitive(
            column,
            row,
            styling.quietZone,
            'modules',
            dotsColor,
            shape,
            0,
          ),
        );
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
          styling.quietZone,
          'modules',
          dotsColor,
          dotsType,
          isOrdinaryDark(row, column - 1),
          isOrdinaryDark(row, column + 1),
          isOrdinaryDark(row - 1, column),
          isOrdinaryDark(row + 1, column),
        );
        addPrimitive(primitive);
      }
    }
  }

  for (let index = 0; index < finders.length; index++) {
    const finder = finders[index]!;
    const type = styling.finder.outer.shape;
    if (type === 'circle' || type === 'square' || type === 'rounded' || type === 'extra-rounded') {
      const primitive: QRCodeStylePrimitive = {
        kind: 'finder-ring',
        role: 'finderOuter',
        color: styling.finder.outer.color,
        shape: type,
        x: styling.quietZone + finder.x,
        y: styling.quietZone + finder.y,
        size: FINDER_SIZE,
        rotation: finder.rotation,
      };
      addPrimitive(primitive);
    } else {
      forEachFinderRingCell((row, column) => {
        const primitive = createModulePrimitive(
          finder.x + column,
          finder.y + row,
          styling.quietZone,
          'finderOuter',
          styling.finder.outer.color,
          type,
          isFinderRingCell(row, column - 1),
          isFinderRingCell(row, column + 1),
          isFinderRingCell(row - 1, column),
          isFinderRingCell(row + 1, column),
        );
        addPrimitive(primitive);
      });
    }
  }

  for (let index = 0; index < finders.length; index++) {
    const finder = finders[index]!;
    const type = styling.finder.center.shape;
    if (type === 'circle' || type === 'square' || type === 'rounded' || type === 'extra-rounded') {
      const primitive: QRCodeStylePrimitive = {
        kind: 'finder-center',
        role: 'finderCenter',
        color: styling.finder.center.color,
        shape: type,
        x: styling.quietZone + finder.x + FINDER_CENTER_OFFSET,
        y: styling.quietZone + finder.y + FINDER_CENTER_OFFSET,
        size: FINDER_CENTER_SIZE,
        rotation: finder.rotation,
      };
      addPrimitive(primitive);
    } else {
      for (let row = 0; row < FINDER_CENTER_SIZE; row++) {
        for (let column = 0; column < FINDER_CENTER_SIZE; column++) {
          const primitive = createModulePrimitive(
            finder.x + FINDER_CENTER_OFFSET + column,
            finder.y + FINDER_CENTER_OFFSET + row,
            styling.quietZone,
            'finderCenter',
            styling.finder.center.color,
            type,
            isFinderCenterModuleCell(row, column - 1),
            isFinderCenterModuleCell(row, column + 1),
            isFinderCenterModuleCell(row - 1, column),
            isFinderCenterModuleCell(row + 1, column),
          );
          addPrimitive(primitive);
        }
      }
    }
  }

  return {
    moduleCount,
    viewSize,
    outputSize: calculateQRCodeOutputSize(matrix, styling),
    backgroundColor: styling.background,
    hasCurves,
    layers: finishMutableStyleLayers(mutableLayers, gridWidth, viewSize),
  };
}

type MutableStyleLayer = {
  color: QRCodeStylePrimitive['color'];
  squareCells: Uint8Array;
  curvedPrimitives: QRCodeStylePrimitive[];
};

function getMutableStyleLayer(
  color: QRCodeStylePrimitive['color'],
  gridWidth: number,
  gridHeight: number,
  layersByColor: Map<QRCodeStylePrimitive['color'], MutableStyleLayer>,
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
): QRCodeStyleLayer[] {
  return mutableLayers.map(({color, squareCells, curvedPrimitives}) => ({
    color,
    rectangles: compactSquareCells(squareCells, gridWidth, gridHeight),
    curvedPrimitives,
  }));
}

function addSquarePrimitiveCells(
  cells: Uint8Array,
  gridWidth: number,
  primitive: QRCodeStylePrimitive,
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
): QRCodeStyleRectangle[] {
  const rectangles: QRCodeStyleRectangle[] = [];
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
  role: QRCodeStyleRole,
  color: QRCodeModuleStylePrimitive['color'],
  type: QRCodeModuleShape,
  left: boolean,
  right: boolean,
  top: boolean,
  bottom: boolean,
): QRCodeModuleStylePrimitive {
  const {shape, rotation} = resolveModuleShape(type, left, right, top, bottom);

  return createResolvedModulePrimitive(column, row, margin, role, color, shape, rotation);
}

function createResolvedModulePrimitive(
  column: number,
  row: number,
  margin: number,
  role: QRCodeStyleRole,
  color: QRCodeModuleStylePrimitive['color'],
  shape: QRCodePaintShape,
  rotation: QRCodeStyleRotation,
): QRCodeModuleStylePrimitive {
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
  type: QRCodeModuleShape,
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
  type: QRCodeModuleShape,
  left: boolean,
  right: boolean,
  top: boolean,
  bottom: boolean,
): ResolvedModuleShape {
  if (type === 'square') return {shape: 'square', rotation: 0};
  if (type === 'circle') return {shape: 'circle', rotation: 0};

  const neighborsCount = +left + +right + +top + +bottom;

  if (type === 'diagonal' || type === 'diagonal-rounded') {
    if (neighborsCount === 0) {
      return {shape: 'opposite-corners-rounded', rotation: 90};
    }
    if (!left && !top) {
      return {
        shape: type === 'diagonal' ? 'corner-rounded' : 'corner-extra-rounded',
        rotation: 270,
      };
    }
    if (!right && !bottom) {
      return {
        shape: type === 'diagonal' ? 'corner-rounded' : 'corner-extra-rounded',
        rotation: 90,
      };
    }
    return {shape: 'square', rotation: 0};
  }

  if (neighborsCount === 0) return {shape: 'circle', rotation: 0};
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
): QRCodeStyleRotation {
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
): QRCodeStyleRotation {
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
