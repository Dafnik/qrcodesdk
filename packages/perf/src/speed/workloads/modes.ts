import {kanji} from '@qrcodesdk/core/kanji';
import {qrcode} from '@qrcodesdk/core/matrix';
import {automaticSegmenter} from '@qrcodesdk/core/segmenter';

import {type WorkloadGroup, payloadOf, workload} from '../workload.ts';

// Payloads that fill about version 10 in their mode at error correction level M.
const FIXED_MODES = {
  numeric: payloadOf('0123456789', 513),
  alphanumeric: payloadOf('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:', 311),
  octet: payloadOf('abcdefghijklmnopqrstuvwxyz0123456789-_~', 213),
  kanji: payloadOf('漢字日本語東京大阪京都', 131),
} as const;

const SEGMENTER_PAYLOADS = {
  short: 'hello',
  numeric: '1234567890'.repeat(100),
  mixed: 'ABCD12345678901234567890abcd',
  long: 'abc12345678901234567890XYZ'.repeat(40),
  kanji: '東京タワー 2026 TOKYO TOWER tickets',
} as const;

export const group: WorkloadGroup = {
  id: 'modes',
  workloads: [
    ...(Object.keys(FIXED_MODES) as (keyof typeof FIXED_MODES)[]).map((mode) =>
      workload({
        id: `modes/${mode}`,
        title: `${mode[0]!.toUpperCase()}${mode.slice(1)} mode, version 10`,
        features: mode === 'kanji' ? ['matrix', 'kanji'] : ['matrix'],
        run: () =>
          qrcode(FIXED_MODES[mode])
            .mode(mode)
            .kanji(mode === 'kanji' ? kanji : undefined)
            .options({version: 10, mask: 0})
            .matrix(),
      }),
    ),
    ...(Object.keys(SEGMENTER_PAYLOADS) as (keyof typeof SEGMENTER_PAYLOADS)[]).flatMap((name) => {
      const payload = SEGMENTER_PAYLOADS[name];
      const kanjiTable = name === 'kanji' ? kanji : undefined;
      const features = name === 'kanji' ? (['kanji'] as const) : [];
      return [
        workload({
          id: `segmenter/${name}/segments`,
          title: `${name} payload: segmentation only`,
          features: ['auto-mode', 'segmenter', ...features],
          run: () => automaticSegmenter(payload, {version: 1, eci: false, kanji: kanjiTable}),
        }),
        workload({
          id: `segmenter/${name}/auto-single`,
          title: `${name} payload: automatic single mode`,
          features: ['matrix', 'auto-mode', ...features],
          run: () => qrcode(payload).mode('auto').kanji(kanjiTable).mask(0).matrix(),
        }),
        workload({
          id: `segmenter/${name}/auto-mixed`,
          title: `${name} payload: automatic mixed modes`,
          features: ['matrix', 'auto-mode', 'segmenter', ...features],
          run: () =>
            qrcode(payload)
              .mode('auto')
              .kanji(kanjiTable)
              .segmenter(automaticSegmenter)
              .mask(0)
              .matrix(),
        }),
      ];
    }),
  ],
};
