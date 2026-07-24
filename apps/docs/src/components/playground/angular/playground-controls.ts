import {TitleCasePipe, UpperCasePipe} from '@angular/common';
import {Component, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormsModule} from '@angular/forms';

import {NANOSTORES, NanostoresService} from '@nanostores/angular';
import {HlmFieldImports} from '@spartan-ng/helm/field';
import {HlmLabelImports} from '@spartan-ng/helm/label';
import {HlmRadioGroupImports} from '@spartan-ng/helm/radio-group';

import {
  type PlaygroundOutput,
  type PlaygroundPackage,
  qrConfig,
  updateQrConfig,
} from '../playground-config.ts';

@Component({
  template: `
    <div hlmField>
      <label class="font-bold" hlmFieldLabel for="package-select">Package</label>
      <div
        class="bg-input/90 text-foreground inline-flex h-9 w-full rounded-md p-0.5"
        id="package-select">
        <hlm-radio-group
          class="group after:bg-background relative grid w-full grid-cols-[1fr_1fr] gap-0 font-medium after:absolute after:inset-y-0 after:w-1/2 after:rounded-sm after:transition-[translate,box-shadow] after:duration-300 after:ease-[cubic-bezier(0.16,1,0.3,1)] data-[state=angular]:after:translate-x-full data-[state=react]:after:translate-x-0 after:motion-reduce:transition-none"
          [attr.data-state]="currentConfig().packageName"
          [ngModel]="currentConfig().packageName"
          (ngModelChange)="updateQrConfig({packageName: $event})">
          @for (package of packages; track package) {
            <label
              class="has-data-[checked=false]:text-muted-foreground/70 z-10 flex items-center justify-center px-3 text-sm has-data-[disabled=true]:cursor-not-allowed has-data-[disabled=true]:opacity-50"
              [for]="'package-input-' + package"
              hlmLabel>
              {{ package | titlecase }}

              <hlm-radio class="hidden" [inputId]="'package-input-' + package" [value]="package" />
            </label>
          }
        </hlm-radio-group>
      </div>
    </div>
    <div hlmField>
      <label class="font-bold" hlmFieldLabel for="output-select">Output</label>

      <div
        class="bg-input/90 text-foreground inline-flex h-9 w-full rounded-md p-0.5"
        id="output-select">
        <hlm-radio-group
          class="group after:bg-background relative grid w-full grid-cols-3 gap-0 font-medium after:pointer-events-none after:absolute after:inset-y-0 after:left-0 after:w-1/3 after:rounded-sm after:shadow-sm after:transition-transform after:duration-300 after:ease-[cubic-bezier(0.16,1,0.3,1)] data-[state=canvas]:after:translate-x-[200%] data-[state=image]:after:translate-x-full data-[state=svg]:after:translate-x-0 after:motion-reduce:transition-none"
          [attr.data-state]="currentConfig().output"
          [ngModel]="currentConfig().output"
          (ngModelChange)="updateQrConfig({output: $event})">
          @for (output of outputs; track output) {
            <label
              class="has-data-[checked=false]:text-muted-foreground/70 z-10 flex cursor-pointer items-center justify-center px-3 text-sm has-data-[disabled=true]:cursor-not-allowed has-data-[disabled=true]:opacity-50"
              [for]="'output-input-' + output"
              hlmLabel>
              {{ output | uppercase }}

              <hlm-radio class="hidden" [inputId]="'output-input-' + output" [value]="output" />
            </label>
          }
        </hlm-radio-group>
      </div>
    </div>
  `,
  host: {
    class: 'grid gap-4',
  },
  providers: [{provide: NANOSTORES, useClass: NanostoresService}],
  selector: 'playground-controls',
  imports: [
    HlmRadioGroupImports,
    HlmLabelImports,
    HlmFieldImports,
    FormsModule,
    TitleCasePipe,
    UpperCasePipe,
  ],
})
export class PlaygroundControls {
  protected readonly updateQrConfig = updateQrConfig;

  private readonly nanostores = inject(NanostoresService);
  protected readonly currentConfig = toSignal(this.nanostores.useStore(qrConfig), {
    requireSync: true,
  });

  protected readonly packages: PlaygroundPackage[] = ['react', 'angular'];
  protected readonly outputs: PlaygroundOutput[] = ['svg', 'image', 'canvas'];
}
