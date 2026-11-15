import {qrcode} from '@qrcodesdk/core/matrix';
import {circle, finder, rounded} from '@qrcodesdk/core/style';
import {QRCodeSVGRenderer, svgCenterImage} from '@qrcodesdk/core/svg';
import {QRCodeTextRenderer} from '@qrcodesdk/core/text';

import {
  ALPHANUMERIC_PAYLOADS,
  QR_VERSIONS,
  URL_PAYLOAD,
  type WorkloadGroup,
  workload,
} from '../workload.ts';

const STYLE = {
  background: '#f8fafccc',
  foreground: '#0f172aff',
  modules: rounded(),
  finder: finder({ring: rounded({radius: 1}), center: circle(), color: '#7c3aedff'}),
} as const;
const IMAGE = 'data:image/png;base64,AA==' as const;

function matrixOf(version: (typeof QR_VERSIONS)[number]) {
  return qrcode(ALPHANUMERIC_PAYLOADS[version])
    .options({mode: 'alphanumeric', version, mask: 0})
    .matrix();
}

export const group: WorkloadGroup = {
  id: 'renderers',
  workloads: [
    ...QR_VERSIONS.flatMap((version) => [
      workload({
        id: `svg/plain-v${version}`,
        title: `Version ${version}: SVG, reused renderer`,
        features: ['svg'],
        setup: () => ({matrix: matrixOf(version), render: QRCodeSVGRenderer()}),
        run: ({matrix, render}) => render(matrix),
      }),
      workload({
        id: `svg/fresh-v${version}`,
        title: `Version ${version}: SVG, new renderer per call`,
        features: ['svg'],
        setup: () => matrixOf(version),
        run: (matrix) => QRCodeSVGRenderer()(matrix),
      }),
      workload({
        id: `svg/styled-v${version}`,
        title: `Version ${version}: styled SVG`,
        features: ['svg', 'styling'],
        setup: () => ({matrix: matrixOf(version), render: QRCodeSVGRenderer({style: STYLE})}),
        run: ({matrix, render}) => render(matrix),
      }),
      workload({
        id: `svg/circle-v${version}`,
        title: `Version ${version}: circle SVG`,
        features: ['svg', 'styling'],
        setup: () => ({
          matrix: matrixOf(version),
          render: QRCodeSVGRenderer({style: {modules: circle()}}),
        }),
        run: ({matrix, render}) => render(matrix),
      }),
      workload({
        id: `svg/center-image-v${version}`,
        title: `Version ${version}: styled SVG with a center image`,
        features: ['svg', 'styling', 'center-image'],
        setup: () => ({
          matrix: matrixOf(version),
          render: QRCodeSVGRenderer({style: STYLE, centerImage: svgCenterImage(IMAGE)}),
        }),
        run: ({matrix, render}) => render(matrix),
      }),
      workload({
        id: `text/blocks-v${version}`,
        title: `Version ${version}: compact terminal text`,
        features: ['text'],
        setup: () => ({
          matrix: matrixOf(version),
          render: QRCodeTextRenderer({style: {moduleSize: 1, quietZone: 2}, layout: 'compact'}),
        }),
        run: ({matrix, render}) => render(matrix),
      }),
    ]),
    workload({
      id: 'end-to-end/url-svg',
      title: 'URL to SVG',
      features: ['matrix', 'svg'],
      setup: () => QRCodeSVGRenderer(),
      run: (render) => qrcode(URL_PAYLOAD).render(render),
    }),
    workload({
      id: 'end-to-end/url-styled-svg',
      title: 'URL to styled SVG with a center image',
      features: ['matrix', 'svg', 'styling', 'center-image'],
      setup: () => QRCodeSVGRenderer({style: STYLE, centerImage: svgCenterImage(IMAGE)}),
      run: (render) => qrcode(URL_PAYLOAD).render(render),
    }),
  ],
};
