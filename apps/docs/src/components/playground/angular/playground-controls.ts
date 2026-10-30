import {Component, computed, effect, inject, linkedSignal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormsModule} from '@angular/forms';

import {NANOSTORES, NanostoresService} from '@nanostores/angular';
import {NgIcon, provideIcons} from '@ng-icons/core';
import {lucideRotateCcw} from '@ng-icons/lucide';
import {HlmAccordionImports} from '@spartan-ng/helm/accordion';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmFieldImports} from '@spartan-ng/helm/field';
import {HlmInputImports} from '@spartan-ng/helm/input';
import {HlmLabelImports} from '@spartan-ng/helm/label';
import {HlmSelectImports} from '@spartan-ng/helm/select';
import {HlmSwitchImports} from '@spartan-ng/helm/switch';

import type {QRCodeFinderShape, QRCodeModuleShape} from '@qrcodesdk/core';

import {suppressInitialTransitions} from '../../angular/suppress-initial-transitions.ts';
import {resetCliOptions} from '../cli-playground.ts';
import {
  playgroundOpenSections,
  playgroundOptions,
  resetQrOptions,
  setPlaygroundSectionOpen,
  updateQrOptions,
} from '../playground-options.ts';
import {CliPlaygroundControls} from './cli-playground-controls.ts';
import {PlaygroundImageControls} from './image-controls.ts';
import {
  DARK_COLOR_PRESETS,
  LIGHT_COLOR_PRESETS,
  PlaygroundColorInput,
} from './playground-color-input.ts';
import {PlaygroundPresetControls} from './preset-controls.ts';
import {QrMatrixControls} from './qr-matrix-controls.ts';
import {titleCase} from './title-case.ts';

