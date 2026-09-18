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

import {type QRCodeCanvasOptions, QRCodeCanvasRenderer} from '@qrcodesdk/browser';
import {type QRCodePayload, qrcode} from '@qrcodesdk/core';

import {replaceElementChildren} from './render-element';
import {splitOptions} from './split-options';

@Component({
  selector: 'qrcode-canvas',
  template: '',
})
export class QRCodeCanvas {
  private readonly renderer = inject(Renderer2);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly qrcode = inject(ElementRef);

  readonly payload = input.required<QRCodePayload>();

  readonly options = input<QRCodeCanvasOptions>();

  private readonly resolvedOptions = computed(() => splitOptions(this.options()));
  private readonly canvasRenderer = computed(() => QRCodeCanvasRenderer(this.resolvedOptions()[1]));

  private readonly qrcodeBuilder = computed(() =>
    qrcode(this.payload()).options(this.resolvedOptions()[0]).renderer(this.canvasRenderer()),
  );

  constructor() {
    effect(() => {
      if (!this.isBrowser) return;

      const canvas = this.qrcodeBuilder().render();

      replaceElementChildren(this.renderer, this.qrcode, canvas);
    });
  }
}
