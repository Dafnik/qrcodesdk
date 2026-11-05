import {describe, expect, test} from 'vitest';

import {
  type QRCodeDataImageURL,
  QRCodeSVGRenderer,
  type QRCodeSVGRendererOptions,
  qrcode,
  svgCenterImage,
} from '../src';
import {ɵtoQRCodePathData as toQRCodePathData} from '../src/internal';
import type {PreparedShapePath} from '../src/shape-path';
import {alignment, circle, customShape, finder, rounded} from '../src/style';
import {fromRows} from './helpers';

function paths(svg: string): string[] {
  return [...svg.matchAll(/ d="([^"]*)"/g)].map((match) => match[1]!);
}

describe('SVG path data', () => {
  test.each([1, 10, 40] as const)(
    'renders generated and caller-supplied matrices identically at version %i',
    (version) => {
      const matrix = qrcode('A').options({version, mask: 0}).matrix();
      const copy = {...matrix, modules: [...matrix.modules], roles: [...matrix.roles]};
      const options: QRCodeSVGRendererOptions[] = [
        {},
        {style: {quietZone: 0, moduleSize: 3, foreground: '#12345680'}},
        {style: {modules: rounded(), finder: finder(), alignment: alignment()}},
        {style: {modules: circle()}},
        {centerImage: svgCenterImage('data:image/png;base64,a')},
      ];
      for (const option of options) {
        const render = QRCodeSVGRenderer(option);
        const expected = render(copy);
        expect(render(matrix)).toBe(expected);
        expect(render(copy)).toBe(expected);
      }
      expect(Object.isFrozen(matrix.modules)).toBe(true);
      expect(Object.isFrozen(matrix.roles)).toBe(true);
    },
  );

  test('chains rectangles with relative moves', () => {
    const svg = QRCodeSVGRenderer({style: {quietZone: 0}})(
      fromRows([
        [1, 0],
        [0, 1],
      ]),
    );

    expect(paths(svg)[1]).toBe('m0 0h1v1h-1zm1 1h1v1h-1z');
    expect(svg).toContain('shape-rendering="crispEdges"');
  });

  test('keeps fractional and large rectangles distinct from cached module commands', () => {
    const layer = {
      color: '#000000' as const,
      tiles: [],
      rects: [0, 0, 1, 1, 1.5, 2.5, 0.25, 0.75, 1000, 2, 1000, 1000, -2.5, -3, 2, 2],
    };
    const expected =
      'm0 0h1v1h-1zm1.5 2.5h0.25v0.75h-0.25zm998.5 -0.5h1000v1000h-1000zm-1002.5 -5h2v2h-2z';
    expect(toQRCodePathData(layer)).toBe(expected);
    expect(toQRCodePathData(layer)).toBe(expected);
  });

  test('merges equal runs in consecutive rows into one rectangle', () => {
    const svg = QRCodeSVGRenderer({style: {quietZone: 1}})(
      fromRows([
        [1, 1],
        [1, 1],
      ]),
    );

    expect(paths(svg)[1]).toBe('m1 1h2v2h-2z');
  });

  test('serializes repeated shaped modules to identical relative text', () => {
    const dot = (circle().module as unknown as PreparedShapePath).data;
    const svg = QRCodeSVGRenderer({style: {quietZone: 0, modules: circle()}})(
      fromRows([
        [1, 0, 1],
        [0, 0, 0],
        [1, 0, 0],
      ]),
    );

    // After a dot closes, the current point is its start, half a module to the right.
    expect(paths(svg)[1]).toBe(`m0 0${dot}m1.5 0${dot}m-2.5 2${dot}`);
    expect(svg).not.toContain('shape-rendering');
  });

  test('uses the neighbor-specific path for each module', () => {
    const shape = rounded();
    const tiles = shape.module as unknown as readonly PreparedShapePath[];
    const [, layer] = paths(
      QRCodeSVGRenderer({style: {quietZone: 0, modules: shape}})(
        fromRows([
          [1, 1],
          [0, 0],
        ]),
      ),
    );

    expect(layer).toBe(`m0 0${tiles[0b10]!.data}m0.5 0${tiles[0b01]!.data}`);
  });

  test('tracks relative subpaths with signed and exponential coordinates', () => {
    const tile = 'm+1e-1,+.2h.2v.2h-.2zm.3-.1h.1v.1h-.1z';
    const svg = QRCodeSVGRenderer({style: {quietZone: 0, modules: customShape({module: tile})}})(
      fromRows([
        [1, 1],
        [0, 0],
      ]),
    );
    expect(paths(svg)[1]).toBe(`m0 0${tile}m0.6 -0.1${tile}`);
  });

  test('keeps move rounding from accumulating across repeated high-precision tiles', () => {
    const offset = 0.123456789;
    const data = toQRCodePathData({
      color: '#000000',
      rects: [],
      tiles: [
        [
          customShape({module: `m${offset} ${offset}h.1v.1h-.1z`})
            .module as unknown as PreparedShapePath,
          Array.from({length: 512}, (_, index) =>
            index % 2 === 0 ? Math.floor(index / 2) % 16 : Math.floor(index / 32),
          ),
        ],
      ],
    });
    const moves = [...data.matchAll(/m([-\d.]+) ([-\d.]+)/g)];
    let x = 0;
    let y = 0;
    for (let index = 0; index < moves.length; index++) {
      x += +moves[index]![1]!;
      y += +moves[index]![2]!;
      if (index % 2 === 0) continue;
      const tile = Math.floor(index / 2);
      expect(Math.abs(x - ((tile % 16) + offset))).toBeLessThanOrEqual(0.00000051);
      expect(Math.abs(y - (Math.floor(tile / 16) + offset))).toBeLessThanOrEqual(0.00000051);
    }
  });

  test('preserves antialiasing for custom fractional paths', () => {
    const svg = QRCodeSVGRenderer({
      style: {modules: customShape({module: 'm.5 .5h.5v.5h-.5z'})},
    })(fromRows([[1]]));
    expect(svg).not.toContain('shape-rendering');
  });

  test('writes RGBA colors as fill opacity and finder parts as their own layer', () => {
    const svg = QRCodeSVGRenderer({
      style: {foreground: '#11223380', finder: finder({color: '#AA0000'})},
    })(qrcode('layers').matrix());
    const fills = [...svg.matchAll(/<path fill="([^"]+)"( fill-opacity="[^"]+")?/g)].map(
      ([, fill, opacity]) => `${fill}${opacity ?? ''}`,
    );

    expect(fills).toEqual(['#ffffff', '#aa0000', '#112233 fill-opacity="0.501961"']);
  });
});

