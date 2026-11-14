import {describe, expect, test} from 'vitest';

import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

import {fixtureMatrixOptions} from '../../src';
import {getAllQRCodeECICombinations} from '../../src';
import {decodeSvgQRCode} from './svg-helpers';

describe('SVG QR eci roundtrips', () => {
  const testSVGRenderer = QRCodeSVGRenderer({style: {moduleSize: 4, quietZone: 4}});

  test.each([...getAllQRCodeECICombinations()])('decodes eci $name SVG output', async (fixture) => {
    await expect(
      decodeSvgQRCode(
        qrcode(fixture.payload).options(fixtureMatrixOptions(fixture)).render(testSVGRenderer),
      ),
    ).resolves.toBe(fixture.payload);
  });
});
