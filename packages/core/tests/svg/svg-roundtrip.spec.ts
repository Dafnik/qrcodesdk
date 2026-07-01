import {describe, expect, test} from 'vitest';

import {SVG_QR_FIXTURES, renderFixtureSvg} from './svg-fixtures';
import {decodeSvgQRCode} from './svg-helpers';

describe('SVG QR roundtrips', () => {
  test.each(SVG_QR_FIXTURES)('decodes $name SVG output', (fixture) => {
    expect(decodeSvgQRCode(renderFixtureSvg(fixture))).toBe(fixture.data);
  });

  test('decodes custom high-contrast color SVG output', () => {
    const svg = renderFixtureSvg(SVG_QR_FIXTURES[1], {
      size: 8,
      margin: 4,
      colors: {
        colorLight: '#fefefe',
        colorDark: '#101010',
      },
    });

    expect(decodeSvgQRCode(svg)).toBe(SVG_QR_FIXTURES[1].data);
  });
});
