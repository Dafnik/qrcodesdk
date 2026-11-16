/** The small, validated part of a report used by the privileged PR publisher. */
type Bundle = {gzip: number; initial: number; lazy: number};
type Scenario = {
  id: string;
  bundles: Partial<Record<'vite' | 'esbuild' | 'webpack', Bundle>>;
  problems: string[];
};
export type SizeSummary = {
  commit: string;
  generatedAt: string;
  scenarios: Scenario[];
  packages: {name: string; packed: number; unpacked: number}[];
};

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Expected an object in size report');
  }
  return value as Record<string, unknown>;
}

function text(value: unknown): string {
  if (typeof value !== 'string' || value.length > 2_000) {
    throw new Error('Invalid text in size report');
  }
  return value;
}

function bytes(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new Error('Invalid byte count in size report');
  }
  return value;
}

function array(value: unknown): unknown[] {
  if (!Array.isArray(value) || value.length > 2_000) {
    throw new Error('Invalid array in size report');
  }
  return value;
}

function unique(ids: string[]): void {
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate id in size report');
}

/** Treat artifacts as data only. Never render arbitrary Markdown from a measured checkout. */
export function parseSizeSummary(value: unknown): SizeSummary {
  const report = object(value);
  if (report['schemaVersion'] !== 1 || report['kind'] !== 'size') {
    throw new Error('Unsupported size report');
  }
  const scenarios = array(report['scenarios']).map((value) => {
    const scenario = object(value);
    const bundles: Scenario['bundles'] = {};
    for (const name of ['vite', 'esbuild', 'webpack'] as const) {
      if (scenario[name] === undefined && name !== 'vite') continue;
      const bundle = object(scenario[name]);
      bundles[name] = {
        gzip: bytes(object(bundle['total'])['gzip']),
        initial: bytes(object(bundle['initial'])['gzip']),
        lazy: bytes(object(bundle['lazy'])['gzip']),
      };
    }
    return {
      id: text(scenario['id']),
      bundles,
      problems: [...array(scenario['problems']), ...array(scenario['warnings'])].map(text),
    };
  });
  const packages = array(report['packages']).map((value) => {
    const item = object(value);
    return {
      name: text(item['name']),
      packed: bytes(item['packed']),
      unpacked: bytes(item['unpacked']),
    };
  });
  if (!scenarios.length || !packages.length) throw new Error('The size report is incomplete');
  unique(scenarios.map((item) => item.id));
  unique(packages.map((item) => item.name));
  const commit = text(report['commit']);
  if (!/^[a-f0-9]{7,40}(?:-dirty)?$/.test(commit)) throw new Error('Invalid report commit');
  const generatedAt = text(report['generatedAt']);
  if (!Number.isFinite(Date.parse(generatedAt))) throw new Error('Invalid report date');
  return {commit, generatedAt: new Date(generatedAt).toISOString(), scenarios, packages};
}

function escape(value: string): string {
  return value.replace(/[&<>|`@[\]()!\r\n]/g, (character) => {
    if (character === '\r' || character === '\n') return ' ';
    return `&#${character.charCodeAt(0)};`;
  });
}

function change(before: number | undefined, after: number | undefined): string {
  if (before === undefined) return 'New';
  if (after === undefined) return 'Removed';
  const delta = after - before;
  const percent = before === 0 ? '' : ` / ${((delta / before) * 100).toFixed(2)}%`;
  return `${delta > 0 ? '+' : ''}${delta.toLocaleString('en-US')} B${percent}`;
}

function row(id: string, before: number | undefined, after: number | undefined): string {
  return `| ${escape(id)} | ${before?.toLocaleString('en-US') ?? '—'} | ${after?.toLocaleString('en-US') ?? '—'} | ${change(before, after)} |`;
}

export function formatSizeComparison(before: SizeSummary, after: SizeSummary): string {
  const changed: string[] = [];
  const unchanged: string[] = [];
  const add = (id: string, a: number | undefined, b: number | undefined) => {
    (a === b ? unchanged : changed).push(row(id, a, b));
  };
  const previous = new Map(before.scenarios.map((item) => [item.id, item]));
  const current = new Map(after.scenarios.map((item) => [item.id, item]));
  for (const id of new Set([...previous.keys(), ...current.keys()])) {
    for (const bundler of ['vite', 'esbuild', 'webpack'] as const) {
      const a = previous.get(id)?.bundles[bundler];
      const b = current.get(id)?.bundles[bundler];
      if (!a && !b) continue;
      add(`${id} / ${bundler} gzip`, a?.gzip, b?.gzip);
      if (bundler === 'vite') {
        add(`${id} / initial gzip`, a?.initial, b?.initial);
        add(`${id} / lazy gzip`, a?.lazy, b?.lazy);
      }
    }
  }
  const packages = new Map(before.packages.map((item) => [item.name, item]));
  const currentPackages = new Map(after.packages.map((item) => [item.name, item]));
  for (const id of new Set([...packages.keys(), ...currentPackages.keys()])) {
    add(`${id} / packed`, packages.get(id)?.packed, currentPackages.get(id)?.packed);
    add(`${id} / unpacked`, packages.get(id)?.unpacked, currentPackages.get(id)?.unpacked);
  }
  const header = '| Measurement | main bytes | PR bytes | Change |\n| --- | ---: | ---: | ---: |';
  const problems = [
    ...before.scenarios.flatMap((item) => item.problems.map((p) => `main / ${item.id}: ${p}`)),
    ...after.scenarios.flatMap((item) => item.problems.map((p) => `PR / ${item.id}: ${p}`)),
  ];
  return [
    `Measured ${before.scenarios.length} main scenarios and ${after.scenarios.length} PR scenarios, plus ${after.packages.length} PR packages.`,
    'Sizes and regressions are informational. All bundle measurements below use gzip; package sizes use tarball and unpacked bytes.',
    changed.length ? `${header}\n${changed.join('\n')}` : 'No size changes.',
    ...(unchanged.length
      ? [
          `<details>\n<summary>Unchanged measurements (${unchanged.length})</summary>\n\n${header}\n${unchanged.join('\n')}\n\n</details>`,
        ]
      : []),
    ...(problems.length
      ? [
          `Measurement problems and bundler warnings:\n\n${problems.map((p) => `- ${escape(p)}`).join('\n')}`,
        ]
      : []),
  ].join('\n\n');
}
