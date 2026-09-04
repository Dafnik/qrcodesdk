import {NgClass} from '@angular/common';
import {
  Component,
  ElementRef,
  computed,
  inject,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';

import {NANOSTORES, NanostoresService} from '@nanostores/angular';
import {NgIcon, provideIcons} from '@ng-icons/core';
import {lucideRotateCcw} from '@ng-icons/lucide';
import {HlmAlertImports} from '@spartan-ng/helm/alert';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmSeparatorImports} from '@spartan-ng/helm/separator';

import {
  type QRCodeExplainModule,
  type QRCodeExplainRole,
  type QRCodeExplanation,
  QR_CODE_EXPLAIN_ROLE_DETAILS,
  QR_CODE_EXPLAIN_ROLE_ORDER,
  explainQRCode,
} from '../explain/qrcode-analyzer.ts';
import {QrMatrixControls} from '../playground/angular/qr-matrix-controls.ts';
import {playgroundConfig, resetQrConfig} from '../playground/playground-config.ts';

type ExplainSelection = {
  groupId: string;
  role: QRCodeExplainRole | 'margin';
  module?: QRCodeExplainModule;
};

type ExplainState =
  {explanation: QRCodeExplanation; error?: undefined} | {explanation?: undefined; error: string};

type TooltipPosition = {
  x: number;
  y: number;
  below: boolean;
};

type LegendItem = {
  id: string;
  role: QRCodeExplainRole | 'margin';
  label: string;
  count: number;
};

@Component({
  selector: 'qrcode-explain-controls',
  imports: [HlmButtonImports, NgIcon, QrMatrixControls],
  providers: [provideIcons({lucideRotateCcw})],
  template: `
    <div class="grid gap-4">
      <div class="flex items-center justify-between gap-4">
        <h2 class="text-2xl font-bold">Configure</h2>
        <button (click)="resetQrConfig()" type="button" hlmBtn>
          Reset
          <ng-icon name="lucideRotateCcw" />
        </button>
      </div>

      <qr-matrix-controls />
    </div>
  `,
})
export class QRCodeExplainControls {
  protected readonly resetQrConfig = resetQrConfig;
}

