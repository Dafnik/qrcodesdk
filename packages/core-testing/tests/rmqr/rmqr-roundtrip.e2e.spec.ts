import {describe, expect, test} from 'vitest';

import {
  type QRCodeEncodingMode,
  QRCodeError,
  QRCodeSVGRenderer,
  type QRCodeVisualStyle,
  qrcode,
  svgCenterImage,
} from '@qrcodesdk/core';
import {kanji} from '@qrcodesdk/core/kanji';
import {type QRCodeRMQRVersion, rMQR} from '@qrcodesdk/core/rmqr';
import {alignment, circle, diagonal, finder, rounded} from '@qrcodesdk/core/style';

import {
  LOGO_IMAGE,
  QR_CODE_RMQR_STYLE_VARIANT_FIXTURES,
  QR_CODE_RMQR_TEST_FIXTURES,
  createFixturePayload,
  fixtureImageDataURL,
  fixtureRMQRMatrixOptions,
  fixtureSeed,
} from '../../src';
import {decodeRMQRCodeMatrix, decodeRMQRCodeSvg} from './rmqr-helpers';

const VERSIONS = (
  [
    [7, [43, 59, 77, 99, 139]],
    [9, [43, 59, 77, 99, 139]],
    [11, [27, 43, 59, 77, 99, 139]],
    [13, [27, 43, 59, 77, 99, 139]],
    [15, [43, 59, 77, 99, 139]],
    [17, [43, 59, 77, 99, 139]],
  ] as const
).flatMap(([height, widths]) =>
  widths.map((width) => `R${String(height)}x${String(width)}` as QRCodeRMQRVersion),
);
const MODES = ['numeric', 'alphanumeric', 'octet', 'kanji'] as const satisfies QRCodeEncodingMode[];

/** The longest payload of a mode that the version holds, found with the encoder itself. */
function longestPayload(
  mode: QRCodeEncodingMode,
  version: QRCodeRMQRVersion,
  errorCorrectionLevel: 'M' | 'H',
): string {
  const seed = fixtureSeed(`rmqr-${version}-${errorCorrectionLevel}-${mode}`);
  const fits = (length: number) => {
    try {
      qrcode(createFixturePayload(mode, length, seed))
        .options({symbol: rMQR({version}), errorCorrectionLevel, mode, kanji})
        .matrix();
      return true;
    } catch (error) {
      if (error instanceof QRCodeError && error.code === 'PAYLOAD_TOO_LARGE') return false;
      throw error;
    }
  };
  let length = 1;
  while (fits(length + 1)) length++;
  return createFixturePayload(mode, length, seed);
}

const CASES = VERSIONS.flatMap((version) =>
  (['M', 'H'] as const).flatMap((errorCorrectionLevel) =>
    MODES.map((mode) => ({
      version,
      errorCorrectionLevel,
      mode,
      payload: longestPayload(mode, version, errorCorrectionLevel),
    })),
  ),
);

describe('rMQR roundtrips', () => {
  test.each(CASES)(
    'decodes a full $version-$errorCorrectionLevel $mode payload',
    async ({version, errorCorrectionLevel, mode, payload}) => {
      const matrix = qrcode(payload)
        .options({symbol: rMQR({version}), errorCorrectionLevel, mode, kanji})
        .matrix();
      await expect(decodeRMQRCodeMatrix(matrix)).resolves.toMatchObject({
        text: payload,
        version,
        ecLevel: errorCorrectionLevel,
        isMirrored: false,
      });
    },
  );

  test.each(VERSIONS)('decodes a one-digit %s payload', async (version) => {
    const matrix = qrcode('7')
      .options({symbol: rMQR({version})})
      .matrix();
    await expect(decodeRMQRCodeMatrix(matrix)).resolves.toMatchObject({text: '7', version});
  });

  test.each(['A\u0000B', 'A\u001dB', 'é', '✅日本', '🚀😀', 'Grüße!'])(
    'decodes %j with automatic version selection',
    async (payload) => {
      const matrix = qrcode(payload).options({symbol: rMQR()}).matrix();
      await expect(decodeRMQRCodeMatrix(matrix)).resolves.toMatchObject({text: payload});
    },
  );

  test.each(QR_CODE_RMQR_TEST_FIXTURES)('decodes $name SVG output', async (fixture) => {
    const svg = qrcode(fixture.payload)
      .options(fixtureRMQRMatrixOptions(fixture))
      .render(QRCodeSVGRenderer({style: {moduleSize: 4}}));
    await expect(decodeRMQRCodeSvg(svg)).resolves.toMatchObject({
      text: fixture.payload,
      version: fixture.symbol,
      ecLevel: fixture.errorCorrectionLevel,
    });
  });

  test.each(QR_CODE_RMQR_STYLE_VARIANT_FIXTURES)(
    'decodes $name SVG style variant',
    async (fixture) => {
      const svg = qrcode(fixture.payload)
        .options(fixture.matrixOptions)
        .render(QRCodeSVGRenderer({style: fixture.styling}));
      await expect(decodeRMQRCodeSvg(svg)).resolves.toMatchObject({
        text: fixture.payload,
        version: fixture.symbol,
      });
    },
  );

  const styles: Record<string, QRCodeVisualStyle> = {
    default: {},
    'module size 2': {moduleSize: 2},
    rounded: {modules: rounded()},
    circle: {modules: circle()},
    'finder and alignment styles': {
      modules: diagonal(),
      // ZXing cannot reliably locate rMQR codes whose finder ring or finder sub-pattern center is
      // shaped, while shaped finder centers and finder sub-pattern rings scan.
      finder: finder({center: circle(), color: '#1e3a8a'}),
      alignment: alignment({ring: circle()}),
    },
    colors: {foreground: '#0f172a', background: '#fef3c7'},
  };

  test.each(Object.entries(styles))('decodes SVG output with %s style', async (_, style) => {
    for (const version of ['R7', 'R11x27', 'R13', 'R17x139'] as const) {
      const payload = `RMQR-${String(version.length)}`;
      const svg = qrcode(payload)
        .options({symbol: rMQR({version})})
        .render(QRCodeSVGRenderer({style}));
      await expect(decodeRMQRCodeSvg(svg)).resolves.toMatchObject({text: payload});
    }
  });

  test.each(['R11x77', 'R13x99', 'R15x139', 'R17x139'] as const)(
    'decodes a centered center image at level H in %s',
    async (version) => {
      const payload = 'https://qrcodesdk.dev';
      const svg = qrcode(payload)
        .options({symbol: rMQR({version}), errorCorrectionLevel: 'H'})
        .render(
          QRCodeSVGRenderer({
            style: {moduleSize: 6},
            centerImage: svgCenterImage(fixtureImageDataURL(LOGO_IMAGE), {size: 0.3}),
          }),
        );
      await expect(decodeRMQRCodeSvg(svg)).resolves.toMatchObject({text: payload, version});
    },
  );
});
