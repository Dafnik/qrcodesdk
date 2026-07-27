import {QRCodeCanvasRenderer, QRCodeImageRenderer} from '@qrcodesdk/browser';
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

import type {PlaygroundConfig} from './playground-config.ts';

export function hasQRCodeError(config: PlaygroundConfig) {
  try {
    const builder = qrcode(config.data).config(config);
    switch (config.output) {
      case 'canvas':
        builder.render(QRCodeCanvasRenderer(config));
        break;
      case 'image':
        builder.render(QRCodeImageRenderer(config));
        break;
      case 'svg':
        builder.render(QRCodeSVGRenderer(config));
        break;
    }

    return undefined;
  } catch (e) {
    return e;
  }
}