@Component({
  selector: 'qrcode-explain',
  imports: [HlmAlertImports, HlmButtonImports, HlmSeparatorImports, NgClass],
  providers: [{provide: NANOSTORES, useClass: NanostoresService}],
  styles: `
    :host {
      display: block;
    }

    .explain-surface {
      --explain-accent: var(--sl-color-accent-high);
      --explain-accent-soft: color-mix(in srgb, var(--sl-color-accent-high) 32%, transparent);
      --explain-grid: color-mix(in srgb, var(--foreground) 9%, transparent);
      background:
        linear-gradient(var(--explain-grid) 1px, transparent 1px),
        linear-gradient(90deg, var(--explain-grid) 1px, transparent 1px),
        color-mix(in srgb, var(--muted) 38%, var(--background));
      background-size: 1rem 1rem;
    }

    .qr-base {
      transition: opacity 140ms ease;
    }

    .qr-base.is-dimmed {
      opacity: 0.28;
    }

    .qr-module {
      shape-rendering: crispEdges;
    }

    .qr-module[data-value='1'] {
      fill: var(--foreground);
    }

    .qr-module[data-value='0'] {
      fill: var(--background);
    }

    .selection-module {
      fill: var(--explain-accent-soft);
      stroke: var(--explain-accent);
      stroke-width: 0.11;
      vector-effect: non-scaling-stroke;
    }

    .selection-cursor {
      fill: none;
      stroke: var(--explain-accent);
      stroke-width: 0.24;
      vector-effect: non-scaling-stroke;
    }

    .selection-margin {
      fill: var(--explain-accent-soft);
      stroke: var(--explain-accent);
      stroke-width: 0.14;
      vector-effect: non-scaling-stroke;
    }

    .module-tooltip {
      position: absolute;
      width: min(17rem, calc(100% - 1rem));
      transform: translate(-50%, calc(-100% - 0.75rem));
      pointer-events: none;
    }

    .module-tooltip.is-below {
      transform: translate(-50%, 0.75rem);
    }

    @media (prefers-reduced-motion: reduce) {
      .qr-base {
        transition: none;
      }
    }
  `,
  template: `
    @if (state().error; as error) {
      <hlm-alert variant="destructive">
        <h3 hlmAlertTitle>QR code generation failed</h3>
        <p hlmAlertDescription>{{ error }}</p>
      </hlm-alert>
    } @else if (explanation(); as qr) {
      <div class="grid gap-5">
        <div class="flex flex-wrap gap-2" aria-label="Resolved QR code settings">
          <span
            class="bg-secondary text-secondary-foreground rounded-md px-2.5 py-1 font-mono text-xs">
            V{{ qr.version }}
          </span>
          <span
            class="bg-secondary text-secondary-foreground rounded-md px-2.5 py-1 font-mono text-xs">
            {{ qr.mode }}
          </span>
          <span
            class="bg-secondary text-secondary-foreground rounded-md px-2.5 py-1 font-mono text-xs">
            ECC {{ qr.errorCorrectionLevel }}
          </span>
          <span
            class="bg-secondary text-secondary-foreground rounded-md px-2.5 py-1 font-mono text-xs">
            Mask {{ qr.mask }}
          </span>
          <span
            class="bg-secondary text-secondary-foreground rounded-md px-2.5 py-1 font-mono text-xs">
            {{ qr.matrix.length }}×{{ qr.matrix.length }} modules
          </span>
        </div>

        <div
          class="explain-surface relative grid min-h-96 place-items-center overflow-hidden rounded-xl border p-4 sm:p-6"
          #surface>
          <svg
            class="focus-visible:ring-ring/50 block h-auto max-h-[70vh] max-w-full touch-none outline-none focus-visible:ring-3"
            [attr.aria-describedby]="activeSelection() ? 'qr-module-details' : null"
            [attr.height]="renderedPixelSize()"
            [attr.viewBox]="'0 0 ' + qr.viewSize + ' ' + qr.viewSize"
            [attr.width]="renderedPixelSize()"
            (blur)="onBlur()"
            (click)="onSvgClick()"
            (focus)="onSvgFocus()"
            (keydown)="onSvgKeydown($event)"
            (pointerleave)="onPointerLeave()"
            (pointermove)="onPointerMove($event)"
            role="img"
            tabindex="0"
            aria-label="Interactive QR code anatomy. Use the pointer or arrow keys to inspect modules.">
            <rect [attr.height]="qr.viewSize" [attr.width]="qr.viewSize" fill="var(--background)" />

            @if (qr.margin > 0) {
              <g data-group="margin" data-role="margin" aria-label="Quiet zone">
                <rect
                  [attr.height]="qr.margin"
                  [attr.width]="qr.viewSize"
                  fill="var(--background)" />
                <rect
                  [attr.height]="qr.margin"
                  [attr.width]="qr.viewSize"
                  [attr.y]="qr.margin + qr.matrix.length"
                  fill="var(--background)" />
                <rect
                  [attr.height]="qr.matrix.length"
                  [attr.width]="qr.margin"
                  [attr.y]="qr.margin"
                  fill="var(--background)" />
                <rect
                  [attr.height]="qr.matrix.length"
                  [attr.width]="qr.margin"
                  [attr.x]="qr.margin + qr.matrix.length"
                  [attr.y]="qr.margin"
                  fill="var(--background)" />
              </g>
            }

            <g class="qr-base" [class.is-dimmed]="activeSelection()">
              @for (module of qr.modules; track module.key) {
                <rect
                  class="qr-module"
                  [attr.data-column]="module.column"
                  [attr.data-group]="module.groupId"
                  [attr.data-key]="module.key"
                  [attr.data-role]="module.role"
                  [attr.data-row]="module.row"
                  [attr.data-value]="module.value"
                  [attr.height]="1"
                  [attr.width]="1"
                  [attr.x]="module.column + qr.margin"
                  [attr.y]="module.row + qr.margin" />
              }
            </g>

            @if (isMarginSelection() && qr.margin > 0) {
              <g class="selection-margin" pointer-events="none">
                <rect [attr.height]="qr.margin" [attr.width]="qr.viewSize" />
                <rect
                  [attr.height]="qr.margin"
                  [attr.width]="qr.viewSize"
                  [attr.y]="qr.margin + qr.matrix.length" />
                <rect
                  [attr.height]="qr.matrix.length"
                  [attr.width]="qr.margin"
                  [attr.y]="qr.margin" />
                <rect
                  [attr.height]="qr.matrix.length"
                  [attr.width]="qr.margin"
                  [attr.x]="qr.margin + qr.matrix.length"
                  [attr.y]="qr.margin" />
              </g>
            } @else {
              <g pointer-events="none">
                @for (module of activeModules(); track module.key) {
                  <rect
                    class="selection-module"
                    [attr.height]="1"
                    [attr.width]="1"
                    [attr.x]="module.column + qr.margin"
                    [attr.y]="module.row + qr.margin" />
                }
              </g>
            }

            @if (activeModule(); as module) {
              <rect
                class="selection-cursor"
                [attr.height]="1"
                [attr.width]="1"
                [attr.x]="module.column + qr.margin"
                [attr.y]="module.row + qr.margin"
                pointer-events="none" />
            }
          </svg>

          @if (tooltipSelection(); as selection) {
            <div
              class="module-tooltip bg-popover text-popover-foreground rounded-lg border px-3 py-2 shadow-lg"
              [class.is-below]="tooltipPosition().below"
              [style.left.px]="tooltipPosition().x"
              [style.top.px]="tooltipPosition().y"
              role="tooltip">
              <p class="text-sm font-semibold">{{ selectionLabel(selection) }}</p>
              <p class="text-muted-foreground mt-0.5 font-mono text-[0.6875rem] leading-relaxed">
                {{ moduleSummary(selection.module) }}
              </p>
            </div>
          }
        </div>

        <div class="grid gap-3">
          <div class="flex items-end justify-between gap-4">
            <div>
              <p class="text-muted-foreground font-mono text-xs tracking-[0.18em] uppercase">
                Signal map
              </p>
              <h3 class="text-base font-semibold">QR anatomy</h3>
            </div>
            <p class="text-muted-foreground text-right text-xs">Hover to preview · click to pin</p>
          </div>

          <div class="grid grid-cols-2 gap-1 sm:grid-cols-3">
            @for (item of legendItems(); track item.id) {
              <button
                class="h-auto min-h-10 justify-start gap-2 px-2 text-left"
                [attr.aria-pressed]="isPinned(item)"
                [variant]="isActive(item) ? 'secondary' : 'ghost'"
                (blur)="previewLegend(undefined)"
                (click)="toggleLegend(item)"
                (focus)="previewLegend(item)"
                (pointerenter)="previewLegend(item)"
                (pointerleave)="previewLegend(undefined)"
                hlmBtn
                size="sm"
                type="button">
                <span
                  class="size-2 shrink-0 rounded-[2px] border"
                  [ngClass]="isActive(item) ? 'bg-primary border-primary' : 'bg-background'"></span>
                <span class="min-w-0">
                  <span class="block truncate text-xs">{{ item.label }}</span>
                  <span class="text-muted-foreground block font-mono text-[0.625rem]">
                    {{ item.count }}
                  </span>
                </span>
              </button>
            }
          </div>
        </div>

        <hlm-separator />

        <section class="min-h-24" id="qr-module-details" aria-live="polite">
          @if (activeSelection(); as selection) {
            <div class="grid gap-1">
              <div class="flex flex-wrap items-baseline justify-between gap-2">
                <h3 class="text-base font-semibold">{{ selectionLabel(selection) }}</h3>
                @if (selection.module; as module) {
                  <code class="text-muted-foreground text-xs">
                    x {{ module.column }} · y {{ module.row }}
                  </code>
                }
              </div>
              <p class="text-muted-foreground text-sm leading-relaxed">
                {{ selectionDescription(selection) }}
              </p>
              @if (selection.module; as module) {
                <p class="font-mono text-xs leading-relaxed">{{ moduleSummary(module) }}</p>
              }
            </div>
          } @else {
            <div class="grid gap-1">
              <h3 class="text-base font-semibold">Inspect a module</h3>
              <p class="text-muted-foreground text-sm leading-relaxed">
                Hover any square to reveal its job. Click, tap, or press Enter to keep a selection
                pinned while you explore.
              </p>
            </div>
          }
        </section>

        <p class="sr-only" aria-live="polite">{{ liveAnnouncement() }}</p>
      </div>
    }
  `,
})
export class QRCodeExplain {
  private readonly nanostores = inject(NanostoresService);
  private readonly surface = viewChild.required<ElementRef<HTMLDivElement>>('surface');
  private readonly config = toSignal(this.nanostores.useStore(playgroundConfig), {
    requireSync: true,
  });

