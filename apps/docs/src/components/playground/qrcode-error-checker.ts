import {
  QRCodeCanvasRenderer,
  QRCodeGIFImageRenderer,
  QRCodeJPEGImageRenderer,
  QRCodePNGImageRenderer,
  QRCodeWebPImageRenderer,
} from '@qrcodesdk/browser';
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

import {
  type PlaygroundOptions,
  type PlaygroundPreparedImage,
  createPlaygroundCanvasOptions,
  createPlaygroundImageOptions,
  createPlaygroundSVGOptions,
  playgroundPreparedImage,
} from './playground-options.ts';

const IMAGE_RENDERERS = {
  png: QRCodePNGImageRenderer,
  webp: QRCodeWebPImageRenderer,
  gif: QRCodeGIFImageRenderer,
  jpeg: QRCodeJPEGImageRenderer,
} as const;

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
      case 'png':
      case 'webp':
      case 'gif':
      case 'jpeg': {
        const {matrix, ...rendererOptions} = createPlaygroundImageOptions(options, preparedImage);
        qrcode(options.payload)
          .options(matrix)
          .render(IMAGE_RENDERERS[options.output](rendererOptions));
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
