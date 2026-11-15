import {ɵencodeGIF} from '@qrcodesdk/core/internal/gif';
import {ɵencodeJPEG} from '@qrcodesdk/core/internal/jpeg';
import {ɵencodeWebP} from '@qrcodesdk/core/internal/webp';
import {type QRCodeMatrix, qrcode} from '@qrcodesdk/core/matrix';
import {rounded} from '@qrcodesdk/core/style';
import {
  QRCodeGIFRenderer,
  QRCodeJPEGRenderer,
  QRCodePNGRenderer,
  QRCodeWebPRenderer,
} from '@qrcodesdk/node';

import {
  ALPHANUMERIC_PAYLOADS,
  QR_VERSIONS,
  URL_PAYLOAD,
  type WorkloadGroup,
  workload,
} from '../workload.ts';

const MODULE_SIZE = 4;
const QUIET_ZONE = 4;

function matrixOf(version: (typeof QR_VERSIONS)[number]) {
  return qrcode(ALPHANUMERIC_PAYLOADS[version])
    .options({mode: 'alphanumeric', version, mask: 0})
    .matrix();
}

/** Square RGBA pixels with four pixels per module, prepared outside the timing. */
function pixelsOf(matrix: QRCodeMatrix, dark: readonly number[]) {
  const width = (matrix.width + QUIET_ZONE * 2) * MODULE_SIZE;
  const height = (matrix.height + QUIET_ZONE * 2) * MODULE_SIZE;
  const data = new Uint8ClampedArray(width * height * 4).fill(255);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const column = Math.floor(x / MODULE_SIZE) - QUIET_ZONE;
      const row = Math.floor(y / MODULE_SIZE) - QUIET_ZONE;
      if (column < 0 || row < 0 || column >= matrix.width || row >= matrix.height) continue;
      if (!matrix.modules[row * matrix.width + column]) continue;
      data.set([...dark, 255], (y * width + x) * 4);
    }
  }
  return {width, height, data};
}

const GRAY = [24, 24, 24];
const DARK = [17, 24, 39];
const COLOR = [124, 58, 237];

const renderers = {
  png: QRCodePNGRenderer,
  webp: QRCodeWebPRenderer,
  gif: QRCodeGIFRenderer,
  jpeg: QRCodeJPEGRenderer,
} as const;

export const group: WorkloadGroup = {
  id: 'raster-node',
  workloads: [
    ...QR_VERSIONS.flatMap((version) => [
      ...(Object.keys(renderers) as (keyof typeof renderers)[]).map((format) =>
        workload({
          id: `node/${format}-v${version}`,
          title: `Version ${version}: ${format.toUpperCase()} file`,
          features: [format],
          targets: ['node'],
          setup: () => ({
            matrix: matrixOf(version),
            render: renderers[format]({style: {moduleSize: MODULE_SIZE, quietZone: QUIET_ZONE}}),
          }),
          run: ({matrix, render}) => render(matrix),
        }),
      ),
      workload({
        id: `node/png-styled-v${version}`,
        title: `Version ${version}: styled PNG file`,
        features: ['png', 'styling'],
        targets: ['node'],
        setup: () => ({
          matrix: matrixOf(version),
          render: QRCodePNGRenderer({
            style: {moduleSize: MODULE_SIZE, quietZone: QUIET_ZONE, modules: rounded()},
          }),
        }),
        run: ({matrix, render}) => render(matrix),
      }),
      workload({
        id: `encoder/jpeg-gray-v${version}`,
        title: `Version ${version}: JPEG encoder, grayscale pixels`,
        features: ['jpeg'],
        setup: () => pixelsOf(matrixOf(version), GRAY),
        run: (pixels) => ɵencodeJPEG(pixels),
      }),
      workload({
        id: `encoder/jpeg-color-v${version}`,
        title: `Version ${version}: JPEG encoder, color pixels`,
        features: ['jpeg'],
        setup: () => pixelsOf(matrixOf(version), COLOR),
        run: (pixels) => ɵencodeJPEG(pixels),
      }),
      workload({
        id: `encoder/webp-v${version}`,
        title: `Version ${version}: WebP encoder`,
        features: ['webp'],
        setup: () => pixelsOf(matrixOf(version), DARK),
        run: (pixels) => ɵencodeWebP(pixels),
      }),
      workload({
        id: `encoder/gif-v${version}`,
        title: `Version ${version}: GIF encoder`,
        features: ['gif'],
        setup: () => pixelsOf(matrixOf(version), DARK),
        run: (pixels) => ɵencodeGIF(pixels),
      }),
    ]),
    workload({
      id: 'end-to-end/url-png',
      title: 'URL to PNG file',
      features: ['matrix', 'png'],
      targets: ['node'],
      setup: () => QRCodePNGRenderer(),
      run: (render) => qrcode(URL_PAYLOAD).render(render),
    }),
  ],
};
