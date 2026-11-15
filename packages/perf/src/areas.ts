/**
 * Features and code areas shared by the size and speed reports.
 *
 * A feature is something an application opts into, such as Micro QR codes or the PNG encoder.
 * Scenarios and workloads are tagged with features, so the docs page can group both reports the
 * same way. A code area groups source files by what they implement. The size report attributes
 * every bundled byte to one area through source maps.
 */

export const FEATURES = {
  matrix: 'Matrix generation',
  'auto-mode': 'Automatic mode',
  segmenter: 'Automatic segmenter',
  kanji: 'Kanji',
  micro: 'Micro QR',
  rmqr: 'rMQR',
  payload: 'Payload helpers',
  text: 'Text renderer',
  svg: 'SVG renderer',
  canvas: 'Canvas renderer',
  png: 'PNG',
  webp: 'WebP',
  gif: 'GIF',
  jpeg: 'JPEG',
  styling: 'Styling',
  'custom-shape': 'Custom shapes',
  'center-image': 'Center image',
  download: 'Downloads',
  'code-splitting': 'Code splitting',
  react: 'React',
  vue: 'Vue',
  svelte: 'Svelte',
  angular: 'Angular',
  explain: 'Docs explanation',
} as const;

export type FeatureId = keyof typeof FEATURES;

export type CodeArea = {
  readonly id: string;
  readonly title: string;
  /** Matches a workspace-relative source path. */
  readonly match: RegExp;
  /**
   * Optional areas must only appear in a bundle that opts into them. The size report fails a
   * scenario that contains an optional area it does not list in `expect`.
   */
  readonly optional?: boolean;
  /** Whether the bytes belong to a QRCodeSDK package. */
  readonly sdk?: boolean;
};

const core = (pattern: string) => new RegExp(`^packages/core/src/(?:${pattern})`);
const browser = (pattern: string) => new RegExp(`^packages/browser/src/(?:${pattern})\\.ts$`);
const node = (pattern: string) => new RegExp(`^packages/node/src/(?:${pattern})\\.ts$`);
const npm = (pattern: string) =>
  new RegExp(`(?:^|/)node_modules/(?:\\.pnpm/[^/]+/node_modules/)?(?:${pattern})/`);

