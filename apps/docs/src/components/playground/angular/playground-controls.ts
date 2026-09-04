import {TitleCasePipe, UpperCasePipe} from '@angular/common';
import {Component, computed, effect, inject, input, linkedSignal, model} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormsModule} from '@angular/forms';

import {NANOSTORES, NanostoresService} from '@nanostores/angular';
import {NgIcon, provideIcons} from '@ng-icons/core';
import {lucideRotateCcw} from '@ng-icons/lucide';
import {SimColorPickerImports} from '@sim/color-picker';
import {HlmAccordionImports} from '@spartan-ng/helm/accordion';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmFieldImports} from '@spartan-ng/helm/field';
import {HlmInputImports} from '@spartan-ng/helm/input';
import {HlmLabelImports} from '@spartan-ng/helm/label';
import {HlmPopoverImports} from '@spartan-ng/helm/popover';
import {HlmRadioGroupImports} from '@spartan-ng/helm/radio-group';
import {HlmSelectImports} from '@spartan-ng/helm/select';
import {HlmSwitchImports} from '@spartan-ng/helm/switch';

import type {QRCodeFinderShape, QRCodeModuleShape} from '@qrcodesdk/core';

import {
  type PlaygroundOutput,
  type PlaygroundPackage,
  playgroundConfig,
  resetQrConfig,
  updateQrConfig,
} from '../playground-config.ts';
import {PlaygroundImageControls} from './image-controls.ts';
import {QrMatrixControls} from './qr-matrix-controls.ts';

@Component({
  template: `
    <hlm-popover sideOffset="8">
      <button
        class="h-10 w-full justify-start gap-3 px-3 font-mono text-xs"
        [id]="buttonId()"
        [disabled]="disabled()"
        hlmBtn
        hlmPopoverTrigger
        type="button"
        variant="outline"
        aria-label="Open color palette">
        <span class="size-5 rounded-sm border shadow-xs" [style.background]="color()"></span>
        <span class="truncate">{{ color() }}</span>
      </button>

      <div
        class="w-auto max-w-[calc(100vw-1rem)] bg-transparent p-0 shadow-none ring-0"
        *hlmPopoverPortal="let ctx">
        <sim-color-picker
          class="w-[380px] max-w-[calc(100vw-1rem)] gap-4 rounded-2xl p-5"
          [(value)]="color"
          [format]="'hex'"
          [presets]="presets()">
          <sim-color-palette />

          <sim-color-value-editor class="gap-0 [&>label]:sr-only" />

          <sim-color-presets
            class="**:data-[slot=color-preset]:size-5 **:data-[slot=color-preset]:rounded-full"
            label="Saved" />
        </sim-color-picker>
      </div>
    </hlm-popover>
  `,
  selector: 'playground-color-input',
  imports: [HlmButtonImports, HlmPopoverImports, SimColorPickerImports],
})
export class PlaygroundColorInput {
  buttonId = input.required<string>();
  color = model<string>();
  presets = input.required<readonly string[]>();
  disabled = input<boolean>(false);
}

