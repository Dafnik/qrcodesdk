import {describe, expect, test} from 'vitest';

import {QRCodeSVGRenderer, qrcode} from '../src';
import {ɵcreateQRCodeStyler as createQRCodeStyler} from '../src/internal';
import {type PreparedShapePath, prepareShapePath} from '../src/shape-path';
import {alignment, circle, customShape, diagonal, finder, rounded} from '../src/style';

describe('style option validation', () => {
  test.each([
    [() => rounded({radius: 2}), 'rounded.radius'],
    [() => diagonal({radius: -1}), 'diagonal.radius'],
    [() => circle({size: 0}), 'circle.size'],
    [() => finder({color: '#gggggg'}), 'finder.color'],
    [() => customShape({finderRing: 'M0 0z'}), 'customShape.finderRing'],
    [() => alignment({color: '#12'}), 'alignment.color'],
  ])('rejects invalid shape or part options %#', (create, field) => {
    expect(create).toThrowError(
      expect.objectContaining({code: 'INVALID_OPTIONS', details: expect.objectContaining({field})}),
    );
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
