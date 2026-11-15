import type {FeatureId} from '../areas.ts';
import type {SizeBundler} from '../report-types.ts';

export type Framework = 'react' | 'vue' | 'svelte' | 'angular';

/**
 * A minimal application that a real project could ship. Each scenario is built as a production
 * app, so its numbers include everything a user downloads for that usage.
 */
export type SizeScenario = {
  readonly id: string;
  readonly title: string;
  readonly group: string;
  readonly description: string;
  readonly features: readonly FeatureId[];
  /** The scenario this one adds to. The size difference is the cost of the added feature. */
  readonly baseline?: string;
  readonly framework?: Framework;
  /** Source of `main.js`. */
  readonly main: string;
  /** Additional modules next to `main.js`, such as lazily loaded routes. */
  readonly files?: Readonly<Record<string, string>>;
  /** Optional code areas this scenario must contain. Any other optional area fails the check. */
  readonly expect?: readonly string[];
  /** Bundlers that build this scenario. Defaults to every bundler. */
  readonly bundlers?: readonly SizeBundler[];
};

// Every scenario reads the payload at runtime, so bundlers cannot fold the work away.
const PAYLOAD = 'location.hash';
const show = (expression: string) => `document.body.append(${expression});`;
const MATRIX = "import {qrcode} from '@qrcodesdk/core/matrix';";
const SVG = "import {QRCodeSVGRenderer} from '@qrcodesdk/core/svg';";
const CANVAS = "import {QRCodeCanvasRenderer} from '@qrcodesdk/browser/canvas';";
const STYLE = "import {alignment, circle, diagonal, finder, rounded} from '@qrcodesdk/core/style';";
const svgOf = (renderer: string, builder = `qrcode(${PAYLOAD})`) =>
  show(`${builder}.render(${renderer})`);
const matrixOf = (builder: string) => show(`String(${builder}.matrix().width)`);

const SVG_EXPECT = ['core:svg'];
const CANVAS_EXPECT = ['browser:canvas'];
const IMAGE_EXPECT = ['browser:canvas', 'browser:image'];
const ALL_IMAGE_EXPECT = [
  ...IMAGE_EXPECT,
  'browser:png',
  'browser:webp',
  'browser:gif',
  'browser:jpeg',
  'core:gif-encoder',
  'core:jpeg-encoder',
  'core:webp-encoder',
  'core:raster-shared',
];
const FRAMEWORK_SVG_EXPECT = ['core:svg', 'browser:download'];

