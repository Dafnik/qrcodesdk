import {Injectable, computed, effect, inject, signal} from '@angular/core';

import {
  type CombinationFilter,
  DEFAULT_COMBINATION_FILTER,
  combinationFixtures,
  countCombinations,
} from '../fixtures/combinations';
import {
  type DevFixture,
  FIXTURE_CATEGORIES,
  type FixtureCategoryId,
} from '../fixtures/fixture-catalog';
import {RENDERERS, type RendererId} from '../rendering/renderers';
import {DecodeResults} from './decode-results';

export type TileSize = 'sm' | 'md' | 'lg';

export const TILE_SIZES: Readonly<Record<TileSize, number>> = {sm: 128, md: 208, lg: 320};

type Selection = Readonly<Record<FixtureCategoryId, readonly string[]>>;

type PersistedSettings = {
  readonly selection: Selection;
  readonly combinations: CombinationFilter;
  readonly renderers: readonly RendererId[];
  readonly decode: boolean;
  readonly tileSize: TileSize;
};

export type Run = {
  readonly fixtures: readonly DevFixture[];
  readonly renderers: readonly RendererId[];
};

const STORAGE_KEY = 'qrcodesdk-dev-tools-settings';

const EMPTY_SELECTION: Selection = {
  fixtures: [],
  styling: [],
  'style-variants': [],
  'center-images': [],
  'fixture-images': [],
};

const DEFAULT_SETTINGS: PersistedSettings = {
  selection: {
    ...EMPTY_SELECTION,
    fixtures: FIXTURE_CATEGORIES.find(({id}) => id === 'fixtures')!.fixtures.map(({id}) => id),
  },
  combinations: DEFAULT_COMBINATION_FILTER,
  renderers: RENDERERS.map(({id}) => id),
  decode: false,
  tileSize: 'md',
};

function loadSettings(): PersistedSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(stored) as Partial<PersistedSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      selection: {...EMPTY_SELECTION, ...parsed.selection},
      combinations: {...DEFAULT_COMBINATION_FILTER, ...parsed.combinations},
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** The draft selection in the sidebar and the run it starts. Nothing renders until `run()`. */
@Injectable({providedIn: 'root'})
export class DevToolsState {
  private readonly results = inject(DecodeResults);
  private readonly initial = loadSettings();

  readonly selection = signal<Selection>(this.initial.selection);
  readonly combinations = signal<CombinationFilter>(this.initial.combinations);
  readonly renderers = signal<readonly RendererId[]>(this.initial.renderers);
  readonly decode = signal(this.initial.decode);
  readonly tileSize = signal<TileSize>(this.initial.tileSize);

  readonly combinationCount = computed(() => countCombinations(this.combinations()));

  readonly selectedFixtureCount = computed(() => {
    const selection = this.selection();
    let count = 0;
    for (const category of FIXTURE_CATEGORIES) count += selection[category.id].length;
    if (this.combinations().enabled) count += this.combinationCount();
    return count;
  });

  readonly selectedRenderCount = computed(
    () => this.selectedFixtureCount() * this.renderers().length,
  );

  private readonly _run = signal<Run | undefined>(undefined);
  readonly currentRun = this._run.asReadonly();

  constructor() {
    effect(() => {
      const settings: PersistedSettings = {
        selection: this.selection(),
        combinations: this.combinations(),
        renderers: this.renderers(),
        decode: this.decode(),
        tileSize: this.tileSize(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    });
  }

  isSelected(category: FixtureCategoryId, id: string): boolean {
    return this.selection()[category].includes(id);
  }

  toggleFixture(category: FixtureCategoryId, id: string, selected: boolean): void {
    this.selection.update((selection) => {
      const ids = selection[category].filter((existing) => existing !== id);
      return {...selection, [category]: selected ? [...ids, id] : ids};
    });
  }

  setCategory(category: FixtureCategoryId, selected: boolean): void {
    const fixtures = FIXTURE_CATEGORIES.find(({id}) => id === category)?.fixtures ?? [];
    this.selection.update((selection) => ({
      ...selection,
      [category]: selected ? fixtures.map(({id}) => id) : [],
    }));
  }

  updateCombinations(patch: Partial<CombinationFilter>): void {
    this.combinations.update((filter) => ({...filter, ...patch}));
  }

  run(): void {
    const selection = this.selection();
    const fixtures: DevFixture[] = [];
    for (const category of FIXTURE_CATEGORIES) {
      const ids = new Set(selection[category.id]);
      for (const fixture of category.fixtures) if (ids.has(fixture.id)) fixtures.push(fixture);
    }
    const combinations = this.combinations();
    if (combinations.enabled) fixtures.push(...combinationFixtures(combinations));

    const renderers = RENDERERS.map(({id}) => id).filter((id) => this.renderers().includes(id));
    this.results.reset();
    this._run.set({fixtures, renderers});
  }

  clearRun(): void {
    this.results.reset();
    this._run.set(undefined);
  }
}
