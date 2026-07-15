import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, test} from 'vitest';

import {QRCodeSVGRenderer} from '@qrcodesdk/core';
import type {QRCodeMatrix} from '@qrcodesdk/core';

import {expectSvgToMatchFileSnapshot} from './svg-helpers';

const SNAPSHOT_DIR = fileURLToPath(new URL('../__snapshots__/svg', import.meta.url));

describe('QRCodeSVGRenderer snapshots', () => {
  test('renders a compact hand-authored custom SVG snapshot', () => {
    const matrix: QRCodeMatrix = [
      [0, 1, 0],
      [1, 0, 1],
      [0, 0, 0],
    ];

    expectSvgToMatchFileSnapshot(
      QRCodeSVGRenderer({
        size: 3,
        margin: 1,
        colors: {
          colorLight: '#eeeeee',
          colorDark: '#111111',
        },
        alt: 'QR alt',
        ariaLabel: 'QR aria',
        title: 'QR title',
      })(matrix),
      join(SNAPSHOT_DIR, 'hand-authored-custom.svg'),
    );
  });
});
