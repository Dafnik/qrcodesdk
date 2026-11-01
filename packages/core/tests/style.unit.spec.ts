import {describe, expect, test} from 'vitest';

import {QRCodeSVGRenderer, type QRCodeShape, qrcode} from '../src';
import {ɵcreateQRCodeStyler as createQRCodeStyler} from '../src/internal';
import {type PreparedShapePath, prepareShapePath} from '../src/shape-path';
import {alignment, circle, customShape, diagonal, finder, rounded} from '../src/style';

describe('style option validation', () => {
  test.each([
    [() => rounded({radius: 2}), 'rounded.radius'],
    [() => diagonal({radius: -1}), 'diagonal.radius'],
    [() => circle({size: 0}), 'circle.size'],
    [() => circle({size: 0.0009}), 'circle.size'],
    [() => finder({color: '#gggggg'}), 'finder.color'],
    [() => customShape({finderRing: 'M0 0z'}), 'customShape.finderRing'],
    [() => alignment({color: '#12'}), 'alignment.color'],
  ])('rejects invalid shape or part options %#', (create, field) => {
    expect(create).toThrowError(
      expect.objectContaining({code: 'INVALID_OPTIONS', details: expect.objectContaining({field})}),
    );
  });
});

describe('custom shape bounds', () => {
  const prepare = (piece: keyof QRCodeShape, path: string) =>
    customShape({[piece]: path} as Record<keyof QRCodeShape, string>);
  test.each([
    ['module', 'm-.25 -.25h1.5v1.5h-1.5z'],
    ['module', 'm0 0h1.01v1h-1.01z'],
    // The curve bulges above y = 0 between endpoints that stay inside.
    ['module', 'm0 0c.25 -.5 .75 -.5 1 0v1h-1z'],
    // A semicircle above its chord leaves the box although its endpoints stay inside.
    ['module', 'm0 .25a.5 .5 0 0 1 1 0v.75h-1z'],
    ['alignmentCenter', 'm0 0h2v1h-2z'],
    ['finderCenter', 'm0 0h3v3.5h-3z'],
    ['alignmentRing', 'm0 0h6v5h-6z'],
    ['finderRing', 'm0 0h7v7.1h-7z'],
  ] as const)('rejects %s path %s outside its box', (piece, path) => {
    expect(() => prepare(piece, path)).toThrowError(
      expect.objectContaining({
        code: 'INVALID_OPTIONS',
        details: expect.objectContaining({field: `customShape.${piece}`}),
      }),
    );
  });

  test.each([
    ['module', 'm0 0h1v1h-1z'],
    ['module', 'm.5 0a.5 .5 0 0 1 0 1a.5 .5 0 0 1 0 -1z'],
    ['module', 'm0 .5c0 -.66 1 -.66 1 0c0 .66 -1 .66 -1 0z'],
    ['module', 'm.5 0 .5 .25v.5l-.5 .25-.5-.25v-.5z'],
    ['finderRing', 'm1 0h5l1 1v5l-1 1h-5l-1 -1v-5zm0 1v5h5v-5z'],
    ['finderCenter', 'm.75 0h1.5l.75 .75v1.5l-.75 .75h-1.5l-.75 -.75v-1.5z'],
    ['alignmentRing', 'm1 0h3l1 1v3l-1 1h-3l-1 -1v-3zm0 1v3h3v-3z'],
  ] as const)('accepts %s path %s inside its box', (piece, path) => {
    expect(() => prepare(piece, path)).not.toThrow();
  });
});

describe('factory style values', () => {
  test('snapshots custom paths and colors before repeated rendering', () => {
    const shape = {finderCenter: 'm0 0h3v3h-3z'};
    const options = {center: customShape(shape), color: '#ABCDEF' as const};
    const value = finder(options);
    const render = QRCodeSVGRenderer({style: {finder: value}});
    const matrix = qrcode('custom pattern').matrix();
    const expected = render(matrix);
    shape.finderCenter = 'invalid';
    expect(render(matrix)).toBe(expected);
    expect(expected).toContain('fill="#abcdef"');
    // The public type is opaque; its runtime representation is still the original closure.
    expect(typeof value).toBe('function');
  });

  test('supports hexagon module paths', () => {
    const shape = {module: 'm.5 0 .5 .25v.5l-.5 .25-.5-.25v-.5z'};
    const hexagon = customShape(shape);
    shape.module = 'invalid';
    const render = QRCodeSVGRenderer({style: {modules: hexagon}});
    const matrix = qrcode('hexagons').matrix();
    const expected = render(matrix);
    expect(render(matrix)).toBe(expected);
    expect(expected).toContain('m.5 0 .5 .25v.5l-.5 .25-.5-.25v-.5z');
  });

  test('reuses prepared paths across renderer instances', () => {
    const shape = customShape({module: 'm.5 0 .5 .25v.5l-.5 .25-.5-.25v-.5z'});
    const matrix = qrcode('shared hexagon').matrix();
    for (let index = 0; index < 2; index++) {
      const drawing = createQRCodeStyler({modules: shape})(matrix);
      expect(drawing.layers[0]!.tiles[0]![0]).toBe(shape.module);
    }
  });

  test.each([
    rounded({radius: 0}),
    rounded({radius: 0.777}),
    rounded({radius: 1}),
    diagonal({radius: 0.2}),
    diagonal({radius: 1}),
    circle({size: 0.001}),
    circle({size: 0.2006}),
    circle({size: 0.333}),
    circle({size: 0.75}),
    circle(),
  ])('prepares valid paths with the correct final cursor position %#', (shape) => {
    for (const key of [
      'module',
      'finderRing',
      'finderCenter',
      'alignmentRing',
      'alignmentCenter',
    ] as const) {
      const piece = shape[key];
      expect(shape[key]).toBe(piece);
      const paths = (Array.isArray(piece) ? piece : [piece]) as readonly (
        PreparedShapePath | undefined
      )[];
      for (const path of paths) {
        if (path) expect(path).toEqual(prepareShapePath('test', path.data));
      }
    }
  });
});
