import {calculateQRCodeRenderedSize} from './styling';
import type {
  QRCodeDotType,
  QRCodeMatrix,
  QRCodeModuleShape,
  QRCodeModuleStylePrimitive,
  QRCodeParsedStylingOptions,
  QRCodeStylePlan,
  QRCodeStylePrimitive,
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

type NeighborReader = (columnOffset: number, rowOffset: number) => boolean;

export function createQRCodeStylePlan(
  matrix: QRCodeMatrix,
  styling: QRCodeParsedStylingOptions,
): QRCodeStylePlan {
  const moduleCount = matrix.length;
  const viewSize = moduleCount + 2 * styling.margin;
  const finders = findFinderPatterns(matrix);
  const finderDarkCells = createFinderDarkCellMap(finders, moduleCount);
  const primitives: QRCodeStylePrimitive[] = [];
  let hasCurves = false;

  const isOrdinaryDark = (row: number, column: number): boolean => {
    if (row < 0 || column < 0) return false;
    return !!matrix[row]?.[column] && finderDarkCells[row * moduleCount + column] !== 1;
  };

  const dotsType = styling.dotsOptions.type;
  const dotsColor = styling.dotsOptions.color;

  if (dotsType === 'square' || dotsType === 'dots') {
    const shape: QRCodeModuleShape = dotsType === 'square' ? 'square' : 'dot';
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
          (columnOffset, rowOffset) => isOrdinaryDark(row + rowOffset, column + columnOffset),
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
      const primitive: QRCodeStylePrimitive = {
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
          (columnOffset, rowOffset) => isFinderRingCell(row + rowOffset, column + columnOffset),
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
      const primitive: QRCodeStylePrimitive = {
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
            (columnOffset, rowOffset) =>
              isFinderCenterModuleCell(row + rowOffset, column + columnOffset),
          );
          primitives.push(primitive);
          if (primitive.shape !== 'square') hasCurves = true;
        }
      }
    }
  }

  return {
    moduleCount,
    viewSize,
    renderedSize: calculateQRCodeRenderedSize(matrix, styling),
    backgroundColor: styling.colors.colorLight,
    hasCurves,
    primitives,
  };
}

function createModulePrimitive(
  column: number,
  row: number,
  margin: number,
  role: QRCodeStyleRole,
  color: QRCodeModuleStylePrimitive['color'],
  type: QRCodeDotType,
  getNeighbor: NeighborReader,
): QRCodeModuleStylePrimitive {
  const {shape, rotation} = resolveModuleShape(type, getNeighbor);

  return createResolvedModulePrimitive(column, row, margin, role, color, shape, rotation);
}

function createResolvedModulePrimitive(
  column: number,
  row: number,
  margin: number,
  role: QRCodeStyleRole,
  color: QRCodeModuleStylePrimitive['color'],
  shape: QRCodeModuleShape,
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
  type: QRCodeDotType,
  getNeighbor: NeighborReader,
): {shape: QRCodeModuleShape; rotation: QRCodeStyleRotation} {
  if (type === 'square') return {shape: 'square', rotation: 0};
  if (type === 'dots') return {shape: 'dot', rotation: 0};

  const left = getNeighbor(-1, 0);
  const right = getNeighbor(1, 0);
  const top = getNeighbor(0, -1);
  const bottom = getNeighbor(0, 1);
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
