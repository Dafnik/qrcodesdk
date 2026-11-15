import {ɵcreateQRCodeStyler, ɵtoQRCodePathData} from '@qrcodesdk/core/internal';
import {qrcode} from '@qrcodesdk/core/matrix';
import {alignment, circle, customShape, diagonal, finder, rounded} from '@qrcodesdk/core/style';

import {ALPHANUMERIC_PAYLOADS, QR_VERSIONS, type WorkloadGroup, workload} from '../workload.ts';

const HEXAGON = 'm.5 0 .5 .25v.5l-.5 .25-.5-.25v-.5z';
const STYLE = {
  background: '#f8fafccc',
  foreground: '#0f172aff',
  modules: rounded(),
  finder: finder({ring: rounded({radius: 1}), center: circle(), color: '#7c3aedff'}),
} as const;

function matrixOf(version: (typeof QR_VERSIONS)[number]) {
  return qrcode(ALPHANUMERIC_PAYLOADS[version])
    .options({mode: 'alphanumeric', version, mask: 0})
    .matrix();
}

export const group: WorkloadGroup = {
  id: 'styling',
  workloads: [
    workload({
      id: 'styling/setup-rounded-finder',
      title: 'Create rounded shapes, finder, and styler',
      features: ['styling'],
      run: () =>
        ɵcreateQRCodeStyler({
          modules: rounded(),
          finder: finder({ring: rounded({radius: 1}), center: circle()}),
        }),
    }),
    workload({
      id: 'styling/setup-circle',
      title: 'Create circle shape and styler',
      features: ['styling'],
      run: () => ɵcreateQRCodeStyler({modules: circle()}),
    }),
    workload({
      id: 'styling/setup-custom-shape',
      title: 'Parse a custom hexagon and create a styler',
      features: ['styling', 'custom-shape'],
      run: () => ɵcreateQRCodeStyler({modules: customShape({module: HEXAGON})}),
    }),
    workload({
      id: 'styling/setup-shared-shapes',
      title: 'Create a styler from shared shapes',
      features: ['styling'],
      run: () => ɵcreateQRCodeStyler(STYLE),
    }),
    ...QR_VERSIONS.flatMap((version) => {
      const draw = (
        title: string,
        id: string,
        style: Parameters<typeof ɵcreateQRCodeStyler>[0],
        features = ['styling'] as const,
      ) =>
        workload({
          id: `styling/draw-${id}-v${version}`,
          title: `Version ${version}: draw ${title}`,
          features: [...features],
          setup: () => ({matrix: matrixOf(version), styler: ɵcreateQRCodeStyler(style)}),
          run: ({matrix, styler}) => styler(matrix),
        });
      return [
        draw('plain modules', 'plain', undefined),
        draw('rounded modules and finder', 'styled', STYLE),
        draw('circle modules', 'circle', {modules: circle()}),
        draw('diagonal modules', 'diagonal', {modules: diagonal()}),
        draw('finder and alignment patterns', 'patterns', {
          finder: finder(),
          alignment: alignment(),
        }),
        workload({
          id: `styling/draw-custom-v${version}`,
          title: `Version ${version}: draw custom hexagons`,
          features: ['styling', 'custom-shape'],
          setup: () => ({
            matrix: matrixOf(version),
            styler: ɵcreateQRCodeStyler({modules: customShape({module: HEXAGON})}),
          }),
          run: ({matrix, styler}) => styler(matrix),
        }),
        workload({
          id: `styling/path-plain-v${version}`,
          title: `Version ${version}: serialize plain path data`,
          features: ['styling'],
          setup: () => ɵcreateQRCodeStyler()(matrixOf(version)).layers[0]!,
          run: (layer) => ɵtoQRCodePathData(layer),
        }),
        workload({
          id: `styling/path-styled-v${version}`,
          title: `Version ${version}: serialize styled path data`,
          features: ['styling'],
          setup: () => ɵcreateQRCodeStyler(STYLE)(matrixOf(version)).layers,
          run: (layers) => layers.map((layer) => ɵtoQRCodePathData(layer)),
        }),
      ];
    }),
  ],
};