describe('svgCenterImage', () => {
  test('accepts original factory values', () => {
    const image = svgCenterImage('data:image/png;base64,a');
    expect(Object.isFrozen(image)).toBe(true);
    expect(() => QRCodeSVGRenderer({centerImage: image})).not.toThrow();
  });

  test('adds the image and clears modules instead of masking them', () => {
    const source = 'data:image/png;base64,iVBORw0KGgo=' as const;
    const matrix = qrcode('center image').errorCorrection('H').matrix();
    const plain = QRCodeSVGRenderer({style: {quietZone: 0}})(matrix);
    const svg = QRCodeSVGRenderer({
      style: {quietZone: 0},
      centerImage: svgCenterImage(source, {size: 0.2, padding: 0}),
    })(matrix);

    expect(svg).toContain(`<image href="${source}" x="10" y="10" width="5" height="5"`);
    expect(svg).not.toContain('<mask');
    expect(paths(svg)[1]).not.toBe(paths(plain)[1]);
  });

  test('validates data URL content when the image is created', () => {
    for (const source of [
      'data:image/png;base64,',
      'http:image/png,AAAA',
      'https://example.com/image/png,AAAA',
    ]) {
      expect(() => svgCenterImage(source as QRCodeDataImageURL)).toThrowError(
        expect.objectContaining({code: 'INVALID_IMAGE_SOURCE'}),
      );
    }
  });
});
