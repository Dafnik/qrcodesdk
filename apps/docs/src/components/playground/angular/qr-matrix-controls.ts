import {CdkTextareaAutosize} from '@angular/cdk/text-field';
import {Component, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormsModule} from '@angular/forms';

import {NANOSTORES, NanostoresService} from '@nanostores/angular';
import {HlmFieldImports} from '@spartan-ng/helm/field';
import {HlmInputImports} from '@spartan-ng/helm/input';
import {HlmSelectImports} from '@spartan-ng/helm/select';
import {HlmSwitchImports} from '@spartan-ng/helm/switch';
import {HlmTextareaImports} from '@spartan-ng/helm/textarea';

import {playgroundOptions, updateQrOptions} from '../playground-options.ts';

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
        <label hlmFieldLabel for="payload">Payload</label>
        <textarea
          id="payload"
          #autosize="cdkTextareaAutosize"
          [ngModel]="currentOptions().payload"
          (ngModelChange)="updateQrOptions({payload: $event})"
          hlmTextarea
          cdkTextareaAutosize></textarea>
      </div>

      <div class="border-input rounded-md border p-4" hlmField>
        <div class="flex items-center justify-between gap-4">
          <div class="grid gap-1">
            <label hlmFieldLabel for="eci">UTF-8 ECI</label>
            <p hlmFieldDescription>
              Emit assignment 26 before the first octet segment to explicitly declare UTF-8.
            </p>
          </div>
          <hlm-switch
            [checked]="currentOptions().eci ?? false"
            (checkedChange)="updateQrOptions({eci: $event})"
            inputId="eci" />
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div hlmField>
          <label hlmFieldLabel for="mode">Mode</label>
          <hlm-select
            [ngModel]="currentOptions().mode"
            (ngModelChange)="updateQrOptions({mode: $event})">
            <hlm-select-trigger class="w-full" buttonId="mode">
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
          <label hlmFieldLabel for="version">Version</label>
          <hlm-select
            [ngModel]="currentOptions().version"
            (ngModelChange)="updateQrOptions({version: $event})">
            <hlm-select-trigger class="w-full" buttonId="version">
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
          <label hlmFieldLabel for="errorCorrection">Error Correction</label>
          <hlm-select
            [ngModel]="currentOptions().errorCorrectionLevel"
            (ngModelChange)="updateQrOptions({errorCorrectionLevel: $event})">
            <hlm-select-trigger class="w-full" buttonId="errorCorrection">
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
          <label hlmFieldLabel for="mask">Mask</label>
          <hlm-select
            [ngModel]="currentOptions().mask"
            (ngModelChange)="updateQrOptions({mask: $event})">
            <hlm-select-trigger class="w-full" buttonId="mask">
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
          <label hlmFieldLabel for="size">Size</label>
          <input
            id="size"
            [ngModel]="currentOptions().moduleSize"
            (ngModelChange)="updateQrOptions({moduleSize: $event})"
            hlmInput
            type="number"
            min="1"
            placeholder="8" />
        </div>

        <div hlmField>
          <label hlmFieldLabel for="quiet-zone">Quiet zone</label>
          <input
            id="quiet-zone"
            [ngModel]="currentOptions().quietZone"
            (ngModelChange)="updateQrOptions({quietZone: $event})"
            hlmInput
            type="number"
            min="0"
            placeholder="4" />
        </div>
      </div>
    </div>
  `,
})
export class QrMatrixControls {
  protected readonly updateQrOptions = updateQrOptions;

  private readonly nanostores = inject(NanostoresService);
  protected readonly currentOptions = toSignal(this.nanostores.useStore(playgroundOptions), {
    requireSync: true,
  });

  protected readonly VERSION_OPTIONS = Array.from({length: 40}, (_, index) => index + 1);
  protected readonly MASK_OPTIONS = Array.from({length: 8}, (_, index) => index);
}
