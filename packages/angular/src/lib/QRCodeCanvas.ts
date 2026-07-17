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
import {type QRCodeInputData, qrcode} from '@qrcodesdk/core';

import {replaceElementChildren} from './render-element';

@Component({
  selector: 'qrcode-canvas',
  template: '',
})
export class QRCodeCanvas {
  private readonly renderer = inject(Renderer2);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly qrcode = inject(ElementRef);

  data = input.required<QRCodeInputData>();

  options = input<QRCodeCanvasOptions>();

  readonly canvasRenderer = computed(() => QRCodeCanvasRenderer(this.options()));

  readonly qrcodeBuilder = computed(() =>
    qrcode(this.data()).config(this.options()).renderer(this.canvasRenderer()),
  );

  constructor() {
    effect(() => {
      if (!this.isBrowser) return;

      const canvas = this.qrcodeBuilder().render();

      replaceElementChildren(this.renderer, this.qrcode, canvas);
    });
  }
}