@Component({
  template: `
    <div class="grid gap-4">
      <div class="flex justify-end">
        <button (click)="resetOptions()" type="button" hlmBtn variant="outline">
          Reset
          <ng-icon name="lucideRotateCcw" />
        </button>
      </div>
      @if (currentOptions().packageName === 'cli') {
        <cli-playground-controls />
      } @else {
        <qr-matrix-controls />
        <div class="grid gap-4 md:grid-cols-2">
          <div hlmField>
            <label hlmFieldLabel for="darkColor">Dark Color</label>
            <playground-color-input
              [presets]="DARK_COLOR_PRESETS"
              [color]="foreground()"
              (colorChange)="updateQrOptions({foreground: $event})"
              buttonId="darkColor" />
          </div>

          <div hlmField>
            <label hlmFieldLabel for="lightColor">Light Color</label>
            <playground-color-input
              [presets]="LIGHT_COLOR_PRESETS"
              [color]="background()"
              (colorChange)="updateQrOptions({background: $event})"
              buttonId="lightColor" />
          </div>
        </div>

        <playground-preset-controls />

        <hlm-accordion type="multiple">
          <hlm-accordion-item
            class="border-b-muted-foreground"
            [isOpened]="openSections().includes('image')"
            (openedChange)="setPlaygroundSectionOpen('image', $event)">
            <hlm-accordion-trigger class="w-full text-nowrap" triggerClass="w-full">
              Center Image
            </hlm-accordion-trigger>
            <hlm-accordion-content>
              <playground-image-controls />
            </hlm-accordion-content>
          </hlm-accordion-item>
          <hlm-accordion-item
            class="border-b-muted-foreground"
            [isOpened]="openSections().includes('styling')"
            (openedChange)="setPlaygroundSectionOpen('styling', $event)">
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
                    for="override-modules"
                    hlmLabel>
                    <div class="flex items-center justify-between gap-2">
                      <span class="text-sm leading-4">Modules</span>
                      <hlm-switch [(checked)]="overrideModules" inputId="override-modules" />
                    </div>

                    <div class="grid gap-2 md:grid-cols-2">
                      <div hlmField>
                        <label hlmFieldLabel for="moduleShape">Type</label>
                        <hlm-select
                          [disabled]="!overrideModules()"
                          [itemToString]="titleCase"
                          [ngModel]="moduleShape()"
                          (ngModelChange)="updateQrOptions({modules: {shape: $event}})">
                          <hlm-select-trigger class="w-full" buttonId="moduleShape">
                            <hlm-select-value placeholder="Auto" />
                          </hlm-select-trigger>
                          <hlm-select-content *hlmSelectPortal>
                            <hlm-select-group>
                              <hlm-select-label>Module shape</hlm-select-label>
                              @for (
                                moduleShapeOption of MODULE_SHAPE_OPTIONS;
                                track moduleShapeOption
                              ) {
                                <hlm-select-item [value]="moduleShapeOption">
                                  {{ titleCase(moduleShapeOption) }}
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
                          (colorChange)="updateQrOptions({modules: {color: $event}})"
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
                      <span class="text-sm leading-4">Finder outer ring</span>
                      <hlm-switch
                        [(checked)]="overrideFinderOuter"
                        inputId="override-finder-outer" />
                    </div>

                    <div class="grid gap-2 md:grid-cols-2">
                      <div hlmField>
                        <label hlmFieldLabel for="finderOuterShape">Type</label>
                        <hlm-select
                          [disabled]="!overrideFinderOuter()"
                          [itemToString]="titleCase"
                          [ngModel]="finderOuterType()"
                          (ngModelChange)="updateQrOptions({finder: {outer: {shape: $event}}})">
                          <hlm-select-trigger class="w-full" buttonId="finderOuterShape">
                            <hlm-select-value placeholder="Auto" />
                          </hlm-select-trigger>
                          <hlm-select-content *hlmSelectPortal>
                            <hlm-select-group>
                              <hlm-select-label>Finder-outer shape</hlm-select-label>
                              @for (
                                finderOuterShapeOption of FINDER_OUTER_SHAPE_OPTIONS;
                                track finderOuterShapeOption
                              ) {
                                <hlm-select-item [value]="finderOuterShapeOption">
                                  {{ titleCase(finderOuterShapeOption) }}
                                </hlm-select-item>
                              }
                            </hlm-select-group>
                          </hlm-select-content>
                        </hlm-select>
                      </div>
                      <div hlmField>
                        <label hlmFieldLabel for="finderOuterColor">Color</label>
                        <playground-color-input
                          [presets]="DARK_COLOR_PRESETS"
                          [color]="finderOuterColor()"
                          [disabled]="!overrideFinderOuter()"
                          (colorChange)="updateQrOptions({finder: {outer: {color: $event}}})"
                          buttonId="finderOuterColor" />
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
                      <span class="text-sm leading-4">Finder center</span>
                      <hlm-switch
                        [(checked)]="overrideFinderCenter"
                        inputId="override-finder-center" />
                    </div>

                    <div class="grid gap-2 md:grid-cols-2">
                      <div hlmField>
                        <label hlmFieldLabel for="finderCenterShape">Type</label>
                        <hlm-select
                          [disabled]="!overrideFinderCenter()"
                          [itemToString]="titleCase"
                          [ngModel]="finderCenterType()"
                          (ngModelChange)="updateQrOptions({finder: {center: {shape: $event}}})">
                          <hlm-select-trigger class="w-full" buttonId="finderCenterShape">
                            <hlm-select-value placeholder="Auto" />
                          </hlm-select-trigger>
                          <hlm-select-content *hlmSelectPortal>
                            <hlm-select-group>
                              <hlm-select-label>Finder-center shape</hlm-select-label>
                              @for (
                                finderCenterShapeOptions of FINDER_CENTER_SHAPE_OPTIONS;
                                track finderCenterShapeOptions
                              ) {
                                <hlm-select-item [value]="finderCenterShapeOptions">
                                  {{ titleCase(finderCenterShapeOptions) }}
                                </hlm-select-item>
                              }
                            </hlm-select-group>
                          </hlm-select-content>
                        </hlm-select>
                      </div>
                      <div hlmField>
                        <label hlmFieldLabel for="finderCenterColor">Color</label>
                        <playground-color-input
                          [presets]="DARK_COLOR_PRESETS"
                          [color]="finderCenterColor()"
                          [disabled]="!overrideFinderCenter()"
                          (colorChange)="updateQrOptions({finder: {center: {color: $event}}})"
                          buttonId="finderCenterColor" />
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </hlm-accordion-content>
          </hlm-accordion-item>
          <hlm-accordion-item
            class="border-b-muted-foreground"
            [isOpened]="openSections().includes('accessibility')"
            (openedChange)="setPlaygroundSectionOpen('accessibility', $event)">
            <hlm-accordion-trigger class="w-full text-nowrap" triggerClass="w-full">
              Accessibility
            </hlm-accordion-trigger>
            <hlm-accordion-content>
              <div class="grid gap-4 py-2 md:grid-cols-2">
                <div hlmField>
                  <label hlmFieldLabel for="alt">Alt</label>
                  <input
                    id="alt"
                    [ngModel]="currentOptions().alt"
                    (ngModelChange)="updateQrOptions({alt: $event})"
                    hlmInput />
                </div>
                <div hlmField>
                  <label hlmFieldLabel for="ariaLabel">aria-label</label>
                  <input
                    id="ariaLabel"
                    [ngModel]="currentOptions().ariaLabel"
                    (ngModelChange)="updateQrOptions({ariaLabel: $event})"
                    hlmInput />
                </div>
                <div hlmField>
                  <label hlmFieldLabel for="title">Title</label>
                  <input
                    id="title"
                    [ngModel]="currentOptions().title"
                    (ngModelChange)="updateQrOptions({title: $event})"
                    hlmInput />
                </div>
              </div>
            </hlm-accordion-content>
          </hlm-accordion-item>
        </hlm-accordion>
      }
    </div>
  `,
  providers: [{provide: NANOSTORES, useClass: NanostoresService}, provideIcons({lucideRotateCcw})],
  selector: 'playground-controls',
  imports: [
    HlmLabelImports,
    HlmFieldImports,
    HlmSelectImports,
    HlmInputImports,
    HlmAccordionImports,
    HlmButtonImports,
    NgIcon,
    HlmSwitchImports,
    FormsModule,
    PlaygroundColorInput,
    PlaygroundImageControls,
    QrMatrixControls,
    CliPlaygroundControls,
    PlaygroundPresetControls,
  ],
})
export class PlaygroundControls {
  protected readonly updateQrOptions = updateQrOptions;
  protected readonly titleCase = titleCase;
  protected readonly setPlaygroundSectionOpen = setPlaygroundSectionOpen;

