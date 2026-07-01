import {describe, expect, test} from 'vitest';

import {QR_CODE_TEST_FIXTURES} from '@qrcodesdk/core-testing';

import {renderFixturePng} from './png-fixture';
import {decodePngQRCode} from './png-helpers';

describe('PNG QR roundtrips', () => {
  test.each(QR_CODE_TEST_FIXTURES)('decodes $name PNG output', (fixture) => {
    expect(decodePngQRCode(renderFixturePng(fixture))).toBe(fixture.data);
  });

  test('decodes custom high-contrast color PNG output', () => {
    const png = renderFixturePng(QR_CODE_TEST_FIXTURES[1], {
      size: 8,
      margin: 4,
      colors: {
        colorLight: '#fefefe',
        colorDark: '#101010',
      },
    });

    expect(decodePngQRCode(png)).toBe(QR_CODE_TEST_FIXTURES[1].data);
  });
});