const vanilla: SizeScenario[] = [
  {
    id: 'empty',
    title: 'Empty app',
    group: 'Baseline',
    description: 'A Vite app without QRCodeSDK. Includes the bundler runtime every app pays.',
    features: [],
    main: show(PAYLOAD),
  },
  {
    id: 'matrix',
    title: 'Matrix',
    group: 'Matrix',
    description: 'Generates a QR code matrix from `@qrcodesdk/core/matrix`.',
    features: ['matrix'],
    baseline: 'empty',
    main: `${MATRIX} ${matrixOf(`qrcode(${PAYLOAD})`)}`,
  },
  {
    id: 'matrix-root',
    title: 'Matrix from the root entry',
    group: 'Matrix',
    description: 'Imports `qrcode` from `@qrcodesdk/core`. Tree shaking should drop the renderers.',
    features: ['matrix'],
    baseline: 'matrix',
    main: `import {qrcode} from '@qrcodesdk/core'; ${matrixOf(`qrcode(${PAYLOAD})`)}`,
  },
  {
    id: 'matrix-fixed',
    title: 'Matrix with fixed mode, version, and mask',
    group: 'Matrix',
    description: 'Sets the mode, version, error correction, and mask explicitly.',
    features: ['matrix'],
    baseline: 'matrix',
    main: `${MATRIX} ${matrixOf(`qrcode(${PAYLOAD}).options({mode: 'octet', version: 5, errorCorrectionLevel: 'M', mask: 3})`)}`,
  },
  {
    id: 'matrix-auto',
    title: 'Automatic mode',
    group: 'Matrix',
    description: "Selects the smallest single mode with `mode('auto')`.",
    features: ['matrix', 'auto-mode'],
    baseline: 'matrix',
    main: `${MATRIX} ${matrixOf(`qrcode(${PAYLOAD}).mode('auto')`)}`,
  },
  {
    id: 'segmenter',
    title: 'Automatic segmenter',
    group: 'Matrix',
    description: 'Optimizes mixed-mode segments with `automaticSegmenter`.',
    features: ['matrix', 'auto-mode', 'segmenter'],
    baseline: 'matrix-auto',
    expect: ['core:segmenter'],
    main: `${MATRIX} import {automaticSegmenter} from '@qrcodesdk/core/segmenter'; ${matrixOf(`qrcode(${PAYLOAD}).mode('auto').segmenter(automaticSegmenter)`)}`,
  },
  {
    id: 'kanji',
    title: 'Kanji mode',
    group: 'Matrix',
    description: 'Adds the Shift JIS table from `@qrcodesdk/core/kanji`.',
    features: ['matrix', 'auto-mode', 'kanji'],
    baseline: 'matrix-auto',
    expect: ['core:kanji-table'],
    main: `${MATRIX} import {kanji} from '@qrcodesdk/core/kanji'; ${matrixOf(`qrcode(${PAYLOAD}).mode('auto').kanji(kanji)`)}`,
  },
  {
    id: 'kanji-segmenter',
    title: 'Kanji with the segmenter',
    group: 'Matrix',
    description: 'Mixed-mode segments, including Kanji.',
    features: ['matrix', 'auto-mode', 'kanji', 'segmenter'],
    baseline: 'segmenter',
    expect: ['core:kanji-table', 'core:segmenter'],
    main: `${MATRIX} import {kanji} from '@qrcodesdk/core/kanji'; import {automaticSegmenter} from '@qrcodesdk/core/segmenter'; ${matrixOf(`qrcode(${PAYLOAD}).mode('auto').kanji(kanji).segmenter(automaticSegmenter)`)}`,
  },
  {
    id: 'micro',
    title: 'Micro QR',
    group: 'Symbols',
    description: 'A Micro QR matrix from `@qrcodesdk/core/micro`.',
    features: ['matrix', 'micro'],
    baseline: 'matrix',
    expect: ['core:micro'],
    main: `${MATRIX} import {microQR} from '@qrcodesdk/core/micro'; ${matrixOf(`qrcode(${PAYLOAD}).options({symbol: microQR()})`)}`,
  },
  {
    id: 'rmqr',
    title: 'rMQR',
    group: 'Symbols',
    description: 'An rMQR matrix from `@qrcodesdk/core/rmqr`.',
    features: ['matrix', 'rmqr'],
    baseline: 'matrix',
    expect: ['core:rmqr'],
    main: `${MATRIX} import {rMQR} from '@qrcodesdk/core/rmqr'; ${matrixOf(`qrcode(${PAYLOAD}).options({symbol: rMQR()})`)}`,
  },
  {
    id: 'all-symbols',
    title: 'QR, Micro QR, and rMQR',
    group: 'Symbols',
    description: 'All three symbol types in one bundle.',
    features: ['matrix', 'micro', 'rmqr'],
    baseline: 'matrix',
    expect: ['core:micro', 'core:rmqr'],
    main: `${MATRIX} import {microQR} from '@qrcodesdk/core/micro'; import {rMQR} from '@qrcodesdk/core/rmqr';
const symbol = ${PAYLOAD}.length > 20 ? rMQR() : ${PAYLOAD}.length > 10 ? microQR() : undefined;
${matrixOf(`qrcode(${PAYLOAD}).options({symbol})`)}`,
  },
  {
    id: 'payload-wifi',
    title: 'Wi-Fi payload',
    group: 'Payload',
    description: 'Formats a Wi-Fi payload with `wifiPayload`.',
    features: ['matrix', 'payload'],
    baseline: 'matrix',
    expect: ['core:payload'],
    main: `${MATRIX} import {wifiPayload} from '@qrcodesdk/core/payload'; ${matrixOf(`qrcode(wifiPayload({ssid: ${PAYLOAD}, password: 'secret', encryption: 'WPA'}))`)}`,
  },
  {
    id: 'payload-vcard',
    title: 'vCard payload',
    group: 'Payload',
    description: 'Formats a contact with `vcardPayload`.',
    features: ['matrix', 'payload'],
    baseline: 'matrix',
    expect: ['core:payload'],
    main: `${MATRIX} import {vcardPayload} from '@qrcodesdk/core/payload'; ${matrixOf(`qrcode(vcardPayload({formattedName: ${PAYLOAD}, phones: [{number: '+43 1 234'}]}))`)}`,
  },
  {
    id: 'payload-calendar',
    title: 'Calendar payload',
    group: 'Payload',
    description: 'Formats an event with `calendarPayload`.',
    features: ['matrix', 'payload'],
    baseline: 'matrix',
    expect: ['core:payload'],
    main: `${MATRIX} import {calendarPayload} from '@qrcodesdk/core/payload'; ${matrixOf(`qrcode(calendarPayload({uid: 'id', timestamp: '2026-01-01T00:00:00Z', summary: ${PAYLOAD}, start: '2026-01-02T10:00:00Z', end: '2026-01-02T11:00:00Z'}))`)}`,
  },
  {
    id: 'payload-all',
    title: 'All payload helpers',
    group: 'Payload',
    description: 'Imports every payload helper.',
    features: ['matrix', 'payload'],
    baseline: 'matrix',
    expect: ['core:payload'],
    main: `${MATRIX} import * as payloads from '@qrcodesdk/core/payload';
const helper = payloads[${PAYLOAD}.slice(1)];
${matrixOf(`qrcode(helper({ssid: 'a', formattedName: 'a', address: 'a', number: 'a', latitude: 1, longitude: 2, uid: 'a', timestamp: '2026-01-01T00:00:00Z', summary: 'a', start: '2026-01-02T10:00:00Z', end: '2026-01-02T11:00:00Z'}))`)}`,
  },
  {
    id: 'text',
    title: 'Text renderer',
    group: 'Renderers',
    description: 'Terminal text with `QRCodeTextRenderer`.',
    features: ['matrix', 'text'],
    baseline: 'matrix',
    expect: ['core:text'],
    main: `${MATRIX} import {QRCodeTextRenderer} from '@qrcodesdk/core/text'; ${svgOf('QRCodeTextRenderer()')}`,
  },
  {
    id: 'svg',
    title: 'SVG renderer',
    group: 'Renderers',
    description: 'A plain SVG string with `QRCodeSVGRenderer`.',
    features: ['matrix', 'svg'],
    baseline: 'matrix',
    expect: SVG_EXPECT,
    main: `${MATRIX} ${SVG} ${svgOf('QRCodeSVGRenderer()')}`,
  },
  {
    id: 'svg-root',
    title: 'SVG from the root entry',
    group: 'Renderers',
    description: 'Imports `qrcode` and `QRCodeSVGRenderer` from `@qrcodesdk/core`.',
    features: ['matrix', 'svg'],
    baseline: 'svg',
    expect: SVG_EXPECT,
    main: `import {qrcode, QRCodeSVGRenderer} from '@qrcodesdk/core'; ${svgOf('QRCodeSVGRenderer()')}`,
  },
  {
    id: 'svg-download',
    title: 'SVG download',
    group: 'Renderers',
    description: 'Downloads an SVG file with `QRCodeDownloadSVGRenderer`.',
    features: ['matrix', 'svg', 'download'],
    baseline: 'svg',
    expect: [...SVG_EXPECT, 'browser:download'],
    main: `${MATRIX} ${SVG} import {QRCodeDownloadSVGRenderer} from '@qrcodesdk/browser/svg';
addEventListener('click', () => qrcode(${PAYLOAD}).render(QRCodeDownloadSVGRenderer({renderer: QRCodeSVGRenderer()})));`,
  },
  {
    id: 'canvas',
    title: 'Canvas renderer',
    group: 'Renderers',
    description: 'A canvas element with `QRCodeCanvasRenderer`.',
    features: ['matrix', 'canvas'],
    baseline: 'matrix',
    expect: CANVAS_EXPECT,
    main: `${MATRIX} ${CANVAS} ${svgOf('QRCodeCanvasRenderer()')}`,
  },
  ...(['png', 'webp', 'gif', 'jpeg'] as const).map((format): SizeScenario => ({
    id: `image-${format}`,
    title: `${format.toUpperCase()} image element`,
    group: 'Renderers',
    description: `An image element backed by a ${format.toUpperCase()} data URL.`,
    features: ['matrix', 'canvas', format],
    baseline: 'canvas',
    expect: [
      ...IMAGE_EXPECT,
      `browser:${format}`,
      ...(format === 'png' ? [] : [`core:${format}-encoder`, 'core:raster-shared']),
    ],
    main: `${MATRIX} import {QRCode${format === 'png' ? 'PNG' : format === 'webp' ? 'WebP' : format.toUpperCase()}ImageRenderer as Renderer} from '@qrcodesdk/browser/${format}'; ${svgOf('Renderer()')}`,
  })),
  {
    id: 'image-all',
    title: 'All image formats',
    group: 'Renderers',
    description: 'PNG, WebP, GIF, and JPEG image renderers in one bundle.',
    features: ['matrix', 'canvas', 'png', 'webp', 'gif', 'jpeg'],
    baseline: 'canvas',
    expect: ALL_IMAGE_EXPECT,
    main: `${MATRIX} import {QRCodePNGImageRenderer, QRCodeWebPImageRenderer, QRCodeGIFImageRenderer, QRCodeJPEGImageRenderer} from '@qrcodesdk/browser';
const renderers = {png: QRCodePNGImageRenderer, webp: QRCodeWebPImageRenderer, gif: QRCodeGIFImageRenderer, jpeg: QRCodeJPEGImageRenderer};
${svgOf(`renderers[${PAYLOAD}.slice(1)]()`)}`,
  },
  {
    id: 'browser-root',
    title: 'Everything from the browser root entry',
    group: 'Renderers',
    description: 'Uses every export of `@qrcodesdk/browser`. The upper bound for browser output.',
    features: ['matrix', 'canvas', 'png', 'webp', 'gif', 'jpeg', 'download'],
    baseline: 'image-all',
    expect: [...ALL_IMAGE_EXPECT, 'browser:download'],
    main: `${MATRIX} import * as browser from '@qrcodesdk/browser'; ${svgOf(`browser[${PAYLOAD}.slice(1)]()`)}`,
  },
  {
    id: 'style-rounded',
    title: 'Rounded modules',
    group: 'Styling',
    description: 'SVG with `rounded()` modules.',
    features: ['matrix', 'svg', 'styling'],
    baseline: 'svg',
    expect: [...SVG_EXPECT, 'core:style-patterns'],
    main: `${MATRIX} ${SVG} ${STYLE} ${svgOf('QRCodeSVGRenderer({style: {modules: rounded()}})')}`,
  },
  {
    id: 'style-circle',
    title: 'Circle modules',
    group: 'Styling',
    description: 'SVG with `circle()` modules.',
    features: ['matrix', 'svg', 'styling'],
    baseline: 'svg',
    expect: [...SVG_EXPECT, 'core:style-patterns'],
    main: `${MATRIX} ${SVG} ${STYLE} ${svgOf('QRCodeSVGRenderer({style: {modules: circle()}})')}`,
  },
  {
    id: 'style-diagonal',
    title: 'Diagonal modules',
    group: 'Styling',
    description: 'SVG with `diagonal()` modules.',
    features: ['matrix', 'svg', 'styling'],
    baseline: 'svg',
    expect: [...SVG_EXPECT, 'core:style-patterns'],
    main: `${MATRIX} ${SVG} ${STYLE} ${svgOf('QRCodeSVGRenderer({style: {modules: diagonal()}})')}`,
  },
  {
    id: 'style-finder-alignment',
    title: 'Finder and alignment patterns',
    group: 'Styling',
    description: 'SVG with styled `finder()` and `alignment()` patterns.',
    features: ['matrix', 'svg', 'styling'],
    baseline: 'svg',
    expect: [...SVG_EXPECT, 'core:style-patterns'],
    main: `${MATRIX} ${SVG} ${STYLE} ${svgOf('QRCodeSVGRenderer({style: {finder: finder({ring: rounded({radius: 1}), center: circle()}), alignment: alignment({center: circle()})}})')}`,
  },
  {
    id: 'style-all',
    title: 'All built-in shapes',
    group: 'Styling',
    description: 'Every built-in shape and pattern factory with colors.',
    features: ['matrix', 'svg', 'styling'],
    baseline: 'svg',
    expect: [...SVG_EXPECT, 'core:style-patterns'],
    main: `${MATRIX} ${SVG} ${STYLE}
const modules = {rounded, circle, diagonal}[${PAYLOAD}.slice(1)]();
${svgOf("QRCodeSVGRenderer({style: {foreground: '#111827', background: '#ffffff', modules, finder: finder({ring: rounded({radius: 1}), center: circle(), color: '#7c3aed'}), alignment: alignment({center: circle()})}})")}`,
  },
  {
    id: 'style-custom-shape',
    title: 'Custom shape',
    group: 'Styling',
    description: 'SVG with a `customShape()` hexagon. Adds the path parser.',
    features: ['matrix', 'svg', 'styling', 'custom-shape'],
    baseline: 'svg',
    expect: [...SVG_EXPECT, 'core:custom-shape'],
    main: `${MATRIX} ${SVG} import {customShape} from '@qrcodesdk/core/style'; ${svgOf("QRCodeSVGRenderer({style: {modules: customShape({module: 'm.5 0 .5 .25v.5l-.5 .25-.5-.25v-.5z'})}})")}`,
  },
  {
    id: 'style-center-image',
    title: 'SVG center image',
    group: 'Styling',
    description: 'SVG with `svgCenterImage()`.',
    features: ['matrix', 'svg', 'center-image'],
    baseline: 'svg',
    expect: SVG_EXPECT,
    main: `${MATRIX} import {QRCodeSVGRenderer, svgCenterImage} from '@qrcodesdk/core/svg'; ${svgOf("QRCodeSVGRenderer({centerImage: svgCenterImage('data:image/png;base64,AA==')})")}`,
  },
  {
    id: 'canvas-styled',
    title: 'Styled canvas',
    group: 'Styling',
    description: 'Canvas with rounded modules and styled finder patterns.',
    features: ['matrix', 'canvas', 'styling'],
    baseline: 'canvas',
    expect: [...CANVAS_EXPECT, 'core:style-patterns'],
    main: `${MATRIX} ${CANVAS} ${STYLE} ${svgOf('QRCodeCanvasRenderer({style: {modules: rounded(), finder: finder({ring: rounded({radius: 1}), center: circle()})}})')}`,
  },
  {
    id: 'canvas-center-image',
    title: 'Canvas center image',
    group: 'Styling',
    description: 'Canvas with `canvasCenterImage()`.',
    features: ['matrix', 'canvas', 'center-image'],
    baseline: 'canvas',
    expect: CANVAS_EXPECT,
    main: `${MATRIX} import {QRCodeCanvasRenderer, canvasCenterImage} from '@qrcodesdk/browser/canvas'; ${svgOf('QRCodeCanvasRenderer({centerImage: canvasCenterImage(new Image())})')}`,
  },
];

