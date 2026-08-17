import {
  QR_CODE_STYLING_FIXTURES,
  QR_CODE_TEST_FIXTURES,
  ɵZXING_UNSUPPORTED_STYLING_FIXTURE_NAMES,
} from '@repo/core-testing';
import {describe, test} from 'vitest';

import {qrcode} from '@qrcodesdk/core';

import {QRCodeImageRenderer} from '../src';
import {
  ROUNDTRIP_COMBINATIONS_BOTH_DECODERS_TWO,
  ROUNDTRIP_COMBINATIONS_ZXING_ONLY_TWO,
  expectCanvasQRCodeToDecode,
  imageToCanvas,
} from './helper';

async function expectImageQRCodeToDecode(
  image: HTMLImageElement,
  expected: string,
  decoders?: readonly ('jsQR' | 'ZXing')[],
): Promise<void> {
  await expectCanvasQRCodeToDecode(await imageToCanvas(image), expected, decoders);
}

describe('QRCodeImageRenderer', () => {
  const defaultRenderer = QRCodeImageRenderer({size: 4, margin: 4});
  const zxingUnsupportedStylingFixtureNames = new Set<string>(
    ɵZXING_UNSUPPORTED_STYLING_FIXTURE_NAMES,
  );
  const stylingFixturesBothDecoders = QR_CODE_STYLING_FIXTURES.filter(
    ({name}) => !zxingUnsupportedStylingFixtureNames.has(name),
  );
  const stylingFixturesJsQROnly = QR_CODE_STYLING_FIXTURES.filter(({name}) =>
    zxingUnsupportedStylingFixtureNames.has(name),
  );

  test.each(QR_CODE_TEST_FIXTURES)('decodes $name image output', async (fixture) => {
    await expectImageQRCodeToDecode(
      qrcode().data(fixture.data).config(fixture).render(defaultRenderer),
      fixture.data,
    );
  });

  test.each(ROUNDTRIP_COMBINATIONS_BOTH_DECODERS_TWO)(
    'decodes $name image output',
    async (fixture) => {
      await expectImageQRCodeToDecode(
        qrcode(fixture.data).config(fixture).render(defaultRenderer),
        fixture.data,
      );
    },
  );

  test.each(ROUNDTRIP_COMBINATIONS_ZXING_ONLY_TWO)(
    'decodes $name image output with ZXing',
    async (fixture) => {
      await expectImageQRCodeToDecode(
        qrcode(fixture.data).config(fixture).render(defaultRenderer),
        fixture.data,
        ['ZXing'],
      );
    },
  );

  test.each(stylingFixturesBothDecoders)('decodes $name image styling fixture', async (fixture) => {
    const image = qrcode(fixture.data)
      .config(fixture.matrixOptions)
      .render(QRCodeImageRenderer(fixture.styling));

    await expectImageQRCodeToDecode(image, fixture.data);
  });

  test.each(stylingFixturesJsQROnly)(
    'decodes $name image styling fixture with jsQR (ZXing limitation)',
    async (fixture) => {
      const image = qrcode(fixture.data)
        .config(fixture.matrixOptions)
        .render(QRCodeImageRenderer(fixture.styling));

      await expectImageQRCodeToDecode(image, fixture.data, ['jsQR']);
    },
  );
});
