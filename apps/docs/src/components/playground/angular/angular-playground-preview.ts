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
  playgroundOptions,
  playgroundPreparedImage,
} from '../playground-options.ts';
import {hasQRCodeError} from '../qrcode-error-checker.ts';

@Component({
  selector: 'qrcode-angular-playground-preview',
  imports: [QRCodeCanvas, QRCodeImage, QRCodeSVG, HlmButtonImports, HlmAlertImports],
  template: `
    <div class="flex flex-col items-center justify-center gap-4">
      @if (options().packageName === 'angular') {
        @if (hasError(); as error) {
          <hlm-alert class="max-w-md" variant="destructive">
            <h4 hlmAlertTitle>QR code generation failed</h4>
            <p hlmAlertDescription>
              {{ error || 'This QR code options is invalid.' }}
            </p>
          </hlm-alert>
        } @else {
          @if (options().output === 'svg') {
            <qrcode-svg #qrcode [payload]="options().payload" [options]="svgOptions()" />
            <button
              class="min-w-64"
              (click)="qrcode.download('qrcodesdk')"
              size="lg"
              hlmBtn
              type="button">
              Download SVG
            </button>
          } @else if (options().output === 'image') {
            <qrcode-image #qrcode [payload]="options().payload" [options]="imageOptions()" />
            <button
              class="min-w-64"
              (click)="qrcode.download('qrcodesdk')"
              size="lg"
              hlmBtn
              type="button">
              Download PNG
            </button>
          } @else {
            <qrcode-canvas [payload]="options().payload" [options]="canvasOptions()" />
          }
        }
      }
    </div>
  `,
})
export class AngularPlaygroundPreview {
  private readonly nanostores = inject(NanostoresService);
  protected readonly options = toSignal(this.nanostores.useStore(playgroundOptions), {
    requireSync: true,
  });
  protected readonly preparedImage = toSignal(this.nanostores.useStore(playgroundPreparedImage), {
    requireSync: true,
  });

  protected readonly svgOptions = computed(() =>
    createPlaygroundSVGOptions(this.options(), this.preparedImage()),
  );
  protected readonly imageOptions = computed(() =>
    createPlaygroundImageOptions(this.options(), this.preparedImage()),
  );
  protected readonly canvasOptions = computed(() =>
    createPlaygroundCanvasOptions(this.options(), this.preparedImage()),
  );
  protected readonly hasError = computed(() =>
    hasQRCodeError(this.options(), this.preparedImage()),
  );
}
