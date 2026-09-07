import {readFile, readdir} from 'node:fs/promises';
import {extname, relative, resolve} from 'node:path';

const workspaceRoot = resolve(import.meta.dirname, '..');
const skippedDirectories = new Set([
  '.astro',
  '.astro-cache',
  '.git',
  '.nx',
  '.turbo',
  'coverage',
  'dist',
  'node_modules',
]);
const textExtensions = new Set([
  '.astro',
  '.css',
  '.html',
  '.js',
  '.json',
  '.jsx',
  '.md',
  '.mdx',
  '.mjs',
  '.svelte',
  '.ts',
  '.tsx',
  '.vue',
  '.yaml',
  '.yml',
]);
const skippedFiles = new Set(['pnpm-lock.yaml', 'scripts/check-terminology.mjs']);

const rules = [
  ['legacy payload type', /\bQRCode(?:InputData|EncodedData)\b/g],
  [
    'legacy center-image type',
    /\bQRCode(?:ImageOverlayOptions|SVGImageOptions|CanvasImageOptions|PNGImageOptions)\b/g,
  ],
  ['legacy center-image method', /\bplaceImage\s*\(/g],
  ['legacy builder method', /\.(?:config|data)\s*\(/g],
  [
    'legacy framework payload prop',
    /<(?:QRCode(?:SVG|Image|Canvas)|qrcode-(?:svg|image|canvas))\b[^>]{0,500}\b(?::|\[)?data(?:\])?=/g,
  ],
  ['legacy CLI payload option', /--input(?:\s|[=<])/g],
  ['legacy CLI positional payload', /\[data\]/g],
  ['legacy scan-reliability term', /\b(?:scan|scanning)[- ](?:safe|safety)\b/gi],
  ['legacy center-image term', /\b(?:image|visual|PNG) overlays?\b/gi],
  ['legacy styled-drawing term', /\bstyle plans?\b/gi],
  ['legacy module-size term', /\brender size\b/gi],
  ['legacy runtime term', /\bruntime-agnostic\b/gi],
  ['legacy module identifiers', /\bdots(?:Type|Color)\b/g],
  [
    'legacy playground options name',
    /\b(?:PlaygroundConfig|playgroundConfig|QrConfig)\b|playground-config/g,
  ],
];

const violations = [];

for (const path of await listFiles(workspaceRoot)) {
  const relativePath = relative(workspaceRoot, path);
  if (skippedFiles.has(relativePath) || !textExtensions.has(extname(path))) continue;

  const source = await readFile(path, 'utf8');
  for (const [description, pattern] of rules) {
    pattern.lastIndex = 0;
    for (const match of source.matchAll(pattern)) {
      const line = source.slice(0, match.index).split('\n').length;
      violations.push(`${relativePath}:${line}: ${description}: ${JSON.stringify(match[0])}`);
    }
  }
}

if (violations.length > 0) {
  console.error(`Non-canonical terminology found:\n${violations.join('\n')}`);
  process.exitCode = 1;
} else {
  console.log('Terminology check passed.');
}

async function listFiles(directory) {
  const entries = await readdir(directory, {withFileTypes: true});
  const paths = [];

  for (const entry of entries) {
    if (entry.isDirectory() && skippedDirectories.has(entry.name)) continue;

    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) paths.push(...(await listFiles(path)));
    else if (entry.isFile()) paths.push(path);
  }

  return paths;
}
