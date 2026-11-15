import {existsSync} from 'node:fs';
import {mkdir, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import type {Plugin} from 'vite';

import {CACHE_ROOT, PERF_ROOT, WORKSPACE_ROOT} from '../paths.ts';
import type {SpeedTarget} from '../report-types.ts';
import type {WorkloadGroupId} from './workloads/index.ts';

/** A checkout whose packages a run measures. */
export type Variant = {
  readonly name: 'current' | 'against';
  readonly root: string;
};

export type GroupBundle =
  | {readonly ok: true; readonly directory: string; readonly entry: string}
  | {readonly ok: false; readonly error: string};

function entrySource(group: WorkloadGroupId): string {
  const groupFile = path.join(PERF_ROOT, 'src/speed/workloads', `${group}.ts`);
  const sampler = path.join(PERF_ROOT, 'src/speed/sampler.ts');
  return `import {group} from ${JSON.stringify(groupFile)};
import {sample, consumeSink} from ${JSON.stringify(sampler)};

export const workloads = group.workloads.map(({id, title, features, targets}) => ({id, title, features, targets}));

export async function run(id, options, now) {
  const workload = group.workloads.find((candidate) => candidate.id === id);
  if (!workload) throw new Error('Unknown workload: ' + id);
  const state = workload.setup ? await workload.setup() : undefined;
  return sample(() => workload.run(state), now, options);
}

export {consumeSink};
`;
}

function shouldRemap(id: string): boolean {
  return (
    path.isAbsolute(id) &&
    (id.startsWith(path.join(WORKSPACE_ROOT, 'packages') + path.sep) ||
      id.startsWith(path.join(WORKSPACE_ROOT, 'apps') + path.sep)) &&
    !id.startsWith(PERF_ROOT + path.sep) &&
    !id.includes(`${path.sep}node_modules${path.sep}`)
  );
}

/**
 * Resolves workspace files from another checkout. Imports resolve in the current workspace
 * first, then the same workspace-relative path is used in the other checkout, so the workloads
 * stay identical and only the measured packages differ.
 */
function variantPlugin(root: string): Plugin {
  return {
    name: 'qrcodesdk-perf:variant',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (importer?.startsWith(root + path.sep)) return null;
      const resolved = await this.resolve(source, importer, {...options, skipSelf: true});
      if (!resolved || resolved.external || !shouldRemap(resolved.id)) return resolved;
      const [file, query = ''] = resolved.id.split('?');
      const target = path.join(root, path.relative(WORKSPACE_ROOT, file!));
      if (!existsSync(target)) {
        this.error(
          `${path.relative(WORKSPACE_ROOT, file!)} does not exist in the comparison checkout`,
        );
      }
      return {...resolved, id: query ? `${target}?${query}` : target};
    },
  };
}

/** Bundles one workload group for one target, as a Node.js module or a browser page. */
export async function bundleGroup(
  group: WorkloadGroupId,
  target: SpeedTarget,
  variant: Variant,
): Promise<GroupBundle> {
  const {build} = await import('vite');
  const directory = path.join(CACHE_ROOT, 'speed', variant.name, target, group);
  await rm(directory, {recursive: true, force: true});
  await mkdir(directory, {recursive: true});
  await writeFile(path.join(directory, 'entry.js'), entrySource(group));
  const plugins = variant.root === WORKSPACE_ROOT ? [] : [variantPlugin(variant.root)];
  try {
    if (target === 'node') {
      await build({
        configFile: false,
        logLevel: 'silent',
        root: directory,
        plugins,
        ssr: {noExternal: true, target: 'node'},
        build: {
          ssr: path.join(directory, 'entry.js'),
          outDir: path.join(directory, 'dist'),
          minify: false,
          emptyOutDir: true,
          rollupOptions: {output: {entryFileNames: 'entry.mjs', format: 'es'}},
        },
      });
      return {ok: true, directory, entry: path.join(directory, 'dist', 'entry.mjs')};
    }
    await writeFile(
      path.join(directory, 'index.html'),
      '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><title>perf</title></head>' +
        '<body><script type="module" src="./main.js"></script></body></html>\n',
    );
    await writeFile(
      path.join(directory, 'main.js'),
      `import * as entry from './entry.js';
globalThis.__perf = {
  list: () => entry.workloads,
  run: (id, options) => entry.run(id, options, () => performance.now()),
  sink: () => typeof entry.consumeSink(),
};
`,
    );
    await build({
      configFile: false,
      logLevel: 'silent',
      root: directory,
      plugins,
      build: {outDir: path.join(directory, 'dist'), emptyOutDir: true, modulePreload: false},
    });
    return {ok: true, directory, entry: path.join(directory, 'dist', 'index.html')};
  } catch (error) {
    return {ok: false, error: error instanceof Error ? error.message : String(error)};
  }
}