/** Ordered: the first matching area wins. */
export const CODE_AREAS: readonly CodeArea[] = [
  {
    id: 'core:builder',
    title: 'Builder and options',
    match: core('(?:qrcode-builder|options|types)\\.ts$'),
    sdk: true,
  },
  {id: 'core:matrix', title: 'QR matrix encoder', match: core('matrix/'), sdk: true},
  {id: 'core:error', title: 'Errors', match: core('error\\.ts$'), sdk: true},
  {
    id: 'core:segmenter',
    title: 'Automatic segmenter',
    match: core('segmenter\\.ts$'),
    optional: true,
    sdk: true,
  },
  {
    id: 'core:kanji-table',
    title: 'Kanji table',
    match: core('kanji(?:\\.ts$|/)'),
    optional: true,
    sdk: true,
  },
  {
    id: 'core:micro',
    title: 'Micro QR encoder',
    match: core('micro(?:\\.ts$|/)'),
    optional: true,
    sdk: true,
  },
  {
    id: 'core:rmqr',
    title: 'rMQR encoder',
    match: core('rmqr(?:\\.ts$|/)'),
    optional: true,
    sdk: true,
  },
  {
    id: 'core:payload',
    title: 'Payload helpers',
    match: core('payload(?:\\.ts$|/)'),
    optional: true,
    sdk: true,
  },
  {
    id: 'core:styler',
    title: 'Styler',
    match: core('(?:styling\\.ts|center-image-store\\.ts|drawing/)'),
    sdk: true,
  },
  {
    id: 'core:style-patterns',
    title: 'Shape and pattern factories',
    match: core('style/(?:patterns|index)\\.ts$'),
    optional: true,
    sdk: true,
  },
  {
    id: 'core:custom-shape',
    title: 'Custom-shape parser',
    match: core('(?:style/custom-shape|shape-path)\\.ts$'),
    optional: true,
    sdk: true,
  },
  {id: 'core:svg', title: 'SVG renderer', match: core('svg\\.ts$'), optional: true, sdk: true},
  {id: 'core:text', title: 'Text renderer', match: core('text\\.ts$'), optional: true, sdk: true},
  {
    id: 'core:gif-encoder',
    title: 'GIF encoder',
    match: core('(?:raster/gif|internal-gif)\\.ts$'),
    optional: true,
    sdk: true,
  },
  {
    id: 'core:jpeg-encoder',
    title: 'JPEG encoder',
    match: core('(?:raster/jpeg|internal-jpeg)\\.ts$'),
    optional: true,
    sdk: true,
  },
  {
    id: 'core:webp-encoder',
    title: 'WebP encoder',
    match: core('(?:raster/webp|internal-webp)\\.ts$'),
    optional: true,
    sdk: true,
  },
  {
    id: 'core:raster-shared',
    title: 'Raster encoder helpers',
    match: core('raster/'),
    optional: true,
    sdk: true,
  },
  {id: 'core:other', title: 'Core (other)', match: core(''), sdk: true},
  {
    id: 'browser:canvas',
    title: 'Canvas renderer',
    match: browser('canvas'),
    optional: true,
    sdk: true,
  },
  {
    id: 'browser:image',
    title: 'Image element base',
    match: browser('(?:image-base|encoded-data-url)'),
    optional: true,
    sdk: true,
  },
  {id: 'browser:png', title: 'Browser PNG', match: browser('png'), optional: true, sdk: true},
  {id: 'browser:webp', title: 'Browser WebP', match: browser('webp'), optional: true, sdk: true},
  {id: 'browser:gif', title: 'Browser GIF', match: browser('gif'), optional: true, sdk: true},
  {id: 'browser:jpeg', title: 'Browser JPEG', match: browser('jpeg'), optional: true, sdk: true},
  {
    id: 'browser:download',
    title: 'Downloads',
    match: browser('(?:download-helper|image|svg)'),
    optional: true,
    sdk: true,
  },
  {id: 'browser:other', title: 'Browser (other)', match: /^packages\/browser\/src\//, sdk: true},
  {
    id: 'node:raster',
    title: 'Node.js rasterizer',
    match: node('(?:raster|render-rgba|pixels|center-image)'),
    sdk: true,
  },
  {id: 'node:png', title: 'Node.js PNG', match: node('(?:png|png-codec)'), sdk: true},
  {id: 'node:other', title: 'Node.js (other)', match: /^packages\/node\/src\//, sdk: true},
  {id: 'adapter:react', title: 'React components', match: /^packages\/react\//, sdk: true},
  {id: 'adapter:vue', title: 'Vue components', match: /^packages\/vue\//, sdk: true},
  {id: 'adapter:svelte', title: 'Svelte components', match: /^packages\/svelte\//, sdk: true},
  {id: 'adapter:angular', title: 'Angular components', match: /^packages\/angular\//, sdk: true},
  {id: 'framework:react', title: 'React runtime', match: npm('react|react-dom|scheduler')},
  {id: 'framework:vue', title: 'Vue runtime', match: npm('vue|@vue/[^/]+')},
  {id: 'framework:svelte', title: 'Svelte runtime', match: npm('svelte|esm-env|clsx')},
  {id: 'framework:angular', title: 'Angular runtime', match: npm('@angular/[^/]+|rxjs|tslib')},
  {id: 'app', title: 'Application code', match: /^packages\/perf\/\.cache\//},
  {id: 'other', title: 'Bundler runtime and unmapped bytes', match: /(?:)/},
];

const areaCache = new Map<string, CodeArea>();

/** Returns the code area of a workspace-relative source path. */
export function codeAreaOf(source: string): CodeArea {
  let area = areaCache.get(source);
  if (!area) {
    area = CODE_AREAS.find((candidate) => candidate.match.test(source)) ?? CODE_AREAS.at(-1)!;
    areaCache.set(source, area);
  }
  return area;
}

export function getCodeArea(id: string): CodeArea {
  const area = CODE_AREAS.find((candidate) => candidate.id === id);
  if (!area) throw new Error(`Unknown code area: ${id}`);
  return area;
}
