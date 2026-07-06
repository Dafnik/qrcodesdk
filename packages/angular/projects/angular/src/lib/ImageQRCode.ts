import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  PLATFORM_ID,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  Renderer2,
} from '@angular/core';
import { type QRCodeMatrixOptions, qrcode } from '@qrcodesdk/core';

import {
  DownloadImageQRCodeRenderer,
  ImageQRCodeRenderer,
  type QRCodeImageRendererOptions,
} from '@qrcodesdk/browser';

import { replaceElementChildren } from './render-element';

export type QRCodeImageOptions = QRCodeMatrixOptions & QRCodeImageRendererOptions;

@Component({
  selector: 'image-qrcode',
  template: '',
})
export class ImageQRCode {
  private readonly renderer = inject(Renderer2);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly qrcode = inject(ElementRef);

  data = input.required<string>();

  options = input<QRCodeImageOptions>();

  readonly imageRenderer = computed(() => ImageQRCodeRenderer(this.options()));

  readonly qrcodeBuilder = computed(() => {
    const options = this.options();
    return qrcode(this.data())
      .version(options?.version)
      .errorCorrection(options?.errorCorrectionLevel)
      .mode(options?.mode)
      .mask(options?.mask)
      .renderer(this.imageRenderer());
  });

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
      DownloadImageQRCodeRenderer({
        renderer: this.imageRenderer(),
        filename,
      }),
    );
  }
}
