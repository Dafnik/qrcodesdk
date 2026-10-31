import {describe, expect, test} from 'vitest';

import {type QRCodeMatrix, qrcode} from '../src';
import {
  type QRCodeDrawing,
  type QRCodeStylePart,
  QR_CODE_MODULE_ROLES,
  createQRCodeCenterImage,
  createQRCodeStyler,
} from '../src/drawing';
import {alignment, circle, finder, rounded} from '../src/style';
import {fromRows} from './helpers';

const {finderRing, finderCenter, alignmentRing, alignmentCenter} = QR_CODE_MODULE_ROLES;

function area(rects: readonly number[]): number {
  let total = 0;
  for (let index = 0; index < rects.length; index += 4) {
    total += rects[index + 2]! * rects[index + 3]!;
  }
  return total;
}

function tileCount(layer: QRCodeDrawing['layers'][number]): number {
  return layer.tiles.reduce((count, [, positions]) => count + positions.length / 2, 0);
}

function countDark(matrix: QRCodeMatrix, roles?: readonly number[]): number {
  let count = 0;
  for (let index = 0; index < matrix.modules.length; index++) {
    if (matrix.modules[index] && (!roles || roles.includes(matrix.roles[index]!))) count++;
  }
  return count;
}

describe('createQRCodeStyler', () => {
  test('creates no layers for a matrix without dark modules', () => {
    expect(createQRCodeStyler()(fromRows([[0]])).layers).toEqual([]);
  });

  test('reports layout and the lowercase background color', () => {
    const drawing = createQRCodeStyler({moduleSize: 3, quietZone: 2, background: '#ABCDEF'})(
      qrcode('layout').matrix(),
    );

    expect(drawing).toMatchObject({
      moduleCount: 21,
      moduleSize: 3,
      quietZone: 2,
      viewSize: 25,
      outputSize: 75,
      background: '#abcdef',
    });
  });

  test('draws an unstyled matrix as one layer of filled rectangles', () => {
    const matrix = qrcode('plain').matrix();
    const {layers} = createQRCodeStyler({foreground: '#123456'})(matrix);

    expect(layers).toHaveLength(1);
    expect(layers[0]!.color).toBe('#123456');
    expect(layers[0]!.tiles).toEqual([]);
    expect(area(layers[0]!.rects)).toBe(countDark(matrix));
  });

  test('shapes every module except unstyled finders, which stay square', () => {
    const matrix = qrcode('shaped').version(2).matrix();
    const [layer] = createQRCodeStyler({modules: circle()})(matrix).layers;
    const finders = [finderRing, finderCenter];

    expect(tileCount(layer!)).toBe(countDark(matrix) - countDark(matrix, finders));
    expect(area(layer!.rects)).toBe(countDark(matrix, finders));
  });

  test('draws finder parts separately from the remaining modules', () => {
    const matrix = qrcode('finder').matrix();
    const [finderLayer, moduleLayer] = createQRCodeStyler({
      finder: finder({ring: rounded(), color: '#ff0000'}),
    })(matrix).layers;

    expect(finderLayer!.color).toBe('#ff0000');
    expect(finderLayer!.tiles).toEqual([[rounded().finderRing, [4, 4, 18, 4, 4, 18]]]);
    expect(area(finderLayer!.rects)).toBe(27);
    expect(area(moduleLayer!.rects)).toBe(
      countDark(matrix) - countDark(matrix, [finderRing, finderCenter]),
    );
  });

  test('draws every alignment pattern through its part', () => {
    const matrix = qrcode('alignment').version(7).matrix();
    const [alignmentLayer, moduleLayer] = createQRCodeStyler({
      quietZone: 0,
      alignment: alignment({center: circle(), color: '#00ff00'}),
    })(matrix).layers;

    expect(alignmentLayer!.color).toBe('#00ff00');
    // Version 7 has six alignment patterns: square rings and dot centers.
    expect(area(alignmentLayer!.rects)).toBe(6 * 16);
    expect(alignmentLayer!.tiles[0]![1]).toContain(22);
    expect(tileCount(alignmentLayer!)).toBe(6);
    expect(area(moduleLayer!.rects)).toBe(
      countDark(matrix) - countDark(matrix, [alignmentRing, alignmentCenter]),
    );
  });

  test('merges parts that share the foreground color into one layer', () => {
    const {layers} = createQRCodeStyler({finder: finder(), alignment: alignment()})(
      qrcode('shared').version(2).matrix(),
    );

    expect(layers).toHaveLength(1);
  });

  test('runs custom parts with role and area claims in matrix coordinates', () => {
    const corner: QRCodeStylePart = (context) => {
      context.claimRoles(finderRing, finderCenter);
      context.claimArea(9, 9, 3, 3);
      context.layer('#00ff00').rect(0, 0, 1, 1);
    };
    const matrix = qrcode('custom part').matrix();
    const {layers} = createQRCodeStyler({quietZone: 1}, [corner])(matrix);
    const cleared = [9, 10, 11].flatMap((y) =>
      [9, 10, 11].map((x) => matrix.modules[y * matrix.size + x]!),
    );

    expect(layers[0]!.rects).toEqual([1, 1, 1, 1]);
    expect(area(layers[1]!.rects)).toBe(
      countDark(matrix) -
        countDark(matrix, [finderRing, finderCenter]) -
        cleared.filter(Boolean).length,
    );
  });

  test('validates and merges custom layer colors case-insensitively', () => {
    const draw = createQRCodeStyler({foreground: '#abcdef'}, [
      (context) => {
        context.layer('#ABCDEF').rect(1, 0, 1, 1);
      },
    ]);
    const {layers} = draw(fromRows([[1]]));
    expect(layers).toHaveLength(1);
    expect(layers[0]!.color).toBe('#abcdef');
    expect(area(layers[0]!.rects)).toBe(2);
    expect(() =>
      createQRCodeStyler({}, [(context) => context.layer('#12')])(fromRows([[0]])),
    ).toThrowError(expect.objectContaining({code: 'INVALID_OPTIONS'}));
  });

  test('clears every module touched by a fractional claimed area', () => {
    const matrix = fromRows([
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1],
    ]);
    const draw = createQRCodeStyler({quietZone: 0}, [
      (context) => {
        context.claimArea(0.5, 0.5, 1, 1);
        expect(context.isAreaClaimed(0, 0, 1, 1)).toBe(true);
      },
    ]);
    expect(draw(matrix).layers[0]!.rects).toEqual([2, 0, 1, 2, 0, 2, 3, 1]);
    const empty = createQRCodeStyler({}, [(context) => context.claimArea(0.5, 0.5, 0, 1)]);
    expect(area(empty(matrix).layers[0]!.rects)).toBe(9);
  });

  test('rejects non-finite geometry and negative dimensions from custom parts', () => {
    const parts: QRCodeStylePart[] = [
      (context) => context.claimArea(NaN, 0, 1, 1),
      (context) => context.claimArea(0, 0, -1, 1),
      (context) => context.layer().rect(0, Infinity, 1, 1),
      (context) => context.layer().rect(0, 0, 1, -1),
      (context) => context.layer().tile('m0 0z', NaN, 0),
    ];
    for (const part of parts) {
      expect(() => createQRCodeStyler({}, [part])(fromRows([[1]]))).toThrowError(
        expect.objectContaining({code: 'INVALID_OPTIONS'}),
      );
    }
  });

  test('rejects invalid path data from custom parts', () => {
    const draw = createQRCodeStyler({
      finder: (context) => context.layer().tile('M0 0h1v1h-1z', 0, 0),
    });

    expect(() => draw(fromRows([[1]]))).toThrowError(
      expect.objectContaining({
        code: 'INVALID_OPTIONS',
        details: expect.objectContaining({field: 'tile'}),
      }),
    );
  });

  test('snapshots options when the styler is created', () => {
    const style = {moduleSize: 3, quietZone: 2};
    const draw = createQRCodeStyler(style);
    style.moduleSize = 99;

    expect(draw(qrcode('snapshot').matrix()).moduleSize).toBe(3);
  });
});

