import {QR_CODE_TEST_FIXTURES} from '@repo/core-testing';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, test} from 'vitest';

import {renderFixturePng} from './png-fixture';
import {expectPngToMatchFileSnapshot} from './png-helpers';

const SNAPSHOT_DIR = fileURLToPath(new URL('../__snapshots__/png', import.meta.url));

describe('QRCodePNGRenderer snapshots', () => {
  test.each(QR_CODE_TEST_FIXTURES)('matches %s generated QR PNG snapshot', (fixture) => {
    expectPngToMatchFileSnapshot(
      renderFixturePng(fixture),
      join(SNAPSHOT_DIR, `${fixture.name}.png`),
    );
  });
});
