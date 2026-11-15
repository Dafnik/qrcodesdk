import {Buffer} from 'node:buffer';
import {existsSync, readFileSync} from 'node:fs';
import {mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';

import type {SizeBundler} from '../report-types.ts';
import type {Framework} from './scenarios.ts';

const require = createRequire(import.meta.url);

export type RawSourceMap = {
  readonly sources: readonly (string | null)[];
  readonly mappings: string;
  readonly sourceRoot?: string;
};

export type BuiltChunk = {
  readonly fileName: string;
  readonly code: string;
  /** Present for Vite builds, which the report attributes module by module. */
  readonly map?: RawSourceMap;
  readonly isEntry: boolean;
  /** Files this chunk imports statically. */
  readonly imports: readonly string[];
};

export type BuildOutput = {
  /** Directory that source-map paths are relative to, joined with each chunk's directory. */
  readonly outDir: string;
  readonly chunks: readonly BuiltChunk[];
};

export type BuildRequest = {
  /** Directory with `index.html` and `main.js`. */
  readonly appDir: string;
  readonly framework?: Framework;
};

const FRAMEWORK_DEFINES: Readonly<Record<string, string>> = {
  'process.env.NODE_ENV': '"production"',
  __VUE_OPTIONS_API__: 'true',
  __VUE_PROD_DEVTOOLS__: 'false',
  __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
  // The Angular CLI sets these globals so production builds drop development-only code.
  ngDevMode: 'false',
  ngJitMode: 'false',
  ngI18nClosureMode: 'false',
};

const SDK_DIST = /[\\/]packages[\\/][^\\/]+[\\/]dist[\\/].*\.m?js$/;
const THIRD_PARTY = /[\\/]node_modules[\\/].*\.[cm]?js$/;
const SOURCE_MAP_COMMENT = /\/\/# sourceMappingURL=\S+\s*$/;
// Partially compiled Angular libraries contain declaration calls, which the linker compiles.
const PARTIAL_DECLARATION = 'ɵɵngDeclare'; // cspell:disable-line
const INLINE_SOURCE_MAP = /\n?\/\/# sourceMappingURL=data:application\/json;[^,]*base64,(\S+)\s*$/;

export function toolVersions(): Record<string, string> {
  const version = (name: string) =>
    (JSON.parse(readFileSync(require.resolve(`${name}/package.json`), 'utf8')) as {version: string})
      .version;
  return {
    vite: version('vite'),
    esbuild: version('esbuild'),
    webpack: version('webpack'),
  };
}

export async function build(bundler: SizeBundler, request: BuildRequest): Promise<BuildOutput> {
  switch (bundler) {
    case 'vite':
      return buildWithVite(request);
    case 'esbuild':
      return buildWithEsbuild(request);
    case 'webpack':
      return buildWithWebpack(request);
  }
}

/* -------------------------------------------------------------------------------------------- */

type VitePlugin = import('vite').Plugin;

/**
 * Loads the source maps that the QRCodeSDK builds ship, so Rolldown chains them and the report
 * attributes bytes to the original TypeScript sources instead of to `dist` chunks.
 */
function sdkSourceMaps(): VitePlugin {
  return {
    name: 'qrcodesdk-perf:source-maps',
    async load(id) {
      if (SDK_DIST.test(id) && existsSync(`${id}.map`)) {
        const code = await readFile(id, 'utf8');
        return {
          code: code.replace(SOURCE_MAP_COMMENT, ''),
          map: await readFile(`${id}.map`, 'utf8'),
        };
      }
      // Third-party maps point at paths from their own build machines. Without them, bytes are
      // attributed to the installed file, such as `node_modules/@angular/core/fesm2022/core.mjs`.
      if (THIRD_PARTY.test(id)) {
        const code = await readFile(id, 'utf8');
        return {code: code.replace(SOURCE_MAP_COMMENT, ''), map: null};
      }
      return null;
    },
  };
}

/**
 * Applies the Angular CLI's JavaScript transformer to every dependency, as `ng build` does: it
 * links partially compiled libraries and runs the advanced optimizations that make Angular
 * classes with static members tree-shakeable.
 */
async function angularTransformer(appDir: string): Promise<VitePlugin> {
  const {JavaScriptTransformer} = await import('@angular/build/private');
  const transformer = new JavaScriptTransformer({
    sourcemap: true,
    thirdPartySourcemaps: false,
    advancedOptimizations: true,
    jit: false,
  });
  return {
    name: 'qrcodesdk-perf:angular-transformer',
    async transform(code, id) {
      if (id.startsWith(appDir) || !/\.m?js$/.test(id)) return null;
      const output = new TextDecoder().decode(
        await transformer.transformData(id, code, {
          skipLinker: !code.includes(PARTIAL_DECLARATION),
        }),
      );
      const match = INLINE_SOURCE_MAP.exec(output);
      if (!match) return {code: output, map: null};
      return {
        code: output.slice(0, match.index),
        map: Buffer.from(match[1]!, 'base64').toString('utf8'),
      };
    },
    async closeBundle() {
      await transformer.close();
    },
  };
}

async function frameworkPlugins(
  framework: Framework | undefined,
  appDir: string,
): Promise<VitePlugin[]> {
  if (framework === 'svelte') {
    const {svelte} = await import('@sveltejs/vite-plugin-svelte');
    return svelte({configFile: false}) as VitePlugin[];
  }
  if (framework === 'angular') return [await angularTransformer(appDir)];
  return [];
}

async function buildWithVite({appDir, framework}: BuildRequest): Promise<BuildOutput> {
  const vite = await import('vite');
  const outDir = path.join(appDir, 'dist-vite');
  const result = await vite.build({
    root: appDir,
    configFile: false,
    logLevel: 'silent',
    mode: 'production',
    define: FRAMEWORK_DEFINES,
    plugins: [sdkSourceMaps(), ...(await frameworkPlugins(framework, appDir))],
    build: {
      outDir,
      write: false,
      sourcemap: 'hidden',
      // Keep every chunk separate so the report shows what each one costs.
      assetsInlineLimit: 0,
      reportCompressedSize: false,
    },
  });
  await writeOutputs(result, outDir);
  const outputs = Array.isArray(result) ? result : [result];
  const chunks: BuiltChunk[] = [];
  for (const output of outputs) {
    if (!('output' in output)) throw new Error('Vite returned a watcher instead of a bundle');
    for (const item of output.output) {
      if (item.type !== 'chunk') continue;
      chunks.push({
        fileName: item.fileName,
        code: item.code,
        map: item.map as unknown as RawSourceMap,
        isEntry: item.isEntry,
        imports: item.imports,
      });
    }
  }
  return {outDir, chunks};
}

/** Keeps the Vite output on disk, so a bundle can be inspected after the report. */
async function writeOutputs(
  result: Awaited<ReturnType<typeof import('vite').build>>,
  outDir: string,
) {
  await rm(outDir, {recursive: true, force: true});
  for (const output of Array.isArray(result) ? result : [result]) {
    if (!('output' in output)) continue;
    for (const item of output.output) {
      const file = path.join(outDir, item.fileName);
      await mkdir(path.dirname(file), {recursive: true});
      await writeFile(file, item.type === 'chunk' ? item.code : item.source);
    }
  }
}

/* -------------------------------------------------------------------------------------------- */

async function buildWithEsbuild({appDir}: BuildRequest): Promise<BuildOutput> {
  const esbuild = await import('esbuild');
  const outDir = path.join(appDir, 'dist-esbuild');
  const result = await esbuild.build({
    absWorkingDir: appDir,
    entryPoints: [path.join(appDir, 'main.js')],
    bundle: true,
    splitting: true,
    format: 'esm',
    platform: 'browser',
    minify: true,
    write: false,
    metafile: true,
    outdir: outDir,
    logLevel: 'silent',
    define: FRAMEWORK_DEFINES,
    supported: {'top-level-await': true},
  });
  const chunks: BuiltChunk[] = result.outputFiles
    .filter((file) => file.path.endsWith('.js'))
    .map((file) => {
      const key = path.relative(appDir, file.path).split(path.sep).join('/');
      const meta = result.metafile.outputs[key];
      if (!meta) throw new Error(`esbuild metafile lacks ${key}`);
      return {
        fileName: path.relative(outDir, file.path),
        code: file.text,
        isEntry:
          meta.entryPoint !== undefined &&
          path.resolve(appDir, meta.entryPoint) === path.join(appDir, 'main.js'),
        imports: meta.imports
          .filter((item) => item.kind === 'import-statement')
          .map((item) => path.relative(outDir, path.join(appDir, item.path))),
      };
    });
  return {outDir, chunks};
}

/* -------------------------------------------------------------------------------------------- */

async function buildWithWebpack({appDir}: BuildRequest): Promise<BuildOutput> {
  const {default: webpack} = await import('webpack');
  const outDir = path.join(appDir, 'dist-webpack');
  await rm(outDir, {recursive: true, force: true});
  const compiler = webpack({
    mode: 'production',
    context: appDir,
    entry: './main.js',
    target: 'web',
    devtool: false,
    performance: {hints: false},
    infrastructureLogging: {level: 'error'},
    experiments: {topLevelAwait: true},
    output: {path: outDir, filename: '[name].js', chunkFilename: '[name].[contenthash].js'},
    plugins: [
      new webpack.DefinePlugin(
        Object.fromEntries(
          Object.entries(FRAMEWORK_DEFINES).filter(([key]) => key !== 'process.env.NODE_ENV'),
        ),
      ),
    ],
  });
  const stats = await new Promise<import('webpack').Stats>((resolve, reject) => {
    compiler.run((error, result) => {
      compiler.close(() => undefined);
      if (error) reject(error);
      else if (!result) reject(new Error('webpack returned no stats'));
      else if (result.hasErrors()) reject(new Error(result.toString('errors-only')));
      else resolve(result);
    });
  });
  const json = stats.toJson({all: false, chunks: true, chunkRelations: true});
  const chunks: BuiltChunk[] = [];
  for (const chunk of json.chunks ?? []) {
    for (const file of chunk.files ?? []) {
      if (!file.endsWith('.js')) continue;
      chunks.push({
        fileName: file,
        code: await readFile(path.join(outDir, file), 'utf8'),
        isEntry: chunk.initial ?? false,
        // webpack loads every initial chunk up front, so each one counts as an entry.
        imports: [],
      });
    }
  }
  return {outDir, chunks};
}
