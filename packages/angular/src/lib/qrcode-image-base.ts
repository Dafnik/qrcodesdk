import {isPlatformBrowser} from '@angular/common';
import {
  Directive,
  ElementRef,
  PLATFORM_ID,
  Renderer2,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';

import {QRCodeDownloadImageRenderer} from '@qrcodesdk/browser/image';
import {
  type QRCodeMatrixOptions,
  type QRCodePayload,
  type QRCodeRenderer,
  qrcode,
} from '@qrcodesdk/core';

import {replaceElementChildren} from './render-element';
import {splitOptions} from './split-options';
import type {QRCodeDownloadHandle} from './types';

/** Shared by the image components, so each format loads only its own encoder. */
@Directive()
export abstract class QRCodeImageBase<
  TOptions extends {readonly matrix?: QRCodeMatrixOptions},
> implements QRCodeDownloadHandle {
  private readonly renderer = inject(Renderer2);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly qrcode = inject(ElementRef);

  readonly payload = input.required<QRCodePayload>();

  readonly options = input<TOptions>();

  private readonly resolvedOptions = computed(() => splitOptions(this.options()));
  private readonly imageRenderer = computed(() => this.createRenderer(this.resolvedOptions()[1]));

  private readonly qrcodeBuilder = computed(() =>
    qrcode(this.payload()).options(this.resolvedOptions()[0]).renderer(this.imageRenderer()),
  );

  constructor() {
    effect(() => {
      if (!this.isBrowser) return;

      const image = this.qrcodeBuilder().render();

      replaceElementChildren(this.renderer, this.qrcode, image);
    });
  }

  protected abstract createRenderer(
    options: Omit<TOptions, 'matrix'> | undefined,
  ): QRCodeRenderer<HTMLImageElement>;

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
