import {CdkTextareaAutosize} from '@angular/cdk/text-field';
import {Component, computed, inject, input} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormsModule} from '@angular/forms';

import {NANOSTORES, NanostoresService} from '@nanostores/angular';
import {HlmFieldImports} from '@spartan-ng/helm/field';
import {HlmInputImports} from '@spartan-ng/helm/input';
import {HlmSelectImports} from '@spartan-ng/helm/select';
import {HlmSwitchImports} from '@spartan-ng/helm/switch';
import {HlmTextareaImports} from '@spartan-ng/helm/textarea';

import {type PlaygroundOptions, playgroundOptions, updateQrOptions} from '../playground-options.ts';
import {titleCase} from './title-case.ts';

@Component({
  selector: 'qr-matrix-controls',
  imports: [
    CdkTextareaAutosize,
    FormsModule,
    HlmFieldImports,
    HlmInputImports,
    HlmSelectImports,
    HlmTextareaImports,
    HlmSwitchImports,
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

      <div class="grid gap-4 md:grid-cols-2">
        <div hlmField>
          <label [for]="idPrefix() + 'mode'" hlmFieldLabel>Mode</label>
          <hlm-select
            [ngModel]="currentOptions().mode"
            [itemToString]="titleCase"
            (ngModelChange)="updateQrOptions({mode: $event})">
            <hlm-select-trigger class="w-full" [buttonId]="idPrefix() + 'mode'">
              <hlm-select-value placeholder="Auto" />
            </hlm-select-trigger>
            <hlm-select-content *hlmSelectPortal>
              <hlm-select-group>
                <hlm-select-label>Modes</hlm-select-label>
                <hlm-select-item [value]="undefined">Auto</hlm-select-item>
                <hlm-select-item value="numeric">Numeric</hlm-select-item>
                <hlm-select-item value="alphanumeric">Alphanumeric</hlm-select-item>
                <hlm-select-item value="octet">Octet</hlm-select-item>
              </hlm-select-group>
            </hlm-select-content>
          </hlm-select>
        </div>

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
          <label [for]="idPrefix() + 'errorCorrection'" hlmFieldLabel>Error Correction</label>
          <hlm-select
            [ngModel]="currentOptions().errorCorrectionLevel"
            (ngModelChange)="updateQrOptions({errorCorrectionLevel: $event})">
            <hlm-select-trigger class="w-full" [buttonId]="idPrefix() + 'errorCorrection'">
              <hlm-select-value placeholder="Auto" />
            </hlm-select-trigger>
            <hlm-select-content *hlmSelectPortal>
              <hlm-select-group>
                <hlm-select-label>Error Correction Levels</hlm-select-label>
                <hlm-select-item [value]="undefined">Auto</hlm-select-item>
                <hlm-select-item value="L">L</hlm-select-item>
                <hlm-select-item value="M">M</hlm-select-item>
                <hlm-select-item value="Q">Q</hlm-select-item>
                <hlm-select-item value="H">H</hlm-select-item>
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
export class QrMatrixControls {
  readonly options = input<PlaygroundOptions>();
  readonly update = input<(patch: Partial<PlaygroundOptions>) => void>(updateQrOptions);
  readonly idPrefix = input('');
  readonly defaultModuleSize = input(8);
  readonly defaultQuietZone = input(4);
  protected readonly updateQrOptions = (patch: Partial<PlaygroundOptions>) => this.update()(patch);

  private readonly nanostores = inject(NanostoresService);
  private readonly storedOptions = toSignal(this.nanostores.useStore(playgroundOptions), {
    requireSync: true,
  });

  protected readonly currentOptions = computed(() => this.options() ?? this.storedOptions());

  protected readonly titleCase = titleCase;
  protected readonly VERSION_OPTIONS = Array.from({length: 40}, (_, index) => index + 1);
  protected readonly MASK_OPTIONS = Array.from({length: 8}, (_, index) => index);
}
