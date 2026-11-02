import {Component} from '@angular/core';

import {
  type QRCodePNGImageOptions,
  QRCodePNGImageRenderer,
  type QRCodePNGImageRendererOptions,
} from '@qrcodesdk/browser/png';
import type {QRCodeRenderer} from '@qrcodesdk/core';

import {QRCodeImageBase} from './qrcode-image-base';

/** Renders the QR code as an image element backed by a PNG data URL. */
@Component({
  selector: 'qrcode-png',
  template: '',
})
export class QRCodePNG extends QRCodeImageBase<QRCodePNGImageOptions> {
  protected override createRenderer(
    options: QRCodePNGImageRendererOptions | undefined,
  ): QRCodeRenderer<HTMLImageElement> {
    return QRCodePNGImageRenderer(options);
  }
}