@Component({
  template: `
    <div class="grid gap-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Configure</h1>
        <button (click)="resetQrConfig()" type="button" hlmBtn>
          Reset
          <ng-icon name="lucideRotateCcw" />
        </button>
      </div>
      <div hlmField>
        <label hlmFieldLabel for="package-select">Package</label>
        <div
          class="bg-input/90 text-foreground inline-flex h-9 w-full rounded-md p-0.5"
          id="package-select">
          <hlm-radio-group
            class="group after:bg-background relative grid w-full grid-cols-4 gap-0 font-medium after:absolute after:inset-y-0 after:w-1/4 after:rounded-sm after:transition-[translate,box-shadow] after:duration-300 after:ease-[cubic-bezier(0.16,1,0.3,1)] data-[state=angular]:after:translate-x-[300%] data-[state=react]:after:translate-x-0 data-[state=svelte]:after:translate-x-[200%] data-[state=vue]:after:translate-x-full after:motion-reduce:transition-none"
            [attr.data-state]="currentConfig().packageName"
            [ngModel]="currentConfig().packageName"
            (ngModelChange)="updateQrConfig({packageName: $event})">
            @for (package of packages; track package) {
              <label
                class="has-data-[checked=false]:text-muted-foreground/70 z-10 flex items-center justify-center px-3 has-data-[disabled=true]:cursor-not-allowed has-data-[disabled=true]:opacity-50"
                [for]="'package-input-' + package"
                hlmLabel>
                {{ package | titlecase }}

                <hlm-radio
                  class="hidden"
                  [inputId]="'package-input-' + package"
                  [value]="package" />
              </label>
            }
          </hlm-radio-group>
        </div>
      </div>
      <div hlmField>
        <label hlmFieldLabel for="output-select">Output</label>

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
                class="has-data-[checked=false]:text-muted-foreground/70 z-10 flex cursor-pointer items-center justify-center px-3 has-data-[disabled=true]:cursor-not-allowed has-data-[disabled=true]:opacity-50"
                [for]="'output-input-' + output"
                hlmLabel>
                {{ output | uppercase }}

                <hlm-radio class="hidden" [inputId]="'output-input-' + output" [value]="output" />
              </label>
            }
          </hlm-radio-group>
        </div>
      </div>
      <qr-matrix-controls />
      <div class="grid gap-4 md:grid-cols-2">
        <div hlmField>
          <label hlmFieldLabel for="darkColor">Dark Color</label>
          <playground-color-input
            [presets]="DARK_COLOR_PRESETS"
            [color]="foreground()"
            (colorChange)="updateQrConfig({foreground: $event})"
            buttonId="darkColor" />
        </div>

        <div hlmField>
          <label hlmFieldLabel for="lightColor">Light Color</label>
          <playground-color-input
            [presets]="LIGHT_COLOR_PRESETS"
            [color]="background()"
            (colorChange)="updateQrConfig({background: $event})"
            buttonId="lightColor" />
        </div>
      </div>

      <hlm-accordion type="multiple">
        <hlm-accordion-item isOpened>
          <hlm-accordion-trigger class="w-full text-nowrap" triggerClass="w-full">
            Center Image
          </hlm-accordion-trigger>
          <hlm-accordion-content>
            <playground-image-controls />
          </hlm-accordion-content>
        </hlm-accordion-item>
        <hlm-accordion-item isOpened>
          <hlm-accordion-trigger class="w-full text-nowrap" triggerClass="w-full">
            Advanced Styling
          </hlm-accordion-trigger>
          <hlm-accordion-content>
            <div class="grid gap-4 py-2 md:grid-cols-2">
              <div
                class="border-input data-[checked=true]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border shadow-xs outline-none"
                [attr.data-checked]="overrideModules() ? 'true' : 'false'">
                <label
                  class="grid w-full gap-2 p-4 has-data-[disabled=true]:cursor-not-allowed has-data-[disabled=true]:opacity-70"
                  for="override-dot"
                  hlmLabel>
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <span class="text-sm leading-4">Dots</span>
                      <span class="text-muted-foreground text-xs leading-[inherit] font-normal">
                        (Data modules)
                      </span>
                    </div>
                    <hlm-switch [(checked)]="overrideModules" inputId="override-dot" />
                  </div>

                  <div class="grid gap-2 md:grid-cols-2">
                    <div hlmField>
                      <label hlmFieldLabel for="moduleShape">Type</label>
                      <hlm-select
                        [disabled]="!overrideModules()"
                        [ngModel]="moduleShape()"
                        (ngModelChange)="updateQrConfig({modules: {shape: $event}})">
                        <hlm-select-trigger class="w-full" buttonId="moduleShape">
                          <hlm-select-value placeholder="Auto" />
                        </hlm-select-trigger>
                        <hlm-select-content *hlmSelectPortal>
                          <hlm-select-group>
                            <hlm-select-label>Dot type</hlm-select-label>
                            @for (
                              moduleShapeOption of MODULE_SHAPE_OPTIONS;
                              track moduleShapeOption
                            ) {
                              <hlm-select-item [value]="moduleShapeOption">
                                {{ moduleShapeOption }}
                              </hlm-select-item>
                            }
                          </hlm-select-group>
                        </hlm-select-content>
                      </hlm-select>
                    </div>
                    <div hlmField>
                      <label hlmFieldLabel for="moduleColor">Color</label>
                      <playground-color-input
                        [presets]="DARK_COLOR_PRESETS"
                        [color]="moduleColor()"
                        [disabled]="!overrideModules()"
                        (colorChange)="updateQrConfig({modules: {color: $event}})"
                        buttonId="moduleColor" />
                    </div>
                  </div>
                </label>
              </div>
              <div
                class="border-input data-[checked=true]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border shadow-xs outline-none"
                [attr.data-checked]="overrideFinderOuter() ? 'true' : 'false'">
                <label
                  class="grid w-full gap-2 p-4 has-data-[disabled=true]:cursor-not-allowed has-data-[disabled=true]:opacity-70"
                  for="override-finder-outer"
                  hlmLabel>
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <span class="text-sm leading-4">Corners Square</span>
                      <span class="text-muted-foreground text-xs leading-[inherit] font-normal">
                        (Finder squares)
                      </span>
                    </div>
                    <hlm-switch [(checked)]="overrideFinderOuter" inputId="override-finder-outer" />
                  </div>

                  <div class="grid gap-2 md:grid-cols-2">
                    <div hlmField>
                      <label hlmFieldLabel for="cornerSquareType">Type</label>
                      <hlm-select
                        [disabled]="!overrideFinderOuter()"
                        [ngModel]="finderOuterType()"
                        (ngModelChange)="updateQrConfig({finder: {outer: {shape: $event}}})">
                        <hlm-select-trigger class="w-full" buttonId="cornerSquareType">
                          <hlm-select-value placeholder="Auto" />
                        </hlm-select-trigger>
                        <hlm-select-content *hlmSelectPortal>
                          <hlm-select-group>
                            <hlm-select-label>Corners square type</hlm-select-label>
                            @for (
                              cornerSquareTypeOption of FINDER_OUTER_SHAPE_OPTIONS;
                              track cornerSquareTypeOption
                            ) {
                              <hlm-select-item [value]="cornerSquareTypeOption">
                                {{ cornerSquareTypeOption }}
                              </hlm-select-item>
                            }
                          </hlm-select-group>
                        </hlm-select-content>
                      </hlm-select>
                    </div>
                    <div hlmField>
                      <label hlmFieldLabel for="cornerSquareColor">Color</label>
                      <playground-color-input
                        [presets]="DARK_COLOR_PRESETS"
                        [color]="finderOuterColor()"
                        [disabled]="!overrideFinderOuter()"
                        (colorChange)="updateQrConfig({finder: {outer: {color: $event}}})"
                        buttonId="cornerSquareColor" />
                    </div>
                  </div>
                </label>
              </div>
              <div
                class="border-input data-[checked=true]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border shadow-xs outline-none"
                [attr.data-checked]="overrideFinderCenter() ? 'true' : 'false'">
                <label
                  class="grid w-full gap-2 p-4 has-data-[disabled=true]:cursor-not-allowed has-data-[disabled=true]:opacity-70"
                  for="override-finder-center"
                  hlmLabel>
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <span class="text-sm leading-4">Corners Dot</span>
                      <span class="text-muted-foreground text-xs leading-[inherit] font-normal">
                        (Finder dots)
                      </span>
                    </div>
                    <hlm-switch
                      [(checked)]="overrideFinderCenter"
                      inputId="override-finder-center" />
                  </div>

                  <div class="grid gap-2 md:grid-cols-2">
                    <div hlmField>
                      <label hlmFieldLabel for="cornerDotType">Type</label>
                      <hlm-select
                        [disabled]="!overrideFinderCenter()"
                        [ngModel]="finderCenterType()"
                        (ngModelChange)="updateQrConfig({finder: {center: {shape: $event}}})">
                        <hlm-select-trigger class="w-full" buttonId="cornerDotType">
                          <hlm-select-value placeholder="Auto" />
                        </hlm-select-trigger>
                        <hlm-select-content *hlmSelectPortal>
                          <hlm-select-group>
                            <hlm-select-label>Corners dot type</hlm-select-label>
                            @for (
                              cornerDotTypeOptions of CORNER_MODULE_SHAPE_OPTIONS;
                              track cornerDotTypeOptions
                            ) {
                              <hlm-select-item [value]="cornerDotTypeOptions">
                                {{ cornerDotTypeOptions }}
                              </hlm-select-item>
                            }
                          </hlm-select-group>
                        </hlm-select-content>
                      </hlm-select>
                    </div>
                    <div hlmField>
                      <label hlmFieldLabel for="cornerDotColor">Color</label>
                      <playground-color-input
                        [presets]="DARK_COLOR_PRESETS"
                        [color]="finderCenterColor()"
                        [disabled]="!overrideFinderCenter()"
                        (colorChange)="updateQrConfig({finder: {center: {color: $event}}})"
                        buttonId="cornerDotColor" />
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </hlm-accordion-content>
        </hlm-accordion-item>
        <hlm-accordion-item isOpened>
          <hlm-accordion-trigger class="w-full text-nowrap" triggerClass="w-full">
            Accessibility
          </hlm-accordion-trigger>
          <hlm-accordion-content>
            <div class="grid gap-4 py-2 md:grid-cols-2">
              <div hlmField>
                <label hlmFieldLabel for="alt">Alt</label>
                <input
                  id="alt"
                  [ngModel]="currentConfig().alt"
                  (ngModelChange)="updateQrConfig({alt: $event})"
                  hlmInput />
              </div>
              <div hlmField>
                <label hlmFieldLabel for="ariaLabel">aria-label</label>
                <input
                  id="ariaLabel"
                  [ngModel]="currentConfig().ariaLabel"
                  (ngModelChange)="updateQrConfig({ariaLabel: $event})"
                  hlmInput />
              </div>
              <div hlmField>
                <label hlmFieldLabel for="title">Title</label>
                <input
                  id="title"
                  [ngModel]="currentConfig().title"
                  (ngModelChange)="updateQrConfig({title: $event})"
                  hlmInput />
              </div>
            </div>
          </hlm-accordion-content>
        </hlm-accordion-item>
      </hlm-accordion>
    </div>
  `,
  providers: [{provide: NANOSTORES, useClass: NanostoresService}, provideIcons({lucideRotateCcw})],
  selector: 'playground-controls',
  imports: [
    HlmRadioGroupImports,
    HlmLabelImports,
    HlmFieldImports,
    HlmSelectImports,
    HlmButtonImports,
    HlmInputImports,
    HlmAccordionImports,
    HlmSwitchImports,
    FormsModule,
    TitleCasePipe,
    UpperCasePipe,
    NgIcon,
    PlaygroundColorInput,
    PlaygroundImageControls,
    QrMatrixControls,
  ],
})
export class PlaygroundControls {
  protected readonly updateQrConfig = updateQrConfig;
  protected readonly resetQrConfig = resetQrConfig;

