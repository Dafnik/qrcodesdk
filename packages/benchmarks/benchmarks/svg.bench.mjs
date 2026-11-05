import {createRequire} from 'node:module';
import {describe, test} from 'vitest';

// Native production modules avoid Vitest's export tracking in the timed code.
const load = createRequire(import.meta.url);
const {QRCodeSVGRenderer, qrcode} = load('@qrcodesdk/core');
const reference = load('qrcode');
// qrcode has no public renderer for an existing matrix. Use its production SVG renderer.
const referenceSVG = load('qrcode/lib/renderer/svg-tag.js');

describe('SVG rendering without matrix generation', () => {
  for (const version of [1, 10, 40]) {
    test(`version ${String(version)}`, async ({bench}) => {
      const matrix = qrcode('SVG BENCHMARK')
        .options({version, mask: 0, mode: 'alphanumeric'})
        .matrix();
      const referenceMatrix = reference.create([{data: 'SVG BENCHMARK', mode: 'alphanumeric'}], {
        version,
        maskPattern: 0,
        errorCorrectionLevel: 'M',
      });
      const options = {style: {moduleSize: 4, quietZone: 4}};
      const renderer = QRCodeSVGRenderer(options);
      const referenceOptions = {width: (matrix.size + 8) * 4, margin: 4};

      await bench.compare(
        bench('QRCodeSDK reused renderer', () => {
          globalThis.__qrcodesdkBenchmarkResult = renderer(matrix);
        }),
        bench('QRCodeSDK fresh renderer', () => {
          globalThis.__qrcodesdkBenchmarkResult = QRCodeSVGRenderer(options)(matrix);
        }),
        bench('qrcode SVG renderer', () => {
          globalThis.__qrcodesdkBenchmarkResult = referenceSVG.render(
            referenceMatrix,
            referenceOptions,
          );
        }),
      );
    });
  }
});
