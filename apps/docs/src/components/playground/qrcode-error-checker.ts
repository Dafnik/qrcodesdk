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
    const builder = qrcode(config.data).config(config);
    switch (config.output) {
      case 'canvas':
        builder.render(QRCodeCanvasRenderer(createPlaygroundCanvasOptions(config, preparedImage)));
        break;
      case 'image':
        builder.render(QRCodeImageRenderer(createPlaygroundImageOptions(config, preparedImage)));
        break;
      case 'svg':
        builder.render(QRCodeSVGRenderer(createPlaygroundSVGOptions(config, preparedImage)));
        break;
    }

    return undefined;
  } catch (e) {
    return e;
  }
}
