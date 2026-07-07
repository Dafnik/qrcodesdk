import {Component, ElementRef, Renderer2, computed, effect, inject, input} from '@angular/core';

import {DownloadSVGQRCodeRenderer} from '@qrcodesdk/browser';
import {
  type QRCodeMatrixOptions,
  type QRCodeSVGRendererOptions,
  SVGQRCodeRenderer,
  qrcode,
} from '@qrcodesdk/core';

export type QRCodeSVGOptions = QRCodeMatrixOptions & QRCodeSVGRendererOptions;

@Component({
  selector: 'svg-qrcode',
  template: '',
})
export class SVGQRCode {
  private readonly renderer = inject(Renderer2);
  private readonly qrcode = inject(ElementRef);

  data = input.required<string>();

  options = input<QRCodeSVGOptions>();

  readonly svgRenderer = computed(() => SVGQRCodeRenderer(this.options()));

  readonly qrcodeBuilder = computed(() => {
    const options = this.options();
    return qrcode(this.data())
      .version(options?.version)
      .errorCorrection(options?.errorCorrectionLevel)
      .mode(options?.mode)
      .mask(options?.mask)
      .renderer(this.svgRenderer());
  });

  constructor() {
    effect(() => {
      const qrcodeBuilder = this.qrcodeBuilder();
      const svg = qrcodeBuilder.render();

      this.renderer.setProperty(this.qrcode.nativeElement, 'innerHTML', svg);
    });
  }

  public download(filename?: string): void {
    this.qrcodeBuilder().render(
      DownloadSVGQRCodeRenderer({
        renderer: this.svgRenderer(),
        filename,
      }),
    );
  }
}
