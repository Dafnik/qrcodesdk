import {describe, expect, test} from 'vitest';

import {
  type QRCodeDotType,
  type QRCodeMatrix,
  type QRCodeModuleStylePrimitive,
  createQRCodeStylePlan,
  parseQRCodeStylingOptions,
} from '../src';

describe('createQRCodeStylePlan', () => {
  test('creates resolved default primitives in module coordinates', () => {
    const matrix = createFinderMatrix();
    matrix[10]![10] = 1;

    const plan = createQRCodeStylePlan(matrix, parseQRCodeStylingOptions({size: 2, margin: 1}));

    expect(plan).toMatchObject({
      moduleCount: 21,
      viewSize: 23,
      renderedSize: 46,
      backgroundColor: '#ffffff',
      hasCurves: false,
    });
    expect(plan.primitives.filter(({role}) => role === 'dots')).toHaveLength(1);
    expect(plan.primitives.filter(({kind}) => kind === 'finder-ring')).toHaveLength(3);
    expect(plan.primitives.filter(({kind}) => kind === 'finder-center')).toHaveLength(3);
    expect(plan.primitives[0]).toMatchObject({x: 11, y: 11, shape: 'square'});
  });

  test('keeps malformed and non-QR matrices in the ordinary dots role', () => {
    const matrix = createFinderMatrix();
    matrix[1]![1] = 1;
    matrix[1]![15] = 1;
    matrix[15]![1] = 1;

    const plan = createQRCodeStylePlan(matrix, parseQRCodeStylingOptions());

    expect(plan.primitives.every(({kind, role}) => kind === 'module' && role === 'dots')).toBe(
      true,
    );
  });

  test('recognizes canonical finder regions in any square matrix of at least 21 modules', () => {
    const matrix = createFinderMatrix(22);

    const plan = createQRCodeStylePlan(matrix, parseQRCodeStylingOptions());

    expect(plan.primitives.filter(({kind}) => kind === 'finder-ring')).toHaveLength(3);
    expect(plan.primitives.filter(({kind}) => kind === 'finder-center')).toHaveLength(3);
  });

  test.each([
    ['rounded', 'dot'],
    ['extra-rounded', 'dot'],
    ['classy', 'opposite-corners-rounded'],
    ['classy-rounded', 'opposite-corners-rounded'],
    ['dots', 'dot'],
    ['square', 'square'],
  ] as const)('resolves isolated %s modules to %s', (type, shape) => {
    expect(modulePrimitives([[1]], type)[0]).toMatchObject({shape});
  });

  test('resolves neighbor-aware ends, corners, and dense modules', () => {
    expect(modulePrimitives([[1, 1]], 'rounded')[0]).toMatchObject({
      shape: 'side-rounded',
      rotation: 180,
    });
    expect(
      modulePrimitives(
        [
          [1, 1],
          [1, 0],
        ],
        'rounded',
      )[0],
    ).toMatchObject({shape: 'corner-rounded', rotation: 270});
    expect(
      modulePrimitives(
        [
          [1, 1],
          [1, 0],
        ],
        'extra-rounded',
      )[0],
    ).toMatchObject({shape: 'corner-extra-rounded', rotation: 270});
    expect(
      modulePrimitives(
        [
          [0, 1, 0],
          [1, 1, 1],
          [0, 1, 0],
        ],
        'rounded',
      )[2],
    ).toMatchObject({shape: 'square'});
  });

  test('uses whole or per-module finder primitives according to the requested types', () => {
    const matrix = createFinderMatrix();
    const whole = createQRCodeStylePlan(
      matrix,
      parseQRCodeStylingOptions({
        cornersSquareOptions: {type: 'extra-rounded'},
        cornersDotOptions: {type: 'dot'},
      }),
    );
    const modular = createQRCodeStylePlan(
      matrix,
      parseQRCodeStylingOptions({
        cornersSquareOptions: {type: 'classy'},
        cornersDotOptions: {type: 'rounded'},
      }),
    );

    expect(whole.primitives.filter(({kind}) => kind === 'finder-ring')).toHaveLength(3);
    expect(whole.primitives.filter(({kind}) => kind === 'finder-center')).toHaveLength(3);
    expect(modular.primitives.filter(({role}) => role === 'cornersSquare')).toHaveLength(72);
    expect(modular.primitives.filter(({role}) => role === 'cornersDot')).toHaveLength(27);
    expect(modular.hasCurves).toBe(true);
  });
});

function modulePrimitives(matrix: QRCodeMatrix, type: QRCodeDotType) {
  return createQRCodeStylePlan(matrix, parseQRCodeStylingOptions({dotsOptions: {type}}))
    .primitives as readonly QRCodeModuleStylePrimitive[];
}

function createFinderMatrix(size = 21): QRCodeMatrix {
  const matrix = Array.from({length: size}, () => Array<0 | 1>(size).fill(0));
  for (const [originRow, originColumn] of [
    [0, 0],
    [0, size - 7],
    [size - 7, 0],
  ]) {
    for (let row = 0; row < 7; row++) {
      for (let column = 0; column < 7; column++) {
        matrix[originRow + row]![originColumn + column] =
          row === 0 ||
          row === 6 ||
          column === 0 ||
          column === 6 ||
          (row >= 2 && row <= 4 && column >= 2 && column <= 4)
            ? 1
            : 0;
      }
    }
  }
  return matrix;
}