describe('createQRCodeCenterImage', () => {
  test('places the image box in view coordinates', () => {
    const drawing = createQRCodeStyler({quietZone: 4})(qrcode('image').matrix());

    expect(createQRCodeCenterImage({size: 0.4}).place(drawing)).toEqual({
      x: 10.3,
      y: 10.3,
      size: 8.4,
    });
  });

  test('clears every module the image or its padding touches', () => {
    const matrix = qrcode('image').matrix();
    const {part} = createQRCodeCenterImage({size: 0.4, padding: 1});
    const drawing = createQRCodeStyler({quietZone: 0}, [part])(matrix);
    // The image spans 6.3 to 14.7, so padding clears modules 5 through 15.
    let cleared = 0;
    for (let y = 5; y <= 15; y++) {
      for (let x = 5; x <= 15; x++) cleared += matrix.modules[y * matrix.size + x]!;
    }

    expect(area(drawing.layers[0]!.rects)).toBe(countDark(matrix) - cleared);
    const kept = createQRCodeStyler({quietZone: 0}, [
      createQRCodeCenterImage({clearBackground: false}).part,
    ])(matrix);
    expect(area(kept.layers[0]!.rects)).toBe(countDark(matrix));
  });

  test('skips alignment patterns behind the image', () => {
    const matrix = qrcode('alignment behind image').version(7).matrix();
    const [alignmentLayer] = createQRCodeStyler(
      {quietZone: 0, alignment: alignment({color: '#00ff00'})},
      [createQRCodeCenterImage({size: 0.2, padding: 0}).part],
    )(matrix).layers;

    // The center alignment pattern of version 7 is behind the image; five patterns remain.
    expect(area(alignmentLayer!.rects)).toBe(5 * 17);
  });

  test.each([
    [{size: 2}, 'centerImage.size'],
    [{padding: -1}, 'centerImage.padding'],
    [{clearBackground: 'yes'}, 'centerImage.clearBackground'],
    [{source: 'x'}, 'centerImage.source'],
  ])('validates the layout %#', (layout, field) => {
    expect(() => createQRCodeCenterImage(layout as never)).toThrowError(
      expect.objectContaining({details: expect.objectContaining({field})}),
    );
  });
});
