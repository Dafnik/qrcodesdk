import {Component, viewChild} from '@angular/core';

import {ImageQRCode} from '@qrcodesdk/angular';

@Component({
  selector: 'AngularImageQRCodeDownloadExample',
  imports: [ImageQRCode],
  template: `
    <div class="flex flex-col items-center">
      <image-qrcode
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
export class DownloadImageQrcodeExample {
  private readonly qrCode = viewChild.required(ImageQRCode);

  protected download() {
    this.qrCode().download('qrcode.png');
  }
}
