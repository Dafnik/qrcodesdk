import {QR_CODE_TEST_FIXTURES} from '@repo/core-testing';
import {describe, expect, test} from 'vitest';

import {qrcode} from '@qrcodesdk/core';
import type {QRCodeCornerDotType, QRCodeCornerSquareType, QRCodeDotType} from '@qrcodesdk/core';

import {QRCodePNGRenderer} from '../../src';
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

  test.each([
    'rounded',
    'dots',
    'classy',
    'classy-rounded',
    'square',
    'extra-rounded',
  ] satisfies QRCodeDotType[])('decodes %s data module styling', (type) => {
    expect(
      decodePngQRCode(
        qrcode('styled dots').render(QRCodePNGRenderer({size: 12, dotsOptions: {type}})),
      ),
    ).toBe('styled dots');
  });

  test.each([
    'dot',
    'square',
    'extra-rounded',
    'rounded',
    'dots',
    'classy',
    'classy-rounded',
  ] satisfies QRCodeCornerSquareType[])('decodes %s finder ring styling', (type) => {
    expect(
      decodePngQRCode(
        qrcode('styled finder ring').render(
          QRCodePNGRenderer({size: 12, cornersSquareOptions: {type}}),
        ),
      ),
    ).toBe('styled finder ring');
  });

  test.each([
    'dot',
    'square',
    'rounded',
    'classy',
    'classy-rounded',
    'extra-rounded',
  ] satisfies QRCodeCornerDotType[])('decodes %s finder center styling', (type) => {
    expect(
      decodePngQRCode(qrcode('A').render(QRCodePNGRenderer({size: 12, cornersDotOptions: {type}}))),
    ).toBe('A');
  });

  test('decodes mixed styles and independent feature colors', () => {
    expect(
      decodePngQRCode(
        qrcode('mixed styled png').render(
          QRCodePNGRenderer({
            size: 12,
            dotsOptions: {color: '#112233', type: 'classy-rounded'},
            cornersSquareOptions: {color: '#445566', type: 'extra-rounded'},
            cornersDotOptions: {color: '#778899', type: 'dot'},
          }),
        ),
      ),
    ).toBe('mixed styled png');
  });
});
