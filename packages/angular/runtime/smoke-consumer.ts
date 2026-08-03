import {Component, VERSION} from '@angular/core';

import {QRCodeCanvas, QRCodeImage, QRCodeSVG} from '@qrcodesdk/angular';

@Component({
  selector: 'app-root',
  imports: [QRCodeSVG, QRCodeImage, QRCodeCanvas],
  template: `
    <main>
      <p data-testid="framework-version">Angular {{ frameworkVersion }}</p>
      <section data-testid="qrcode-svg">
        <qrcode-svg [options]="options" data="HELLO" />
      </section>
      <section data-testid="qrcode-image">
        <qrcode-image [options]="imageOptions" data="HELLO" />
      </section>
      <section data-testid="qrcode-canvas">
        <qrcode-canvas [options]="options" data="HELLO" />
      </section>
    </main>
  `,
})
export class App {
  protected readonly frameworkVersion = VERSION.full;
  protected readonly options = {size: 2, margin: 1};
  protected readonly imageOptions = {
    ...this.options,
    alt: 'Framework runtime QR code',
    ariaLabel: 'Framework runtime QR code',
  };
}
