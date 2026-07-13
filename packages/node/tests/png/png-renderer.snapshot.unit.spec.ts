import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, test} from 'vitest';

import type {QRCodeMatrix} from '@qrcodesdk/core';

import {QRCodePNGRenderer} from '../../src';
import {expectPngToMatchFileSnapshot} from './png-helpers';

const SNAPSHOT_DIR = fileURLToPath(new URL('../__snapshots__/png', import.meta.url));

describe('QRCodePNGRenderer snapshots', () => {
  test('renders a compact hand-authored custom PNG snapshot', () => {
    const matrix: QRCodeMatrix = [
      [0, 1, 0],
      [1, 0, 1],
      [0, 0, 0],
    ];

    expectPngToMatchFileSnapshot(
      QRCodePNGRenderer({
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
