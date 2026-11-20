import {describe, expect, test} from 'vitest';

import {QRCodeSVGRenderer, type QRCodeVisualStyle, qrcode, svgCenterImage} from '@qrcodesdk/core';
import {rMQR} from '@qrcodesdk/core/rmqr';
import {alignment, circle, diagonal, finder, rounded} from '@qrcodesdk/core/style';

import {
  QR_CODE_RMQR_CENTER_IMAGE_FIXTURES,
  QR_CODE_RMQR_STYLE_VARIANT_FIXTURES,
  QR_CODE_RMQR_TEST_FIXTURES,
  RMQR_VERSIONS,
  fixtureImageDataURL,
  fixtureRMQRMatrixOptions,
  getAllRMQRCodeCombinations,
} from '../../src';
import {decodeRMQRCodeMatrix, decodeRMQRCodeSvg} from './rmqr-helpers';

describe('rMQR roundtrips', () => {
  test.each([...getAllRMQRCodeCombinations()])(
    'decodes combination $name SVG output',
    async (fixture) => {
      const svg = qrcode(fixture.payload)
        .options(fixtureRMQRMatrixOptions(fixture))
        .render(QRCodeSVGRenderer({style: {moduleSize: 4}}));
      await expect(decodeRMQRCodeSvg(svg)).resolves.toMatchObject({
        text: fixture.payload,
        version: fixture.symbol,
        ecLevel: fixture.errorCorrectionLevel,
        isMirrored: false,
      });
    },
  );

  test.each(RMQR_VERSIONS)('decodes a one-digit %s payload', async (version) => {
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

  test.each(QR_CODE_RMQR_CENTER_IMAGE_FIXTURES)(
    'decodes $name SVG center image fixture',
    async (fixture) => {
      const svg = qrcode(fixture.payload)
        .options(fixture.matrixOptions)
        .render(
          QRCodeSVGRenderer({
            style: fixture.style,
            centerImage: svgCenterImage(fixtureImageDataURL(fixture.image), {
              ...fixture.layout,
              aspectRatio: fixture.image.width / fixture.image.height,
            }),
          }),
        );
      await expect(decodeRMQRCodeSvg(svg)).resolves.toMatchObject({
        text: fixture.payload,
        version: fixture.symbol,
      });
    },
  );
});
