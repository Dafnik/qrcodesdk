import {ScrollingModule} from '@angular/cdk/scrolling';
import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';

import {NgIcon, provideIcons} from '@ng-icons/core';
import {lucideScanQrCode, lucideSearch, lucideX} from '@ng-icons/lucide';
import {HlmBadge} from '@spartan-ng/helm/badge';
import {HlmButton} from '@spartan-ng/helm/button';
import {HlmInput} from '@spartan-ng/helm/input';
import {HlmNativeSelectImports} from '@spartan-ng/helm/native-select';
import {HlmProgressImports} from '@spartan-ng/helm/progress';

import {type DevFixture, describeMatrix} from '../fixtures/fixture-catalog';
import {DecodeResults, resultKey} from '../state/decode-results';
import {DevToolsState, TILE_SIZES} from '../state/dev-tools-state';
import {QRTile} from './qr-tile';

type StatusFilter = 'all' | 'fail' | 'known-fail' | 'pass' | 'unchecked';

/** Row padding (py-3) plus the tile footer and gap. */
const ROW_CHROME = 24 + 30;
/**
 * Characters kept on each side of the ellipsis in long payload previews. Sized so the preview,
 * including the character count, fits the three clamped lines of the 18rem fixture column.
 */
const PAYLOAD_PREVIEW_EDGE_LENGTH = 44;

@Component({
  selector: 'app-results-view',
  imports: [
    ScrollingModule,
    QRTile,
    HlmBadge,
    HlmButton,
    HlmInput,
    HlmNativeSelectImports,
    HlmProgressImports,
    NgIcon,
  ],
  providers: [provideIcons({lucideScanQrCode, lucideSearch, lucideX})],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'flex min-h-0 min-w-0 flex-1 flex-col'},
  template: `
    @if (state.currentRun(); as run) {
      <div class="border-border flex flex-wrap items-center gap-2 border-b px-4 py-2">
        <div class="relative w-64">
          <ng-icon
            class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2"
            name="lucideSearch" />
          <input
            class="ps-8"
            [value]="search()"
            (input)="search.set($any($event.target).value)"
            aria-label="Filter fixtures by name"
            hlmInput
            placeholder="Filter by name…"
            type="search" />
        </div>

        @if (state.decode()) {
          <hlm-native-select
            class="w-44"
            [value]="statusFilter()"
            (valueChange)="statusFilter.set($any($event))"
            aria-label="Filter by jsQR status">
            <option hlmNativeSelectOption value="all">All rows</option>
            <option hlmNativeSelectOption value="fail">With failures</option>
            <option hlmNativeSelectOption value="known-fail">With known failures</option>
            <option hlmNativeSelectOption value="pass">All passed</option>
            <option hlmNativeSelectOption value="unchecked">Not fully checked</option>
          </hlm-native-select>
        }

        <span class="text-muted-foreground text-sm">
          {{ rows().length }} / {{ run.fixtures.length }} fixtures ·
          {{ run.renderers.length }} renderers
        </span>

        @if (state.decode()) {
          <div class="ms-auto flex items-center gap-2">
            <span class="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" hlmBadge>
              {{ results.summary().pass }} pass
            </span>
            <span hlmBadge variant="destructive">{{ results.summary().fail }} fail</span>
            <span class="text-amber-700 dark:text-amber-400" hlmBadge variant="outline">
              {{ results.summary()['known-fail'] }} known
            </span>
            <span class="text-muted-foreground text-xs">
              {{ results.checked() }} / {{ totalRenders() }} checked
            </span>

            @if (results.bulkProgress(); as progress) {
              <hlm-progress class="w-32" [value]="progress.done" [max]="progress.total">
                <hlm-progress-indicator />
              </hlm-progress>
              <button (click)="results.cancelDecodeAll()" hlmBtn size="sm" variant="outline">
                <ng-icon name="lucideX" />
                Cancel
              </button>
            } @else {
              <button
                [disabled]="results.checked() >= totalRenders()"
                (click)="results.decodeAll(run.fixtures, run.renderers)"
                hlmBtn
                size="sm"
                variant="outline">
                <ng-icon name="lucideScanQrCode" />
                Decode all
              </button>
            }
          </div>
        }
      </div>

      @if (rows().length === 0) {
        <p class="text-muted-foreground p-8 text-sm">No fixtures match the filters.</p>
      }

      <cdk-virtual-scroll-viewport
        class="min-h-0 flex-1"
        [itemSize]="rowHeight()"
        [maxBufferPx]="rowHeight() * 6"
        [minBufferPx]="rowHeight() * 3">
        <div
          class="border-border flex w-max min-w-full gap-4 border-b px-4 py-3"
          *cdkVirtualFor="let fixture of rows(); trackBy: trackById"
          [style.height.px]="rowHeight()">
          <div class="flex w-72 shrink-0 flex-col gap-1 overflow-hidden">
            <span class="truncate font-mono text-sm font-medium" [title]="fixture.name">
              {{ fixture.name }}
            </span>
            <div class="flex flex-wrap gap-1">
              <span hlmBadge variant="secondary">{{ fixture.category }}</span>
              @if (fixture.knownDecodeIssue) {
                <span
                  class="text-amber-700 dark:text-amber-400"
                  [title]="fixture.knownDecodeIssue"
                  hlmBadge
                  variant="outline">
                  known jsQR issue
                </span>
              }
            </div>
            <span class="text-muted-foreground text-xs">{{ matrix(fixture) }}</span>
            <span
              class="text-muted-foreground line-clamp-3 font-mono text-xs break-all"
              [title]="
                fixture.payload.length > 500
                  ? fixture.payload.length + ' characters'
                  : fixture.payload
              ">
              {{ payloadPreview(fixture) }}
            </span>
          </div>
          @for (renderer of run.renderers; track renderer) {
            <app-qr-tile [fixture]="fixture" [renderer]="renderer" [size]="tileSize()" />
          }
        </div>
      </cdk-virtual-scroll-viewport>
    } @else {
      <div class="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2 p-8">
        <p class="text-foreground text-lg font-medium">Nothing rendered yet</p>
        <p class="max-w-md text-center text-sm">
          Pick fixtures and renderers in the sidebar, then press Run. Large selections such as all
          combinations render lazily while you scroll.
        </p>
      </div>
    }
  `,
})
export class ResultsView {
  protected readonly state = inject(DevToolsState);
  protected readonly results = inject(DecodeResults);

