import {
  QR_CODE_STYLING_FIXTURES,
  QR_CODE_TEST_FIXTURES,
  ɵZXING_UNSUPPORTED_STYLING_FIXTURE_NAMES,
} from '@repo/core-testing';
import {PNG} from 'pngjs';
import {describe, test} from 'vitest';

import {qrcode} from '@qrcodesdk/core';

import {QRCodePNGRenderer} from '../../src';
import {expectPngQRCodeToDecode} from './png-helpers';

describe('PNG QR roundtrips', () => {
  test('decodes output with a small prepared PNG overlay', async () => {
    const logo = new PNG({width: 8, height: 4});
    for (let index = 0; index < logo.data.length; index += 4) {
      logo.data[index] = 220;
      logo.data[index + 1] = 38;
      logo.data[index + 2] = 38;
      logo.data[index + 3] = 255;
    }

    await expectPngQRCodeToDecode(
      qrcode('prepared Node image')
        .errorCorrection('H')
        .render(
          QRCodePNGRenderer({
            size: 4,
            margin: 4,
            image: {
              source: PNG.sync.write(logo),
              size: 0.16,
              padding: 0.25,
            },
          }),
        ),
      'prepared Node image',
    );
  });

  const defaultRenderer = QRCodePNGRenderer({size: 4, margin: 4});
  const zxingUnsupportedStylingFixtureNames = new Set<string>(
    ɵZXING_UNSUPPORTED_STYLING_FIXTURE_NAMES,
  );
  const stylingFixturesBothDecoders = QR_CODE_STYLING_FIXTURES.filter(
    ({name}) => !zxingUnsupportedStylingFixtureNames.has(name),
  );
  const stylingFixturesJsQROnly = QR_CODE_STYLING_FIXTURES.filter(({name}) =>
    zxingUnsupportedStylingFixtureNames.has(name),
  );

  test.each(
    ['Grüße aus Wien', '東京 ✅🚀'].flatMap((data) => [
      {data, eci: false},
      {data, eci: true},
    ]),
  )('decodes UTF-8 PNG output for $data with ECI $eci', async ({data, eci}) => {
    await expectPngQRCodeToDecode(
      qrcode(data).mode('octet').eci(eci).render(defaultRenderer),
      data,
    );
  });

  test.each(QR_CODE_TEST_FIXTURES)('decodes $name PNG output', async (fixture) => {
    await expectPngQRCodeToDecode(
      qrcode(fixture.data).config(fixture).render(defaultRenderer),
      fixture.data,
    );
  });

  test.each(stylingFixturesBothDecoders)('decodes $name PNG styling fixture', async (fixture) => {
    await expectPngQRCodeToDecode(
      qrcode(fixture.data).config(fixture.matrixOptions).render(QRCodePNGRenderer(fixture.styling)),
      fixture.data,
    );
  });

  test.each(stylingFixturesJsQROnly)(
    'decodes $name PNG styling fixture with jsQR (ZXing limitation)',
    async (fixture) => {
      await expectPngQRCodeToDecode(
        qrcode(fixture.data)
          .config(fixture.matrixOptions)
          .render(QRCodePNGRenderer(fixture.styling)),
        fixture.data,
        ['jsQR'],
      );
    },
  );
});