  private readonly nanostores = inject(NanostoresService);
  protected readonly currentConfig = toSignal(this.nanostores.useStore(playgroundConfig), {
    requireSync: true,
  });
  protected readonly foreground = computed(() => this.currentConfig().foreground ?? '#000000');
  protected readonly background = computed(() => this.currentConfig().background ?? '#FFFFFF');
  protected readonly moduleShape = computed(() => this.currentConfig().modules?.shape ?? 'square');
  protected readonly moduleColor = computed(() => this.currentConfig().modules?.color ?? '#000000');
  protected readonly finderOuterType = computed(
    () => this.currentConfig().finder?.outer?.shape ?? 'square',
  );
  protected readonly finderOuterColor = computed(
    () => this.currentConfig().finder?.outer?.color ?? '#000000',
  );
  protected readonly finderCenterType = computed(
    () => this.currentConfig().finder?.center?.shape ?? 'square',
  );
  protected readonly finderCenterColor = computed(
    () => this.currentConfig().finder?.center?.color ?? '#000000',
  );

  protected readonly overrideModules = linkedSignal(() => !!this.currentConfig().modules);
  protected readonly overrideFinderOuter = linkedSignal(() => !!this.currentConfig().finder?.outer);
  protected readonly overrideFinderCenter = linkedSignal(
    () => !!this.currentConfig().finder?.center,
  );

