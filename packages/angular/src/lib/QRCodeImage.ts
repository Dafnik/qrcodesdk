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

import {
  QRCodeDownloadImageRenderer,
  QRCodeImageRenderer,
  type QRCodeImageRendererOptions,
} from '@qrcodesdk/browser';
import {type QRCodeMatrixOptions, qrcode} from '@qrcodesdk/core';

import {replaceElementChildren} from './render-element';

export type QRCodeImageOptions = QRCodeMatrixOptions & QRCodeImageRendererOptions;

@Component({
  selector: 'qrcode-image',
  template: '',
})
export class QRCodeImage {
  private readonly renderer = inject(Renderer2);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly qrcode = inject(ElementRef);

  data = input.required<string>();

  options = input<QRCodeImageOptions>();

  readonly imageRenderer = computed(() => QRCodeImageRenderer(this.options()));

  readonly qrcodeBuilder = computed(() =>
    qrcode(this.data()).config(this.options()).renderer(this.imageRenderer()),
  );

  constructor() {
    effect(() => {
      if (!this.isBrowser) return;

      const image = this.qrcodeBuilder().render();

      replaceElementChildren(this.renderer, this.qrcode, image);
    });
  }

  public download(filename?: string): void {
    if (!this.isBrowser) return;

    this.qrcodeBuilder().render(
      QRCodeDownloadImageRenderer({
        renderer: this.imageRenderer(),
        filename,
      }),
    );
  }
}
