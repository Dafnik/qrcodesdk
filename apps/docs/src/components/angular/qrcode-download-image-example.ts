import {Component, viewChild} from '@angular/core';

import {QRCodeImage} from '@qrcodesdk/angular';

@Component({
  selector: 'qrcode-angular-download-image-example',
  imports: [QRCodeImage],
  template: `
    <div class="flex flex-col items-center">
      <qrcode-image
        #qrcode
        [options]="{
          alt: 'QR code for qrcodesdk.dev',
        }"
        data="https://qrcodesdk.dev" />
      <button class="btn-primary" (click)="qrcode.download('qrcodesdk')" type="button">
        Download PNG
      </button>
    </div>
  `,
})
export class QRCodeDownloadImageExample {
  private readonly qrCode = viewChild.required(QRCodeImage);

  protected download() {
    this.qrCode().download('qrcode.png');
  }
}
