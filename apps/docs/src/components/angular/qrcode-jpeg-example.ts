import {Component} from '@angular/core';

import {QRCodeJPEG, type QRCodeJPEGImageOptions} from '@qrcodesdk/angular';

@Component({
  selector: 'qrcode-angular-jpeg-example',
  imports: [QRCodeJPEG],
  template: `
    <qrcode-jpeg [options]="options" payload="https://qrcodesdk.dev" />
  `,
})
export class QRCodeJPEGExample {
  protected readonly options: QRCodeJPEGImageOptions = {
    style: {moduleSize: 8, quietZone: 4},
    quality: 90,
    accessibility: {
      alt: 'QR code: scan to open qrcodesdk.dev',
    },
  };
}
