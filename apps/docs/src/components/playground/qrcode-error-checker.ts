import {QRCodeCanvasRenderer, QRCodeImageRenderer} from '@qrcodesdk/browser';
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

import {
  type PlaygroundConfig,
  type PlaygroundPreparedImage,
  createPlaygroundCanvasOptions,
  createPlaygroundImageOptions,
  createPlaygroundSVGOptions,
  playgroundPreparedImage,
} from './playground-config.ts';

export function hasQRCodeError(
  config: PlaygroundConfig,
  preparedImage: PlaygroundPreparedImage | undefined = playgroundPreparedImage.get(),
) {
  try {
    switch (config.output) {
      case 'canvas': {
        const {matrix, ...rendererOptions} = createPlaygroundCanvasOptions(config, preparedImage);
        qrcode(config.data).config(matrix).render(QRCodeCanvasRenderer(rendererOptions));
        break;
      }
      case 'image': {
        const {matrix, ...rendererOptions} = createPlaygroundImageOptions(config, preparedImage);
        qrcode(config.data).config(matrix).render(QRCodeImageRenderer(rendererOptions));
        break;
      }
      case 'svg': {
        const {matrix, ...rendererOptions} = createPlaygroundSVGOptions(config, preparedImage);
        qrcode(config.data).config(matrix).render(QRCodeSVGRenderer(rendererOptions));
        break;
      }
    }

    return undefined;
  } catch (e) {
    return e;
  }
}
