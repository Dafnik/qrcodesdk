import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, test} from 'vitest';

import {QRCodeMatrix, SVGQRCodeRenderer} from '@qrcodesdk/core';

import {QR_CODE_TEST_FIXTURES} from '../../src';
import {renderFixtureSvg} from './svg-fixture.spec';
import {expectSvgToMatchFileSnapshot} from './svg-helpers';

const SNAPSHOT_DIR = fileURLToPath(new URL('../__snapshots__/svg', import.meta.url));

describe('SVGQRCodeRenderer snapshots', () => {
  test.each(QR_CODE_TEST_FIXTURES)('matches %s generated QR SVG snapshot', (fixture) => {
    expectSvgToMatchFileSnapshot(
      renderFixtureSvg(fixture),
      join(SNAPSHOT_DIR, `${fixture.name}.svg`),
    );
  });

  test('renders a compact hand-authored custom SVG snapshot', () => {
    const matrix: QRCodeMatrix = [
      [0, 1, 0],
      [1, 0, 1],
      [0, 0, 0],
    ];

    expectSvgToMatchFileSnapshot(
      SVGQRCodeRenderer({
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
