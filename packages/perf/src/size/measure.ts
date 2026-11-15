import {decode} from '@jridgewell/sourcemap-codec';
import {Buffer} from 'node:buffer';
import path from 'node:path';
import {brotliCompressSync, constants, gzipSync} from 'node:zlib';

import {codeAreaOf} from '../areas.ts';
import {toWorkspacePath} from '../paths.ts';
import type {
  CheckBundleResult,
  SizeChunk,
  SizeDuplicate,
  SizeModule,
  Sizes,
  ViteBundleResult,
} from '../report-types.ts';
import type {BuildOutput, BuiltChunk, RawSourceMap} from './bundlers.ts';

const UNMAPPED = '(unmapped)';

/**
 * Compressed sizes as a server would serve the chunk: gzip at its default level 6 and Brotli at
 * quality 11, which static hosts use for precompressed assets.
 */
export function measureCode(code: string): Sizes {
  const buffer = Buffer.from(code);
  return {
    min: buffer.byteLength,
    gzip: gzipSync(buffer).byteLength,
    brotli: brotliCompressSync(buffer, {
      params: {[constants.BROTLI_PARAM_QUALITY]: 11},
    }).byteLength,
  };
}

export function addSizes(...items: readonly Sizes[]): Sizes {
  return items.reduce(
    (sum, item) => ({
      min: sum.min + item.min,
      gzip: sum.gzip + item.gzip,
      brotli: sum.brotli + item.brotli,
    }),
    {min: 0, gzip: 0, brotli: 0},
  );
}

/**
 * Attributes every byte of generated code to the original source it came from. Each mapping
 * segment covers the generated columns up to the next segment on the same line.
 */
export function attributeBytes(
  code: string,
  map: RawSourceMap,
  resolveSource: (source: string) => string,
): Map<string, number> {
  const bytes = new Map<string, number>();
  const add = (source: string, text: string) => {
    if (!text) return;
    bytes.set(source, (bytes.get(source) ?? 0) + Buffer.byteLength(text));
  };
  const sources = map.sources.map((source) => (source === null ? UNMAPPED : resolveSource(source)));
  const lines = code.split('\n');
  const mappings = decode(map.mappings);
  for (const [index, line] of lines.entries()) {
    const segments = mappings[index] ?? [];
    // The newline belongs to no source.
    if (index < lines.length - 1) add(UNMAPPED, '\n');
    if (segments.length === 0) {
      add(UNMAPPED, line);
      continue;
    }
    add(UNMAPPED, line.slice(0, segments[0]![0]));
    for (const [position, segment] of segments.entries()) {
      const end = segments[position + 1]?.[0] ?? line.length;
      const source = segment.length >= 4 ? sources[segment[1]!]! : UNMAPPED;
      add(source, line.slice(segment[0], end));
    }
  }
  return bytes;
}

/**
 * Collapses third-party files to their package, such as
 * `node_modules/.pnpm/react-dom@19/node_modules/react-dom/cjs/client.js` to `node_modules/react-dom/`.
 * The report tracks QRCodeSDK by source file and other packages as a whole.
 */
export function normalizeSource(absolutePath: string): string {
  const relative = toWorkspacePath(absolutePath);
  const match =
    /(?:^|\/)node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?((?:@[^/]+\/)?[^/]+)\//.exec(relative);
  return match ? `node_modules/${match[1]}/` : relative;
}

function chunkKinds(chunks: readonly BuiltChunk[]): Map<string, 'initial' | 'lazy'> {
  const byName = new Map(chunks.map((chunk) => [chunk.fileName, chunk]));
  const kinds = new Map<string, 'initial' | 'lazy'>();
  const visit = (chunk: BuiltChunk) => {
    if (kinds.get(chunk.fileName) === 'initial') return;
    kinds.set(chunk.fileName, 'initial');
    for (const name of chunk.imports) {
      const imported = byName.get(name);
      if (imported) visit(imported);
    }
  };
  for (const chunk of chunks) if (chunk.isEntry) visit(chunk);
  for (const chunk of chunks) if (!kinds.has(chunk.fileName)) kinds.set(chunk.fileName, 'lazy');
  return kinds;
}

export function summarizeCheck(output: BuildOutput): CheckBundleResult {
  const kinds = chunkKinds(output.chunks);
  const sized = output.chunks.map((chunk) => ({
    kind: kinds.get(chunk.fileName)!,
    sizes: measureCode(chunk.code),
  }));
  return {
    total: addSizes(...sized.map((chunk) => chunk.sizes)),
    initial: addSizes(
      ...sized.filter((chunk) => chunk.kind === 'initial').map((chunk) => chunk.sizes),
    ),
    lazy: addSizes(...sized.filter((chunk) => chunk.kind === 'lazy').map((chunk) => chunk.sizes)),
    chunkCount: output.chunks.length,
  };
}

/** Replaces content hashes so chunk names stay stable between runs. */
function chunkName(fileName: string): string {
  return fileName.replace(/-[\w-]{8}(?=\.js$)/, '');
}

export function summarizeVite(output: BuildOutput): ViteBundleResult {
  const kinds = chunkKinds(output.chunks);
  const chunks: SizeChunk[] = [];
  const areas: Record<string, number> = {};
  const locations = new Map<string, {chunks: string[]; bytes: number}>();
  let sdkBytes = 0;

  for (const chunk of output.chunks) {
    if (!chunk.map) throw new Error(`${chunk.fileName} has no source map`);
    const directory = path.join(output.outDir, path.dirname(chunk.fileName));
    const attributed = attributeBytes(chunk.code, chunk.map, (source) =>
      normalizeSource(path.resolve(directory, chunk.map?.sourceRoot ?? '', source)),
    );
    const name = chunkName(chunk.fileName);
    const modules: SizeModule[] = [...attributed]
      .map(([source, bytes]) => ({path: source, area: codeAreaOf(source).id, bytes}))
      .sort((a, b) => b.bytes - a.bytes || a.path.localeCompare(b.path));
    for (const module of modules) {
      const area = codeAreaOf(module.path);
      areas[area.id] = (areas[area.id] ?? 0) + module.bytes;
      if (area.sdk) sdkBytes += module.bytes;
      if (module.path === UNMAPPED) continue;
      const location = locations.get(module.path) ?? {chunks: [], bytes: 0};
      location.chunks.push(name);
      location.bytes += module.bytes;
      locations.set(module.path, location);
    }
    chunks.push({name, kind: kinds.get(chunk.fileName)!, sizes: measureCode(chunk.code), modules});
  }

  chunks.sort((a, b) =>
    a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === 'initial' ? -1 : 1,
  );
  const duplicates: SizeDuplicate[] = [...locations]
    .filter(([, location]) => location.chunks.length > 1)
    .map(([source, location]) => ({
      path: source,
      chunks: location.chunks.sort(),
      bytes: location.bytes,
    }))
    .sort((a, b) => b.bytes - a.bytes);

  return {
    total: addSizes(...chunks.map((chunk) => chunk.sizes)),
    initial: addSizes(
      ...chunks.filter((chunk) => chunk.kind === 'initial').map((chunk) => chunk.sizes),
    ),
    lazy: addSizes(...chunks.filter((chunk) => chunk.kind === 'lazy').map((chunk) => chunk.sizes)),
    sdkBytes,
    areas: Object.fromEntries(Object.entries(areas).sort(([, a], [, b]) => b - a)),
    chunks,
    duplicates,
  };
}
