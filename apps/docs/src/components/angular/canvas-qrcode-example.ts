import {Component} from '@angular/core';

import {CanvasQRCode, type QRCodeCanvasOptions} from '@qrcodesdk/angular';

@Component({
  selector: 'AngularCanvasQRCodeExample',
  imports: [CanvasQRCode],
  template: `
    <canvas-qrcode [options]="options" data="https://qrcodesdk.dev" />
  `,
})
export class CanvasQRCodeExample {
  options: QRCodeCanvasOptions = {
    size: 8,
    margin: 4,
    colors: {
      colorDark: '#111827',
      colorLight: '#ffffff',
    },
  };
}
