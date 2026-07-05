import {QR_CODE_TEST_FIXTURES} from '@repo/core-testing';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, test} from 'vitest';

import type {QRCodeMatrix} from '@qrcodesdk/core';

import {PNGQRCodeRenderer} from '../../src';
import {renderFixturePng} from './png-fixture';
import {expectPngToMatchFileSnapshot} from './png-helpers';

const SNAPSHOT_DIR = fileURLToPath(new URL('../__snapshots__/png', import.meta.url));

describe('PNGQRCodeRenderer snapshots', () => {
  test.each(QR_CODE_TEST_FIXTURES)('matches %s generated QR PNG snapshot', (fixture) => {
    expectPngToMatchFileSnapshot(
      renderFixturePng(fixture),
      join(SNAPSHOT_DIR, `${fixture.name}.png`),
    );
  });

  test('renders a compact hand-authored custom PNG snapshot', () => {
    const matrix: QRCodeMatrix = [
      [0, 1, 0],
      [1, 0, 1],
      [0, 0, 0],
    ];

    expectPngToMatchFileSnapshot(
      PNGQRCodeRenderer({
        size: 3,
        margin: 1,
        colors: {
          colorLight: '#eeeeee',
          colorDark: '#111111',
        },
      })(matrix),
      join(SNAPSHOT_DIR, 'hand-authored-custom.png'),
    );
  });
});
