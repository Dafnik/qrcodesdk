import {describe, expect, test} from 'vitest';

import {QR_CODE_TEST_FIXTURES} from '../../src';
import {renderFixtureSvg} from './svg-fixture';
import {decodeSvgQRCode} from './svg-helpers';

describe('SVG QR roundtrips', () => {
  test.each(QR_CODE_TEST_FIXTURES)('decodes $name SVG output', (fixture) => {
    expect(decodeSvgQRCode(renderFixtureSvg(fixture))).toBe(fixture.data);
  });

  test('decodes custom high-contrast color SVG output', () => {
    const svg = renderFixtureSvg(QR_CODE_TEST_FIXTURES[1], {
      size: 8,
      margin: 4,
      colors: {
        colorLight: '#fefefe',
        colorDark: '#101010',
      },
    });

    expect(decodeSvgQRCode(svg)).toBe(QR_CODE_TEST_FIXTURES[1].data);
  });
});