const splitting: SizeScenario[] = [
  {
    id: 'split-svg',
    title: 'Lazy SVG renderer',
    group: 'Code splitting',
    description: 'Generates the matrix up front and loads the SVG renderer on demand.',
    features: ['matrix', 'svg', 'code-splitting'],
    baseline: 'svg',
    expect: SVG_EXPECT,
    main: `${MATRIX} const matrix = qrcode(${PAYLOAD}).matrix();
addEventListener('click', async () => { const {QRCodeSVGRenderer} = await import('@qrcodesdk/core/svg'); ${show('QRCodeSVGRenderer()(matrix)')} });`,
  },
  {
    id: 'split-image-download',
    title: 'Lazy image downloads',
    group: 'Code splitting',
    description: 'Renders SVG up front and loads the PNG and JPEG renderers for a download menu.',
    features: ['matrix', 'svg', 'png', 'jpeg', 'download', 'code-splitting'],
    baseline: 'svg',
    expect: [
      ...SVG_EXPECT,
      ...IMAGE_EXPECT,
      'browser:png',
      'browser:jpeg',
      'core:jpeg-encoder',
      'core:raster-shared',
    ],
    main: `${MATRIX} ${SVG} ${svgOf('QRCodeSVGRenderer()')}
addEventListener('click', async (event) => {
  const {format} = event.target.dataset;
  const renderer = format === 'png'
    ? (await import('@qrcodesdk/browser/png')).QRCodePNGImageRenderer()
    : (await import('@qrcodesdk/browser/jpeg')).QRCodeJPEGImageRenderer();
  ${show(`qrcode(${PAYLOAD}).render(renderer)`)}
});`,
  },
  {
    id: 'split-symbols',
    title: 'Lazy Micro QR and rMQR',
    group: 'Code splitting',
    description:
      'Renders a standard QR code up front and loads the Micro QR and rMQR encoders on demand.',
    features: ['matrix', 'svg', 'micro', 'rmqr', 'code-splitting'],
    baseline: 'svg',
    expect: [...SVG_EXPECT, 'core:micro', 'core:rmqr'],
    main: `${MATRIX} ${SVG} const svg = QRCodeSVGRenderer(); ${svgOf('svg')}
addEventListener('click', async (event) => {
  const symbol = event.target.dataset.symbol === 'micro'
    ? (await import('@qrcodesdk/core/micro')).microQR()
    : (await import('@qrcodesdk/core/rmqr')).rMQR();
  ${show(`qrcode(${PAYLOAD}).options({symbol}).render(svg)`)}
});`,
  },
  {
    id: 'split-routes',
    title: 'Two routes',
    group: 'Code splitting',
    description:
      'A router with a styled SVG route and a PNG route. Shows what the routes share and duplicate.',
    features: ['matrix', 'svg', 'canvas', 'png', 'styling', 'code-splitting'],
    baseline: 'empty',
    expect: [...SVG_EXPECT, ...IMAGE_EXPECT, 'browser:png', 'core:style-patterns'],
    main: `const routes = {svg: () => import('./route-svg.js'), png: () => import('./route-png.js')};
routes[${PAYLOAD}.slice(1)]().then((route) => route.default());`,
    files: {
      'route-svg.js': `${MATRIX} ${SVG} ${STYLE} export default () => ${svgOf('QRCodeSVGRenderer({style: {modules: rounded(), finder: finder({center: circle()})}})')}`,
      'route-png.js': `${MATRIX} import {QRCodePNGImageRenderer} from '@qrcodesdk/browser/png'; export default () => ${svgOf('QRCodePNGImageRenderer()')}`,
    },
  },
];

