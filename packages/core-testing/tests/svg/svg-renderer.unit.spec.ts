import {describe, expect, test} from 'vitest';

import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';
import {circle, diagonal, finder, rounded} from '@qrcodesdk/core/style';

import {matrixFromRows} from '../../src';
import {extractPaths, extractSvgAttrs} from './svg-helpers';

describe('QRCodeSVGRenderer', () => {
  test('includes the quiet zone in the SVG dimensions', () => {
    const svg = QRCodeSVGRenderer({style: {moduleSize: 2, quietZone: 1}})(matrixFromRows([[1]]));
    expect(extractSvgAttrs(svg)).toMatchObject({width: '6', height: '6', viewBox: '0 0 3 3'});
    expect(extractPaths(svg)).toHaveLength(2);
    expect(svg).toContain('shape-rendering="crispEdges"');
  });

  test('renders RGBA backgrounds and separate module and finder colors', () => {
    const svg = qrcode('style').render(
      QRCodeSVGRenderer({
        style: {
          foreground: '#123456',
          background: '#abcdef80',
          modules: diagonal({radius: 1}),
          finder: finder({ring: rounded({radius: 1}), center: circle(), color: '#345678'}),
        },
      }),
    );
    expect(svg).toContain('fill="#abcdef" fill-opacity="0.501961"');
    expect(svg).toContain('fill="#123456"');
    expect(svg).toContain('fill="#345678"');
    expect(svg).not.toContain('shape-rendering');
  });

  test('uses native SVG accessibility and escapes content', () => {
    const svg = QRCodeSVGRenderer({
      accessibility: {ariaLabel: 'Scan "A&B"', title: '<code>'},
    })(matrixFromRows([[1]]));
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-label="Scan &quot;A&amp;B&quot;"');
    expect(svg).toContain('<title>&lt;code&gt;</title>');
    expect(QRCodeSVGRenderer()(matrixFromRows([[1]]))).toContain('aria-hidden="true"');
  });
});
