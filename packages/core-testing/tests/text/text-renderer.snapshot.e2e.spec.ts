import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, test} from 'vitest';

import {QRCodeTextRenderer, qrcode} from '@qrcodesdk/core';

import {QR_CODE_TEST_FIXTURES} from '../../src';
import {expectTextToMatchFileSnapshot} from './text-helpers';

const SNAPSHOT_DIR = fileURLToPath(new URL('../__snapshots__/text', import.meta.url));
const RENDERER_VARIANTS = [
  {name: 'compact', small: true, snapshotSuffix: ''},
  {name: 'full', small: false, snapshotSuffix: '-full'},
] as const;

describe('QRCodeTextRenderer snapshots', () => {
  describe.each(RENDERER_VARIANTS)('$name rendering', (variant) => {
    test.each(QR_CODE_TEST_FIXTURES)('matches %s generated QR text snapshot', (fixture) => {
      expectTextToMatchFileSnapshot(
        qrcode(fixture.data)
          .config(fixture)
          .render(QRCodeTextRenderer({size: 2, margin: 4, small: variant.small})),
        join(SNAPSHOT_DIR, `${fixture.name}${variant.snapshotSuffix}.txt`),
      );
    });
  });
});