  protected readonly search = signal('');
  protected readonly statusFilter = signal<StatusFilter>('all');

  protected readonly tileSize = computed(() => TILE_SIZES[this.state.tileSize()]);
  protected readonly rowHeight = computed(() => this.tileSize() + ROW_CHROME);

  protected readonly totalRenders = computed(() => {
    const run = this.state.currentRun();
    return run ? run.fixtures.length * run.renderers.length : 0;
  });

  protected readonly rows = computed<readonly DevFixture[]>(() => {
    const run = this.state.currentRun();
    if (!run) return [];
    const terms = this.search().trim().toLowerCase().split(/\s+/u).filter(Boolean);
    const status = this.state.decode() ? this.statusFilter() : 'all';
    if (status !== 'all') this.results.version();

    return run.fixtures.filter((fixture) => {
      if (terms.length > 0) {
        const haystack = `${fixture.category}/${fixture.name}`.toLowerCase();
        if (!terms.every((term) => haystack.includes(term))) return false;
      }
      if (status === 'all') return true;

      const statuses = run.renderers.map(
        (renderer) => this.results.get(resultKey(fixture, renderer))?.status,
      );
      switch (status) {
        case 'fail':
        case 'known-fail':
          return statuses.includes(status);
        case 'pass':
          return statuses.every((value) => value === 'pass');
        case 'unchecked':
          return statuses.includes(undefined);
      }
    });
  });

  protected readonly trackById = (_index: number, fixture: DevFixture) => fixture.id;

  protected matrix(fixture: DevFixture): string {
    return describeMatrix(fixture.matrix);
  }

  protected payloadPreview(fixture: DevFixture): string {
    const {payload} = fixture;
    if (payload === '') return '(empty payload)';
    // Code points, so multi-byte characters such as emoji are never split.
    const characters = Array.from(payload);
    if (characters.length <= PAYLOAD_PREVIEW_EDGE_LENGTH * 2 + 1) return payload;
    const start = characters.slice(0, PAYLOAD_PREVIEW_EDGE_LENGTH).join('');
    const end = characters.slice(-PAYLOAD_PREVIEW_EDGE_LENGTH).join('');
    return `${start}…${end} (${characters.length} chars)`;
  }
}
