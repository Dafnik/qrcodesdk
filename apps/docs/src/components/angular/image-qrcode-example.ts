import {Component} from '@angular/core';

import {ImageQRCode, type QRCodeImageOptions} from '@qrcodesdk/angular';

@Component({
  selector: 'AngularImageQRCodeExample',
  imports: [ImageQRCode],
  template: `
    <image-qrcode [options]="options" data="https://qrcodesdk.dev" />
  `,
})
export class ImageQRCodeExample {
  options: QRCodeImageOptions = {
    size: 8,
    margin: 4,
    alt: 'QR code for qrcodesdk.dev',
    ariaLabel: 'Scan to open qrcodesdk.dev',
  };
}
