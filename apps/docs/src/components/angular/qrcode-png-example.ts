import {Component} from '@angular/core';

import {QRCodePNG, type QRCodePNGImageOptions} from '@qrcodesdk/angular';

@Component({
  selector: 'qrcode-angular-png-example',
  imports: [QRCodePNG],
  template: `
    <qrcode-png [options]="options" payload="https://qrcodesdk.dev" />
  `,
})
export class QRCodePNGExample {
  protected readonly options: QRCodePNGImageOptions = {
    style: {moduleSize: 8, quietZone: 4},
    accessibility: {
      alt: 'QR code for qrcodesdk.dev',
      ariaLabel: 'Scan to open qrcodesdk.dev',
    },
  };
}
