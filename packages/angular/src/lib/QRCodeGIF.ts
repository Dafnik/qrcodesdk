import {Component} from '@angular/core';

import {
  type QRCodeGIFImageOptions,
  QRCodeGIFImageRenderer,
  type QRCodeGIFImageRendererOptions,
} from '@qrcodesdk/browser/gif';
import type {QRCodeRenderer} from '@qrcodesdk/core';

import {QRCodeImageBase} from './qrcode-image-base';

/** Renders the QR code as an image element backed by a GIF data URL. */
@Component({
  selector: 'qrcode-gif',
  template: '',
})
export class QRCodeGIF extends QRCodeImageBase<QRCodeGIFImageOptions> {
  protected override createRenderer(
    options: QRCodeGIFImageRendererOptions | undefined,
  ): QRCodeRenderer<HTMLImageElement> {
    return QRCodeGIFImageRenderer(options);
  }
}
