import {calculateQRCodeOutputSize} from './styling';
import type {
  QRCodeMatrix,
  QRCodeModuleShape,
  QRCodeModuleStylePrimitive,
  QRCodePaintShape,
  QRCodeResolvedVisualStyle,
  QRCodeStyleLayer,
  QRCodeStylePrimitive,
  QRCodeStyleRectangle,
  QRCodeStyleRole,
  QRCodeStyleRotation,
  QRCodeStyledDrawingData,
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

export function createQRCodeStyledDrawingData(
  matrix: QRCodeMatrix,
  styling: QRCodeResolvedVisualStyle,
): QRCodeStyledDrawingData {
  if (
    styling.modules.shape === 'square' &&
    styling.finder.outer.shape === 'square' &&
    styling.finder.center.shape === 'square'
  ) {
    return createSquareStyledDrawingData(matrix, styling);
  }

  return createStyledDrawingData(matrix, styling);
}

function createSquareStyledDrawingData(
  matrix: QRCodeMatrix,
  styling: QRCodeResolvedVisualStyle,
): QRCodeStyledDrawingData {
  const moduleCount = matrix.length;
  const viewSize = moduleCount + 2 * styling.quietZone;
  const gridWidth = Math.max(
    viewSize,
    styling.quietZone + matrix.reduce((maximum, row) => Math.max(maximum, row.length), 0),
  );
  const finders = findFinderPatterns(matrix);
  const finderDarkModules = createFinderDarkModuleMap(finders, moduleCount);
  const layersByColor = new Map<QRCodeStylePrimitive['color'], MutableStyleLayer>();
  const mutableLayers: MutableStyleLayer[] = [];

  const addModule = (color: QRCodeStylePrimitive['color'], x: number, y: number): void => {
    const layer = getMutableStyleLayer(color, gridWidth, viewSize, layersByColor, mutableLayers);
    layer.squareModules[y * gridWidth + x] = 1;
  };

  for (let row = 0; row < moduleCount; row++) {
    const matrixRow = matrix[row]!;
    const rowOffset = row * moduleCount;
    for (let column = 0; column < matrixRow.length; column++) {
      if (!matrixRow[column] || finderDarkModules[rowOffset + column] === 1) continue;
      addModule(styling.modules.color, styling.quietZone + column, styling.quietZone + row);
    }
  }

  for (let index = 0; index < finders.length; index++) {
    const finder = finders[index]!;
    forEachFinderRingModule((row, column) => {
      addModule(
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
        addModule(
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

function createStyledDrawingData(
  matrix: QRCodeMatrix,
  styling: QRCodeResolvedVisualStyle,
): QRCodeStyledDrawingData {
  const moduleCount = matrix.length;
  const viewSize = moduleCount + 2 * styling.quietZone;
  const gridWidth = Math.max(
    viewSize,
    styling.quietZone + matrix.reduce((maximum, row) => Math.max(maximum, row.length), 0),
  );
  const finders = findFinderPatterns(matrix);
  const finderDarkModules = createFinderDarkModuleMap(finders, moduleCount);
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
      addSquarePrimitiveModules(layer.squareModules, gridWidth, primitive);
    } else {
      layer.curvedPrimitives.push(primitive);
      hasCurves = true;
    }
  };

  const isOrdinaryDark = (row: number, column: number): boolean => {
    if (row < 0 || column < 0) return false;
    return !!matrix[row]?.[column] && finderDarkModules[row * moduleCount + column] !== 1;
  };

  const moduleShape = styling.modules.shape;
  const moduleColor = styling.modules.color;

  if (moduleShape === 'square' || moduleShape === 'circle') {
    const shape: QRCodePaintShape = moduleShape === 'square' ? 'square' : 'circle';
    for (let row = 0; row < moduleCount; row++) {
      const matrixRow = matrix[row]!;
      const rowOffset = row * moduleCount;
      for (let column = 0; column < matrixRow.length; column++) {
        if (!matrixRow[column] || finderDarkModules[rowOffset + column] === 1) continue;
        addPrimitive(
          createResolvedModulePrimitive(
            column,
            row,
            styling.quietZone,
            'modules',
            moduleColor,
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
          moduleColor,
          moduleShape,
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
      forEachFinderRingModule((row, column) => {
        const primitive = createModulePrimitive(
          finder.x + column,
          finder.y + row,
          styling.quietZone,
          'finderOuter',
          styling.finder.outer.color,
          type,
          isFinderRingModule(row, column - 1),
          isFinderRingModule(row, column + 1),
          isFinderRingModule(row - 1, column),
          isFinderRingModule(row + 1, column),
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
            isFinderCenterModuleModule(row, column - 1),
            isFinderCenterModuleModule(row, column + 1),
            isFinderCenterModuleModule(row - 1, column),
            isFinderCenterModuleModule(row + 1, column),
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
  squareModules: Uint8Array;
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
    squareModules: new Uint8Array(gridWidth * gridHeight),
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
  return mutableLayers.map(({color, squareModules, curvedPrimitives}) => ({
    color,
    rectangles: compactSquareModules(squareModules, gridWidth, gridHeight),
    curvedPrimitives,
  }));
}

function addSquarePrimitiveModules(
  modules: Uint8Array,
  gridWidth: number,
  primitive: QRCodeStylePrimitive,
): void {
  const {x, y} = primitive;
  if (primitive.kind === 'module') {
    modules[y * gridWidth + x] = 1;
    return;
  }

  if (primitive.kind === 'finder-center') {
    for (let row = 0; row < primitive.size; row++) {
      const start = (y + row) * gridWidth + x;
      modules.fill(1, start, start + primitive.size);
    }
    return;
  }

  const top = y * gridWidth + x;
  const bottom = (y + primitive.size - 1) * gridWidth + x;
  modules.fill(1, top, top + primitive.size);
  modules.fill(1, bottom, bottom + primitive.size);
  for (let row = 1; row < primitive.size - 1; row++) {
    const start = (y + row) * gridWidth + x;
    modules[start] = 1;
    modules[start + primitive.size - 1] = 1;
  }
}

function compactSquareModules(
  modules: Uint8Array,
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

function createModulePrimitive(
  column: number,
  row: number,
  quietZone: number,
  role: QRCodeStyleRole,
  color: QRCodeModuleStylePrimitive['color'],
  type: QRCodeModuleShape,
  left: boolean,
  right: boolean,
  top: boolean,
  bottom: boolean,
): QRCodeModuleStylePrimitive {
  const {shape, rotation} = resolveModuleShape(type, left, right, top, bottom);

  return createResolvedModulePrimitive(column, row, quietZone, role, color, shape, rotation);
}

function createResolvedModulePrimitive(
  column: number,
  row: number,
  quietZone: number,
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
    x: quietZone + column,
    y: quietZone + row,
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
      const expected = isFinderRingModule(row, column) || isFinderCenterModule(row, column);
      if (!!matrix[y + row]?.[x + column] !== expected) return false;
    }
  }
  return true;
}

function createFinderDarkModuleMap(finders: readonly Finder[], moduleCount: number): Uint8Array {
  const modules = new Uint8Array(moduleCount * moduleCount);
  for (const finder of finders) {
    for (let row = 0; row < FINDER_SIZE; row++) {
      for (let column = 0; column < FINDER_SIZE; column++) {
        if (isFinderRingModule(row, column) || isFinderCenterModule(row, column)) {
          modules[(finder.y + row) * moduleCount + finder.x + column] = 1;
        }
      }
    }
  }
  return modules;
}

function forEachFinderRingModule(callback: (row: number, column: number) => void): void {
  for (let row = 0; row < FINDER_SIZE; row++) {
    for (let column = 0; column < FINDER_SIZE; column++) {
      if (isFinderRingModule(row, column)) callback(row, column);
    }
  }
}

function isFinderRingModule(row: number, column: number): boolean {
  return (
    row >= 0 &&
    row < FINDER_SIZE &&
    column >= 0 &&
    column < FINDER_SIZE &&
    (row === 0 || row === FINDER_SIZE - 1 || column === 0 || column === FINDER_SIZE - 1)
  );
}

function isFinderCenterModule(row: number, column: number): boolean {
  return (
    row >= FINDER_CENTER_OFFSET &&
    row < FINDER_CENTER_OFFSET + FINDER_CENTER_SIZE &&
    column >= FINDER_CENTER_OFFSET &&
    column < FINDER_CENTER_OFFSET + FINDER_CENTER_SIZE
  );
}

function isFinderCenterModuleModule(row: number, column: number): boolean {
  return row >= 0 && row < FINDER_CENTER_SIZE && column >= 0 && column < FINDER_CENTER_SIZE;
}
