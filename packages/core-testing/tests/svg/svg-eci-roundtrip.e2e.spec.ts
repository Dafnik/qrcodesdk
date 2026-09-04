import {describe, expect, test} from 'vitest';

import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

import {getAllQRCodeECICombinations} from '../../src';
import {decodeSvgQRCode} from './svg-helpers';

/**
 * Version 23 QR codes always fail to decode
 * https://github.com/cozmo/jsQR/issues/251
 */
const JSQR_ROUNDTRIP_ECI_ENABLED_COMBINATIONS = [...getAllQRCodeECICombinations()].filter(
  ({version, errorCorrectionLevel}) => version !== 23 || errorCorrectionLevel !== 'L',
);

describe('SVG QR eci roundtrips', () => {
  const testSVGRenderer = QRCodeSVGRenderer({style: {moduleSize: 4, quietZone: 4}});

  test.each(JSQR_ROUNDTRIP_ECI_ENABLED_COMBINATIONS)(
    'decodes eci $name SVG output',
    async (fixture) => {
      await expect(
        decodeSvgQRCode(qrcode(fixture.data).config(fixture).render(testSVGRenderer)),
      ).resolves.toBe(fixture.data);
    },
  );
});
