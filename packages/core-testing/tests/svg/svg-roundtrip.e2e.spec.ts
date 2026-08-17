import sharp from 'sharp';
import {describe, test} from 'vitest';

import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

import {
  QR_CODE_STYLING_FIXTURES,
  QR_CODE_TEST_FIXTURES,
  getAllQRCodeCombinations,
  ɵZXING_UNSUPPORTED_STYLING_FIXTURE_NAMES,
} from '../../src';
import {expectSvgQRCodeToDecode} from './svg-helpers';

/**
 * Version 23/L QR codes always fail to decode with jsQR
 * https://github.com/cozmo/jsQR/issues/251
 */
const ROUNDTRIP_COMBINATIONS = [...getAllQRCodeCombinations()];
const ROUNDTRIP_COMBINATIONS_BOTH_DECODERS = ROUNDTRIP_COMBINATIONS.filter(
  ({version, errorCorrectionLevel}) => version !== 23 || errorCorrectionLevel !== 'L',
);
const ROUNDTRIP_COMBINATIONS_ZXING_ONLY = ROUNDTRIP_COMBINATIONS.filter(
  ({version, errorCorrectionLevel}) => version === 23 && errorCorrectionLevel === 'L',
);
describe('SVG QR roundtrips', () => {
  test('decodes SVG output with a small prepared image overlay', async () => {
    const logo = await sharp({
      create: {
        width: 4,
        height: 4,
        channels: 4,
        background: {r: 220, g: 38, b: 38, alpha: 1},
      },
    })
      .png()
      .toBuffer();
    const source = `data:image/png;base64,${logo.toString('base64')}` as const;

    await expectSvgQRCodeToDecode(
      qrcode('prepared SVG image')
        .errorCorrection('H')
        .render(
          QRCodeSVGRenderer({
            size: 4,
            margin: 4,
            image: {source, size: 0.16, padding: 0.25},
          }),
        ),
      'prepared SVG image',
    );
  });

  const testSVGRenderer = QRCodeSVGRenderer({size: 4, margin: 4});
  const zxingUnsupportedStylingFixtureNames = new Set<string>(
    ɵZXING_UNSUPPORTED_STYLING_FIXTURE_NAMES,
  );
  const stylingFixturesBothDecoders = QR_CODE_STYLING_FIXTURES.filter(
    ({name}) => !zxingUnsupportedStylingFixtureNames.has(name),
  );
  const stylingFixturesJsQROnly = QR_CODE_STYLING_FIXTURES.filter(({name}) =>
    zxingUnsupportedStylingFixtureNames.has(name),
  );

  test.each(['ABCDE12345678?A1A', 'ABé12345678901234567890', 'AB✅🚀12345678901234567890'])(
    'decodes automatic mixed-mode SVG output for %s',
    async (data) => {
      await expectSvgQRCodeToDecode(qrcode(data).render(testSVGRenderer), data);
    },
  );

  test.each(
    ['Grüße aus Wien', '東京 ✅🚀'].flatMap((data) => [
      {data, eci: false},
      {data, eci: true},
    ]),
  )('decodes forced UTF-8 octet SVG output for $data with ECI $eci', async ({data, eci}) => {
    await expectSvgQRCodeToDecode(
      qrcode(data).mode('octet').eci(eci).render(testSVGRenderer),
      data,
    );
  });

  test.each(QR_CODE_TEST_FIXTURES)('decodes $name SVG output', async (fixture) => {
    await expectSvgQRCodeToDecode(
      qrcode(fixture.data).config(fixture).render(testSVGRenderer),
      fixture.data,
    );
  });

  test.each(ROUNDTRIP_COMBINATIONS_BOTH_DECODERS)('decodes $name SVG output', async (fixture) => {
    await expectSvgQRCodeToDecode(
      qrcode(fixture.data).config(fixture).render(testSVGRenderer),
      fixture.data,
    );
  });

  test.each(ROUNDTRIP_COMBINATIONS_ZXING_ONLY)(
    'decodes $name SVG output with ZXing',
    async (fixture) => {
      await expectSvgQRCodeToDecode(
        qrcode(fixture.data).config(fixture).render(testSVGRenderer),
        fixture.data,
        ['ZXing'],
      );
    },
  );

  test.each(stylingFixturesBothDecoders)('decodes $name SVG styling fixture', async (fixture) => {
    await expectSvgQRCodeToDecode(
      qrcode(fixture.data).config(fixture.matrixOptions).render(QRCodeSVGRenderer(fixture.styling)),
      fixture.data,
    );
  });

  test.each(stylingFixturesJsQROnly)(
    'decodes $name SVG styling fixture with jsQR (ZXing limitation)',
    async (fixture) => {
      await expectSvgQRCodeToDecode(
        qrcode(fixture.data)
          .config(fixture.matrixOptions)
          .render(QRCodeSVGRenderer(fixture.styling)),
        fixture.data,
        ['jsQR'],
      );
    },
  );
});
