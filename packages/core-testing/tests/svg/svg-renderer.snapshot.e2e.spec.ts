import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, test} from 'vitest';

import {QRCodeSVGRenderer, qrcode, svgCenterImage} from '@qrcodesdk/core';

import {QR_CODE_RENDER_FIXTURES, fixtureImageDataURL} from '../../src';
import {expectSvgToMatchFileSnapshot} from './svg-helpers';

const SNAPSHOT_DIR = fileURLToPath(new URL('../__snapshots__/svg', import.meta.url));

// The docs dev tools render the same fixtures with the same options.
describe('QRCodeSVGRenderer snapshots', () => {
  test.each(QR_CODE_RENDER_FIXTURES)('matches $id SVG snapshot', (fixture) => {
    const {centerImage} = fixture;
    expectSvgToMatchFileSnapshot(
      qrcode(fixture.payload)
        .options(fixture.matrix)
        .render(
          QRCodeSVGRenderer({
            style: fixture.style,
            centerImage: centerImage
              ? svgCenterImage(fixtureImageDataURL(centerImage.image), centerImage.layout)
              : undefined,
          }),
        ),
      join(SNAPSHOT_DIR, `${fixture.snapshotPath}.svg`),
    );
  });
});
