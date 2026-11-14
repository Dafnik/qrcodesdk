import {Component} from '@angular/core';

import {QRCodeWebP, type QRCodeWebPImageOptions} from '@qrcodesdk/angular';

@Component({
  selector: 'qrcode-angular-webp-example',
  imports: [QRCodeWebP],
  template: `
    <qrcode-webp [options]="options" payload="https://qrcodesdk.dev" />
  `,
})
export class QRCodeWebPExample {
  protected readonly options: QRCodeWebPImageOptions = {
    style: {moduleSize: 8, quietZone: 4},
    accessibility: {
      alt: 'QR code: scan to open qrcodesdk.dev',
    },
  };
}
