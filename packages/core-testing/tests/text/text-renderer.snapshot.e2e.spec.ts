import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, test} from 'vitest';

import {QR_CODE_TEST_FIXTURES} from '../../src';
import {renderFixtureText} from './text-fixture';
import {expectTextToMatchFileSnapshot} from './text-helpers';

const SNAPSHOT_DIR = fileURLToPath(new URL('../__snapshots__/text', import.meta.url));
const RENDERER_VARIANTS = [
  {name: 'normal', small: false, snapshotSuffix: ''},
  {name: 'small', small: true, snapshotSuffix: '-small'},
] as const;

describe('QRCodeTextRenderer snapshots', () => {
  describe.each(RENDERER_VARIANTS)('$name rendering', (variant) => {
    test.each(QR_CODE_TEST_FIXTURES)('matches %s generated QR text snapshot', (fixture) => {
      expectTextToMatchFileSnapshot(
        renderFixtureText(fixture, {size: 2, margin: 4, small: variant.small}),
        join(SNAPSHOT_DIR, `${fixture.name}${variant.snapshotSuffix}.txt`),
      );
    });
  });
});
