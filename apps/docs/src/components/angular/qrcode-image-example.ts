import {Component} from '@angular/core';

import {QRCodeImage} from '@qrcodesdk/angular';
import type {QRCodeImageOptions} from '@qrcodesdk/browser';

@Component({
  selector: 'qrcode-angular-image-example',
  imports: [QRCodeImage],
  template: `
    <qrcode-image [options]="options" data="https://qrcodesdk.dev" />
  `,
})
export class QRCodeImageExample {
  protected readonly options: QRCodeImageOptions = {
    size: 8,
    margin: 4,
    alt: 'QR code for qrcodesdk.dev',
    ariaLabel: 'Scan to open qrcodesdk.dev',
  };
}
