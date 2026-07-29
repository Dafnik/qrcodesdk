import {Component, computed, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';

import {NanostoresService} from '@nanostores/angular';
import {HlmAlertImports} from '@spartan-ng/helm/alert';
import {HlmButtonImports} from '@spartan-ng/helm/button';

import {QRCodeCanvas, QRCodeImage, QRCodeSVG} from '@qrcodesdk/angular';

import {
  createPlaygroundCanvasOptions,
  createPlaygroundImageOptions,
  createPlaygroundSVGOptions,
  playgroundConfig,
  playgroundPreparedImage,
} from '../playground-config.ts';
import {hasQRCodeError} from '../qrcode-error-checker.ts';

@Component({
  selector: 'qrcode-angular-playground-preview',
  imports: [QRCodeCanvas, QRCodeImage, QRCodeSVG, HlmButtonImports, HlmAlertImports],
  template: `
    <div class="flex flex-col items-center justify-center gap-4">
      @if (config().packageName === 'angular') {
        @if (hasError(); as error) {
          <hlm-alert class="max-w-md" variant="destructive">
            <h4 hlmAlertTitle>QR code generation failed</h4>
            <p hlmAlertDescription>
              {{ error || 'This QR code configuration is invalid.' }}
            </p>
          </hlm-alert>
        } @else {
          @if (config().output === 'svg') {
            <qrcode-svg #qrcode [data]="config().data" [options]="svgOptions()" />
            <button
              class="min-w-64"
              (click)="qrcode.download('qrcodesdk')"
              size="lg"
              hlmBtn
              type="button">
              Download SVG
            </button>
          } @else if (config().output === 'image') {
            <qrcode-image #qrcode [data]="config().data" [options]="imageOptions()" />
            <button
              class="min-w-64"
              (click)="qrcode.download('qrcodesdk')"
              size="lg"
              hlmBtn
              type="button">
              Download PNG
            </button>
          } @else {
            <qrcode-canvas [data]="config().data" [options]="canvasOptions()" />
          }
        }
      }
    </div>
  `,
})
export class AngularPlaygroundPreview {
  private readonly nanostores = inject(NanostoresService);
  protected readonly config = toSignal(this.nanostores.useStore(playgroundConfig), {
    requireSync: true,
  });
  protected readonly preparedImage = toSignal(this.nanostores.useStore(playgroundPreparedImage), {
    requireSync: true,
  });

  protected readonly svgOptions = computed(() =>
    createPlaygroundSVGOptions(this.config(), this.preparedImage()),
  );
  protected readonly imageOptions = computed(() =>
    createPlaygroundImageOptions(this.config(), this.preparedImage()),
  );
  protected readonly canvasOptions = computed(() =>
    createPlaygroundCanvasOptions(this.config(), this.preparedImage()),
  );
  protected readonly hasError = computed(() => hasQRCodeError(this.config(), this.preparedImage()));
}
