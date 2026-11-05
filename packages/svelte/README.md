<!-- Generated from apps/docs/src/content/docs/packages/svelte.mdx. Run `pnpm turbo run generate-readmes --filter=docs` to update. -->

<div align="center"><img src="https://qrcodesdk.dev/favicon.svg" alt="QRCodeSDK logo" width="240"></div>

# @qrcodesdk/svelte

[![Open @qrcodesdk/svelte on npmx.dev](https://npmx.dev/api/registry/badge/name/@qrcodesdk/svelte?color=24272c&style=shieldsio)](https://npmx.dev/@qrcodesdk/svelte) ![@qrcodesdk/svelte version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/svelte?color=24272c&label=version&style=shieldsio) ![@qrcodesdk/svelte install size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/svelte?color=24272c&label=install%20size&style=shieldsio) ![@qrcodesdk/svelte download/mo](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/svelte?color=24272c&label=download%2Fmo&style=shieldsio) [![@qrcodesdk/svelte source code](https://npmx.dev/api/registry/badge/name/@qrcodesdk/svelte?color=24272c&label=source%20code&value=GitHub%20%E2%86%97&style=shieldsio)](https://github.com/Dafnik/qrcodesdk/tree/main/packages/svelte)

**[Documentation](https://qrcodesdk.dev) | [Live Demo](https://qrcodesdk.dev/playground/?package=svelte)**

Svelte components for rendering QR codes as inline SVG, PNG, WebP, GIF, and JPEG Image elements, and
Canvas elements.

## Install

```sh
npm install @qrcodesdk/svelte
```

```sh
pnpm add @qrcodesdk/svelte
```

<details>
<summary>Other package managers</summary>

**vp**

```sh
vp add @qrcodesdk/svelte
```

**deno**

```sh
deno add @qrcodesdk/svelte
```

**bun**

```sh
bun add @qrcodesdk/svelte
```

**yarn**

```sh
yarn add @qrcodesdk/svelte
```

</details>

## Quick start

Import the components directly in a Svelte component:

```svelte
<script lang="ts">
  import {QRCodeCanvas, QRCodePNG, QRCodeSVG} from '@qrcodesdk/svelte';
</script>

<QRCodeSVG payload="https://qrcodesdk.dev" />
<QRCodePNG payload="https://qrcodesdk.dev" />
<QRCodeCanvas payload="https://qrcodesdk.dev" />
```

## Version compatibility

| @qrcodesdk/svelte | Svelte   |
| ----------------- | -------- |
| `0.x.x`           | `^5.0.0` |

## Components

| Component      | Output               | Download support |
| -------------- | -------------------- | ---------------- |
| `QRCodeSVG`    | `Inline SVG element` | SVG              |
| `QRCodePNG`    | `PNG-backed <img>`   | PNG              |
| `QRCodeWebP`   | `WebP-backed <img>`  | WebP             |
| `QRCodeGIF`    | `GIF-backed <img>`   | GIF              |
| `QRCodeJPEG`   | `JPEG-backed <img>`  | JPEG             |
| `QRCodeCanvas` | `<canvas> element`   | None             |

### Options

| Prop      | Type                         | Description                                     |
| --------- | ---------------------------- | ----------------------------------------------- |
| `payload` | `string \| number`           | Required QR code payload.                       |
| `options` | `Component-specific options` | Optional matrix and renderer configuration.     |
| `class`   | `string`                     | CSS class applied to the component wrapper div. |

Each image format has its own component, so your bundle only includes the encoders of the components
you import. `QRCodePNG` uses the browser's native PNG encoder. `QRCodeWebP` renders lossless WebP,
usually the smallest file, with an encoder bundled in the SDK that also works in Safari. `QRCodeGIF`
is limited to 256 colors and binary transparency, so prefer PNG or WebP for transparent backgrounds
and photographic center images. `QRCodeJPEG` is lossy and has no transparency: it blends
transparent pixels onto a white matte by default, and `quality` (1 to 100, default 92) trades file
size for detail. Use it when a destination requires JPEG. See the
[Image element renderers](https://qrcodesdk.dev/reference/renderers/image/) reference for details.

The components forward `class`, `style`, and other native `<div>` attributes to their wrapper.
Use `bind:this` when you need a download handle; the rendered SVG, Image, or Canvas remains inside
that wrapper.

## Live examples

### SVG component

```svelte
<script lang="ts">
  import {QRCodeSVG, type QRCodeSVGOptions} from '@qrcodesdk/svelte';

  const options: QRCodeSVGOptions = {
    style: {moduleSize: 8, quietZone: 2},
    accessibility: {ariaLabel: 'Scan to open qrcodesdk.dev'},
  };
</script>

<QRCodeSVG class="mx-auto" payload="https://qrcodesdk.dev" {options} />
```

### PNG component

```svelte
<script lang="ts">
  import {QRCodePNG, type QRCodePNGImageOptions} from '@qrcodesdk/svelte';

  const options: QRCodePNGImageOptions = {
    style: {moduleSize: 8, quietZone: 2},
    accessibility: {alt: 'QR code for qrcodesdk.dev'},
  };
</script>

<QRCodePNG class="mx-auto" payload="https://qrcodesdk.dev" {options} />
```

### WebP component

```svelte
<script lang="ts">
  import {QRCodeWebP, type QRCodeWebPImageOptions} from '@qrcodesdk/svelte';

  const options: QRCodeWebPImageOptions = {
    style: {moduleSize: 8, quietZone: 2},
    accessibility: {alt: 'QR code for qrcodesdk.dev'},
  };
</script>

<QRCodeWebP class="mx-auto" payload="https://qrcodesdk.dev" {options} />
```

### GIF component

```svelte
<script lang="ts">
  import {QRCodeGIF, type QRCodeGIFImageOptions} from '@qrcodesdk/svelte';

  const options: QRCodeGIFImageOptions = {
    style: {moduleSize: 8, quietZone: 2},
    accessibility: {alt: 'QR code for qrcodesdk.dev'},
  };
</script>

<QRCodeGIF class="mx-auto" payload="https://qrcodesdk.dev" {options} />
```

### JPEG component

```svelte
<script lang="ts">
  import {QRCodeJPEG, type QRCodeJPEGImageOptions} from '@qrcodesdk/svelte';

  const options: QRCodeJPEGImageOptions = {
    style: {moduleSize: 8, quietZone: 2},
    quality: 90,
    accessibility: {alt: 'QR code for qrcodesdk.dev'},
  };
</script>

<QRCodeJPEG class="mx-auto" payload="https://qrcodesdk.dev" {options} />
```

### Canvas component

```svelte
<script lang="ts">
  import {QRCodeCanvas, type QRCodeCanvasOptions} from '@qrcodesdk/svelte';

  const options: QRCodeCanvasOptions = {style: {moduleSize: 8, quietZone: 2}};
</script>

<QRCodeCanvas class="mx-auto" payload="https://qrcodesdk.dev" {options} />
```

### PNG download

```svelte
<script lang="ts">
  import {
    type QRCodeDownloadHandle,
    QRCodePNG,
    type QRCodePNGImageOptions,
  } from '@qrcodesdk/svelte';

  let qrcode: QRCodeDownloadHandle | undefined;
  const options: QRCodePNGImageOptions = {accessibility: {alt: 'QR code for qrcodesdk.dev'}};
</script>

<div class="flex flex-col items-center gap-2">
  <QRCodePNG bind:this={qrcode} payload="https://qrcodesdk.dev" {options} />
  <button class="btn-primary" type="button" onclick={() => qrcode?.download('qrcodesdk')}>
    Download PNG
  </button>
</div>
```

## Center images

Load and decode a browser image first, store it in rune-mode state, and pass
`canvasCenterImage(image)` as `options.centerImage`. Render the PNG, WebP, GIF, JPEG, or Canvas component
only after the source is ready. `QRCodeSVG` takes `svgCenterImage()` with an embedded data URL instead. See
[Add a center image](https://qrcodesdk.dev/guides/center-images/#svelte) for a complete
Svelte example.

## Download files

`QRCodeSVG`, `QRCodePNG`, `QRCodeWebP`, `QRCodeGIF`, and `QRCodeJPEG` expose `download(filename?)`
for SVG, PNG, WebP, GIF, and JPEG files respectively. The method appends the matching file extension when needed.
`QRCodeCanvas` has no download method.

See [Download or save](https://qrcodesdk.dev/guides/download-or-save/#download-from-svelte) for the complete
Svelte example, or its [Canvas export section](https://qrcodesdk.dev/guides/download-or-save/#export-a-canvas-manually)
for manual downloads.

## Server-side rendering

`QRCodeSVG` produces runtime-neutral SVG and can render on the server.

`QRCodePNG`, `QRCodeWebP`, `QRCodeGIF`, `QRCodeJPEG`, and `QRCodeCanvas` rely on browser DOM and Canvas APIs, so they render an empty wrapper
on the server and populate it after mounting in the browser. Their download methods also skip work
outside the browser.

## Shared options

The `options` prop groups encoding settings under `matrix`. Renderer settings such as
`style`, `accessibility`, and `centerImage` go alongside it:

```ts
import {type QRCodeSVGOptions, circle, finder, rounded} from '@qrcodesdk/svelte';

const options: QRCodeSVGOptions = {
  matrix: {errorCorrectionLevel: 'H'},
  style: {moduleSize: 8, quietZone: 4, modules: rounded(), finder: finder({center: circle()})},
  accessibility: {ariaLabel: 'Scan to open qrcodesdk.dev'},
};
```

Pass this object through the component's `options` prop. Use `QRCodePNGImageOptions`,
`QRCodeWebPImageOptions`, `QRCodeGIFImageOptions`, `QRCodeJPEGImageOptions`, or `QRCodeCanvasOptions`
for the corresponding component. `QRCodeGIFImageOptions` also accepts `transparency.threshold`, and
`QRCodeJPEGImageOptions` accepts `quality` and `transparency.matte`.

Import shape and pattern factories, and center-image factories from `@qrcodesdk/svelte` alongside the components.

See [Builder and matrix](https://qrcodesdk.dev/reference/builder/) for the fields inside `matrix`,
[Customize appearance](https://qrcodesdk.dev/guides/customize/) for `style`, and
[Renderer outputs](https://qrcodesdk.dev/reference/renderers/) for output-specific options.

## Public API

```ts
import {
  type QRCodeAlignmentCenterShape,
  type QRCodeAlignmentOptions,
  type QRCodeAlignmentRingShape,
  type QRCodeAlignmentStyle,
  type QRCodeBaseProps,
  QRCodeCanvas,
  type QRCodeCanvasAccessibilityOptions,
  type QRCodeCanvasCenterImage,
  type QRCodeCanvasOptions,
  type QRCodeCanvasProps,
  type QRCodeCenterImageLayout,
  type QRCodeCircleShapeOptions,
  type QRCodeColor,
  type QRCodeDataImageURL,
  type QRCodeDownloadHandle,
  type QRCodeEncodingMode,
  type QRCodeErrorCorrectionLevel,
  type QRCodeFinderCenterShape,
  type QRCodeFinderOptions,
  type QRCodeFinderRingShape,
  type QRCodeFinderStyle,
  QRCodeGIF,
  type QRCodeGIFImageOptions,
  type QRCodeGIFProps,
  type QRCodeImageAccessibilityOptions,
  QRCodeJPEG,
  type QRCodeJPEGImageOptions,
  type QRCodeJPEGProps,
  type QRCodeMask,
  type QRCodeMatrixOptions,
  type QRCodeMode,
  type QRCodeModulePattern,
  type QRCodeModuleShape,
  QRCodePNG,
  type QRCodePNGImageOptions,
  type QRCodePNGProps,
  type QRCodePayload,
  type QRCodeRoundedShapeOptions,
  QRCodeSVG,
  type QRCodeSVGAccessibilityOptions,
  type QRCodeSVGCenterImage,
  type QRCodeSVGOptions,
  type QRCodeSVGProps,
  type QRCodeSegment,
  type QRCodeSegmenter,
  type QRCodeSegmenterOptions,
  type QRCodeShape,
  type QRCodeShapePath,
  type QRCodeShapePiece,
  type QRCodeVersion,
  type QRCodeVisualStyle,
  QRCodeWebP,
  type QRCodeWebPImageOptions,
  type QRCodeWebPProps,
  alignment,
  canvasCenterImage,
  circle,
  customShape,
  diagonal,
  finder,
  rounded,
  svgCenterImage,
} from '@qrcodesdk/svelte';
```

## Documentation

- [@qrcodesdk/svelte](https://qrcodesdk.dev/packages/svelte/)
- [Customize appearance](https://qrcodesdk.dev/guides/customize/)
- [Add a center image](https://qrcodesdk.dev/guides/center-images/)
- [Download or save a QR code as SVG, PNG, WebP, GIF, or JPEG](https://qrcodesdk.dev/guides/download-or-save/)
- [SVG string renderer](https://qrcodesdk.dev/reference/renderers/svg/)
- [Image element renderers](https://qrcodesdk.dev/reference/renderers/image/)
- [Canvas element renderer](https://qrcodesdk.dev/reference/renderers/canvas/)
