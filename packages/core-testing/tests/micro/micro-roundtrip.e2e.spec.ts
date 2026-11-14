import {describe, expect, test} from 'vitest';

import {
  type QRCodeEncodingMode,
  type QRCodeErrorCorrectionLevel,
  QRCodeSVGRenderer,
  type QRCodeVisualStyle,
  qrcode,
} from '@qrcodesdk/core';
import {kanji} from '@qrcodesdk/core/kanji';
import {type QRCodeMicroMask, type QRCodeMicroVersion, microQR} from '@qrcodesdk/core/micro';
import {circle, finder, rounded} from '@qrcodesdk/core/style';

import {
  QR_CODE_MICRO_STYLE_VARIANT_FIXTURES,
  QR_CODE_MICRO_TEST_FIXTURES,
  createFixturePayload,
  fixtureMicroMatrixOptions,
  fixtureSeed,
} from '../../src';
import {decodeMicroQRCodeMatrix, decodeMicroQRCodeSvg} from './micro-helpers';

// ISO/IEC 18004:2015 Table 7: data capacity by symbol, level, and mode.
const SYMBOLS: readonly [
  QRCodeMicroVersion,
  QRCodeErrorCorrectionLevel,
  number,
  number,
  number,
  number,
][] = [
  ['M1', 'L', 5, 0, 0, 0],
  ['M2', 'L', 10, 6, 0, 0],
  ['M2', 'M', 8, 5, 0, 0],
  ['M3', 'L', 23, 14, 9, 6],
  ['M3', 'M', 18, 11, 7, 4],
  ['M4', 'L', 35, 21, 15, 9],
  ['M4', 'M', 30, 18, 13, 8],
  ['M4', 'Q', 21, 13, 9, 5],
];
const MODES = ['numeric', 'alphanumeric', 'octet', 'kanji'] as const satisfies QRCodeEncodingMode[];

const CASES = SYMBOLS.flatMap(([version, errorCorrectionLevel, ...capacities]) =>
  MODES.flatMap((mode, index) =>
    Array.from({length: capacities[index]!}, (_, length) => ({
      version,
      errorCorrectionLevel,
      mode,
      payload: createFixturePayload(
        mode,
        length + 1,
        fixtureSeed(`${version}-${errorCorrectionLevel}-${mode}-${String(length)}`),
      ),
    })),
  ),
);

describe('Micro QR roundtrips', () => {
  test.each(CASES)(
    'decodes $version-$errorCorrectionLevel $mode "$payload"',
    async ({version, errorCorrectionLevel, mode, payload}) => {
      const matrix = qrcode(payload)
        .options({symbol: microQR({version}), errorCorrectionLevel, mode, kanji})
        .matrix();
      const scan = await decodeMicroQRCodeMatrix(matrix);
      expect(scan).toMatchObject({
        text: payload,
        version,
        isMirrored: false,
        format: 'MicroQRCode',
      });
      if (version !== 'M1') expect(scan.ecLevel).toBe(errorCorrectionLevel);
    },
  );

  test.each(
    (['01234567', 'HELLO WORLD', 'hello'] as const).flatMap((payload) =>
      ([0, 1, 2, 3] as const satisfies QRCodeMicroMask[]).map((mask) => ({payload, mask})),
    ),
  )('decodes "$payload" with mask $mask', async ({payload, mask}) => {
    const matrix = qrcode(payload)
      .options({symbol: microQR({mask})})
      .matrix();
    await expect(decodeMicroQRCodeMatrix(matrix)).resolves.toMatchObject({text: payload});
  });

  test.each(['é', 'äöü', '✅日本', '🚀😀', 'Grüße!'])(
    'decodes the UTF-8 payload %s with automatic version selection',
    async (payload) => {
      const matrix = qrcode(payload).options({symbol: microQR()}).matrix();
      await expect(decodeMicroQRCodeMatrix(matrix)).resolves.toMatchObject({text: payload});
    },
  );

  test.each(QR_CODE_MICRO_TEST_FIXTURES)('decodes $name SVG output', async (fixture) => {
    const svg = qrcode(fixture.payload)
      .options(fixtureMicroMatrixOptions(fixture))
      .render(QRCodeSVGRenderer({style: {moduleSize: 4}}));
    const scan = await decodeMicroQRCodeSvg(svg);
    expect(scan).toMatchObject({text: fixture.payload, version: fixture.version});
    if (fixture.version !== 'M1') expect(scan.ecLevel).toBe(fixture.errorCorrectionLevel);
  });

  test.each(QR_CODE_MICRO_STYLE_VARIANT_FIXTURES)(
    'decodes $name SVG style variant',
    async (fixture) => {
      const svg = qrcode(fixture.payload)
        .options(fixture.matrixOptions)
        .render(QRCodeSVGRenderer({style: fixture.styling}));
      await expect(decodeMicroQRCodeSvg(svg)).resolves.toMatchObject({text: fixture.payload});
    },
  );

  const styles: Record<string, QRCodeVisualStyle> = {
    default: {},
    'module size 2': {moduleSize: 2},
    rounded: {modules: rounded()},
    // ZXing cannot locate a Micro QR finder pattern whose ring has a corner radius of 0.5 or more.
    'circle with finder style': {
      modules: circle(),
      finder: finder({ring: rounded({radius: 0.25}), center: circle(), color: '#1e3a8a'}),
    },
    colors: {foreground: '#0f172a', background: '#fef3c7'},
  };

  test.each(Object.entries(styles))('decodes SVG output with %s style', async (_, style) => {
    for (const payload of ['12345', 'MICRO QR', 'qrcodesdk']) {
      const svg = qrcode(payload).options({symbol: microQR()}).render(QRCodeSVGRenderer({style}));
      await expect(decodeMicroQRCodeSvg(svg)).resolves.toMatchObject({text: payload});
    }
  });
});