  protected readonly state = computed<ExplainState>(() => {
    try {
      return {explanation: explainQRCode(this.config())};
    } catch (error) {
      return {error: error instanceof Error ? error.message : String(error)};
    }
  });
  protected readonly explanation = computed(() => this.state().explanation);
  protected readonly pinnedSelection = linkedSignal<ExplainSelection | undefined>(() => {
    this.explanation();
    return undefined;
  });
  private readonly previewSelection = linkedSignal<ExplainSelection | undefined>(() => {
    this.explanation();
    return undefined;
  });
  private readonly pointerSelection = signal<ExplainSelection | undefined>(undefined);
  private readonly keyboardPosition = linkedSignal(() => {
    this.explanation();
    return {row: 0, column: 0};
  });

  protected readonly activeSelection = computed(
    () => this.pinnedSelection() ?? this.previewSelection(),
  );
  protected readonly activeModule = computed(() => this.activeSelection()?.module);
  protected readonly isMarginSelection = computed(() => this.activeSelection()?.role === 'margin');
  protected readonly tooltipSelection = signal<ExplainSelection | undefined>(undefined);
  protected readonly tooltipPosition = signal<TooltipPosition>({x: 0, y: 0, below: false});
  protected readonly renderedPixelSize = computed(() => {
    const explanation = this.explanation();
    return explanation === undefined ? 0 : explanation.viewSize * explanation.moduleSize;
  });
  protected readonly activeModules = computed<readonly QRCodeExplainModule[]>(() => {
    const selection = this.activeSelection();
    const explanation = this.explanation();
    if (selection === undefined || explanation === undefined || selection.role === 'margin')
      return [];
    return explanation.modules.filter(({role}) => role === selection.role);
  });
  protected readonly legendItems = computed<readonly LegendItem[]>(() => {
    const explanation = this.explanation();
    if (explanation === undefined) return [];
    const counts = new Map<QRCodeExplainRole, number>();
    for (const module of explanation.modules) {
      counts.set(module.role, (counts.get(module.role) ?? 0) + 1);
    }
    const items: LegendItem[] =
      explanation.quietZone > 0
        ? [
            {
              id: 'role:margin',
              role: 'margin',
              label: 'Quiet zone',
              count: explanation.viewSize ** 2 - explanation.matrix.length ** 2,
            },
          ]
        : [];
    for (const role of QR_CODE_EXPLAIN_ROLE_ORDER) {
      const count = counts.get(role) ?? 0;
      if (count > 0) {
        items.push({
          id: `role:${role}`,
          role,
          label: QR_CODE_EXPLAIN_ROLE_DETAILS[role].label,
          count,
        });
      }
    }
    return items;
  });
  protected readonly liveAnnouncement = computed(() => {
    const selection = this.activeSelection();
    if (selection === undefined) return '';
    return `${this.selectionLabel(selection)}. ${this.moduleSummary(selection.module)}`;
  });

