import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, test} from 'vitest';

import {qrcode} from '@qrcodesdk/core';
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

  test('renders a mixed styled PNG snapshot', () => {
    expectPngToMatchFileSnapshot(
      qrcode('styled snapshot').render(
        QRCodePNGRenderer({
          size: 8,
          margin: 4,
          colors: {colorLight: '#fefefe', colorDark: '#101010'},
          dotsOptions: {color: '#123456', type: 'classy-rounded'},
          cornersSquareOptions: {color: '#654321', type: 'extra-rounded'},
          cornersDotOptions: {color: '#2468ac', type: 'dot'},
        }),
      ),
      join(SNAPSHOT_DIR, 'styled-custom.png'),
    );
  });
});
