import {describe, expect, test} from 'vitest';

import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';
import type {QRCodeMatrix} from '@qrcodesdk/core';

import {extractPaths, extractSvgAttrs} from './svg-helpers';

describe('QRCodeSVGRenderer', () => {
  test('renders default SVG geometry from a hand-authored matrix', () => {
    const matrix: QRCodeMatrix = [
      [1, 0],
      [0, 1],
    ];
    const svg = QRCodeSVGRenderer()(matrix);
    const svgAttrs = extractSvgAttrs(svg);
    const paths = extractPaths(svg);

    expect(svgAttrs.xmlns).toBe('http://www.w3.org/2000/svg');
    expect(svgAttrs.width).toBe('50');
    expect(svgAttrs.height).toBe('50');
    expect(svgAttrs.viewBox).toBe('0 0 10 10');
    expect(svgAttrs['shape-rendering']).toBe('crispEdges');

    expect(paths[0].attrs).toEqual({
      fill: '#ffffff',
      d: 'M0 0h10v10H0z',
    });
    expect(paths[1].attrs).toEqual({
      fill: '#000000',
      'fill-rule': 'evenodd',
      d: 'M4 4h1v1h-1ZM5 5h1v1h-1Z',
    });
  });

  test('renders custom sizing, margin, colors, and accessibility attributes', () => {
    const matrix: QRCodeMatrix = [
      [0, 1, 0],
      [1, 0, 1],
      [0, 0, 0],
    ];
    const svg = QRCodeSVGRenderer({
      size: 3,
      margin: 1,
      colors: {
        colorLight: '#eeeeee',
        colorDark: '#111111',
      },
      alt: 'QR alt',
      ariaLabel: 'QR aria',
      title: 'QR title',
    })(matrix);
    const svgAttrs = extractSvgAttrs(svg);
    const paths = extractPaths(svg);

    expect(svgAttrs).toMatchObject({
      width: '15',
      height: '15',
      viewBox: '0 0 5 5',
      'shape-rendering': 'crispEdges',
      alt: 'QR alt',
      'aria-label': 'QR aria',
      title: 'QR title',
    });
    expect(paths).toHaveLength(2);
    expect(paths[0].attrs).toEqual({
      fill: '#eeeeee',
      d: 'M0 0h5v5H0z',
    });
    expect(paths[1].attrs).toEqual({
      fill: '#111111',
      'fill-rule': 'evenodd',
      d: 'M2 1h1v1h-1ZM1 2h1v1h-1ZM3 2h1v1h-1Z',
    });
  });

  test('compacts horizontal cells and vertically identical runs into filled rectangles', () => {
    const svg = QRCodeSVGRenderer({size: 1, margin: 0})([
      [1, 1, 0, 1],
      [1, 1, 0, 1],
      [1, 1, 1, 1],
    ]);
    const foreground = extractPaths(svg)[1]!;

    expect(foreground.attrs.stroke).toBeUndefined();
    expect(foreground.attrs).toEqual({
      fill: '#000000',
      'fill-rule': 'evenodd',
      d: 'M0 0h2v2h-2ZM3 0h1v2h-1ZM0 2h4v1h-4Z',
    });
  });

  test('compacts square finder centers and keeps square finder rings as border bars', () => {
    const svg = qrcode('A').render(
      QRCodeSVGRenderer({
        size: 1,
        margin: 0,
        dotsOptions: {color: '#112233'},
        cornersSquareOptions: {color: '#445566', type: 'square'},
        cornersDotOptions: {color: '#778899', type: 'square'},
      }),
    );
    const paths = extractPaths(svg);
    const ringPath = paths.find(({attrs}) => attrs.fill === '#445566')!;
    const centerPath = paths.find(({attrs}) => attrs.fill === '#778899')!;

    expect(ringPath.attrs['fill-rule']).toBe('evenodd');
    expect(ringPath.attrs.d.match(/M/g)).toHaveLength(12);
    expect(ringPath.attrs.d).toContain('M0 0h7v1h-7Z');
    expect(ringPath.attrs.d).toContain('M0 1h1v5h-1Z');
    expect(ringPath.attrs.d).toContain('M6 1h1v5h-1Z');
    expect(ringPath.attrs.d).toContain('M0 6h7v1h-7Z');
    expect(centerPath.attrs.d.match(/h3v3h-3Z/g)).toHaveLength(3);
  });

  test('escapes SVG accessibility attribute values', () => {
    const svg = QRCodeSVGRenderer({
      alt: 'Scan "A&B" <now>',
      ariaLabel: 'Open "docs" & examples',
      title: 'QR <title>',
    })([[1]]);

    expect(svg).toContain('alt="Scan &quot;A&amp;B&quot; &lt;now&gt;"');
    expect(svg).toContain('aria-label="Open &quot;docs&quot; &amp; examples"');
    expect(svg).toContain('title="QR &lt;title&gt;"');
  });

  test('renders only a background path when the matrix has no dark modules', () => {
    const svg = QRCodeSVGRenderer({size: 2, margin: 0})([
      [0, 0],
      [0, 0],
    ]);

    expect(extractPaths(svg)).toHaveLength(1);
    expect(extractPaths(svg)[0].attrs).toEqual({
      fill: '#ffffff',
      d: 'M0 0h2v2H0z',
    });
  });

  test('rejects invalid shared styling', () => {
    expect(() => QRCodeSVGRenderer({size: 1.5})([[1]])).toThrow(
      'QR code size must be a positive integer',
    );
    expect(() => QRCodeSVGRenderer({margin: -1})([[1]])).toThrow(
      'QR code margin must be a non-negative integer',
    );
    expect(() => QRCodeSVGRenderer({colors: {colorDark: '#abc'}})([[1]])).toThrow(
      'QR code colorDark must be a 6-digit hex color',
    );
  });

  test('renders independently colored curved module and finder paths', () => {
    const svg = qrcode('styled svg').render(
      QRCodeSVGRenderer({
        dotsOptions: {color: '#112233', type: 'rounded'},
        cornersSquareOptions: {color: '#445566', type: 'extra-rounded'},
        cornersDotOptions: {color: '#778899', type: 'dot'},
      }),
    );
    const paths = extractPaths(svg);

    expect(extractSvgAttrs(svg)['shape-rendering']).toBeUndefined();
    expect(paths.map(({attrs}) => attrs.fill)).toEqual([
      '#ffffff',
      '#112233',
      '#445566',
      '#778899',
    ]);
    expect(paths.slice(1).every(({attrs}) => attrs['fill-rule'] === 'evenodd')).toBe(true);
    expect(paths.slice(1).every(({attrs}) => attrs.stroke === undefined)).toBe(true);
    expect(paths[1]!.attrs.d).toMatch(/h\d+v\d+h-\d+Z/);
    expect(paths[1]!.attrs.d).toContain('A');
  });
});