  protected onPointerMove(event: PointerEvent): void {
    const target = event.target;
    if (!(target instanceof SVGElement)) return;
    const interactive = target.closest<SVGElement>('[data-group]');
    if (interactive === null) return;

    const selection = this.selectionFromElement(interactive);
    if (selection === undefined) return;
    this.pointerSelection.set(selection);
    if (this.pinnedSelection() === undefined) {
      if (
        this.previewSelection()?.groupId !== selection.groupId ||
        this.previewSelection()?.module?.key !== selection.module?.key
      ) {
        this.previewSelection.set(selection);
      }
    }
    this.tooltipSelection.set(selection);
    this.updateTooltipPosition(event.clientX, event.clientY);
  }

  protected onPointerLeave(): void {
    this.pointerSelection.set(undefined);
    this.tooltipSelection.set(undefined);
    if (this.pinnedSelection() === undefined) this.previewSelection.set(undefined);
  }

  protected onSvgClick(): void {
    const selection = this.pointerSelection() ?? this.previewSelection();
    if (selection === undefined) return;
    if (this.pinnedSelection()?.groupId === selection.groupId) {
      this.pinnedSelection.set(undefined);
    } else {
      this.pinnedSelection.set(selection);
    }
  }

  protected onSvgFocus(): void {
    const selection = this.activeSelection();
    if (selection?.module !== undefined) {
      this.keyboardPosition.set({
        row: selection.module.row,
        column: selection.module.column,
      });
    } else if (selection === undefined) {
      this.keyboardPosition.set({row: 0, column: 0});
      this.selectKeyboardModule();
    }
  }

  protected onBlur(): void {
    if (this.pinnedSelection() === undefined) this.previewSelection.set(undefined);
  }

