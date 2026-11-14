import {describe, test} from 'vitest';

import {kanji} from '@qrcodesdk/core/kanji';

import {type QRCodeExplainOptions, explainQRCode} from './qrcode-analyzer.ts';
import {analyzeQRCodeEncoding} from './qrcode-trace.ts';

/*
 * Measures the docs QR code explanation with the encoding trace off and on. Vitest warms each
 * workload up before it measures. Run it alone: `pnpm turbo run benchmark:explain --filter=docs`.
 */
const WORKLOADS: readonly (readonly [string, QRCodeExplainOptions])[] = [
  ['short URL, version 2', {payload: 'https://qrcodesdk.dev'}],
  [
    'mixed segments with Kanji',
    {payload: '東京タワー 2026 TOKYO TOWER tickets', kanji, optimizeSegments: true},
  ],
  ['version 40-L, 2000 bytes', {payload: 'x'.repeat(2000), version: 40, errorCorrectionLevel: 'L'}],
  ['Micro QR M3', {payload: '0123456789', micro: true}],
];

// Retains each result so the runtime cannot discard the work.
let sink: unknown;

describe('QR code explanation', () => {
  for (const [name, options] of WORKLOADS) {
    test(name, async ({bench}) => {
      const {matrix, traceRequest} = explainQRCode(options);

      await bench.compare(
        bench('explanation, trace off', () => {
          sink = explainQRCode(options);
        }),
        bench('explanation and trace', () => {
          const explanation = explainQRCode(options);
          sink = analyzeQRCodeEncoding(explanation.matrix, explanation.traceRequest);
        }),
        bench('trace analysis only', () => {
          sink = analyzeQRCodeEncoding(matrix, traceRequest);
        }),
      );
    });
  }
});

export {sink};
