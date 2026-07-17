import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, test} from 'vitest';

import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

import {QR_CODE_TEST_FIXTURES} from '../../src';
import {expectSvgToMatchFileSnapshot} from './svg-helpers';

const SNAPSHOT_DIR = fileURLToPath(new URL('../__snapshots__/svg', import.meta.url));

describe('QRCodeSVGRenderer snapshots', () => {
  test.each(QR_CODE_TEST_FIXTURES)('matches %s generated QR SVG snapshot', (fixture) => {
    expectSvgToMatchFileSnapshot(
      qrcode(fixture.data)
        .config(fixture)
        .render(QRCodeSVGRenderer({size: 8, margin: 4})),
      join(SNAPSHOT_DIR, `${fixture.name}.svg`),
    );
  });
});
