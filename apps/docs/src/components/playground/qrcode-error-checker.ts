import {QRCodeCanvasRenderer, QRCodeImageRenderer} from '@qrcodesdk/browser';
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

import {
  type PlaygroundOptions,
  type PlaygroundPreparedImage,
  createPlaygroundCanvasOptions,
  createPlaygroundImageOptions,
  createPlaygroundSVGOptions,
  playgroundPreparedImage,
} from './playground-options.ts';

export function hasQRCodeError(
  options: PlaygroundOptions,
  preparedImage: PlaygroundPreparedImage | undefined = playgroundPreparedImage.get(),
) {
  try {
    switch (options.output) {
      case 'canvas': {
        const {matrix, ...rendererOptions} = createPlaygroundCanvasOptions(options, preparedImage);
        qrcode(options.payload).options(matrix).render(QRCodeCanvasRenderer(rendererOptions));
        break;
      }
      case 'image': {
        const {matrix, ...rendererOptions} = createPlaygroundImageOptions(options, preparedImage);
        qrcode(options.payload).options(matrix).render(QRCodeImageRenderer(rendererOptions));
        break;
      }
      case 'svg': {
        const {matrix, ...rendererOptions} = createPlaygroundSVGOptions(options, preparedImage);
        qrcode(options.payload).options(matrix).render(QRCodeSVGRenderer(rendererOptions));
        break;
      }
    }

    return undefined;
  } catch (e) {
    return e;
  }
}
