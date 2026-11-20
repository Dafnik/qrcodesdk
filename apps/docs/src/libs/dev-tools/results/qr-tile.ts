import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

import {NgIcon, provideIcons} from '@ng-icons/core';
import {lucideDownload, lucideX} from '@ng-icons/lucide';
import {
  BrnDialog,
  BrnDialogClose,
  BrnDialogContent,
  BrnDialogTitle,
  BrnDialogTrigger,
} from '@spartan-ng/brain/dialog';
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
import type {DecodeResult, DecoderId} from '../rendering/decode';
import {captureOutput} from '../rendering/rasterize';
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
    // The dev server's Angular compiler needs the individual Brain directives here.
    BrnDialog,
    BrnDialogClose,
    BrnDialogContent,
    BrnDialogTitle,
    BrnDialogTrigger,
    HlmButton,
    NgIcon,
    DecodeBadge,
  ],
  providers: [provideIcons({lucideDownload, lucideX})],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'flex shrink-0 flex-col gap-1.5'},
  template: `
    <brn-dialog class="contents" (closed)="previewSource.set(undefined)">
      <button
        class="checkerboard border-border focus-visible:ring-ring flex cursor-zoom-in items-center justify-center overflow-hidden rounded-md border focus-visible:ring-2 [&_canvas]:max-h-full [&_canvas]:max-w-full [&_img]:max-h-full [&_img]:max-w-full [&_svg]:max-h-full [&_svg]:max-w-full"
        #output
        [attr.aria-label]="'Enlarge ' + fixture().name + ' in ' + label()"
        [style.width.px]="previewWidth()"
        [style.height.px]="size()"
        (click)="inspect()"
        brnDialogTrigger>
        @switch (renderer()) {
          @case ('svg') {
            <qrcode-svg class="contents" #qrcode [payload]="fixture().payload" [options]="svg()" />
          }
          @case ('png') {
            <qrcode-png
              class="contents"
              #qrcode
              [payload]="fixture().payload"
              [options]="canvas()" />
          }
          @case ('webp') {
            <qrcode-webp
              class="contents"
              #qrcode
              [payload]="fixture().payload"
              [options]="canvas()" />
          }
          @case ('gif') {
            <qrcode-gif
              class="contents"
              #qrcode
              [payload]="fixture().payload"
              [options]="canvas()" />
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
      </button>

      <ng-template brnDialogContent>
        <section
          class="bg-background border-border flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-6xl flex-col gap-3 rounded-lg border p-4 shadow-lg">
          <header class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <h2 class="font-mono text-sm font-medium break-all" brnDialogTitle>
                {{ fixture().name }}
              </h2>
              <div class="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                <span>{{ label() }}</span>
                @for (decoder of decoders(); track decoder) {
                  <app-decode-badge [decoder]="decoder" [result]="result(decoder)" />
                }
              </div>
            </div>
            <button brnDialogClose hlmBtn size="icon-sm" variant="ghost" aria-label="Close preview">
              <ng-icon name="lucideX" />
            </button>
          </header>
          @if (previewSource(); as source) {
            <div class="flex flex-wrap items-center gap-1" role="group" aria-label="Preview zoom">
              @for (level of zoomLevels; track level) {
                <button
                  [variant]="zoom() === level ? 'secondary' : 'ghost'"
                  [attr.aria-pressed]="zoom() === level"
                  (click)="zoom.set(level)"
                  hlmBtn
                  size="sm">
                  {{ level === 1 ? 'Fit' : level + '×' }}
                </button>
              }
              @if (renderer() !== 'canvas') {
                <button class="ms-auto" (click)="download()" hlmBtn size="sm" variant="outline">
                  <ng-icon name="lucideDownload" />
                  Download
                </button>
              }
            </div>
            <div
              class="checkerboard border-border focus-visible:ring-ring min-h-0 overflow-auto rounded-md border focus-visible:ring-2"
              role="region"
              aria-label="QR preview"
              tabindex="0">
              <img
                class="block h-auto max-w-none object-contain"
                [style.max-height]="zoom() === 1 ? '60dvh' : null"
                [style.width.%]="zoom() * 100"
                [style.image-rendering]="renderer() === 'svg' ? 'auto' : 'pixelated'"
                [src]="source"
                [alt]="fixture().name" />
            </div>
          } @else {
            <p class="text-muted-foreground text-sm">Preview unavailable.</p>
          }
        </section>
      </ng-template>
    </brn-dialog>
    <div class="flex flex-wrap items-center gap-1" [style.width.px]="previewWidth()">
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

  protected readonly previewWidth = computed(() => {
    const {id, category} = this.fixture();
    return category.startsWith('rmqr') || id.startsWith('all-combinations/rmqr/')
      ? this.size() * 2
      : this.size();
  });
  protected readonly zoomLevels = [1, 2, 4] as const;
  protected readonly zoom = signal(1);
  protected readonly previewSource = signal<string | undefined>(undefined);

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

  protected inspect(): void {
    this.zoom.set(1);
    const output = captureOutput(this.output().nativeElement, this.renderer());
    switch (output?.kind) {
      case 'svg':
        this.previewSource.set(
          `data:image/svg+xml;charset=utf-8,${encodeURIComponent(output.svg)}`,
        );
        break;
      case 'canvas':
        this.previewSource.set(output.canvas.toDataURL());
        break;
      case 'image':
        this.previewSource.set(output.image.currentSrc || output.image.src);
        break;
      default:
        this.previewSource.set(undefined);
    }
  }

  protected download(): void {
    this.qrcode()?.download(this.fixture().id.replaceAll('/', '_') + '_' + this.renderer());
  }
}
