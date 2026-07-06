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

import { CanvasQRCodeRenderer, type QRCodeCanvasRendererOptions } from '@qrcodesdk/browser';

import { replaceElementChildren } from './render-element';

export type QRCodeCanvasOptions = QRCodeMatrixOptions & QRCodeCanvasRendererOptions;

@Component({
  selector: 'canvas-qrcode',
  template: '',
})
export class CanvasQRCode {
  private readonly renderer = inject(Renderer2);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly qrcode = inject(ElementRef);

  data = input.required<string>();

  options = input<QRCodeCanvasOptions>();

  readonly canvasRenderer = computed(() => CanvasQRCodeRenderer(this.options()));

  readonly qrcodeBuilder = computed(() => {
    const options = this.options();
    return qrcode(this.data())
      .version(options?.version)
      .errorCorrection(options?.errorCorrectionLevel)
      .mode(options?.mode)
      .mask(options?.mask)
      .renderer(this.canvasRenderer());
  });

  constructor() {
    effect(() => {
      if (!this.isBrowser) return;

      const canvas = this.qrcodeBuilder().render();

      replaceElementChildren(this.renderer, this.qrcode, canvas);
    });
  }
}
