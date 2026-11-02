import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';

import {NgIcon, provideIcons} from '@ng-icons/core';
import {lucidePlay} from '@ng-icons/lucide';
import {HlmAccordionImports} from '@spartan-ng/helm/accordion';
import {HlmButton} from '@spartan-ng/helm/button';
import {HlmCheckbox} from '@spartan-ng/helm/checkbox';
import {HlmInput} from '@spartan-ng/helm/input';
import {HlmLabel} from '@spartan-ng/helm/label';
import {HlmNativeSelectImports} from '@spartan-ng/helm/native-select';
import {HlmSeparator} from '@spartan-ng/helm/separator';
import {HlmSwitch} from '@spartan-ng/helm/switch';
import {HlmToggleGroupImports} from '@spartan-ng/helm/toggle-group';

import type {QRCodeErrorCorrectionLevel, QRCodeMask, QRCodeMode} from '@qrcodesdk/core';

import {
  COMBINATION_SETS,
  type CombinationSet,
  ERROR_CORRECTION_LEVELS,
  MASKS,
  MODES,
} from '../fixtures/combinations';
import {FIXTURE_CATEGORIES, type FixtureCategory} from '../fixtures/fixture-catalog';
import {RENDERERS, type RendererId} from '../rendering/renderers';
import {DevToolsState} from '../state/dev-tools-state';

