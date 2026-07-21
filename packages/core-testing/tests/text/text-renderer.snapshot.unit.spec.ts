import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, test} from 'vitest';

import {QRCodeTextRenderer} from '@qrcodesdk/core';
import type {QRCodeMatrix} from '@qrcodesdk/core';

import {expectTextToMatchFileSnapshot} from './text-helpers';

const SNAPSHOT_DIR = fileURLToPath(new URL('../__snapshots__/text', import.meta.url));
const RENDERER_VARIANTS = [
  {name: 'compact', small: true, snapshotSuffix: ''},
  {name: 'full', small: false, snapshotSuffix: '-full'},
] as const;

describe('QRCodeTextRenderer snapshots', () => {
  test.each(RENDERER_VARIANTS)('renders a hand-authored $name text snapshot', (variant) => {
    const matrix: QRCodeMatrix = [
      [0, 1, 0],
      [1, 0, 1],
      [0, 0, 0],
    ];

    expectTextToMatchFileSnapshot(
      QRCodeTextRenderer({
        size: 2,
        margin: 1,
        small: variant.small,
      })(matrix),
      join(SNAPSHOT_DIR, `hand-authored${variant.snapshotSuffix}.txt`),
    );
  });
});
