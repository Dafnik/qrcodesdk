import {Component, DestroyRef, computed, inject, signal} from '@angular/core';

import {
  CanvasQRCode,
  ImageQRCode,
  type QRCodeCanvasOptions,
  type QRCodeImageOptions,
  type QRCodeSVGOptions,
  SVGQRCode,
} from '@qrcodesdk/angular';

import {createPlaygroundSnapshot, readPlaygroundDraftFromUrl} from './qrcode-playground-state';
import {
  type QRCodePlaygroundConfig,
  type QRCodePlaygroundSnapshot,
  QR_CODE_PLAYGROUND_UPDATE_EVENT,
} from './qrcode-playground-types';

@Component({
  selector: 'AngularQrcodePlaygroundPreview',
  imports: [CanvasQRCode, ImageQRCode, SVGQRCode],
  template: `
    @if (snapshot().draft.packageName === 'angular') {
      @if (!snapshot().config) {
        <div class="qrcode-playground__preview-error" role="status">
          {{ snapshot().validation.error || 'This QR code configuration is invalid.' }}
        </div>
      } @else if (config()?.output === 'svg') {
        <div class="qrcode-playground__preview-output">
          <svg-qrcode #qrcode [data]="config()!.data" [options]="svgOptions()" />
        </div>
        <button
          class="qrcode-playground__button qrcode-playground__button--wide"
          (click)="qrcode.download('qrcodesdk')"
          type="button">
          Download SVG
        </button>
      } @else if (config()?.output === 'image') {
        <div class="qrcode-playground__preview-output">
          <image-qrcode #qrcode [data]="config()!.data" [options]="imageOptions()" />
        </div>
        <button
          class="qrcode-playground__button qrcode-playground__button--wide"
          (click)="qrcode.download('qrcodesdk')"
          type="button">
          Download PNG
        </button>
      } @else {
        <div class="qrcode-playground__preview-output">
          <canvas-qrcode [data]="config()!.data" [options]="canvasOptions()" />
        </div>
      }
    }
  `,
})
export class AngularQrcodePlaygroundPreview {
  readonly snapshot = signal<QRCodePlaygroundSnapshot>(
    createPlaygroundSnapshot(readPlaygroundDraftFromUrl()),
  );

  readonly config = computed<QRCodePlaygroundConfig | undefined>(() => this.snapshot().config);
  readonly svgOptions = computed<QRCodeSVGOptions>(() => this.config()?.options ?? {});
  readonly imageOptions = computed<QRCodeImageOptions>(() => this.config()?.options ?? {});
  readonly canvasOptions = computed<QRCodeCanvasOptions>(() => this.config()?.options ?? {});

  constructor() {
    if (typeof window === 'undefined') return;

    const destroyRef = inject(DestroyRef);

    const handler = (event: CustomEvent) => {
      this.snapshot.set(event.detail);
    };

    window.addEventListener(QR_CODE_PLAYGROUND_UPDATE_EVENT, handler as EventListener);

    destroyRef.onDestroy(() => {
      window.removeEventListener(QR_CODE_PLAYGROUND_UPDATE_EVENT, handler as EventListener);
    });
  }
}
