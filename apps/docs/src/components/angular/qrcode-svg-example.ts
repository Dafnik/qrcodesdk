import {Component} from '@angular/core';

import {QRCodeSVG} from '@qrcodesdk/angular';

@Component({
  selector: 'qrcode-angular-svg-example',
  imports: [QRCodeSVG],
  template: `
    <qrcode-svg
      [options]="{
        title: 'QR code for qrcodesdk.dev',
        ariaLabel: 'Scan to open qrcodesdk.dev',
      }"
      data="https://qrcodesdk.dev" />
  `,
})
export class QRCodeSVGExample {}
