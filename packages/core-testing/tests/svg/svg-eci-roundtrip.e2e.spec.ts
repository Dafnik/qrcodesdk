import {describe, test} from 'vitest';

import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

import {getAllQRCodeECICombinations} from '../../src';
import {expectSvgQRCodeToDecode} from './svg-helpers';

/**
 * Version 23/L QR codes always fail to decode with jsQR
 * https://github.com/cozmo/jsQR/issues/251
 */
const ROUNDTRIP_ECI_COMBINATIONS = [...getAllQRCodeECICombinations()];
const ROUNDTRIP_ECI_COMBINATIONS_BOTH_DECODERS = ROUNDTRIP_ECI_COMBINATIONS.filter(
  ({version, errorCorrectionLevel}) => version !== 23 || errorCorrectionLevel !== 'L',
);
const ROUNDTRIP_ECI_COMBINATIONS_ZXING_ONLY = ROUNDTRIP_ECI_COMBINATIONS.filter(
  ({version, errorCorrectionLevel}) => version === 23 && errorCorrectionLevel === 'L',
);

describe('SVG QR eci roundtrips', () => {
  const testSVGRenderer = QRCodeSVGRenderer({size: 4, margin: 4});

  test.each(ROUNDTRIP_ECI_COMBINATIONS_BOTH_DECODERS)(
    'decodes eci $name SVG output',
    async (fixture) => {
      await expectSvgQRCodeToDecode(
        qrcode(fixture.data).config(fixture).render(testSVGRenderer),
        fixture.data,
      );
    },
  );

  test.each(ROUNDTRIP_ECI_COMBINATIONS_ZXING_ONLY)(
    'decodes eci $name SVG output with ZXing',
    async (fixture) => {
      await expectSvgQRCodeToDecode(
        qrcode(fixture.data).config(fixture).render(testSVGRenderer),
        fixture.data,
        ['ZXing'],
      );
    },
  );
});
