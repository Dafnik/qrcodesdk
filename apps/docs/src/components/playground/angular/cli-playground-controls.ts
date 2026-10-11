import {Component, computed, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormsModule} from '@angular/forms';

import {NanostoresService} from '@nanostores/angular';
import {HlmFieldImports} from '@spartan-ng/helm/field';
import {HlmInputImports} from '@spartan-ng/helm/input';
import {HlmNativeSelectImports} from '@spartan-ng/helm/native-select';

import {cliPlaygroundOptions, updateCliOptions} from '../cli-playground.ts';
import {
  DARK_COLOR_PRESETS,
  LIGHT_COLOR_PRESETS,
  PlaygroundColorInput,
} from './playground-color-input.ts';
import {QrMatrixControls} from './qr-matrix-controls.ts';

@Component({
  selector: 'cli-playground-controls',
  imports: [
    FormsModule,
    HlmFieldImports,
    HlmInputImports,
    HlmNativeSelectImports,
    PlaygroundColorInput,
    QrMatrixControls,
  ],
  template: `
    <div class="grid gap-4">
      <div class="grid gap-4 md:grid-cols-2">
        <div hlmField>
          <label hlmFieldLabel for="cli-launcher">Command launcher</label>
          <hlm-native-select
            class="w-full"
            [ngModel]="options().launcher"
            (ngModelChange)="update({launcher: $event})"
            selectId="cli-launcher">
            <option hlmNativeSelectOption value="installed">qrc (installed)</option>
            <option hlmNativeSelectOption value="npm">npx</option>
            <option hlmNativeSelectOption value="pnpm">pnpm dlx</option>
            <option hlmNativeSelectOption value="viteplus">vp dlx</option>
            <option hlmNativeSelectOption value="bun">bunx</option>
            <option hlmNativeSelectOption value="yarn">yarn dlx</option>
          </hlm-native-select>
        </div>
        <div hlmField>
          <label hlmFieldLabel for="cli-format">Output</label>
          <hlm-native-select
            class="w-full"
            [ngModel]="options().format"
            (ngModelChange)="update({format: $event})"
            selectId="cli-format">
            <option hlmNativeSelectOption value="text">Text</option>
            <option hlmNativeSelectOption value="svg">SVG</option>
          </hlm-native-select>
        </div>
      </div>
      <p class="text-muted-foreground text-sm">
        PNG output requires Node APIs and is available when you run the CLI locally.
      </p>
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
    </div>
  `,
})
export class CliPlaygroundControls {
  private readonly nanostores = inject(NanostoresService);
  protected readonly options = toSignal(this.nanostores.useStore(cliPlaygroundOptions), {
    requireSync: true,
  });
  protected readonly update = updateCliOptions;
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
