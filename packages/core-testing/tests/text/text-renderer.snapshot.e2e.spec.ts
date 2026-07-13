import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, test} from 'vitest';

import {QR_CODE_TEST_FIXTURES} from '../../src';
import {renderFixtureText} from './text-fixture';
import {expectTextToMatchFileSnapshot} from './text-helpers';

const SNAPSHOT_DIR = fileURLToPath(new URL('../__snapshots__/text', import.meta.url));

describe('QRCodeTextRenderer snapshots', () => {
  test.each(QR_CODE_TEST_FIXTURES)('matches %s generated QR text snapshot', (fixture) => {
    expectTextToMatchFileSnapshot(
      renderFixtureText(fixture),
      join(SNAPSHOT_DIR, `${fixture.name}.txt`),
    );
  });
});
