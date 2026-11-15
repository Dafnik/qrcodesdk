import {type QRCodeMask, qrcode} from '@qrcodesdk/core/matrix';

import {
  ALPHANUMERIC_PAYLOADS,
  QR_VERSIONS,
  URL_PAYLOAD,
  type WorkloadGroup,
  workload,
} from '../workload.ts';

const MASKS = [0, 1, 2, 3, 4, 5, 6, 7] as const satisfies readonly QRCodeMask[];

export const group: WorkloadGroup = {
  id: 'matrix',
  workloads: [
    workload({
      id: 'matrix/url',
      title: 'URL, automatic version and mask',
      features: ['matrix'],
      run: () => qrcode(URL_PAYLOAD).matrix(),
    }),
    ...QR_VERSIONS.flatMap((version) => [
      workload({
        id: `matrix/fixed-v${version}`,
        title: `Version ${version}, fixed mask`,
        features: ['matrix'],
        run: () =>
          qrcode(ALPHANUMERIC_PAYLOADS[version])
            .options({mode: 'alphanumeric', version, mask: 0})
            .matrix(),
      }),
      workload({
        id: `matrix/auto-mask-v${version}`,
        title: `Version ${version}, automatic mask`,
        features: ['matrix'],
        run: () =>
          qrcode(ALPHANUMERIC_PAYLOADS[version]).options({mode: 'alphanumeric', version}).matrix(),
      }),
      workload({
        id: `matrix/auto-version-v${version}`,
        title: `Version ${version} payload, automatic version and mask`,
        features: ['matrix'],
        run: () => qrcode(ALPHANUMERIC_PAYLOADS[version]).options({mode: 'alphanumeric'}).matrix(),
      }),
    ]),
    ...MASKS.map((mask) =>
      workload({
        id: `matrix/mask-${mask}-v20`,
        title: `Version 20, mask ${mask}`,
        features: ['matrix'],
        run: () => qrcode('A').options({mode: 'alphanumeric', version: 20, mask}).matrix(),
      }),
    ),
  ],
};
