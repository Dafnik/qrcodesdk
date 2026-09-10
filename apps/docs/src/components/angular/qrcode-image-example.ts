import {Component} from '@angular/core';

import {QRCodeImage, type QRCodeImageOptions} from '@qrcodesdk/angular';

@Component({
  selector: 'qrcode-angular-image-example',
  imports: [QRCodeImage],
  template: `
    <qrcode-image [options]="options" payload="https://qrcodesdk.dev" />
  `,
})
export class QRCodeImageExample {
  protected readonly options: QRCodeImageOptions = {
    style: {moduleSize: 8, quietZone: 4},
    accessibility: {
      alt: 'QR code for qrcodesdk.dev',
      ariaLabel: 'Scan to open qrcodesdk.dev',
    },
  };
}
