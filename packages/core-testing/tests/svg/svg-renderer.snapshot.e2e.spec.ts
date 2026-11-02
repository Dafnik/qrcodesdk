import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, test} from 'vitest';

import {QRCodeSVGRenderer, qrcode, svgCenterImage} from '@qrcodesdk/core';

import {fixtureImageDataURL, fixtureMatrixOptions} from '../../src';
import {
  QR_CODE_CENTER_IMAGE_FIXTURES,
  QR_CODE_STYLE_VARIANT_FIXTURES,
  QR_CODE_STYLING_FIXTURES,
  QR_CODE_TEST_FIXTURES,
} from '../../src';
import {expectSvgToMatchFileSnapshot} from './svg-helpers';

const SNAPSHOT_DIR = fileURLToPath(new URL('../__snapshots__/svg', import.meta.url));

describe('QRCodeSVGRenderer snapshots', () => {
  const renderer = QRCodeSVGRenderer({style: {moduleSize: 8, quietZone: 4}});
  test.each(QR_CODE_TEST_FIXTURES)('matches %s generated QR SVG snapshot', (fixture) => {
    expectSvgToMatchFileSnapshot(
      qrcode(fixture.payload).options(fixtureMatrixOptions(fixture)).render(renderer),
      join(SNAPSHOT_DIR, `${fixture.name}.svg`),
    );
  });

  test.each(QR_CODE_STYLING_FIXTURES)('matches $name SVG styling snapshot', (fixture) => {
    expectSvgToMatchFileSnapshot(
      qrcode(fixture.payload)
        .options(fixture.matrixOptions)
        .render(QRCodeSVGRenderer({style: fixture.styling})),
      join(SNAPSHOT_DIR, 'styling', `${fixture.name}.svg`),
    );
  });

  test.each(QR_CODE_STYLE_VARIANT_FIXTURES)(
    'matches $name SVG style variant snapshot',
    (fixture) => {
      expectSvgToMatchFileSnapshot(
        qrcode(fixture.payload)
          .options(fixture.matrixOptions)
          .render(QRCodeSVGRenderer({style: fixture.styling})),
        join(SNAPSHOT_DIR, 'style-variants', `${fixture.name}.svg`),
      );
    },
  );

  test.each(QR_CODE_CENTER_IMAGE_FIXTURES)('matches $name SVG center image snapshot', (fixture) => {
    expectSvgToMatchFileSnapshot(
      qrcode(fixture.payload)
        .options(fixture.matrixOptions)
        .render(
          QRCodeSVGRenderer({
            style: fixture.style,
            centerImage: svgCenterImage(fixtureImageDataURL(fixture.image), fixture.layout),
          }),
        ),
      join(SNAPSHOT_DIR, 'center-image', `${fixture.name}.svg`),
    );
  });
});