  protected onSvgKeydown(event: KeyboardEvent): void {
    const explanation = this.explanation();
    if (explanation === undefined) return;
    const current = this.keyboardPosition();
    let next = current;

    switch (event.key) {
      case 'ArrowUp':
        next = {...current, row: Math.max(0, current.row - 1)};
        break;
      case 'ArrowDown':
        next = {...current, row: Math.min(explanation.matrix.length - 1, current.row + 1)};
        break;
      case 'ArrowLeft':
        next = {...current, column: Math.max(0, current.column - 1)};
        break;
      case 'ArrowRight':
        next = {...current, column: Math.min(explanation.matrix.length - 1, current.column + 1)};
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.togglePinnedSelection(this.previewSelection());
        return;
      case 'Escape':
        event.preventDefault();
        this.pinnedSelection.set(undefined);
        this.previewSelection.set(undefined);
        return;
      default:
        return;
    }

    event.preventDefault();
    this.keyboardPosition.set(next);
    this.selectKeyboardModule();
  }

  protected previewLegend(item: LegendItem | undefined): void {
    if (this.pinnedSelection() !== undefined) return;
    this.previewSelection.set(item === undefined ? undefined : this.selectionFromLegend(item));
  }

  protected toggleLegend(item: LegendItem): void {
    const selection = this.selectionFromLegend(item);
    this.togglePinnedSelection(selection);
  }

  protected isActive(item: LegendItem): boolean {
    const selection = this.activeSelection();
    return selection?.role === item.role;
  }

  protected isPinned(item: LegendItem): boolean {
    return this.pinnedSelection()?.role === item.role;
  }

  protected selectionLabel(selection: ExplainSelection): string {
    if (selection.role === 'margin') return 'Quiet zone';
    return QR_CODE_EXPLAIN_ROLE_DETAILS[selection.role].label;
  }

  protected selectionDescription(selection: ExplainSelection): string {
    if (selection.role === 'margin') {
      return 'A clear light border that helps scanners isolate the QR code from its surroundings.';
    }
    return QR_CODE_EXPLAIN_ROLE_DETAILS[selection.role].description;
  }

  protected moduleSummary(module: QRCodeExplainModule | undefined): string {
    const explanation = this.explanation();
    if (module === undefined) {
      return explanation === undefined
        ? ''
        : `Version ${explanation.version} · mask ${explanation.mask}`;
    }
    const parts = [
      `module (${module.column}, ${module.row})`,
      module.value === 1 ? 'rendered dark' : 'rendered light',
    ];
    if (module.sourceValue !== undefined) parts.push(`source bit ${module.sourceValue}`);
    if (module.placementBitIndex !== undefined) {
      parts.push(`placement bit ${module.placementBitIndex + 1}`);
    }
    if (module.codewordIndex !== undefined) parts.push(`codeword ${module.codewordIndex}`);
    return parts.join(' · ');
  }

  private selectionFromElement(element: SVGElement): ExplainSelection | undefined {
    const groupId = element.dataset['group'];
    const role = element.dataset['role'] as QRCodeExplainRole | 'margin' | undefined;
    if (groupId === undefined || role === undefined) return undefined;
    const row = Number(element.dataset['row']);
    const column = Number(element.dataset['column']);
    const module =
      Number.isInteger(row) && Number.isInteger(column)
        ? this.explanation()?.moduleGrid[row]?.[column]
        : undefined;
    return {groupId, role, module};
  }

  private selectionFromLegend(item: LegendItem): ExplainSelection {
    return {groupId: item.id, role: item.role};
  }

  private togglePinnedSelection(selection: ExplainSelection | undefined): void {
    if (selection === undefined) return;
    if (this.pinnedSelection()?.groupId === selection.groupId) {
      this.pinnedSelection.set(undefined);
    } else {
      this.pinnedSelection.set(selection);
      this.previewSelection.set(selection);
    }
  }

  private selectKeyboardModule(): void {
    const position = this.keyboardPosition();
    const module = this.explanation()?.moduleGrid[position.row]?.[position.column];
    if (module !== undefined) {
      const selection = {
        groupId: module.groupId,
        role: module.role,
        module,
      };
      this.previewSelection.set(selection);
      if (this.pinnedSelection() !== undefined) this.pinnedSelection.set(selection);
    }
  }

  private updateTooltipPosition(clientX: number, clientY: number): void {
    const bounds = this.surface().nativeElement.getBoundingClientRect();
    const tooltipHalfWidth = Math.min(136, Math.max(80, bounds.width / 2 - 8));
    const x = Math.min(
      Math.max(clientX - bounds.left, tooltipHalfWidth),
      bounds.width - tooltipHalfWidth,
    );
    const y = clientY - bounds.top;
    this.tooltipPosition.set({x, y, below: y < 88});
  }
}
