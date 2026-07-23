import {QR_CODE_STYLING_FIXTURES, QR_CODE_TEST_FIXTURES} from '@repo/core-testing';
import {describe, expect, test} from 'vitest';

import {qrcode} from '@qrcodesdk/core';

import {QRCodePNGRenderer} from '../../src';
import {decodePngQRCode} from './png-helpers';

describe('PNG QR roundtrips', () => {
  test.each(QR_CODE_TEST_FIXTURES)('decodes $name PNG output', (fixture) => {
    expect(
      decodePngQRCode(
        qrcode(fixture.data)
          .config(fixture)
          .render(QRCodePNGRenderer({size: 8, margin: 4})),
      ),
    ).toBe(fixture.data);
  });

  test.each(QR_CODE_STYLING_FIXTURES)('decodes $name PNG styling fixture', (fixture) => {
    expect(
      decodePngQRCode(
        qrcode(fixture.data)
          .config(fixture.matrixOptions)
          .render(QRCodePNGRenderer(fixture.styling)),
      ),
    ).toBe(fixture.data);
  });
});
