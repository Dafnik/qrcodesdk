import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, test} from 'vitest';

import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';
import type {QRCodeDataImageURL, QRCodeMatrix} from '@qrcodesdk/core';

import {expectSvgToMatchFileSnapshot} from './svg-helpers';

const SNAPSHOT_DIR = fileURLToPath(new URL('../__snapshots__/svg', import.meta.url));
const LOGO_PNG = readFileSync(
  fileURLToPath(new URL('../../../../apps/docs/public/logo-square.png', import.meta.url)),
);
const LOGO_DATA_URL = `data:image/png;base64,${LOGO_PNG.toString('base64')}` as QRCodeDataImageURL;

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

  test('renders a mixed styled SVG snapshot', () => {
    expectSvgToMatchFileSnapshot(
      qrcode('styled snapshot').render(
        QRCodeSVGRenderer({
          size: 8,
          margin: 4,
          colors: {colorLight: '#fefefe', colorDark: '#101010'},
          dotsOptions: {color: '#123456', type: 'classy-rounded'},
          cornersSquareOptions: {color: '#654321', type: 'extra-rounded'},
          cornersDotOptions: {color: '#2468ac', type: 'dot'},
        }),
      ),
      join(SNAPSHOT_DIR, 'styled-custom.svg'),
    );
  });

  test('renders a prepared image overlay SVG snapshot', () => {
    expectSvgToMatchFileSnapshot(
      qrcode('https://qrcodesdk.dev')
        .config({errorCorrectionLevel: 'H'})
        .render(
          QRCodeSVGRenderer({
            size: 8,
            margin: 4,
            image: {source: LOGO_DATA_URL},
          }),
        ),
      join(SNAPSHOT_DIR, 'image-overlay-logo.svg'),
    );
  });
});
