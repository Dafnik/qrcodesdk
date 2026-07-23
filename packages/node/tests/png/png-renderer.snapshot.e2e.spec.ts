import {QR_CODE_STYLING_FIXTURES, QR_CODE_TEST_FIXTURES} from '@repo/core-testing';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, test} from 'vitest';

import {qrcode} from '@qrcodesdk/core';

import {QRCodePNGRenderer} from '../../src';
import {expectPngToMatchFileSnapshot} from './png-helpers';

const SNAPSHOT_DIR = fileURLToPath(new URL('../__snapshots__/png', import.meta.url));

describe('QRCodePNGRenderer snapshots', () => {
  test.each(QR_CODE_TEST_FIXTURES)('matches %s generated QR PNG snapshot', (fixture) => {
    expectPngToMatchFileSnapshot(
      qrcode(fixture.data)
        .config(fixture)
        .render(QRCodePNGRenderer({size: 8, margin: 4})),
      join(SNAPSHOT_DIR, `${fixture.name}.png`),
    );
  });

  test.each(QR_CODE_STYLING_FIXTURES)('matches $name PNG styling snapshot', (fixture) => {
    expectPngToMatchFileSnapshot(
      qrcode(fixture.data).config(fixture.matrixOptions).render(QRCodePNGRenderer(fixture.styling)),
      join(SNAPSHOT_DIR, 'styling', `${fixture.name}.png`),
    );
  });
});
