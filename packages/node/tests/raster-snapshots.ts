import {encodeFixturePNG, fixtureMatrixOptions} from '@repo/core-testing';
import {
  QR_CODE_CENTER_IMAGE_FIXTURES,
  QR_CODE_STYLE_VARIANT_FIXTURES,
  QR_CODE_STYLING_FIXTURES,
  QR_CODE_TEST_FIXTURES,
} from '@repo/core-testing';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, test} from 'vitest';

import {type QRCodeRenderer, qrcode} from '@qrcodesdk/core';

import {type QRCodeRasterRendererOptions, rasterCenterImage} from '../src';
import {type RasterFormat, expectRasterToMatchFileSnapshot} from './raster-helpers';

/** Compares every fixture rendered by one raster renderer with its tracked file snapshot. */
export function describeRasterSnapshots(
  format: RasterFormat,
  createRenderer: (options: QRCodeRasterRendererOptions) => QRCodeRenderer<Buffer>,
): void {
  const extension = format.toLowerCase();
  const snapshotDirectory = fileURLToPath(new URL(`__snapshots__/${extension}`, import.meta.url));

  describe(`${format} renderer snapshots`, () => {
    test.each(QR_CODE_TEST_FIXTURES)(`matches %s generated QR ${format} snapshot`, (fixture) => {
      expectRasterToMatchFileSnapshot(
        format,
        qrcode(fixture.payload)
          .options(fixtureMatrixOptions(fixture))
          .render(createRenderer({style: {moduleSize: 8, quietZone: 4}})),
        join(snapshotDirectory, `${fixture.name}.${extension}`),
      );
    });

    test.each(QR_CODE_STYLING_FIXTURES)(`matches $name ${format} styling snapshot`, (fixture) => {
      expectRasterToMatchFileSnapshot(
        format,
        qrcode(fixture.payload)
          .options(fixture.matrixOptions)
          .render(createRenderer({style: fixture.styling})),
        join(snapshotDirectory, 'styling', `${fixture.name}.${extension}`),
      );
    });

    test.each(QR_CODE_STYLE_VARIANT_FIXTURES)(
      `matches $name ${format} style variant snapshot`,
      (fixture) => {
        expectRasterToMatchFileSnapshot(
          format,
          qrcode(fixture.payload)
            .options(fixture.matrixOptions)
            .render(createRenderer({style: fixture.styling})),
          join(snapshotDirectory, 'style-variants', `${fixture.name}.${extension}`),
        );
      },
    );

    test.each(QR_CODE_CENTER_IMAGE_FIXTURES)(
      `matches $name ${format} center image snapshot`,
      (fixture) => {
        expectRasterToMatchFileSnapshot(
          format,
          qrcode(fixture.payload)
            .options(fixture.matrixOptions)
            .render(
              createRenderer({
                style: fixture.style,
                centerImage: rasterCenterImage(encodeFixturePNG(fixture.image), fixture.layout),
              }),
            ),
          join(snapshotDirectory, 'center-image', `${fixture.name}.${extension}`),
        );
      },
    );
  });
}
