import {CdkTextareaAutosize} from '@angular/cdk/text-field';
import {Component, Directive, computed, inject, input} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormsModule} from '@angular/forms';

import {NANOSTORES, NanostoresService} from '@nanostores/angular';
import {HlmAlertImports} from '@spartan-ng/helm/alert';
import {HlmFieldImports} from '@spartan-ng/helm/field';
import {HlmInputImports} from '@spartan-ng/helm/input';
import {HlmSelectImports} from '@spartan-ng/helm/select';
import {HlmSwitchImports} from '@spartan-ng/helm/switch';
import {HlmTextareaImports} from '@spartan-ng/helm/textarea';

import type {QRCodeErrorCorrectionLevel} from '@qrcodesdk/core';
import type {QRCodeMicroMask, QRCodeMicroVersion} from '@qrcodesdk/core/micro';

import {
  type PlaygroundOptions,
  isUnreliableMicroFinderRing,
  playgroundOptions,
  playgroundSymbolPatch,
  updateQrOptions,
} from '../playground-options.ts';
import {titleCase} from './title-case.ts';

type PlaygroundSymbol = 'standard' | 'micro';

/** The level core applies when none is set. Picking it clears the option. */
const DEFAULT_ERROR_CORRECTION_LEVEL = 'M' satisfies QRCodeErrorCorrectionLevel;

/** Shared inputs for controls that edit either the playground store or a passed-in copy. */
@Directive()
abstract class QrOptionsControls {
  readonly options = input<PlaygroundOptions>();
  readonly update = input<(patch: Partial<PlaygroundOptions>) => void>(updateQrOptions);
  readonly idPrefix = input('');
  protected readonly updateQrOptions = (patch: Partial<PlaygroundOptions>) => this.update()(patch);

  private readonly nanostores = inject(NanostoresService);
  private readonly storedOptions = toSignal(this.nanostores.useStore(playgroundOptions), {
    requireSync: true,
  });

  protected readonly currentOptions = computed(() => this.options() ?? this.storedOptions());
}

@Component({
  selector: 'qr-matrix-controls',
  imports: [
    CdkTextareaAutosize,
    FormsModule,
    HlmFieldImports,
    HlmInputImports,
    HlmSelectImports,
    HlmTextareaImports,
  ],
  providers: [{provide: NANOSTORES, useClass: NanostoresService}],
  template: `
    <div class="grid gap-4">
      <div hlmField>
        <label [for]="idPrefix() + 'payload'" hlmFieldLabel>Payload</label>
        <textarea
          #autosize="cdkTextareaAutosize"
          [id]="idPrefix() + 'payload'"
          [ngModel]="currentOptions().payload"
          (ngModelChange)="updateQrOptions({payload: $event})"
          hlmTextarea
          cdkTextareaAutosize></textarea>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div hlmField>
          <label [for]="idPrefix() + 'mode'" hlmFieldLabel>Mode</label>
          <hlm-select
            [ngModel]="currentOptions().mode ?? 'auto'"
            [itemToString]="titleCase"
            (ngModelChange)="updateQrOptions({mode: $event})">
            <hlm-select-trigger class="w-full" [buttonId]="idPrefix() + 'mode'">
              <hlm-select-value placeholder="Auto" />
            </hlm-select-trigger>
            <hlm-select-content *hlmSelectPortal>
              <hlm-select-group>
                <hlm-select-label>Modes</hlm-select-label>
                <hlm-select-item value="auto">Auto</hlm-select-item>
                <hlm-select-item value="numeric">Numeric</hlm-select-item>
                <hlm-select-item value="alphanumeric">Alphanumeric</hlm-select-item>
                <hlm-select-item value="octet">Octet</hlm-select-item>
                <hlm-select-item value="kanji">Kanji</hlm-select-item>
              </hlm-select-group>
            </hlm-select-content>
          </hlm-select>
        </div>

        <div hlmField>
          <label [for]="idPrefix() + 'errorCorrection'" hlmFieldLabel>Error Correction</label>
          <hlm-select
            [ngModel]="currentOptions().errorCorrectionLevel ?? DEFAULT_ERROR_CORRECTION_LEVEL"
            [itemToString]="errorCorrectionLabel"
            (ngModelChange)="setErrorCorrectionLevel($event)">
            <hlm-select-trigger class="w-full" [buttonId]="idPrefix() + 'errorCorrection'">
              <hlm-select-value />
            </hlm-select-trigger>
            <hlm-select-content *hlmSelectPortal>
              <hlm-select-group>
                <hlm-select-label>Error Correction Levels</hlm-select-label>
                @for (level of ERROR_CORRECTION_LEVELS; track level) {
                  <hlm-select-item [value]="level">
                    {{ errorCorrectionLabel(level) }}
                  </hlm-select-item>
                }
              </hlm-select-group>
            </hlm-select-content>
          </hlm-select>
        </div>

        <div hlmField>
          <label [for]="idPrefix() + 'size'" hlmFieldLabel>Size</label>
          <input
            [id]="idPrefix() + 'size'"
            [ngModel]="currentOptions().moduleSize"
            [placeholder]="defaultModuleSize()"
            (ngModelChange)="updateQrOptions({moduleSize: $event})"
            hlmInput
            type="number"
            min="1" />
        </div>

        <div hlmField>
          <label [for]="idPrefix() + 'quiet-zone'" hlmFieldLabel>Quiet zone</label>
          <input
            [id]="idPrefix() + 'quiet-zone'"
            [ngModel]="currentOptions().quietZone"
            [placeholder]="defaultQuietZone()"
            (ngModelChange)="updateQrOptions({quietZone: $event})"
            hlmInput
            type="number"
            min="0" />
        </div>
      </div>
    </div>
  `,
})
export class QrMatrixControls extends QrOptionsControls {
  readonly defaultModuleSize = input(8);
  readonly defaultQuietZone = input(4);