  /** Reset the selected package's settings without discarding the other configuration. */
  protected resetOptions(): void {
    if (this.currentOptions().packageName === 'cli') resetCliOptions();
    else resetQrOptions();
  }
  private readonly nanostores = inject(NanostoresService);
  protected readonly currentOptions = toSignal(this.nanostores.useStore(playgroundOptions), {
    requireSync: true,
  });
  protected readonly openSections = toSignal(this.nanostores.useStore(playgroundOpenSections), {
    requireSync: true,
  });
  protected readonly foreground = computed(() => this.currentOptions().foreground ?? '#000000');
  protected readonly background = computed(() => this.currentOptions().background ?? '#FFFFFF');
  protected readonly moduleShape = computed(() => this.currentOptions().modules?.shape ?? 'square');
  protected readonly moduleColor = computed(
    () => this.currentOptions().modules?.color ?? '#000000',
  );
  protected readonly finderOuterType = computed(
    () => this.currentOptions().finder?.outer?.shape ?? 'square',
  );
  protected readonly finderOuterColor = computed(
    () => this.currentOptions().finder?.outer?.color ?? '#000000',
  );
  protected readonly finderCenterType = computed(
    () => this.currentOptions().finder?.center?.shape ?? 'square',
  );
  protected readonly finderCenterColor = computed(
    () => this.currentOptions().finder?.center?.color ?? '#000000',
  );

  protected readonly overrideModules = linkedSignal(() => !!this.currentOptions().modules);
  protected readonly overrideFinderOuter = linkedSignal(
    () => !!this.currentOptions().finder?.outer,
  );
  protected readonly overrideFinderCenter = linkedSignal(
    () => !!this.currentOptions().finder?.center,
  );

  protected readonly DARK_COLOR_PRESETS = DARK_COLOR_PRESETS;
  protected readonly LIGHT_COLOR_PRESETS = LIGHT_COLOR_PRESETS;

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
  protected readonly FINDER_CENTER_SHAPE_OPTIONS = [
    'square',
    'rounded',
    'extra-rounded',
    'circle',
  ] as const satisfies readonly QRCodeFinderShape[];

  constructor() {
    suppressInitialTransitions();
    effect(() => {
      if (!this.overrideModules() && this.currentOptions().modules !== undefined) {
        updateQrOptions({modules: undefined});
      }
    });
    effect(() => {
      if (!this.overrideFinderOuter() && this.currentOptions().finder?.outer !== undefined) {
        updateQrOptions({finder: {...this.currentOptions().finder, outer: undefined}});
      }
    });
    effect(() => {
      if (!this.overrideFinderCenter() && this.currentOptions().finder?.center !== undefined) {
        updateQrOptions({finder: {...this.currentOptions().finder, center: undefined}});
      }
    });
  }
}
