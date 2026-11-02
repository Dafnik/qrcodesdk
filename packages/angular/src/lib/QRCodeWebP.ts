import {Component} from '@angular/core';

import {
  type QRCodeWebPImageOptions,
  QRCodeWebPImageRenderer,
  type QRCodeWebPImageRendererOptions,
} from '@qrcodesdk/browser/webp';
import type {QRCodeRenderer} from '@qrcodesdk/core';

import {QRCodeImageBase} from './qrcode-image-base';

/** Renders the QR code as an image element backed by a WebP data URL. */
@Component({
  selector: 'qrcode-webp',
  template: '',
})
export class QRCodeWebP extends QRCodeImageBase<QRCodeWebPImageOptions> {
  protected override createRenderer(
    options: QRCodeWebPImageRendererOptions | undefined,
  ): QRCodeRenderer<HTMLImageElement> {
    return QRCodeWebPImageRenderer(options);
  }
}
