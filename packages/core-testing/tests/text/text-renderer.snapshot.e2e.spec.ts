import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, test} from 'vitest';

import {QRCodeTextRenderer, qrcode} from '@qrcodesdk/core';

import {fixtureMatrixOptions, fixtureMicroMatrixOptions, fixtureRMQRMatrixOptions} from '../../src';
import {
  QR_CODE_MICRO_TEST_FIXTURES,
  QR_CODE_RMQR_TEST_FIXTURES,
  QR_CODE_TEST_FIXTURES,
} from '../../src';
import {expectTextToMatchFileSnapshot} from './text-helpers';

const SNAPSHOT_DIR = fileURLToPath(new URL('../__snapshots__/text', import.meta.url));
const RENDERER_VARIANTS = [
  {name: 'compact', layout: 'compact', snapshotSuffix: ''},
  {name: 'full', layout: 'full', snapshotSuffix: '-full'},
] as const;

describe('QRCodeTextRenderer snapshots', () => {
  describe.each(RENDERER_VARIANTS)('$name rendering', (variant) => {
    test.each(QR_CODE_TEST_FIXTURES)('matches %s generated QR text snapshot', (fixture) => {
      expectTextToMatchFileSnapshot(
        qrcode(fixture.payload)
          .options(fixtureMatrixOptions(fixture))
          .render(
            QRCodeTextRenderer({
              style: {moduleSize: 2, quietZone: 4},
              layout: variant.layout,
            }),
          ),
        join(SNAPSHOT_DIR, `${fixture.name}${variant.snapshotSuffix}.txt`),
      );
    });

    test.each(QR_CODE_MICRO_TEST_FIXTURES)('matches $name Micro QR text snapshot', (fixture) => {
      expectTextToMatchFileSnapshot(
        qrcode(fixture.payload)
          .options(fixtureMicroMatrixOptions(fixture))
          .render(QRCodeTextRenderer({style: {moduleSize: 2}, layout: variant.layout})),
        join(SNAPSHOT_DIR, 'micro', `${fixture.name}${variant.snapshotSuffix}.txt`),
      );
    });

    test.each(QR_CODE_RMQR_TEST_FIXTURES)('matches $name rMQR text snapshot', (fixture) => {
      expectTextToMatchFileSnapshot(
        qrcode(fixture.payload)
          .options(fixtureRMQRMatrixOptions(fixture))
          .render(QRCodeTextRenderer({style: {moduleSize: 2}, layout: variant.layout})),
        join(SNAPSHOT_DIR, 'rmqr', `${fixture.name}${variant.snapshotSuffix}.txt`),
      );
    });
  });
});
