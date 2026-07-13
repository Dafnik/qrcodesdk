import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, test} from 'vitest';

import {QRCodeMatrix, QRCodeTextRenderer} from '@qrcodesdk/core';

import {expectTextToMatchFileSnapshot} from './text-helpers';

const SNAPSHOT_DIR = fileURLToPath(new URL('../__snapshots__/text', import.meta.url));

describe('QRCodeTextRenderer snapshots', () => {
  test('renders a hand-authored text snapshot', () => {
    const matrix: QRCodeMatrix = [
      [0, 1, 0],
      [1, 0, 1],
      [0, 0, 0],
    ];

    expectTextToMatchFileSnapshot(
      QRCodeTextRenderer({
        size: 2,
        margin: 1,
      })(matrix),
      join(SNAPSHOT_DIR, 'hand-authored.txt'),
    );
  });
});
