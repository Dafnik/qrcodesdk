import {createRequire} from 'node:module';
import process from 'node:process';
import {describe, test} from 'vitest';

// Load built artifacts natively so Vitest's module-export tracking is outside the timed code.
const load = createRequire(import.meta.url);
const directory = process.env['QRCODESDK_BENCHMARK_CORE'] ?? '../dist';
const {QRCodeSVGRenderer, qrcode, svgCenterImage} = load(`${directory}/index.mjs`);
const shapes = load(`${directory}/style.mjs`);
const {alignment, circle, finder, rounded} = shapes;
// Older comparison builds accept raw path objects directly.
const customShape = shapes.customShape ?? ((paths) => paths);
const drawing = {...shapes, ...load(`${directory}/internal.mjs`)};
// The unprefixed fallback permits comparisons against pre-cleanup built artifacts.
const createQRCodeStyler = drawing.ɵcreateQRCodeStyler ?? drawing.createQRCodeStyler;
const toQRCodePathData = drawing.ɵtoQRCodePathData ?? drawing.toQRCodePathData;

const VERSIONS = [1, 10, 40];
// Batch very fast setup calls so sample bookkeeping does not dominate GC pressure.
const SETUP_BATCH_SIZE = 100;
const STYLE = {
  background: '#f8fafccc',
  foreground: '#0f172aff',
  modules: rounded(),
  finder: finder({ring: rounded({radius: 1}), center: circle(), color: '#7c3aedff'}),
};

describe('styler hot paths', () => {
  for (const version of VERSIONS) {
    test(`version ${String(version)}`, async ({bench}) => {
      const matrix = qrcode('A').options({mode: 'alphanumeric', version, mask: 0}).matrix();
      const plain = createQRCodeStyler();
      const styled = createQRCodeStyler(STYLE);
      const circular = createQRCodeStyler({modules: circle()});
      const circleSVG = QRCodeSVGRenderer({style: {modules: circle()}});
      const drawing = styled(matrix);
      const hexagon = createQRCodeStyler({
        modules: customShape({module: 'm.5 0 .5 .25v.5l-.5 .25-.5-.25v-.5z'}),
      });
      const patterned = createQRCodeStyler({finder: finder(), alignment: alignment()});
      const image = QRCodeSVGRenderer({
        centerImage: svgCenterImage('data:image/png;base64,AA=='),
        style: STYLE,
      });

      await bench.compare(
        bench('create shapes and styler (100 calls)', () => {
          for (let index = 0; index < SETUP_BATCH_SIZE; index++) {
            globalThis.__qrcodesdkBenchmarkResult = createQRCodeStyler({
              modules: rounded(),
              finder: finder({ring: rounded({radius: 1}), center: circle()}),
            });
          }
        }),
        bench('create circle and styler (100 calls)', () => {
          for (let index = 0; index < SETUP_BATCH_SIZE; index++) {
            globalThis.__qrcodesdkBenchmarkResult = createQRCodeStyler({modules: circle()});
          }
        }),
        bench('create custom hexagon and styler (100 calls)', () => {
          for (let index = 0; index < SETUP_BATCH_SIZE; index++) {
            globalThis.__qrcodesdkBenchmarkResult = createQRCodeStyler({
              modules: customShape({module: 'm.5 0 .5 .25v.5l-.5 .25-.5-.25v-.5z'}),
            });
          }
        }),
        bench('create styler from shared shapes (100 calls)', () => {
          for (let index = 0; index < SETUP_BATCH_SIZE; index++) {
            globalThis.__qrcodesdkBenchmarkResult = createQRCodeStyler(STYLE);
          }
        }),
        bench('draw plain', () => {
          globalThis.__qrcodesdkBenchmarkResult = plain(matrix);
        }),
        bench('draw styled', () => {
          globalThis.__qrcodesdkBenchmarkResult = styled(matrix);
        }),
        bench('draw circle', () => {
          globalThis.__qrcodesdkBenchmarkResult = circular(matrix);
        }),
        bench('draw custom hexagon', () => {
          globalThis.__qrcodesdkBenchmarkResult = hexagon(matrix);
        }),
        bench('draw finder and alignment', () => {
          globalThis.__qrcodesdkBenchmarkResult = patterned(matrix);
        }),
        bench('render styled SVG with center image', () => {
          globalThis.__qrcodesdkBenchmarkResult = image(matrix);
        }),
        bench('render circle SVG', () => {
          globalThis.__qrcodesdkBenchmarkResult = circleSVG(matrix);
        }),
        bench('serialize styled path data', () => {
          for (const layer of drawing.layers) {
            globalThis.__qrcodesdkBenchmarkResult = toQRCodePathData(layer);
          }
        }),
      );
    });
  }
});
