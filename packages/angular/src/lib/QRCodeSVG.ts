import {Component, ElementRef, Renderer2, computed, effect, inject, input} from '@angular/core';

import {QRCodeDownloadSVGRenderer} from '@qrcodesdk/browser';
import {
  type QRCodeInputData,
  type QRCodeSVGOptions,
  QRCodeSVGRenderer,
  qrcode,
} from '@qrcodesdk/core';

@Component({
  selector: 'qrcode-svg',
  template: '',
})
export class QRCodeSVG {
  private readonly renderer = inject(Renderer2);
  private readonly qrcode = inject(ElementRef);

  data = input.required<QRCodeInputData>();

  options = input<QRCodeSVGOptions>();

  readonly svgRenderer = computed(() => QRCodeSVGRenderer(this.options()));

  readonly qrcodeBuilder = computed(() =>
    qrcode(this.data()).config(this.options()).renderer(this.svgRenderer()),
  );

  constructor() {
    effect(() => {
      const qrcodeBuilder = this.qrcodeBuilder();
      const svg = qrcodeBuilder.render();

      this.renderer.setProperty(this.qrcode.nativeElement, 'innerHTML', svg);
    });
  }

  public download(filename?: string): void {
    this.qrcodeBuilder().render(
      QRCodeDownloadSVGRenderer({
        renderer: this.svgRenderer(),
        filename,
      }),
    );
  }
}
