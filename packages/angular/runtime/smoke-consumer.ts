import {Component, VERSION} from '@angular/core';

import {QRCodeCanvas, QRCodeJPEG, QRCodePNG, QRCodeSVG, kanji} from '@qrcodesdk/angular';

@Component({
  selector: 'app-root',
  imports: [QRCodeSVG, QRCodePNG, QRCodeJPEG, QRCodeCanvas],
  template: `
    <main>
      <p data-testid="framework-version">Angular {{ frameworkVersion }}</p>
      <section data-testid="qrcode-svg">
        <qrcode-svg [options]="options" payload="HELLO" />
      </section>
      <section data-testid="qrcode-image">
        <qrcode-png [options]="imageOptions" payload="HELLO" />
      </section>
      <section data-testid="qrcode-jpeg">
        <qrcode-jpeg [options]="imageOptions" payload="HELLO" />
      </section>
      <section data-testid="qrcode-canvas">
        <qrcode-canvas [options]="options" payload="HELLO" />
      </section>
      <section data-testid="qrcode-kanji-svg">
        <qrcode-svg [options]="kanjiOptions" payload="東京タワー" />
      </section>
    </main>
  `,
})
export class App {
  protected readonly frameworkVersion = VERSION.full;
  protected readonly options = {style: {moduleSize: 2, quietZone: 1}};
  // Kanji mode fits this payload into version 1; UTF-8 octets would need version 2.
  protected readonly kanjiOptions = {...this.options, matrix: {kanji}};
  protected readonly imageOptions = {
    ...this.options,
    accessibility: {
      alt: 'Framework runtime QR code',
      ariaLabel: 'Framework runtime QR code',
    },
  };
}
