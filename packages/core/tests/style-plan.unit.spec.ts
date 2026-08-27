import {describe, expect, test} from 'vitest';

import {
  type QRCodeDotType,
  type QRCodeMatrix,
  ɵcreateQRCodeStylePlan as createQRCodeStylePlan,
  ɵparseQRCodeStylingOptions as parseQRCodeStylingOptions,
} from '../src';

describe('createQRCodeStylePlan', () => {
  test('creates resolved default layers in module coordinates', () => {
    const matrix = createFinderMatrix();
    matrix[10]![10] = 1;

    const plan = createQRCodeStylePlan(
      matrix,
      parseQRCodeStylingOptions({
        size: 2,
        margin: 1,
        dotsOptions: {color: '#111111'},
        cornersSquareOptions: {color: '#222222'},
        cornersDotOptions: {color: '#333333'},
      }),
    );

    expect(plan).toMatchObject({
      moduleCount: 21,
      viewSize: 23,
      renderedSize: 46,
      backgroundColor: '#ffffff',
      hasCurves: false,
    });
    expect(countLayerModules(plan.layers.find(({color}) => color === '#111111')!)).toBe(1);
    expect(countLayerModules(plan.layers.find(({color}) => color === '#222222')!)).toBe(72);
    expect(countLayerModules(plan.layers.find(({color}) => color === '#333333')!)).toBe(27);
    expect(plan.layers[0]!.rectangles[0]).toMatchObject({x: 11, y: 11});
  });

  test('compacts square modules into renderer-ready rectangles', () => {
    const plan = createQRCodeStylePlan(
      [
        [1, 1],
        [1, 1],
      ],
      parseQRCodeStylingOptions({size: 1, margin: 0}),
    );

    expect(plan.layers).toEqual([
      {
        color: '#000000',
        curvedPrimitives: [],
        rectangles: [{x: 0, y: 0, width: 2, height: 2}],
      },
    ]);
  });

  test('keeps malformed and non-QR matrices in the ordinary dots role', () => {
    const matrix = createFinderMatrix();
    matrix[1]![1] = 1;
    matrix[1]![15] = 1;
    matrix[15]![1] = 1;

    const plan = createQRCodeStylePlan(
      matrix,
      parseQRCodeStylingOptions({
        cornersSquareOptions: {color: '#222222'},
        cornersDotOptions: {color: '#333333'},
      }),
    );

    expect(plan.layers.map(({color}) => color)).toEqual(['#000000']);
  });

  test('recognizes canonical finder regions in any square matrix of at least 21 modules', () => {
    const matrix = createFinderMatrix(22);

    const plan = createQRCodeStylePlan(
      matrix,
      parseQRCodeStylingOptions({
        cornersSquareOptions: {color: '#222222'},
        cornersDotOptions: {color: '#333333'},
      }),
    );

    expect(countLayerModules(plan.layers.find(({color}) => color === '#222222')!)).toBe(72);
    expect(countLayerModules(plan.layers.find(({color}) => color === '#333333')!)).toBe(27);
  });

  test.each([
    ['rounded', 'dot'],
    ['extra-rounded', 'dot'],
    ['classy', 'opposite-corners-rounded'],
    ['classy-rounded', 'opposite-corners-rounded'],
    ['dots', 'dot'],
    ['square', 'square'],
  ] as const)('resolves isolated %s modules to %s', (type, shape) => {
    expect(renderedModules([[1]], type)[0]).toMatchObject({shape});
  });

  test('resolves neighbor-aware ends, corners, and dense modules', () => {
    expect(renderedModules([[1, 1]], 'rounded')[0]).toMatchObject({
      shape: 'side-rounded',
      rotation: 180,
    });
    expect(
      renderedModules(
        [
          [1, 1],
          [1, 0],
        ],
        'rounded',
      )[0],
    ).toMatchObject({shape: 'corner-rounded', rotation: 270});
    expect(
      renderedModules(
        [
          [1, 1],
          [1, 0],
        ],
        'extra-rounded',
      )[0],
    ).toMatchObject({shape: 'corner-extra-rounded', rotation: 270});
    expect(
      renderedModules(
        [
          [0, 1, 0],
          [1, 1, 1],
          [0, 1, 0],
        ],
        'rounded',
      )[2],
    ).toMatchObject({shape: 'square'});
  });

  test.each([
    [
      'classy',
      'left and bottom',
      [
        [0, 0, 0],
        [1, 1, 0],
        [0, 1, 0],
      ],
    ],
    [
      'classy',
      'right and top',
      [
        [0, 1, 0],
        [0, 1, 1],
        [0, 0, 0],
      ],
    ],
    [
      'classy-rounded',
      'left and bottom',
      [
        [0, 0, 0],
        [1, 1, 0],
        [0, 1, 0],
      ],
    ],
    [
      'classy-rounded',
      'right and top',
      [
        [0, 1, 0],
        [0, 1, 1],
        [0, 0, 0],
      ],
    ],
  ] satisfies readonly (readonly [QRCodeDotType, string, QRCodeMatrix])[])(
    'keeps %s modules square with %s neighbors',
    (type, _neighbors, matrix) => {
      expect(renderedModules(matrix, type)[1]).toMatchObject({shape: 'square', rotation: 0});
    },
  );

  test('uses whole or per-module finder primitives according to the requested types', () => {
    const matrix = createFinderMatrix();
    const whole = createQRCodeStylePlan(
      matrix,
      parseQRCodeStylingOptions({
        cornersSquareOptions: {color: '#222222', type: 'extra-rounded'},
        cornersDotOptions: {color: '#333333', type: 'dot'},
      }),
    );
    const modular = createQRCodeStylePlan(
      matrix,
      parseQRCodeStylingOptions({
        cornersSquareOptions: {color: '#222222', type: 'classy'},
        cornersDotOptions: {color: '#333333', type: 'rounded'},
      }),
    );

    expect(whole.layers.find(({color}) => color === '#222222')!.curvedPrimitives).toHaveLength(3);
    expect(whole.layers.find(({color}) => color === '#333333')!.curvedPrimitives).toHaveLength(3);
    expect(countLayerModules(modular.layers.find(({color}) => color === '#222222')!)).toBe(72);
    expect(countLayerModules(modular.layers.find(({color}) => color === '#333333')!)).toBe(27);
    expect(modular.hasCurves).toBe(true);
  });
});

function renderedModules(matrix: QRCodeMatrix, type: QRCodeDotType) {
  const layer = createQRCodeStylePlan(
    matrix,
    parseQRCodeStylingOptions({margin: 0, dotsOptions: {type}}),
  ).layers[0]!;
  const modules = layer.curvedPrimitives.map(({shape, rotation, x, y}) => ({
    shape,
    rotation,
    x,
    y,
  }));
  for (const rectangle of layer.rectangles) {
    for (let y = rectangle.y; y < rectangle.y + rectangle.height; y++) {
      for (let x = rectangle.x; x < rectangle.x + rectangle.width; x++) {
        modules.push({shape: 'square', rotation: 0, x, y});
      }
    }
  }
  return modules.sort((first, second) => first.y - second.y || first.x - second.x);
}

function countLayerModules(layer: ReturnType<typeof createQRCodeStylePlan>['layers'][number]) {
  return (
    layer.curvedPrimitives.length +
    layer.rectangles.reduce((total, rectangle) => total + rectangle.width * rectangle.height, 0)
  );
}

function createFinderMatrix(size = 21): Array<Array<0 | 1>> {
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
