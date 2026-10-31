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

import {suppressInitialTransitions} from '../../angular/suppress-initial-transitions.ts';
import {resetCliOptions} from '../cli-playground.ts';
import {
  type PlaygroundOptions,
  playgroundOpenSections,
  playgroundOptions,
  resetQrOptions,
  setPlaygroundSectionOpen,
  updateQrOptions,
} from '../playground-options.ts';
import {PLAYGROUND_SHAPES} from '../playground-style.ts';
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

                    <div class="grid gap-2">
                      <div hlmField>
                        <label hlmFieldLabel for="moduleShape">Module shape</label>
                        <hlm-select
                          [disabled]="!overrideModules()"
                          [itemToString]="titleCase"
                          [ngModel]="moduleShape()"
                          (ngModelChange)="updateQrOptions({moduleShape: $event})">
                          <hlm-select-trigger class="w-full" buttonId="moduleShape">
                            <hlm-select-value placeholder="Auto" />
                          </hlm-select-trigger>
                          <hlm-select-content *hlmSelectPortal>
                            <hlm-select-group>
                              <hlm-select-label>Module shape</hlm-select-label>
                              @for (shapeOption of SHAPE_OPTIONS; track shapeOption) {
                                <hlm-select-item [value]="shapeOption">
                                  {{ titleCase(shapeOption) }}
                                </hlm-select-item>
                              }
                            </hlm-select-group>
                          </hlm-select-content>
                        </hlm-select>
                      </div>
                    </div>
                  </label>
                </div>
                <div
                  class="border-input data-[checked=true]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border shadow-xs outline-none"
                  [attr.data-checked]="overrideFinder() ? 'true' : 'false'">
                  <label
                    class="grid w-full gap-2 p-4 has-data-[disabled=true]:cursor-not-allowed has-data-[disabled=true]:opacity-70"
                    for="override-finder"
                    hlmLabel>
                    <div class="flex items-center justify-between gap-2">
                      <span class="text-sm leading-4">Finder patterns</span>
                      <hlm-switch [(checked)]="overrideFinder" inputId="override-finder" />
                    </div>

                    <div class="grid gap-2 md:grid-cols-2">
                      <div hlmField>
                        <label hlmFieldLabel for="finderRingShape">Finder ring</label>
                        <hlm-select
                          [disabled]="!overrideFinder()"
                          [itemToString]="titleCase"
                          [ngModel]="finderRingShape()"
                          (ngModelChange)="updateQrOptions({finderRingShape: $event})">
                          <hlm-select-trigger class="w-full" buttonId="finderRingShape">
                            <hlm-select-value placeholder="Auto" />
                          </hlm-select-trigger>
                          <hlm-select-content *hlmSelectPortal>
                            <hlm-select-group>
                              <hlm-select-label>Finder ring shape</hlm-select-label>
                              @for (shapeOption of SHAPE_OPTIONS; track shapeOption) {
                                <hlm-select-item [value]="shapeOption">
                                  {{ titleCase(shapeOption) }}
                                </hlm-select-item>
                              }
                            </hlm-select-group>
                          </hlm-select-content>
                        </hlm-select>
                      </div>
                      <div hlmField>
                        <label hlmFieldLabel for="finderCenterShape">Finder center</label>
                        <hlm-select
                          [disabled]="!overrideFinder()"
                          [itemToString]="titleCase"
                          [ngModel]="finderCenterShape()"
                          (ngModelChange)="updateQrOptions({finderCenterShape: $event})">
                          <hlm-select-trigger class="w-full" buttonId="finderCenterShape">
                            <hlm-select-value placeholder="Auto" />
                          </hlm-select-trigger>
                          <hlm-select-content *hlmSelectPortal>
                            <hlm-select-group>
                              <hlm-select-label>Finder center shape</hlm-select-label>
                              @for (shapeOption of SHAPE_OPTIONS; track shapeOption) {
                                <hlm-select-item [value]="shapeOption">
                                  {{ titleCase(shapeOption) }}
                                </hlm-select-item>
                              }
                            </hlm-select-group>
                          </hlm-select-content>
                        </hlm-select>
                      </div>
                      <div class="md:col-span-2" hlmField>
                        <label hlmFieldLabel for="finderColor">Finder color</label>
                        <playground-color-input
                          [presets]="DARK_COLOR_PRESETS"
                          [color]="finderColor()"
                          [disabled]="!overrideFinder()"
                          (colorChange)="updateQrOptions({finderColor: $event})"
                          buttonId="finderColor" />
                      </div>
                    </div>
                  </label>
                </div>
                <div
                  class="border-input data-[checked=true]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border shadow-xs outline-none"
                  [attr.data-checked]="overrideAlignment() ? 'true' : 'false'">
                  <label
                    class="grid w-full gap-2 p-4 has-data-[disabled=true]:cursor-not-allowed has-data-[disabled=true]:opacity-70"
                    for="override-alignment"
                    hlmLabel>
                    <div class="flex items-center justify-between gap-2">
                      <span class="text-sm leading-4">Alignment patterns</span>
                      <hlm-switch [(checked)]="overrideAlignment" inputId="override-alignment" />
                    </div>

                    <div class="grid gap-2 md:grid-cols-2">
                      <div hlmField>
                        <label hlmFieldLabel for="alignmentRingShape">Alignment ring</label>
                        <hlm-select
                          [disabled]="!overrideAlignment()"
                          [itemToString]="titleCase"
                          [ngModel]="alignmentRingShape()"
                          (ngModelChange)="updateQrOptions({alignmentRingShape: $event})">
                          <hlm-select-trigger class="w-full" buttonId="alignmentRingShape">
                            <hlm-select-value placeholder="Auto" />
                          </hlm-select-trigger>
                          <hlm-select-content *hlmSelectPortal>
                            <hlm-select-group>
                              <hlm-select-label>Alignment ring shape</hlm-select-label>
                              @for (shapeOption of SHAPE_OPTIONS; track shapeOption) {
                                <hlm-select-item [value]="shapeOption">
                                  {{ titleCase(shapeOption) }}
                                </hlm-select-item>
                              }
                            </hlm-select-group>
                          </hlm-select-content>
                        </hlm-select>
                      </div>
                      <div hlmField>
                        <label hlmFieldLabel for="alignmentCenterShape">Alignment center</label>
                        <hlm-select
                          [disabled]="!overrideAlignment()"
                          [itemToString]="titleCase"
                          [ngModel]="alignmentCenterShape()"
                          (ngModelChange)="updateQrOptions({alignmentCenterShape: $event})">
                          <hlm-select-trigger class="w-full" buttonId="alignmentCenterShape">
                            <hlm-select-value placeholder="Auto" />
                          </hlm-select-trigger>
                          <hlm-select-content *hlmSelectPortal>
                            <hlm-select-group>
                              <hlm-select-label>Alignment center shape</hlm-select-label>
                              @for (shapeOption of SHAPE_OPTIONS; track shapeOption) {
                                <hlm-select-item [value]="shapeOption">
                                  {{ titleCase(shapeOption) }}
                                </hlm-select-item>
                              }
                            </hlm-select-group>
                          </hlm-select-content>
                        </hlm-select>
                      </div>
                      <div class="md:col-span-2" hlmField>
                        <label hlmFieldLabel for="alignmentColor">Alignment color</label>
                        <playground-color-input
                          [presets]="DARK_COLOR_PRESETS"
                          [color]="alignmentColor()"
                          [disabled]="!overrideAlignment()"
                          (colorChange)="updateQrOptions({alignmentColor: $event})"
                          buttonId="alignmentColor" />
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
  protected readonly moduleShape = computed(() => this.currentOptions().moduleShape ?? 'square');
  protected readonly finderRingShape = computed(
    () => this.currentOptions().finderRingShape ?? 'square',
  );
  protected readonly finderCenterShape = computed(
    () => this.currentOptions().finderCenterShape ?? 'square',
  );
  protected readonly finderColor = computed(
    () => this.currentOptions().finderColor ?? this.foreground(),
  );

  /**
   * Alignment patterns take the module shape until a part styles them. Inside the part, an unset
   * shape is square, so the selects show "Auto" only while no alignment option is set.
   */
  protected readonly alignmentRingShape = computed(
    () =>
      this.currentOptions().alignmentRingShape ??
      (hasAlignmentOptions(this.currentOptions()) ? 'square' : undefined),
  );
  protected readonly alignmentCenterShape = computed(
    () =>
      this.currentOptions().alignmentCenterShape ??
      (hasAlignmentOptions(this.currentOptions()) ? 'square' : undefined),
  );
  protected readonly alignmentColor = computed(
    () => this.currentOptions().alignmentColor ?? this.foreground(),
  );

  protected readonly overrideModules = linkedSignal(
    () => this.currentOptions().moduleShape !== undefined,
  );
  protected readonly overrideFinder = linkedSignal(() => hasFinderOptions(this.currentOptions()));
  protected readonly overrideAlignment = linkedSignal(() =>
    hasAlignmentOptions(this.currentOptions()),
  );

  protected readonly DARK_COLOR_PRESETS = DARK_COLOR_PRESETS;
  protected readonly LIGHT_COLOR_PRESETS = LIGHT_COLOR_PRESETS;

  protected readonly SHAPE_OPTIONS = PLAYGROUND_SHAPES;

  constructor() {
    suppressInitialTransitions();
    effect(() => {
      if (!this.overrideModules() && this.currentOptions().moduleShape !== undefined) {
        updateQrOptions({moduleShape: undefined});
      }
    });
    effect(() => {
      if (!this.overrideFinder() && hasFinderOptions(this.currentOptions())) {
        updateQrOptions({
          finderRingShape: undefined,
          finderCenterShape: undefined,
          finderColor: undefined,
        });
      }
    });
    effect(() => {
      if (!this.overrideAlignment() && hasAlignmentOptions(this.currentOptions())) {
        updateQrOptions({
          alignmentRingShape: undefined,
          alignmentCenterShape: undefined,
          alignmentColor: undefined,
        });
      }
    });
  }
}

function hasFinderOptions(options: PlaygroundOptions): boolean {
  return (
    options.finderRingShape !== undefined ||
    options.finderCenterShape !== undefined ||
    options.finderColor !== undefined
  );
}

function hasAlignmentOptions(options: PlaygroundOptions): boolean {
  return (
    options.alignmentRingShape !== undefined ||
    options.alignmentCenterShape !== undefined ||
    options.alignmentColor !== undefined
  );
}
