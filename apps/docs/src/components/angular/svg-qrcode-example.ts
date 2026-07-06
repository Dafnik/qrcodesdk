import {Component} from '@angular/core';

import {SVGQRCode} from '@qrcodesdk/angular';

@Component({
  selector: 'AngularSVGQRCodeExample',
  imports: [SVGQRCode],
  template: `
    <svg-qrcode
      [options]="{
        title: 'QR code for qrcodesdk.dev',
        ariaLabel: 'Scan to open qrcodesdk.dev',
      }"
      data="https://qrcodesdk.dev" />
  `,
})
export class SVGQRCodeExample {}
