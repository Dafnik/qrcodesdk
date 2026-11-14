import {QR_CODE_RENDER_FIXTURES, encodeFixturePNG} from '@repo/core-testing';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, test} from 'vitest';

import {type QRCodeRenderer, qrcode} from '@qrcodesdk/core';

import {type QRCodeRasterRendererOptions, rasterCenterImage} from '../src';
import {type RasterFormat, expectRasterToMatchFileSnapshot} from './raster-helpers';

/**
 * Compares every render fixture drawn by one raster renderer with its tracked file snapshot. The
 * docs dev tools render the same fixtures with the same options.
 */
export function describeRasterSnapshots(
  format: RasterFormat,
  createRenderer: (options: QRCodeRasterRendererOptions) => QRCodeRenderer<Buffer>,
): void {
  const extension = format.toLowerCase();
  const snapshotDirectory = fileURLToPath(new URL(`__snapshots__/${extension}`, import.meta.url));

  describe(`${format} renderer snapshots`, () => {
    test.each(QR_CODE_RENDER_FIXTURES)(`matches $id ${format} snapshot`, (fixture) => {
      const {centerImage} = fixture;
      expectRasterToMatchFileSnapshot(
        format,
        qrcode(fixture.payload)
          .options(fixture.matrix)
          .render(
            createRenderer({
              style: fixture.style,
              centerImage: centerImage
                ? rasterCenterImage(encodeFixturePNG(centerImage.image), centerImage.layout)
                : undefined,
            }),
          ),
        join(snapshotDirectory, `${fixture.snapshotPath}.${extension}`),
      );
    });
  });
}
