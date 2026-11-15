/*
 * The docs QR code explanation and its optional encoding trace. They live in the docs app and
 * read private core source, so this group imports them by path.
 */
import {kanji} from '@qrcodesdk/core/kanji';

import {
  type QRCodeExplainOptions,
  explainQRCode,
} from '../../../../../apps/docs/src/components/explain/qrcode-analyzer.ts';
import {analyzeQRCodeEncoding} from '../../../../../apps/docs/src/components/explain/qrcode-trace.ts';
import {type WorkloadGroup, workload} from '../workload.ts';

const CASES: readonly (readonly [string, string, QRCodeExplainOptions])[] = [
  ['url', 'short URL, version 2', {payload: 'https://qrcodesdk.dev'}],
  [
    'kanji',
    'mixed segments with Kanji',
    {payload: '東京タワー 2026 TOKYO TOWER tickets', kanji, optimizeSegments: true},
  ],
  [
    'v40',
    'version 40-L, 2000 bytes',
    {payload: 'x'.repeat(2000), version: 40, errorCorrectionLevel: 'L'},
  ],
  ['micro', 'Micro QR M3', {payload: '0123456789', micro: true}],
];

export const group: WorkloadGroup = {
  id: 'explain',
  workloads: CASES.flatMap(([id, title, options]) => [
    workload({
      id: `explain/${id}/explanation`,
      title: `${title}: explanation, trace off`,
      features: ['explain'],
      run: () => explainQRCode(options),
    }),
    workload({
      id: `explain/${id}/with-trace`,
      title: `${title}: explanation and trace`,
      features: ['explain'],
      run: () => {
        const explanation = explainQRCode(options);
        return analyzeQRCodeEncoding(explanation.matrix, explanation.traceRequest);
      },
    }),
    workload({
      id: `explain/${id}/trace`,
      title: `${title}: trace analysis only`,
      features: ['explain'],
      setup: () => explainQRCode(options),
      run: ({matrix, traceRequest}) => analyzeQRCodeEncoding(matrix, traceRequest),
    }),
  ]),
};