type FrameworkApp = {
  readonly empty: string;
  readonly mount: (component: string, imports: string) => string;
  readonly bundlers?: readonly SizeBundler[];
};

const FRAMEWORKS: Record<Framework, FrameworkApp> = {
  react: {
    empty: `import {createElement} from 'react'; import {createRoot} from 'react-dom/client';
createRoot(document.body).render(createElement('p', null, ${PAYLOAD}));`,
    mount: (
      component,
      imports,
    ) => `import {createElement} from 'react'; import {createRoot} from 'react-dom/client';
import {${imports}} from '@qrcodesdk/react';
createRoot(document.body).render(${component});`,
  },
  vue: {
    empty: `import {createApp, h} from 'vue'; createApp({render: () => h('p', ${PAYLOAD})}).mount(document.body);`,
    mount: (
      component,
      imports,
    ) => `import {createApp, h} from 'vue'; import {${imports}} from '@qrcodesdk/vue';
createApp({render: () => ${component}}).mount(document.body);`,
  },
  svelte: {
    empty: `import {mount} from 'svelte'; import Empty from './empty.svelte'; mount(Empty, {target: document.body, props: {payload: ${PAYLOAD}}});`,
    mount: (
      component,
      imports,
    ) => `import {mount} from 'svelte'; import {${imports}} from '@qrcodesdk/svelte';
${component}`,
    bundlers: ['vite'],
  },
  angular: {
    empty: `import {createApplication} from '@angular/platform-browser';
await createApplication();
${show(PAYLOAD)}`,
    mount: (component, imports) => `import {createApplication} from '@angular/platform-browser';
import {createComponent} from '@angular/core';
import {${imports}} from '@qrcodesdk/angular';
const app = await createApplication();
${component}`,
    bundlers: ['vite'],
  },
};

