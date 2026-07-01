import {describe, expect, test} from 'vitest';

import {QR_CODE_TEST_FIXTURES} from '../../src';
import {renderFixtureSvg} from './svg-fixture';
import {decodeSvgQRCode} from './svg-helpers';

describe('SVG QR roundtrips', () => {
  test.each(QR_CODE_TEST_FIXTURES)('decodes $name SVG output', async (fixture) => {
    await expect(decodeSvgQRCode(renderFixtureSvg(fixture))).resolves.toBe(fixture.data);
  });

  test('decodes custom high-contrast color SVG output', async () => {
    const svg = renderFixtureSvg(QR_CODE_TEST_FIXTURES[1], {
      size: 8,
      margin: 4,
      colors: {
        colorLight: '#fefefe',
        colorDark: '#101010',
      },
    });

    await expect(decodeSvgQRCode(svg)).resolves.toBe(QR_CODE_TEST_FIXTURES[1].data);
  });
});
