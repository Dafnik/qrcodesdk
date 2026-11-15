import {QRCodeCanvasRenderer} from '@qrcodesdk/browser/canvas';
import {QRCodeGIFImageRenderer} from '@qrcodesdk/browser/gif';
import {QRCodeJPEGImageRenderer} from '@qrcodesdk/browser/jpeg';
import {QRCodePNGImageRenderer} from '@qrcodesdk/browser/png';
import {QRCodeWebPImageRenderer} from '@qrcodesdk/browser/webp';
import {qrcode} from '@qrcodesdk/core/matrix';
import {circle, finder, rounded} from '@qrcodesdk/core/style';

import {
  ALPHANUMERIC_PAYLOADS,
  QR_VERSIONS,
  URL_PAYLOAD,
  type WorkloadGroup,
  workload,
} from '../workload.ts';

const STYLE = {moduleSize: 4, quietZone: 4} as const;

function matrixOf(version: (typeof QR_VERSIONS)[number]) {
  return qrcode(ALPHANUMERIC_PAYLOADS[version])
    .options({mode: 'alphanumeric', version, mask: 0})
    .matrix();
}

const images = {
  png: QRCodePNGImageRenderer,
  webp: QRCodeWebPImageRenderer,
  gif: QRCodeGIFImageRenderer,
  jpeg: QRCodeJPEGImageRenderer,
} as const;

export const group: WorkloadGroup = {
  id: 'browser',
  workloads: [
    ...QR_VERSIONS.flatMap((version) => [
      workload({
        id: `canvas/plain-v${version}`,
        title: `Version ${version}: canvas`,
        features: ['canvas'],
        targets: ['browser'],
        setup: () => ({matrix: matrixOf(version), render: QRCodeCanvasRenderer({style: STYLE})}),
        run: ({matrix, render}) => render(matrix),
      }),
      workload({
        id: `canvas/styled-v${version}`,
        title: `Version ${version}: styled canvas`,
        features: ['canvas', 'styling'],
        targets: ['browser'],
        setup: () => ({
          matrix: matrixOf(version),
          render: QRCodeCanvasRenderer({
            style: {...STYLE, modules: rounded(), finder: finder({center: circle()})},
          }),
        }),
        run: ({matrix, render}) => render(matrix),
      }),
      ...(Object.keys(images) as (keyof typeof images)[]).map((format) =>
        workload({
          id: `image/${format}-v${version}`,
          title: `Version ${version}: ${format.toUpperCase()} image element`,
          features: ['canvas', format],
          targets: ['browser'],
          setup: () => ({matrix: matrixOf(version), render: images[format]({style: STYLE})}),
          run: ({matrix, render}) => render(matrix),
        }),
      ),
    ]),
    workload({
      id: 'end-to-end/url-canvas',
      title: 'URL to canvas',
      features: ['matrix', 'canvas'],
      targets: ['browser'],
      setup: () => QRCodeCanvasRenderer(),
      run: (render) => qrcode(URL_PAYLOAD).render(render),
    }),
  ],
};