type FrameworkComponent = {
  readonly id: string;
  readonly title: string;
  readonly components: readonly string[];
  readonly options?: string;
  readonly imports?: readonly string[];
  readonly features: readonly FeatureId[];
  readonly expect: readonly string[];
  readonly baseline?: string;
};

const FRAMEWORK_COMPONENTS: readonly FrameworkComponent[] = [
  {
    id: 'svg',
    title: 'SVG component',
    components: ['QRCodeSVG'],
    features: ['matrix', 'svg'],
    expect: FRAMEWORK_SVG_EXPECT,
  },
  {
    id: 'svg-styled',
    title: 'Styled SVG component',
    components: ['QRCodeSVG'],
    imports: ['rounded', 'finder', 'circle'],
    options: '{style: {modules: rounded(), finder: finder({center: circle()})}}',
    features: ['matrix', 'svg', 'styling'],
    expect: [...FRAMEWORK_SVG_EXPECT, 'core:style-patterns'],
    baseline: 'svg',
  },
  {
    id: 'canvas',
    title: 'Canvas component',
    components: ['QRCodeCanvas'],
    features: ['matrix', 'canvas'],
    expect: ['browser:canvas'],
  },
  {
    id: 'png',
    title: 'PNG component',
    components: ['QRCodePNG'],
    features: ['matrix', 'canvas', 'png'],
    expect: [...IMAGE_EXPECT, 'browser:png', 'browser:download'],
  },
  {
    id: 'all',
    title: 'All components',
    components: ['QRCodeSVG', 'QRCodeCanvas', 'QRCodePNG', 'QRCodeWebP', 'QRCodeGIF', 'QRCodeJPEG'],
    features: ['matrix', 'svg', 'canvas', 'png', 'webp', 'gif', 'jpeg'],
    expect: [...ALL_IMAGE_EXPECT, ...FRAMEWORK_SVG_EXPECT],
  },
];