  protected readonly titleCase = titleCase;
  protected readonly DEFAULT_ERROR_CORRECTION_LEVEL = DEFAULT_ERROR_CORRECTION_LEVEL;
  protected readonly ERROR_CORRECTION_LEVELS = [
    'L',
    'M',
    'Q',
    'H',
  ] as const satisfies readonly QRCodeErrorCorrectionLevel[];
  protected readonly errorCorrectionLabel = (level: QRCodeErrorCorrectionLevel): string =>
    level === DEFAULT_ERROR_CORRECTION_LEVEL ? `${level} (Default)` : level;

  protected setErrorCorrectionLevel(level: QRCodeErrorCorrectionLevel): void {
    this.updateQrOptions({
      errorCorrectionLevel: level === DEFAULT_ERROR_CORRECTION_LEVEL ? undefined : level,
    });
  }
}

@Component({
  selector: 'qr-encoding-controls',
  imports: [FormsModule, HlmAlertImports, HlmFieldImports, HlmSelectImports, HlmSwitchImports],
  providers: [{provide: NANOSTORES, useClass: NanostoresService}],
  template: `
    <div class="grid gap-4">
      @if (allowMicro()) {
        <div hlmField>
          <label [for]="idPrefix() + 'symbol'" hlmFieldLabel>Symbol</label>
          <hlm-select
            [ngModel]="micro() ? 'micro' : 'standard'"
            [itemToString]="symbolLabel"
            (ngModelChange)="setSymbol($event)">
            <hlm-select-trigger class="w-full" [buttonId]="idPrefix() + 'symbol'">
              <hlm-select-value />
            </hlm-select-trigger>
            <hlm-select-content *hlmSelectPortal>
              <hlm-select-group>
                <hlm-select-label>Symbols</hlm-select-label>
                <hlm-select-item value="standard">{{ symbolLabel('standard') }}</hlm-select-item>
                <hlm-select-item value="micro">{{ symbolLabel('micro') }}</hlm-select-item>
              </hlm-select-group>
            </hlm-select-content>
          </hlm-select>
          @if (micro()) {
            <p hlmFieldDescription>
              11 to 17 modules wide for up to 35 digits, 21 alphanumeric characters, or 15 bytes.
              Many phone camera apps cannot read Micro QR codes.
            </p>
          }
        </div>
      }

      @if (micro()) {
        <div class="grid gap-4 md:grid-cols-2">
          <div hlmField>
            <label [for]="idPrefix() + 'micro-version'" hlmFieldLabel>Version</label>
            <hlm-select
              [ngModel]="currentOptions().microVersion"
              (ngModelChange)="updateQrOptions({microVersion: $event})">
              <hlm-select-trigger class="w-full" [buttonId]="idPrefix() + 'micro-version'">
                <hlm-select-value placeholder="Auto" />
              </hlm-select-trigger>
              <hlm-select-content *hlmSelectPortal>
                <hlm-select-group>
                  <hlm-select-label>Micro QR versions</hlm-select-label>
                  <hlm-select-item [value]="undefined">Auto</hlm-select-item>
                  @for (version of MICRO_VERSION_OPTIONS; track version) {
                    <hlm-select-item [value]="version">{{ version }}</hlm-select-item>
                  }
                </hlm-select-group>
              </hlm-select-content>
            </hlm-select>
          </div>

          <div hlmField>
            <label [for]="idPrefix() + 'micro-mask'" hlmFieldLabel>Mask</label>
            <hlm-select
              [ngModel]="currentOptions().microMask"
              (ngModelChange)="updateQrOptions({microMask: $event})">
              <hlm-select-trigger class="w-full" [buttonId]="idPrefix() + 'micro-mask'">
                <hlm-select-value placeholder="Auto" />
              </hlm-select-trigger>
              <hlm-select-content *hlmSelectPortal>
                <hlm-select-group>
                  <hlm-select-label>Micro QR masks</hlm-select-label>
                  <hlm-select-item [value]="undefined">Auto</hlm-select-item>
                  @for (mask of MICRO_MASK_OPTIONS; track mask) {
                    <hlm-select-item [value]="mask">{{ mask }}</hlm-select-item>
                  }
                </hlm-select-group>
              </hlm-select-content>
            </hlm-select>
          </div>
        </div>

        <label
          class="border-input rounded-md border p-4"
          [for]="idPrefix() + 'micro-fallback'"
          hlmField>
          <div class="flex items-center justify-between gap-4">
            <div class="grid gap-1">
              <span hlmFieldLabel>Fall back to a standard QR code</span>
              <p hlmFieldDescription>
                Generate a standard QR code when no Micro QR code holds the payload at the error
                correction level.
              </p>
            </div>
            <hlm-switch
              [checked]="currentOptions().microFallback ?? false"
              [inputId]="idPrefix() + 'micro-fallback'"
              (checkedChange)="updateQrOptions({microFallback: $event})" />
          </div>
        </label>

        @if (hasUnreliableFinderRing()) {
          <hlm-alert>
            <h4 hlmAlertTitle>Finder ring may not scan</h4>
            <p hlmAlertDescription>
              Scanners locate a Micro QR code by its one finder pattern. ZXing cannot reliably find
              {{ currentOptions().finderRingShape }} finder rings; use a square or diagonal ring.
            </p>
          </hlm-alert>
        }
      } @else {
        <div class="grid gap-4 md:grid-cols-2">
          <div hlmField>
            <label [for]="idPrefix() + 'version'" hlmFieldLabel>Version</label>
            <hlm-select
              [ngModel]="currentOptions().version"
              (ngModelChange)="updateQrOptions({version: $event})">
              <hlm-select-trigger class="w-full" [buttonId]="idPrefix() + 'version'">
                <hlm-select-value placeholder="Auto" />
              </hlm-select-trigger>
              <hlm-select-content *hlmSelectPortal>
                <hlm-select-group>
                  <hlm-select-label>Versions</hlm-select-label>
                  <hlm-select-item [value]="undefined">Auto</hlm-select-item>
                  @for (version of VERSION_OPTIONS; track version) {
                    <hlm-select-item [value]="version">{{ version }}</hlm-select-item>
                  }
                </hlm-select-group>
              </hlm-select-content>
            </hlm-select>
          </div>

          <div hlmField>
            <label [for]="idPrefix() + 'mask'" hlmFieldLabel>Mask</label>
            <hlm-select
              [ngModel]="currentOptions().mask"
              (ngModelChange)="updateQrOptions({mask: $event})">
              <hlm-select-trigger class="w-full" [buttonId]="idPrefix() + 'mask'">
                <hlm-select-value placeholder="Auto" />
              </hlm-select-trigger>
              <hlm-select-content *hlmSelectPortal>
                <hlm-select-group>
                  <hlm-select-label>Masks</hlm-select-label>
                  <hlm-select-item [value]="undefined">Auto</hlm-select-item>
                  @for (mask of MASK_OPTIONS; track mask) {
                    <hlm-select-item [value]="mask">{{ mask }}</hlm-select-item>
                  }
                </hlm-select-group>
              </hlm-select-content>
            </hlm-select>
          </div>
        </div>

        <label
          class="border-input rounded-md border p-4"
          [for]="idPrefix() + 'optimize-segments'"
          hlmField>
          <div class="flex items-center justify-between gap-4">
            <div class="grid gap-1">
              <span hlmFieldLabel>Optimize mixed-mode segments</span>
              <p hlmFieldDescription>
                Auto mode can combine encoding modes to fit more data. Uses additional processing
                time. Explicit modes bypass this option.
              </p>
            </div>
            <hlm-switch
              [checked]="currentOptions().optimizeSegments ?? false"
              [inputId]="idPrefix() + 'optimize-segments'"
              (checkedChange)="updateQrOptions({optimizeSegments: $event})" />
          </div>
        </label>

        <label class="border-input rounded-md border p-4" [for]="idPrefix() + 'eci'" hlmField>
          <div class="flex items-center justify-between gap-4">
            <div class="grid gap-1">
              <span hlmFieldLabel>UTF-8 ECI</span>
              <p hlmFieldDescription>
                Emit assignment 26 before the first octet segment to explicitly declare UTF-8.
              </p>
            </div>
            <hlm-switch
              [checked]="currentOptions().eci ?? false"
              [inputId]="idPrefix() + 'eci'"
              (checkedChange)="updateQrOptions({eci: $event})" />
          </div>
        </label>
      }

      <label class="border-input rounded-md border p-4" [for]="idPrefix() + 'kanji'" hlmField>
        <div class="flex items-center justify-between gap-4">
          <div class="grid gap-1">
            <span hlmFieldLabel>Kanji mode</span>
            <p hlmFieldDescription>
              Auto mode and optimized segments encode Japanese text in 13 bits per character instead
              of UTF-8 bytes. Adds a Shift JIS table of about 13 kB gzipped. The Kanji mode always
              loads the table.
            </p>
          </div>
          <hlm-switch
            [checked]="currentOptions().kanji ?? false"
            [inputId]="idPrefix() + 'kanji'"
            (checkedChange)="updateQrOptions({kanji: $event})" />
        </div>
      </label>
    </div>
  `,
})
export class QrEncodingControls extends QrOptionsControls {
  /** The CLI cannot generate Micro QR codes, so it hides the symbol choice. */
  readonly allowMicro = input(true);

  protected readonly VERSION_OPTIONS = Array.from({length: 40}, (_, index) => index + 1);
  protected readonly MASK_OPTIONS = Array.from({length: 8}, (_, index) => index);
  protected readonly MICRO_VERSION_OPTIONS = [
    'M1',
    'M2',
    'M3',
    'M4',
  ] as const satisfies readonly QRCodeMicroVersion[];
  protected readonly MICRO_MASK_OPTIONS = [
    0, 1, 2, 3,
  ] as const satisfies readonly QRCodeMicroMask[];

  protected readonly micro = computed(() => this.allowMicro() && !!this.currentOptions().micro);
  protected readonly hasUnreliableFinderRing = computed(() =>
    isUnreliableMicroFinderRing(this.currentOptions().finderRingShape),
  );
  protected readonly symbolLabel = (symbol: PlaygroundSymbol): string =>
    symbol === 'micro' ? 'Micro QR code' : 'QR code (Default)';

  protected setSymbol(symbol: PlaygroundSymbol): void {
    this.updateQrOptions(playgroundSymbolPatch(this.currentOptions(), symbol === 'micro'));
  }
}
