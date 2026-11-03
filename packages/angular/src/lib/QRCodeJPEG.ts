import {Component} from '@angular/core';

import {
  type QRCodeJPEGImageOptions,
  QRCodeJPEGImageRenderer,
  type QRCodeJPEGImageRendererOptions,
} from '@qrcodesdk/browser/jpeg';
import type {QRCodeRenderer} from '@qrcodesdk/core';

import {QRCodeImageBase} from './qrcode-image-base';

/** Renders the QR code as an image element backed by a JPEG data URL. */
@Component({
  selector: 'qrcode-jpeg',
  template: '',
})
export class QRCodeJPEG extends QRCodeImageBase<QRCodeJPEGImageOptions> {
  protected override createRenderer(
    options: QRCodeJPEGImageRendererOptions | undefined,
  ): QRCodeRenderer<HTMLImageElement> {
    return QRCodeJPEGImageRenderer(options);
  }
}