function renderComponents(framework: Framework, item: FrameworkComponent): string {
  const options = item.options ? `, options: ${item.options}` : '';
  const props = `{payload: ${PAYLOAD}${options}}`;
  switch (framework) {
    case 'react':
      return item.components.length === 1
        ? `createElement(${item.components[0]}, ${props})`
        : `createElement('div', null, ${item.components.map((name) => `createElement(${name}, ${props})`).join(', ')})`;
    case 'vue':
      return `h('div', [${item.components.map((name) => `h(${name}, ${props})`).join(', ')}])`;
    case 'svelte':
      return item.components
        .map((name) => `mount(${name}, {target: document.body, props: ${props}});`)
        .join('\n');
    case 'angular':
      return item.components
        .map(
          (name) => `{
  const ref = createComponent(${name}, {environmentInjector: app.injector, hostElement: document.body.appendChild(document.createElement('div'))});
  ref.setInput('payload', ${PAYLOAD});${item.options ? `\n  ref.setInput('options', ${item.options});` : ''}
  app.attachView(ref.hostView);
}`,
        )
        .join('\n');
  }
}

const frameworks: SizeScenario[] = (Object.keys(FRAMEWORKS) as Framework[]).flatMap((framework) => {
  const app = FRAMEWORKS[framework];
  const name = framework === 'vue' ? 'Vue' : framework[0]!.toUpperCase() + framework.slice(1);
  const empty: SizeScenario = {
    id: `${framework}-empty`,
    title: `Empty ${name} app`,
    group: 'Frameworks',
    description: `A ${name} app without QRCodeSDK. The baseline of the ${name} scenarios.`,
    features: [framework],
    framework,
    main: app.empty,
    ...(framework === 'svelte'
      ? {files: {'empty.svelte': '<script>let {payload} = $props();</script><p>{payload}</p>'}}
      : {}),
    ...(app.bundlers ? {bundlers: app.bundlers} : {}),
  };
  return [
    empty,
    ...FRAMEWORK_COMPONENTS.map((item): SizeScenario => ({
      id: `${framework}-${item.id}`,
      title: `${name}: ${item.title}`,
      group: 'Frameworks',
      description: `Mounts ${item.components.map((component) => `\`${component}\``).join(', ')} from \`@qrcodesdk/${framework}\`.`,
      features: [framework, ...item.features],
      framework,
      baseline: item.baseline ? `${framework}-${item.baseline}` : empty.id,
      expect: item.expect,
      main: app.mount(
        renderComponents(framework, item),
        [...item.components, ...(item.imports ?? [])].join(', '),
      ),
      ...(app.bundlers ? {bundlers: app.bundlers} : {}),
    })),
  ];
});

export const SIZE_SCENARIOS: readonly SizeScenario[] = [...vanilla, ...splitting, ...frameworks];

export function validateScenarios(scenarios: readonly SizeScenario[]): void {
  const ids = new Set<string>();
  for (const scenario of scenarios) {
    if (ids.has(scenario.id)) throw new Error(`Duplicate size scenario: ${scenario.id}`);
    ids.add(scenario.id);
  }
  for (const scenario of scenarios) {
    if (scenario.baseline && !ids.has(scenario.baseline)) {
      throw new Error(`${scenario.id}: unknown baseline scenario ${scenario.baseline}`);
    }
  }
}
