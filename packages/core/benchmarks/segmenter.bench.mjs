import {createRequire} from 'node:module';
import {describe, test} from 'vitest';

// Use native built modules to keep Vitest's export tracking outside the timed code.
const load = createRequire(import.meta.url);
const {qrcode} = load('../dist/index.mjs');
const {automaticSegmenter} = load('../dist/segmenter.mjs');
const PAYLOADS = {
  short: 'hello',
  numeric: '1234567890'.repeat(100),
  mixed: 'ABCD12345678901234567890abcd',
  long: 'abc12345678901234567890XYZ'.repeat(40),
};

for (const [name, payload] of Object.entries(PAYLOADS)) {
  describe(name, () => {
    test('segmentation only', async ({bench}) => {
      await bench('automatic segmenter', () => {
        globalThis.__qrcodesdkBenchmarkResult = automaticSegmenter(payload, {
          version: 1,
          eci: false,
        });
      }).run();
    });
    test('matrix generation', async ({bench}) => {
      await bench.compare(
        bench('auto single mode', () => {
          globalThis.__qrcodesdkBenchmarkResult = qrcode(payload).mode('auto').mask(0).matrix();
        }),
        bench('auto mixed mode', () => {
          globalThis.__qrcodesdkBenchmarkResult = qrcode(payload)
            .mode('auto')
            .segmenter(automaticSegmenter)
            .mask(0)
            .matrix();
        }),
      );
    });
  });
}
