import {Component} from '@angular/core';

import {QRCodeCanvas} from '@qrcodesdk/angular';
import type {QRCodeCanvasOptions} from '@qrcodesdk/browser';

@Component({
  selector: 'qrcode-angular-canvas-example',
  imports: [QRCodeCanvas],
  template: `
    <qrcode-canvas [options]="options" data="https://qrcodesdk.dev" />
  `,
})
export class QRCodeCanvasExample {
  options: QRCodeCanvasOptions = {
    size: 8,
    margin: 4,
    colors: {
      colorDark: '#111827',
      colorLight: '#ffffff',
    },
  };
}
