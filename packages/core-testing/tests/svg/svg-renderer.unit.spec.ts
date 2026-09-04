import {describe, expect, test} from 'vitest';

import {QRCodeError, QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

import {extractPaths, extractSvgAttrs} from './svg-helpers';

describe('QRCodeSVGRenderer', () => {
  test('renders default square geometry with the production dimensions', () => {
    const svg = QRCodeSVGRenderer({style: {moduleSize: 2, quietZone: 1}})([[1]]);
    expect(extractSvgAttrs(svg)).toMatchObject({width: '6', height: '6', viewBox: '0 0 3 3'});
    expect(extractPaths(svg)).toHaveLength(2);
    expect(svg).toContain('shape-rendering="crispEdges"');
  });

  test('renders every visual concern through nested style groups', () => {
    const svg = qrcode('style').render(
      QRCodeSVGRenderer({
        style: {
          foreground: '#123456',
          background: '#abcdef80',
          modules: {shape: 'diagonal-rounded', color: '#234567'},
          finder: {
            outer: {shape: 'extra-rounded', color: '#345678'},
            center: {shape: 'circle', color: '#456789'},
          },
        },
      }),
    );
    expect(svg).toContain('fill="#abcdef" fill-opacity="0.501961"');
    expect(svg).toContain('fill="#234567"');
    expect(svg).toContain('fill="#345678"');
    expect(svg).toContain('fill="#456789"');
    expect(svg).not.toContain('shape-rendering');
  });

  test('uses native SVG accessibility and escapes content', () => {
    const svg = QRCodeSVGRenderer({
      accessibility: {ariaLabel: 'Scan "A&B"', title: '<code>'},
    })([[1]]);
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-label="Scan &quot;A&amp;B&quot;"');
    expect(svg).toContain('<title>&lt;code&gt;</title>');
    expect(QRCodeSVGRenderer()([[1]])).toContain('aria-hidden="true"');
  });

  test('validates embedded image sources at construction', () => {
    expect(() =>
      QRCodeSVGRenderer({image: {source: 'https://example.com/logo.png' as never}}),
    ).toThrowError(expect.objectContaining<Partial<QRCodeError>>({code: 'INVALID_IMAGE_SOURCE'}));
  });
});
