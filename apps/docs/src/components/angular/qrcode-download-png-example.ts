import {Component} from '@angular/core';

import {QRCodePNG} from '@qrcodesdk/angular';

@Component({
  selector: 'qrcode-angular-download-png-example',
  imports: [QRCodePNG],
  template: `
    <qrcode-png
      #qrcode
      [options]="{
        accessibility: {alt: 'QR code: scan to open qrcodesdk.dev'},
      }"
      payload="https://qrcodesdk.dev" />
    <button (click)="qrcode.download('qrcodesdk')" type="button">Download PNG</button>
  `,
})
export class QRCodeDownloadPNGExample {}
