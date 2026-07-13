import {describe, expect, test} from 'vitest';

import {QRCodeMatrix, QRCodeSVGRenderer} from '@qrcodesdk/core';

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
      stroke: '#000000',
      d: 'M4 4.5h1M5 5.5h1',
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
      stroke: '#111111',
      d: 'M2 1.5h1M1 2.5h1m1 0h1',
    });
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
});
