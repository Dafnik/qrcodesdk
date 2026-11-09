import {Component} from '@angular/core';

import {QRCodeGIF, type QRCodeGIFImageOptions} from '@qrcodesdk/angular';

@Component({
  selector: 'qrcode-angular-gif-example',
  imports: [QRCodeGIF],
  template: `
    <qrcode-gif [options]="options" payload="https://qrcodesdk.dev" />
  `,
})
export class QRCodeGIFExample {
  protected readonly options: QRCodeGIFImageOptions = {
    style: {moduleSize: 8, quietZone: 4},
    accessibility: {
      alt: 'QR code: scan to open qrcodesdk.dev',
    },
  };
}
