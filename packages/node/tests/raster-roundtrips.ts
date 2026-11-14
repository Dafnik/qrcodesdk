import {
  encodeFixturePNG,
  fixtureMatrixOptions,
  fixtureMicroMatrixOptions,
  fixtureRMQRMatrixOptions,
} from '@repo/core-testing';
import {
  QR_CODE_CENTER_IMAGE_FIXTURES,
  QR_CODE_MICRO_STYLE_VARIANT_FIXTURES,
  QR_CODE_MICRO_TEST_FIXTURES,
  QR_CODE_RMQR_STYLE_VARIANT_FIXTURES,
  QR_CODE_RMQR_TEST_FIXTURES,
  QR_CODE_ROUNDTRIP_TEST_FIXTURES,
  QR_CODE_STYLE_VARIANT_FIXTURES,
  QR_CODE_STYLING_FIXTURES,
} from '@repo/core-testing';
import {describe, expect, test} from 'vitest';

import {type QRCodeRenderer, qrcode} from '@qrcodesdk/core';

import {type QRCodeRasterRendererOptions, rasterCenterImage} from '../src';
import {decodeRasterMicroQRCode, decodeRasterQRCode, decodeRasterRMQRCode} from './raster-helpers';

/**
 * Scans every fixture rendered by one raster renderer, except the named styling fixtures that ZXing
 * cannot read in this format.
 */
export function describeRasterRoundtrips(
  format: string,
  createRenderer: (options: QRCodeRasterRendererOptions) => QRCodeRenderer<Buffer>,
  scannerSensitiveFixtures: ReadonlySet<string> = new Set(),
): void {
  const stylingFixtures = QR_CODE_STYLING_FIXTURES.filter(
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

    test.each(QR_CODE_ROUNDTRIP_TEST_FIXTURES)(
      `decodes $name ${format} output`,
      async (fixture) => {
        await expect(
          decodeRasterQRCode(
            qrcode(fixture.payload).options(fixtureMatrixOptions(fixture)).render(defaultRenderer),
          ),
        ).resolves.toBe(fixture.payload);
      },
    );

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

    // Micro QR and rMQR fixtures keep the default quiet zone of 2 modules.
    const smallSymbolRenderer = createRenderer({style: {moduleSize: 4}});

    test.each(QR_CODE_MICRO_TEST_FIXTURES)(
      `decodes $name ${format} Micro QR output`,
      async (fixture) => {
        await expect(
          decodeRasterMicroQRCode(
            qrcode(fixture.payload)
              .options(fixtureMicroMatrixOptions(fixture))
              .render(smallSymbolRenderer),
          ),
        ).resolves.toMatchObject({text: fixture.payload, version: fixture.version});
      },
    );

    test.each(QR_CODE_MICRO_STYLE_VARIANT_FIXTURES)(
      `decodes $name ${format} Micro QR style variant`,
      async (fixture) => {
        await expect(
          decodeRasterMicroQRCode(
            qrcode(fixture.payload)
              .options(fixture.matrixOptions)
              .render(createRenderer({style: fixture.styling})),
          ),
        ).resolves.toMatchObject({text: fixture.payload});
      },
    );

    test.each(QR_CODE_RMQR_TEST_FIXTURES)(
      `decodes $name ${format} rMQR output`,
      async (fixture) => {
        await expect(
          decodeRasterRMQRCode(
            qrcode(fixture.payload)
              .options(fixtureRMQRMatrixOptions(fixture))
              .render(smallSymbolRenderer),
          ),
        ).resolves.toMatchObject({text: fixture.payload, version: fixture.symbol});
      },
    );

    test.each(QR_CODE_RMQR_STYLE_VARIANT_FIXTURES)(
      `decodes $name ${format} rMQR style variant`,
      async (fixture) => {
        await expect(
          decodeRasterRMQRCode(
            qrcode(fixture.payload)
              .options(fixture.matrixOptions)
              .render(createRenderer({style: fixture.styling})),
          ),
        ).resolves.toMatchObject({text: fixture.payload, version: fixture.symbol});
      },
    );
  });
}
