import {Component, computed, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormsModule} from '@angular/forms';

import {NanostoresService} from '@nanostores/angular';
import {HlmAccordionImports} from '@spartan-ng/helm/accordion';
import {HlmFieldImports} from '@spartan-ng/helm/field';
import {HlmInputImports} from '@spartan-ng/helm/input';
import {HlmNativeSelectImports} from '@spartan-ng/helm/native-select';

import {cliPlaygroundOptions, updateCliOptions} from '../cli-playground.ts';
import {playgroundOpenSections, setPlaygroundSectionOpen} from '../playground-options.ts';
import {
  DARK_COLOR_PRESETS,
  LIGHT_COLOR_PRESETS,
  PlaygroundColorInput,
} from './playground-color-input.ts';
import {PlaygroundPresetControls} from './preset-controls.ts';
import {QrEncodingControls, QrMatrixControls} from './qr-matrix-controls.ts';

@Component({
  selector: 'cli-playground-controls',
  imports: [
    FormsModule,
    HlmAccordionImports,
    HlmFieldImports,
    HlmInputImports,
    HlmNativeSelectImports,
    PlaygroundColorInput,
    PlaygroundPresetControls,
    QrEncodingControls,
    QrMatrixControls,
  ],
  template: `
    <div class="grid gap-4">
      @if (options().format === 'svg') {
        <div hlmField>
          <label hlmFieldLabel for="cli-output-path">Output path</label>
          <input
            id="cli-output-path"
            [ngModel]="options().outputPath"
            (ngModelChange)="update({outputPath: $event})"
            hlmInput />
          <p hlmFieldDescription>The command writes this file when you run it locally.</p>
        </div>
      }
      <qr-matrix-controls
        [options]="matrixOptions()"
        [update]="update"
        [defaultModuleSize]="1"
        [defaultQuietZone]="2"
        idPrefix="cli-" />
      @if (options().format === 'text') {
        <div class="grid gap-4 md:grid-cols-2">
          <div hlmField>
            <label hlmFieldLabel for="cli-ansi">ANSI mode</label>
            <hlm-native-select
              class="w-full"
              [ngModel]="options().ansi"
              (ngModelChange)="update({ansi: $event})"
              selectId="cli-ansi">
              <option hlmNativeSelectOption value="blocks">Colored blocks</option>
              <option hlmNativeSelectOption value="off">Off</option>
              <option hlmNativeSelectOption value="background">Colored backgrounds</option>
            </hlm-native-select>
          </div>
          <div hlmField>
            <label hlmFieldLabel for="cli-layout">Text layout</label>
            <hlm-native-select
              class="w-full"
              [ngModel]="options().layout"
              [disabled]="options().ansi === 'background'"
              (ngModelChange)="update({layout: $event})"
              selectId="cli-layout">
              <option hlmNativeSelectOption value="compact">Compact</option>
              <option hlmNativeSelectOption value="full">Full</option>
            </hlm-native-select>
          </div>
        </div>
        @if (options().ansi === 'background') {
          <p class="text-muted-foreground text-sm">
            ANSI backgrounds use full-height cells and do not accept a layout flag.
          </p>
        } @else if (options().ansi === 'off') {
          <p class="text-muted-foreground text-sm">
            ANSI off uses the terminal's default colors and ignores QR color settings.
          </p>
        }
      }
      <div class="grid gap-4 md:grid-cols-2">
        <div hlmField>
          <label hlmFieldLabel for="cli-foreground">Dark color</label>
          <playground-color-input
            [color]="options().foreground ?? '#000000'"
            [presets]="DARK_COLOR_PRESETS"
            [showFormat]="false"
            [disabled]="colorsDisabled()"
            (colorChange)="update({foreground: $event})"
            buttonId="cli-foreground" />
        </div>
        <div hlmField>
          <label hlmFieldLabel for="cli-background">Light color</label>
          <playground-color-input
            [color]="options().background ?? '#FFFFFF'"
            [presets]="LIGHT_COLOR_PRESETS"
            [showFormat]="false"
            [disabled]="colorsDisabled()"
            (colorChange)="update({background: $event})"
            buttonId="cli-background" />
        </div>
      </div>
      <playground-preset-controls [disabled]="colorsDisabled()" idPrefix="cli-" />
      @if (options().format === 'svg') {
        <div class="grid gap-4 md:grid-cols-2">
          <div hlmField>
            <label hlmFieldLabel for="cli-aria-label">aria-label</label>
            <input
              id="cli-aria-label"
              [ngModel]="options().ariaLabel ?? ''"
              (ngModelChange)="update({ariaLabel: $event || undefined})"
              hlmInput />
          </div>
          <div hlmField>
            <label hlmFieldLabel for="cli-title">Title</label>
            <input
              id="cli-title"
              [ngModel]="options().title ?? ''"
              (ngModelChange)="update({title: $event || undefined})"
              hlmInput />
          </div>
        </div>
      }
      <hlm-accordion type="multiple">
        <hlm-accordion-item
          class="border-b-muted-foreground"
          [isOpened]="openSections().includes('encoding')"
          (openedChange)="setPlaygroundSectionOpen('encoding', $event)">
          <hlm-accordion-trigger class="w-full text-nowrap" triggerClass="w-full">
            Advanced Encoding
          </hlm-accordion-trigger>
          <hlm-accordion-content>
            <qr-encoding-controls
              class="block py-2"
              [options]="matrixOptions()"
              [update]="update"
              idPrefix="cli-" />
          </hlm-accordion-content>
        </hlm-accordion-item>
      </hlm-accordion>
    </div>
  `,
})
export class CliPlaygroundControls {
  private readonly nanostores = inject(NanostoresService);
  protected readonly options = toSignal(this.nanostores.useStore(cliPlaygroundOptions), {
    requireSync: true,
  });
  protected readonly update = updateCliOptions;
  protected readonly openSections = toSignal(this.nanostores.useStore(playgroundOpenSections), {
    requireSync: true,
  });
  protected readonly setPlaygroundSectionOpen = setPlaygroundSectionOpen;
  protected readonly DARK_COLOR_PRESETS = DARK_COLOR_PRESETS;
  protected readonly LIGHT_COLOR_PRESETS = LIGHT_COLOR_PRESETS;
  protected readonly matrixOptions = computed(() => ({
    ...this.options(),
    packageName: 'cli' as const,
    output: 'svg' as const,
  }));
  protected readonly colorsDisabled = computed(
    () => this.options().format === 'text' && this.options().ansi === 'off',
  );
}
