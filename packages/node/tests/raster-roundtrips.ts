import {encodeFixturePNG, fixtureMatrixOptions} from '@repo/core-testing';
import {
  QR_CODE_CENTER_IMAGE_FIXTURES,
  QR_CODE_STYLE_VARIANT_FIXTURES,
  QR_CODE_STYLING_ROUNDTRIP_FIXTURES,
  QR_CODE_TEST_FIXTURES,
} from '@repo/core-testing';
import {describe, expect, test} from 'vitest';

import {type QRCodeRenderer, qrcode} from '@qrcodesdk/core';

import {type QRCodeRasterRendererOptions, rasterCenterImage} from '../src';
import {decodeRasterQRCode} from './raster-helpers';

/**
 * Scans every fixture rendered by one raster renderer, except the named styling fixtures that jsQR
 * cannot read in this format.
 */
export function describeRasterRoundtrips(
  format: string,
  createRenderer: (options: QRCodeRasterRendererOptions) => QRCodeRenderer<Buffer>,
  scannerSensitiveFixtures: ReadonlySet<string> = new Set(),
): void {
  const stylingFixtures = QR_CODE_STYLING_ROUNDTRIP_FIXTURES.filter(
    ({name}) => !scannerSensitiveFixtures.has(name),
  );

  describe(`${format} QR roundtrips`, () => {
    test.each(QR_CODE_CENTER_IMAGE_FIXTURES)(
      `decodes $name ${format} center image fixture`,
      async (fixture) => {
        await expect(
          decodeRasterQRCode(
            qrcode(fixture.payload)
              .options(fixture.matrixOptions)
              .render(
                createRenderer({
                  style: fixture.style,
                  centerImage: rasterCenterImage(encodeFixturePNG(fixture.image), fixture.layout),
                }),
              ),
          ),
        ).resolves.toBe(fixture.payload);
      },
    );

    const defaultRenderer = createRenderer({style: {moduleSize: 4, quietZone: 4}});

    test.each(
      ['Grüße aus Wien', '東京 ✅🚀'].flatMap((payload) => [
        {payload, eci: false},
        {payload, eci: true},
      ]),
    )(`decodes UTF-8 ${format} output for $payload with ECI $eci`, async ({payload, eci}) => {
      await expect(
        decodeRasterQRCode(qrcode(payload).mode('octet').eci(eci).render(defaultRenderer)),
      ).resolves.toBe(payload);
    });

    test.each(QR_CODE_TEST_FIXTURES)(`decodes $name ${format} output`, async (fixture) => {
      await expect(
        decodeRasterQRCode(
          qrcode(fixture.payload).options(fixtureMatrixOptions(fixture)).render(defaultRenderer),
        ),
      ).resolves.toBe(fixture.payload);
    });

    test.each(stylingFixtures)(`decodes $name ${format} styling fixture`, async (fixture) => {
      await expect(
        decodeRasterQRCode(
          qrcode(fixture.payload)
            .options(fixture.matrixOptions)
            .render(createRenderer({style: fixture.styling})),
        ),
      ).resolves.toBe(fixture.payload);
    });

    test.each(QR_CODE_STYLE_VARIANT_FIXTURES)(
      `decodes $name ${format} style variant`,
      async (fixture) => {
        await expect(
          decodeRasterQRCode(
            qrcode(fixture.payload)
              .options(fixture.matrixOptions)
              .render(createRenderer({style: fixture.styling})),
          ),
        ).resolves.toBe(fixture.payload);
      },
    );
  });
}
