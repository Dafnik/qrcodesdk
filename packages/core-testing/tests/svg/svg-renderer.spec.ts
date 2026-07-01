import {describe, expect, test} from 'vitest';

import {QRCodeMatrix, SVGQRCodeRenderer} from '@qrcodesdk/core';

import {extractRects, extractSvgAttrs} from './svg-helpers';

function countDarkModules(matrix: QRCodeMatrix): number {
  return matrix.flat().filter(Boolean).length;
}

describe('SVGQRCodeRenderer', () => {
  test('renders default SVG geometry from a hand-authored matrix', () => {
    const matrix: QRCodeMatrix = [
      [1, 0],
      [0, 1],
    ];
    const svg = SVGQRCodeRenderer()(matrix);
    const svgAttrs = extractSvgAttrs(svg);
    const rects = extractRects(svg);

    expect(svgAttrs.xmlns).toBe('http://www.w3.org/2000/svg');
    expect(svgAttrs.width).toBe('50');
    expect(svgAttrs.height).toBe('50');

    expect(rects[0].attrs).toEqual({
      width: '50',
      height: '50',
      fill: '#ffffff',
    });
    expect(rects.slice(1)).toHaveLength(countDarkModules(matrix));
    expect(rects[1].attrs).toMatchObject({
      x: '20',
      y: '20',
      width: '5.3',
      height: '5.3',
      fill: '#000000',
    });
    expect(rects[2].attrs).toMatchObject({
      x: '25',
      y: '25',
      width: '5.3',
      height: '5.3',
      fill: '#000000',
    });
  });

  test('renders custom sizing, margin, colors, and accessibility attributes', () => {
    const matrix: QRCodeMatrix = [
      [0, 1, 0],
      [1, 0, 1],
      [0, 0, 0],
    ];
    const svg = SVGQRCodeRenderer({
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
    const rects = extractRects(svg);

    expect(svgAttrs).toMatchObject({
      width: '15',
      height: '15',
      alt: 'QR alt',
      'aria-label': 'QR aria',
      title: 'QR title',
    });
    expect(rects[0].attrs.fill).toBe('#eeeeee');
    expect(rects.slice(1)).toHaveLength(3);
    expect(rects.slice(1).map((rect) => rect.attrs.fill)).toEqual([
      '#111111',
      '#111111',
      '#111111',
    ]);
    expect(rects.slice(1).map((rect) => [rect.attrs.x, rect.attrs.y])).toEqual([
      ['6', '3'],
      ['3', '6'],
      ['9', '6'],
    ]);
    expect(rects[1].attrs.width).toBe('3.3');
    expect(rects[1].attrs.height).toBe('3.3');
  });

  test('renders only a background rect when the matrix has no dark modules', () => {
    const svg = SVGQRCodeRenderer({size: 2, margin: 0})([
      [0, 0],
      [0, 0],
    ]);

    expect(extractRects(svg)).toHaveLength(1);
    expect(extractRects(svg)[0].attrs).toEqual({
      width: '4',
      height: '4',
      fill: '#ffffff',
    });
  });
});
