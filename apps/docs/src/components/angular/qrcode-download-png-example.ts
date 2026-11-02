import {Component, viewChild} from '@angular/core';

import {QRCodePNG} from '@qrcodesdk/angular';

@Component({
  selector: 'qrcode-angular-download-png-example',
  imports: [QRCodePNG],
  template: `
    <div class="flex flex-col items-center gap-2">
      <qrcode-png
        #qrcode
        [options]="{
          accessibility: {alt: 'QR code for qrcodesdk.dev'},
        }"
        payload="https://qrcodesdk.dev" />
      <button class="btn-primary" (click)="qrcode.download('qrcodesdk')" type="button">
        Download PNG
      </button>
    </div>
  `,
})
export class QRCodeDownloadPNGExample {
  private readonly qrCode = viewChild.required(QRCodePNG);

  protected download() {
    this.qrCode().download('qrcode.png');
  }
}