function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (value === null || value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function clampVersion(value: string | number): number {
  const version = Math.round(Number(value));
  return Number.isFinite(version) ? Math.min(40, Math.max(1, version)) : 1;
}

@Component({
  selector: 'app-selection-panel',
  imports: [
    HlmAccordionImports,
    HlmButton,
    HlmCheckbox,
    HlmInput,
    HlmLabel,
    HlmNativeSelectImports,
    HlmSeparator,
    HlmSwitch,
    HlmToggleGroupImports,
    NgIcon,
  ],
  providers: [provideIcons({lucidePlay})],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'flex min-h-0 flex-col'},
  template: `
    <div class="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
      <section class="flex flex-col gap-2">
        <h2 class="text-sm font-semibold">Renderers</h2>
        <hlm-toggle-group
          class="flex-wrap"
          [value]="$any(state.renderers())"
          (valueChange)="setRenderers($any($event))"
          size="sm"
          type="multiple"
          variant="outline">
          @for (renderer of renderers; track renderer.id) {
            <button
              class="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              [title]="renderer.component"
              [value]="renderer.id"
              hlmToggleGroupItem>
              {{ renderer.label }}
            </button>
          }
        </hlm-toggle-group>
      </section>

      <section class="flex flex-col gap-3">
        <h2 class="text-sm font-semibold">Options</h2>
        <div class="flex items-center gap-2">
          <hlm-switch
            [checked]="state.decode()"
            (checkedChange)="state.decode.set($event)"
            inputId="decode-switch" />
          <label hlmLabel for="decode-switch">Decode with jsQR</label>
        </div>
        <div class="flex items-center gap-2">
          <label class="w-20" hlmLabel for="tile-size">Tile size</label>
          <hlm-native-select
            class="flex-1"
            [value]="state.tileSize()"
            (valueChange)="setTileSize($event)"
            selectId="tile-size"
            size="sm">
            <option hlmNativeSelectOption value="sm">Small</option>
            <option hlmNativeSelectOption value="md">Medium</option>
            <option hlmNativeSelectOption value="lg">Large</option>
          </hlm-native-select>
        </div>
      </section>

      <hlm-separator />

      <section class="flex flex-col gap-1">
        <h2 class="text-sm font-semibold">Fixtures</h2>
        <hlm-accordion type="multiple">
          @for (category of categories; track category.id) {
            <hlm-accordion-item>
              <div class="flex items-center gap-2">
                <hlm-checkbox
                  [aria-label]="'Select all ' + category.label"
                  [checked]="categoryState(category) === 'all'"
                  [indeterminate]="categoryState(category) === 'some'"
                  (checkedChange)="state.setCategory(category.id, $event)" />
                <hlm-accordion-trigger class="flex-1">
                  <span class="flex flex-1 items-baseline justify-between gap-2 pe-2">
                    <span>{{ category.label }}</span>
                    <span class="text-muted-foreground text-xs tabular-nums">
                      {{ state.selection()[category.id].length }}/{{ category.fixtures.length }}
                    </span>
                  </span>
                </hlm-accordion-trigger>
              </div>
              <hlm-accordion-content>
                <p class="text-muted-foreground mb-2 font-mono text-xs">{{ category.source }}</p>
                <ul class="flex flex-col gap-1.5 ps-1">
                  @for (fixture of category.fixtures; track fixture.id) {
                    <li class="flex items-center gap-2">
                      <hlm-checkbox
                        [checked]="state.isSelected(category.id, fixture.id)"
                        [inputId]="'fixture-' + fixture.id"
                        (checkedChange)="state.toggleFixture(category.id, fixture.id, $event)" />
                      <label
                        class="truncate font-mono text-xs font-normal"
                        [for]="'fixture-' + fixture.id"
                        [title]="fixture.name"
                        hlmLabel>
                        {{ fixture.name }}
                      </label>
                    </li>
                  }
                </ul>
              </hlm-accordion-content>
            </hlm-accordion-item>
          }

          <hlm-accordion-item>
            <div class="flex items-center gap-2">
              <hlm-checkbox
                [checked]="state.combinations().enabled"
                (checkedChange)="state.updateCombinations({enabled: $event})"
                aria-label="Include all-combinations" />
              <hlm-accordion-trigger class="flex-1">
                <span class="flex flex-1 items-baseline justify-between gap-2 pe-2">
                  <span>All combinations</span>
                  <span class="text-muted-foreground text-xs tabular-nums">
                    {{ state.combinations().enabled ? state.combinationCount() : 0 }}
                  </span>
                </span>
              </hlm-accordion-trigger>
            </div>
            <hlm-accordion-content>
              <div class="flex flex-col gap-3 ps-1">
                <p class="text-muted-foreground font-mono text-xs">all-combinations.ts</p>
                <div class="flex flex-col gap-1.5">
                  <span class="text-xs font-medium">Sets</span>
                  <hlm-toggle-group
                    class="flex-wrap"
                    [value]="$any(state.combinations().sets)"
                    (valueChange)="setCombinationSets($any($event))"
                    size="sm"
                    type="multiple"
                    variant="outline">
                    @for (set of combinationSets; track set.id) {
                      <button
                        class="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                        [title]="set.source"
                        [value]="set.id"
                        hlmToggleGroupItem>
                        {{ set.label }}
                      </button>
                    }
                  </hlm-toggle-group>
                </div>

                <div class="flex items-center gap-2">
                  <span class="text-xs font-medium">Versions</span>
                  <input
                    class="h-7 w-16"
                    [value]="state.combinations().versionFrom"
                    (change)="setVersionFrom($any($event.target).value)"
                    aria-label="First version"
                    hlmInput
                    max="40"
                    min="1"
                    type="number" />
                  <span class="text-muted-foreground text-xs">to</span>
                  <input
                    class="h-7 w-16"
                    [value]="state.combinations().versionTo"
                    (change)="setVersionTo($any($event.target).value)"
                    aria-label="Last version"
                    hlmInput
                    max="40"
                    min="1"
                    type="number" />
                </div>

                <div class="flex flex-col gap-1.5">
                  <span class="text-xs font-medium">Error correction</span>
                  <hlm-toggle-group
                    [value]="$any(state.combinations().errorCorrectionLevels)"
                    (valueChange)="setErrorCorrectionLevels($any($event))"
                    size="sm"
                    type="multiple"
                    variant="outline">
                    @for (level of errorCorrectionLevels; track level) {
                      <button
                        class="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                        [value]="level"
                        hlmToggleGroupItem>
                        {{ level }}
                      </button>
                    }
                  </hlm-toggle-group>
                </div>

                <div class="flex flex-col gap-1.5">
                  <span class="text-xs font-medium">Masks (ignored by auto mask)</span>
                  <hlm-toggle-group
                    [value]="$any(state.combinations().masks)"
                    (valueChange)="setMasks($any($event))"
                    size="sm"
                    type="multiple"
                    variant="outline">
                    @for (mask of masks; track mask) {
                      <button
                        class="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                        [value]="mask"
                        hlmToggleGroupItem>
                        {{ mask }}
                      </button>
                    }
                  </hlm-toggle-group>
                </div>

                <div class="flex flex-col gap-1.5">
                  <span class="text-xs font-medium">Modes</span>
                  <hlm-toggle-group
                    class="flex-wrap"
                    [value]="$any(state.combinations().modes)"
                    (valueChange)="setModes($any($event))"
                    size="sm"
                    type="multiple"
                    variant="outline">
                    @for (mode of modes; track mode) {
                      <button
                        class="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                        [value]="mode"
                        hlmToggleGroupItem>
                        {{ mode }}
                      </button>
                    }
                  </hlm-toggle-group>
                </div>

                <p class="text-muted-foreground text-xs">
                  {{ state.combinationCount() }} combinations match.
                </p>
              </div>
            </hlm-accordion-content>
          </hlm-accordion-item>
        </hlm-accordion>
      </section>
    </div>

    <div class="border-border flex flex-col gap-2 border-t p-4">
      <p class="text-muted-foreground text-xs">
        {{ state.selectedFixtureCount() }} fixtures × {{ state.renderers().length }} renderers =
        {{ state.selectedRenderCount() }} renders
      </p>
      <div class="flex gap-2">
        <button
          class="flex-1"
          [disabled]="state.selectedRenderCount() === 0"
          (click)="state.run()"
          hlmBtn>
          <ng-icon name="lucidePlay" />
          Run
        </button>
        <button
          [disabled]="!state.currentRun()"
          (click)="state.clearRun()"
          hlmBtn
          variant="outline">
          Clear
        </button>
      </div>
    </div>
  `,
})
export class SelectionPanel {
  protected readonly state = inject(DevToolsState);

