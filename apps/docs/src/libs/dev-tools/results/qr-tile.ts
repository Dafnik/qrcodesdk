import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';

import {NgIcon, provideIcons} from '@ng-icons/core';
import {lucideDownload} from '@ng-icons/lucide';
import {HlmButton} from '@spartan-ng/helm/button';

import {
  QRCodeCanvas,
  type QRCodeDownloadHandle,
  QRCodeGIF,
  QRCodeJPEG,
  QRCodePNG,
  QRCodeSVG,
  QRCodeWebP,
} from '@qrcodesdk/angular';

import type {DevFixture} from '../fixtures/fixture-catalog';
import {type DecodeResult, type DecoderId, captureOutput} from '../rendering/decode';
import {type RendererId, canvasOptions, rendererLabel, svgOptions} from '../rendering/renderers';
import {DecodeResults, resultKey} from '../state/decode-results';
import {DevToolsState} from '../state/dev-tools-state';
import {DecodeBadge} from './decode-badge';

/** Renders one fixture with one `@qrcodesdk/angular` component and optionally scans it. */
@Component({
  selector: 'app-qr-tile',
  imports: [
    QRCodeSVG,
    QRCodePNG,
    QRCodeWebP,
    QRCodeGIF,
    QRCodeJPEG,
    QRCodeCanvas,
    HlmButton,
    NgIcon,
    DecodeBadge,
  ],
  providers: [provideIcons({lucideDownload})],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'flex shrink-0 flex-col gap-1.5'},
  template: `
    <div
      class="checkerboard border-border flex items-center justify-center overflow-hidden rounded-md border [&_canvas]:max-h-full [&_canvas]:max-w-full [&_img]:max-h-full [&_img]:max-w-full [&_svg]:max-h-full [&_svg]:max-w-full"
      #output
      [style.width.px]="size()"
      [style.height.px]="size()">
      @switch (renderer()) {
        @case ('svg') {
          <qrcode-svg class="contents" #qrcode [payload]="fixture().payload" [options]="svg()" />
        }
        @case ('png') {
          <qrcode-png class="contents" #qrcode [payload]="fixture().payload" [options]="canvas()" />
        }
        @case ('webp') {
          <qrcode-webp
            class="contents"
            #qrcode
            [payload]="fixture().payload"
            [options]="canvas()" />
        }
        @case ('gif') {
          <qrcode-gif class="contents" #qrcode [payload]="fixture().payload" [options]="canvas()" />
        }
        @case ('jpeg') {
          <qrcode-jpeg
            class="contents"
            #qrcode
            [payload]="fixture().payload"
            [options]="canvas()" />
        }
        @case ('canvas') {
          <qrcode-canvas class="contents" [payload]="fixture().payload" [options]="canvas()" />
        }
      }
    </div>
    <div class="flex flex-wrap items-center gap-1" [style.width.px]="size()">
      <span class="text-muted-foreground text-xs font-medium">{{ label() }}</span>
      @for (decoder of decoders(); track decoder) {
        <app-decode-badge [decoder]="decoder" [result]="result(decoder)" />
      }
      @if (renderer() !== 'canvas') {
        <button
          class="ms-auto"
          [attr.aria-label]="'Download ' + label()"
          (click)="download()"
          hlmBtn
          size="icon-xs"
          variant="ghost">
          <ng-icon name="lucideDownload" />
        </button>
      }
    </div>
  `,
})
export class QRTile {
  private readonly state = inject(DevToolsState);
  private readonly results = inject(DecodeResults);

  readonly fixture = input.required<DevFixture>();
  readonly renderer = input.required<RendererId>();
  readonly size = input.required<number>();

  private readonly output = viewChild.required<ElementRef<HTMLElement>>('output');
  private readonly qrcode = viewChild<QRCodeDownloadHandle>('qrcode');

  protected readonly svg = computed(() => svgOptions(this.fixture()));
  protected readonly canvas = computed(() => canvasOptions(this.fixture()));
  protected readonly label = computed(() => rendererLabel(this.renderer()));
  protected readonly decoders = this.state.decoders;
  private readonly version = this.results.version;

  constructor() {
    // Runs after the component effects rendered the current inputs into the DOM.
    afterRenderEffect({
      read: () => {
        const decoders = this.decoders();
        if (decoders.length === 0) return;
        // Re-runs keep tiles whose fixture and renderer didn't change, but clear their results.
        this.results.runId();
        const fixture = this.fixture();
        const renderer = this.renderer();
        if (
          decoders.every((decoder) => this.results.isKnown(resultKey(fixture, renderer, decoder)))
        ) {
          return;
        }
        this.results.decode(
          fixture,
          renderer,
          captureOutput(this.output().nativeElement, renderer),
          decoders,
        );
      },
    });
  }

  protected result(decoder: DecoderId): DecodeResult | undefined {
    this.version();
    return this.results.get(resultKey(this.fixture(), this.renderer(), decoder));
  }

  protected download(): void {
    this.qrcode()?.download(this.fixture().id.replaceAll('/', '_') + '_' + this.renderer());
  }
}