  protected readonly packages: PlaygroundPackage[] = ['react', 'vue', 'svelte', 'angular'];
  protected readonly outputs: PlaygroundOutput[] = ['svg', 'image', 'canvas'];
  protected readonly DARK_COLOR_PRESETS = [
    '#0A0A0A',
    '#171717',
    '#262626',
    '#404040',
    '#102a43',
    '#17365d',
    '#1f2937',
    '#4c285e',
    '#2d3748',
    '#111827',
    '#3f1d1d',
  ] as const;
  protected readonly LIGHT_COLOR_PRESETS = [
    '#FFFFFF',
    '#F0F0F0',
    '#E0E0E0',
    '#D0D0D0',
    '#C0C0C0',
  ] as const;

  protected readonly MODULE_SHAPE_OPTIONS = [
    'square',
    'rounded',
    'circle',
    'diagonal',
    'diagonal-rounded',
    'extra-rounded',
  ] as const satisfies QRCodeModuleShape[];
  protected readonly FINDER_OUTER_SHAPE_OPTIONS = [
    'square',
    'extra-rounded',
    'rounded',
    'circle',
  ] as const satisfies readonly QRCodeFinderShape[];
  protected readonly CORNER_MODULE_SHAPE_OPTIONS = [
    'square',
    'rounded',
    'extra-rounded',
    'circle',
  ] as const satisfies readonly QRCodeFinderShape[];

  constructor() {
    effect(() => {
      if (!this.overrideModules() && this.currentConfig().modules !== undefined) {
        updateQrConfig({modules: undefined});
      }
    });
    effect(() => {
      if (!this.overrideFinderOuter() && this.currentConfig().finder?.outer !== undefined) {
        updateQrConfig({finder: {...this.currentConfig().finder, outer: undefined}});
      }
    });
    effect(() => {
      if (!this.overrideFinderCenter() && this.currentConfig().finder?.center !== undefined) {
        updateQrConfig({finder: {...this.currentConfig().finder, center: undefined}});
      }
    });
  }
}
