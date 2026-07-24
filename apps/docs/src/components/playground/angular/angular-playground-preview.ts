import {Component, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';

import {NanostoresService} from '@nanostores/angular';
import {HlmButtonImports} from '@spartan-ng/helm/button';

import {QRCodeCanvas, QRCodeImage, QRCodeSVG} from '@qrcodesdk/angular';

import {qrConfig} from '../playground-config.ts';

@Component({
  selector: 'qrcode-angular-playground-preview',
  imports: [QRCodeCanvas, QRCodeImage, QRCodeSVG, HlmButtonImports],
  host: {
    class: 'flex flex-col gap-4 justify-center items-center',
  },
  template: `
    @if (config()?.packageName === 'angular') {
      <!--      @if (!snapshot().config) {-->
      <!--        <div class="qrcode-playground__preview-error" role="status">-->
      <!--          {{ snapshot().validation.error || 'This QR code configuration is invalid.' }}-->
      <!--        </div>-->
      @if (config()?.output === 'svg') {
        <qrcode-svg #qrcode [data]="config()!.value" [options]="config()" />
        <button
          class="min-w-64"
          (click)="qrcode.download('qrcodesdk')"
          size="lg"
          hlmBtn
          type="button">
          Download SVG
        </button>
      } @else if (config()?.output === 'image') {
        <qrcode-image #qrcode [data]="config()!.value" [options]="config()" />
        <button
          class="min-w-64"
          (click)="qrcode.download('qrcodesdk')"
          size="lg"
          hlmBtn
          type="button">
          Download PNG
        </button>
      } @else {
        <qrcode-canvas [data]="config()!.value" [options]="config()" />
      }
    }
  `,
})
export class AngularPlaygroundPreview {
  private readonly nanostores = inject(NanostoresService);
  protected readonly config = toSignal(this.nanostores.useStore(qrConfig));
}
