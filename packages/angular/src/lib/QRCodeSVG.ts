import {isPlatformBrowser} from '@angular/common';
import {
  Component,
  ElementRef,
  PLATFORM_ID,
  Renderer2,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';

import {QRCodeDownloadSVGRenderer} from '@qrcodesdk/browser';
import {
  type QRCodeInputData,
  type QRCodeSVGOptions,
  QRCodeSVGRenderer,
  qrcode,
} from '@qrcodesdk/core';

import {splitOptions} from './split-options';

@Component({
  selector: 'qrcode-svg',
  template: '',
})
export class QRCodeSVG {
  private readonly renderer = inject(Renderer2);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly qrcode = inject(ElementRef);

  data = input.required<QRCodeInputData>();

  options = input<QRCodeSVGOptions>();

  readonly resolvedOptions = computed(() => splitOptions(this.options()));
  readonly svgRenderer = computed(() => QRCodeSVGRenderer(this.resolvedOptions()[1]));

  readonly qrcodeBuilder = computed(() =>
    qrcode(this.data()).config(this.resolvedOptions()[0]).renderer(this.svgRenderer()),
  );

  constructor() {
    effect(() => {
      const qrcodeBuilder = this.qrcodeBuilder();
      const svg = qrcodeBuilder.render();

      this.renderer.setProperty(this.qrcode.nativeElement, 'innerHTML', svg);
    });
  }

  public download(filename?: string): void {
    if (!this.isBrowser) return;

    this.qrcodeBuilder().render(
      QRCodeDownloadSVGRenderer({
        renderer: this.svgRenderer(),
        filename,
      }),
    );
  }
}