  protected readonly categories = FIXTURE_CATEGORIES;
  protected readonly renderers = RENDERERS;
  protected readonly combinationSets = COMBINATION_SETS;
  protected readonly errorCorrectionLevels = ERROR_CORRECTION_LEVELS;
  protected readonly masks = MASKS;
  protected readonly modes = MODES;

  private readonly categoryStates = computed(() => {
    const selection = this.state.selection();
    return new Map(
      FIXTURE_CATEGORIES.map((category) => {
        const count = selection[category.id].length;
        const state =
          count === 0 ? 'none' : count >= category.fixtures.length ? 'all' : ('some' as const);
        return [category.id, state] as const;
      }),
    );
  });

  protected categoryState(category: FixtureCategory): 'none' | 'some' | 'all' {
    return this.categoryStates().get(category.id) ?? 'none';
  }

  protected setTileSize(value: string | null | undefined): void {
    if (value === 'sm' || value === 'md' || value === 'lg') this.state.tileSize.set(value);
  }

  protected setRenderers(value: RendererId | RendererId[] | null | undefined): void {
    this.state.renderers.set(asArray(value));
  }

  protected setCombinationSets(value: CombinationSet | CombinationSet[] | null): void {
    this.state.updateCombinations({sets: asArray(value)});
  }

  protected setErrorCorrectionLevels(
    value: QRCodeErrorCorrectionLevel | QRCodeErrorCorrectionLevel[] | null,
  ): void {
    this.state.updateCombinations({errorCorrectionLevels: asArray(value)});
  }

  protected setMasks(value: QRCodeMask | QRCodeMask[] | null): void {
    this.state.updateCombinations({masks: asArray(value)});
  }

  protected setModes(value: QRCodeMode | QRCodeMode[] | null): void {
    this.state.updateCombinations({modes: asArray(value)});
  }

  protected setVersionFrom(value: string): void {
    const versionFrom = clampVersion(value);
    this.state.updateCombinations({
      versionFrom,
      versionTo: Math.max(versionFrom, this.state.combinations().versionTo),
    });
  }

  protected setVersionTo(value: string): void {
    const versionTo = clampVersion(value);
    this.state.updateCombinations({
      versionTo,
      versionFrom: Math.min(versionTo, this.state.combinations().versionFrom),
    });
  }
}
