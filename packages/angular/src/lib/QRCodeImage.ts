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
  type QRCodeImageOptions,
  QRCodeImageRenderer,
} from '@qrcodesdk/browser';
import {type QRCodeInputData, qrcode} from '@qrcodesdk/core';

import {replaceElementChildren} from './render-element';
import {splitOptions} from './split-options';

@Component({
  selector: 'qrcode-image',
  template: '',
})
export class QRCodeImage {
  private readonly renderer = inject(Renderer2);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly qrcode = inject(ElementRef);

  data = input.required<QRCodeInputData>();

  options = input<QRCodeImageOptions>();

  readonly resolvedOptions = computed(() => splitOptions(this.options()));
  readonly imageRenderer = computed(() => QRCodeImageRenderer(this.resolvedOptions()[1]));

  readonly qrcodeBuilder = computed(() =>
    qrcode(this.data()).config(this.resolvedOptions()[0]).renderer(this.imageRenderer()),
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
