import {
  QR_CODE_STYLING_FIXTURES,
  QR_CODE_TEST_FIXTURES,
  ɵZXING_UNSUPPORTED_STYLING_FIXTURE_NAMES,
} from '@repo/core-testing';
import {describe, test} from 'vitest';

import {qrcode} from '@qrcodesdk/core';

import {QRCodeCanvasRenderer} from '../src';
import {
  ROUNDTRIP_COMBINATIONS_BOTH_DECODERS_ONE,
  ROUNDTRIP_COMBINATIONS_ZXING_ONLY_ONE,
  expectCanvasQRCodeToDecode,
} from './helper';

describe('QRCodeCanvasRenderer', () => {
  test('decodes output with a small prepared image overlay', async () => {
    const logo = document.createElement('canvas');
    logo.width = 8;
    logo.height = 4;
    const context = logo.getContext('2d')!;
    context.fillStyle = '#dc2626';
    context.fillRect(0, 0, logo.width, logo.height);

    await expectCanvasQRCodeToDecode(
      qrcode('prepared browser image')
        .errorCorrection('H')
        .render(
          QRCodeCanvasRenderer({
            size: 4,
            margin: 4,
            image: {source: logo, size: 0.16, padding: 0.25},
          }),
        ),
      'prepared browser image',
    );
  });

  const defaultRenderer = QRCodeCanvasRenderer({size: 4, margin: 4});
  const zxingUnsupportedStylingFixtureNames = new Set<string>(
    ɵZXING_UNSUPPORTED_STYLING_FIXTURE_NAMES,
  );
  const stylingFixturesBothDecoders = QR_CODE_STYLING_FIXTURES.filter(
    ({name}) => !zxingUnsupportedStylingFixtureNames.has(name),
  );
  const stylingFixturesJsQROnly = QR_CODE_STYLING_FIXTURES.filter(({name}) =>
    zxingUnsupportedStylingFixtureNames.has(name),
  );

  test.each(QR_CODE_TEST_FIXTURES)('decodes $name canvas output', async (fixture) => {
    await expectCanvasQRCodeToDecode(
      qrcode().data(fixture.data).config(fixture).render(defaultRenderer),
      fixture.data,
    );
  });

  test.each(ROUNDTRIP_COMBINATIONS_BOTH_DECODERS_ONE)(
    'decodes $name canvas output',
    async (fixture) => {
      await expectCanvasQRCodeToDecode(
        qrcode(fixture.data).config(fixture).render(defaultRenderer),
        fixture.data,
      );
    },
  );

  test.each(ROUNDTRIP_COMBINATIONS_ZXING_ONLY_ONE)(
    'decodes $name canvas output with ZXing',
    async (fixture) => {
      await expectCanvasQRCodeToDecode(
        qrcode(fixture.data).config(fixture).render(defaultRenderer),
        fixture.data,
        ['ZXing'],
      );
    },
  );

  test.each(stylingFixturesBothDecoders)(
    'decodes $name canvas styling fixture',
    async (fixture) => {
      await expectCanvasQRCodeToDecode(
        qrcode(fixture.data)
          .config(fixture.matrixOptions)
          .render(QRCodeCanvasRenderer(fixture.styling)),
        fixture.data,
      );
    },
  );

  test.each(stylingFixturesJsQROnly)(
    'decodes $name canvas styling fixture with jsQR (ZXing limitation)',
    async (fixture) => {
      await expectCanvasQRCodeToDecode(
        qrcode(fixture.data)
          .config(fixture.matrixOptions)
          .render(QRCodeCanvasRenderer(fixture.styling)),
        fixture.data,
        ['jsQR'],
      );
    },
  );
});
