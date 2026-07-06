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
      <button
        class="ring-offset-background focus-visible:ring-ring bg-accent-600 text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors hover:cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
        (click)="qrcode.download('qrcodesdk')"
        type="button">
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
