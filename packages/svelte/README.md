<!-- Generated from apps/docs/src/content/docs/packages/svelte.mdx. Run `pnpm turbo run generate-readmes --filter=docs` to update. -->

<div align="center"><img src="https://qrcodesdk.dev/favicon.svg" alt="QRCodeSDK logo" width="240"></div>

# @qrcodesdk/svelte

[![Open @qrcodesdk/svelte on npmx.dev](https://npmx.dev/api/registry/badge/name/@qrcodesdk/svelte?color=24272c&style=shieldsio)](https://npmx.dev/@qrcodesdk/svelte) ![@qrcodesdk/svelte version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/svelte?color=24272c&label=version&style=shieldsio) ![@qrcodesdk/svelte install size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/svelte?color=24272c&label=install%20size&style=shieldsio) ![@qrcodesdk/svelte download/mo](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/svelte?color=24272c&label=download%2Fmo&style=shieldsio) [![@qrcodesdk/svelte source code](https://npmx.dev/api/registry/badge/name/@qrcodesdk/svelte?color=24272c&label=source%20code&value=GitHub%20%E2%86%97&style=shieldsio)](https://github.com/Dafnik/qrcodesdk/tree/main/packages/svelte)

**[Documentation](https://qrcodesdk.dev) | [Live Demo](https://qrcodesdk.dev/playground/?package=svelte)**

Svelte components that render QR codes as inline SVG, as PNG, WebP, GIF, or JPEG Image elements, or
as Canvas elements.

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
deno add npm:@qrcodesdk/svelte
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

Import a component in a Svelte component:

```svelte
<script lang="ts">
  import {QRCodeSVG, type QRCodeSVGOptions} from '@qrcodesdk/svelte';

  const options: QRCodeSVGOptions = {
    accessibility: {ariaLabel: 'Scan to open qrcodesdk.dev'},
  };
</script>

<figure>
  <QRCodeSVG payload="https://qrcodesdk.dev" {options} />
  <figcaption>
    Scan the code or open <a href="https://qrcodesdk.dev">qrcodesdk.dev</a>
  </figcaption>
</figure>
```

- `ariaLabel` names the QR code for screen readers. The link gives everyone another way to reach the
  destination.
- Without `accessibility` options, the QR code is decorative and hidden from assistive technology.
  Leave it unlabeled only when nearby content, such as this link, already explains it.
- `QRCodePNG`, `QRCodeWebP`, `QRCodeGIF`, `QRCodeJPEG`, and `QRCodeCanvas` take the same `payload`
  and `options` props. Image components also accept `accessibility.alt`.

## Version compatibility

| @qrcodesdk/svelte | Svelte   |
| ----------------- | -------- |
| `0.x.x`           | `^5.0.0` |

## Components

Each output format has its own component. Your bundle only includes the encoders of the components
you import.

| Component      | Output               | Download support |
| -------------- | -------------------- | ---------------- |
| `QRCodeSVG`    | `Inline SVG element` | SVG              |
| `QRCodePNG`    | `PNG-backed <img>`   | PNG              |
| `QRCodeWebP`   | `WebP-backed <img>`  | WebP             |
| `QRCodeGIF`    | `GIF-backed <img>`   | GIF              |
| `QRCodeJPEG`   | `JPEG-backed <img>`  | JPEG             |
| `QRCodeCanvas` | `<canvas> element`   | None             |

### Component props

| Prop                                       | Type                             | Description                                                                                    |
| ------------------------------------------ | -------------------------------- | ---------------------------------------------------------------------------------------------- |
| `payload`                                  | `string \| number`               | Required QR code payload.                                                                      |
| `options`                                  | Component-specific options       | Optional `matrix` options and renderer options, such as `QRCodeSVGOptions` for `QRCodeSVG`.    |
| `class`, `style`, other `<div>` attributes | `HTMLAttributes<HTMLDivElement>` | Spread onto the wrapper `<div>` that contains the output element. `children` is not accepted.  |
| `bind:this`                                | `QRCodeDownloadHandle`           | Exposes `download(filename?)` on every component except `QRCodeCanvas`, which exports nothing. |

## Choose an image format

- `QRCodePNG` uses the browser's native PNG encoder.
- `QRCodeWebP` uses a lossless encoder bundled in the SDK. It also works in Safari and usually
  produces the smallest file.
- `QRCodeGIF` is limited to 256 colors and on-or-off transparency. Prefer PNG or WebP for
  transparent backgrounds and photographic center images.
- `QRCodeJPEG` is lossy and has no transparency. It blends transparent pixels onto a white matte by
  default. Its `quality` option ranges from 1 to 100 and defaults to 92. Use it only when a
  destination requires JPEG.

See [Image element renderers](https://qrcodesdk.dev/reference/renderers/image/) for details.

## Live examples

### SVG component

```svelte
<script lang="ts">
  import {QRCodeSVG, type QRCodeSVGOptions} from '@qrcodesdk/svelte';

  const options: QRCodeSVGOptions = {
    style: {moduleSize: 8, quietZone: 4},
    accessibility: {ariaLabel: 'Scan to open qrcodesdk.dev'},
  };
</script>

<QRCodeSVG payload="https://qrcodesdk.dev" {options} />
```

### PNG component

```svelte
<script lang="ts">
  import {QRCodePNG, type QRCodePNGImageOptions} from '@qrcodesdk/svelte';

  const options: QRCodePNGImageOptions = {
    style: {moduleSize: 8, quietZone: 4},
    accessibility: {alt: 'QR code: scan to open qrcodesdk.dev'},
  };
</script>

<QRCodePNG payload="https://qrcodesdk.dev" {options} />
```

### WebP component

```svelte
<script lang="ts">
  import {QRCodeWebP, type QRCodeWebPImageOptions} from '@qrcodesdk/svelte';

  const options: QRCodeWebPImageOptions = {
    style: {moduleSize: 8, quietZone: 4},
    accessibility: {alt: 'QR code: scan to open qrcodesdk.dev'},
  };
</script>

<QRCodeWebP payload="https://qrcodesdk.dev" {options} />
```

### GIF component

```svelte
<script lang="ts">
  import {QRCodeGIF, type QRCodeGIFImageOptions} from '@qrcodesdk/svelte';

  const options: QRCodeGIFImageOptions = {
    style: {moduleSize: 8, quietZone: 4},
    accessibility: {alt: 'QR code: scan to open qrcodesdk.dev'},
  };
</script>

<QRCodeGIF payload="https://qrcodesdk.dev" {options} />
```

### JPEG component

```svelte
<script lang="ts">
  import {QRCodeJPEG, type QRCodeJPEGImageOptions} from '@qrcodesdk/svelte';

  const options: QRCodeJPEGImageOptions = {
    style: {moduleSize: 8, quietZone: 4},
    quality: 90,
    accessibility: {alt: 'QR code: scan to open qrcodesdk.dev'},
  };
</script>

<QRCodeJPEG payload="https://qrcodesdk.dev" {options} />
```

### Canvas component

```svelte
<script lang="ts">
  import {QRCodeCanvas, type QRCodeCanvasOptions} from '@qrcodesdk/svelte';

  const options: QRCodeCanvasOptions = {
    style: {moduleSize: 8, quietZone: 4},
    accessibility: {ariaLabel: 'Scan to open qrcodesdk.dev'},
  };
</script>

<QRCodeCanvas payload="https://qrcodesdk.dev" {options} />
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
  const options: QRCodePNGImageOptions = {
    accessibility: {alt: 'QR code: scan to open qrcodesdk.dev'},
  };
</script>

<QRCodePNG bind:this={qrcode} payload="https://qrcodesdk.dev" {options} />
<button type="button" onclick={() => qrcode?.download('qrcodesdk')}>Download PNG</button>
```

## Center images

For PNG, WebP, GIF, JPEG, and Canvas components:

1. Load and decode a browser image.
2. Store it in `$state`.
3. Pass `canvasCenterImage(image)` as `options.centerImage`.
4. Render the component only after the image is ready.

`QRCodeSVG` takes `svgCenterImage()` with an embedded data URL instead. See
[Add a center image](https://qrcodesdk.dev/guides/center-images/#svelte) for the complete Svelte example.

## Download files

Every component except `QRCodeCanvas` exposes `download(filename?)`. Get it through `bind:this`. The method appends the file extension when needed.

See [Download or save](https://qrcodesdk.dev/guides/download-or-save/#download-from-svelte) for a complete Svelte example. For
manual downloads, see [Export a canvas manually](https://qrcodesdk.dev/guides/download-or-save/#export-a-canvas-manually).

## Server-side rendering

- `QRCodeSVG` produces runtime-neutral SVG and renders on the server.
- `QRCodePNG`, `QRCodeWebP`, `QRCodeGIF`, `QRCodeJPEG`, and `QRCodeCanvas` need browser DOM and
  Canvas APIs. On the server, they render an empty wrapper and skip downloads. They fill the wrapper
  after mounting in the browser.

## Shared options

The `options` prop groups encoding settings under `matrix`. Renderer settings, such as `style`,
`accessibility`, and `centerImage`, sit next to it:

```ts
import {type QRCodeSVGOptions, circle, finder, rounded} from '@qrcodesdk/svelte';

const options: QRCodeSVGOptions = {
  matrix: {errorCorrectionLevel: 'H'},
  style: {moduleSize: 8, quietZone: 4, modules: rounded(), finder: finder({center: circle()})},
  accessibility: {ariaLabel: 'Scan to open qrcodesdk.dev'},
};
```

Each component has its own options type:

| Component      | Options type             | Extra options                   |
| -------------- | ------------------------ | ------------------------------- |
| `QRCodeSVG`    | `QRCodeSVGOptions`       | None                            |
| `QRCodePNG`    | `QRCodePNGImageOptions`  | None                            |
| `QRCodeWebP`   | `QRCodeWebPImageOptions` | None                            |
| `QRCodeGIF`    | `QRCodeGIFImageOptions`  | `transparency.threshold`        |
| `QRCodeJPEG`   | `QRCodeJPEGImageOptions` | `quality`, `transparency.matte` |
| `QRCodeCanvas` | `QRCodeCanvasOptions`    | None                            |

Learn more about each group:

- [Builder and matrix](https://qrcodesdk.dev/reference/builder/) covers the fields inside `matrix`.
- [Customize appearance](https://qrcodesdk.dev/guides/customize/) covers `style`.
- [Renderer outputs](https://qrcodesdk.dev/reference/renderers/) covers output-specific options.

[Payload helpers](https://qrcodesdk.dev/reference/payloads/) and `QRCodeError` come from `@qrcodesdk/core`. To use them,
[add Core to the project](https://qrcodesdk.dev/getting-started/choose-your-setup/#add-core-to-a-framework-project).

### Mixed-mode segmentation

Mixed-mode segmentation is opt-in. Import `automaticSegmenter` from `@qrcodesdk/svelte` and pass it as
`matrix.segmenter`:

```ts
import {type QRCodeSVGOptions, automaticSegmenter} from '@qrcodesdk/svelte';

const options: QRCodeSVGOptions = {matrix: {mode: 'auto', segmenter: automaticSegmenter}};
```

### Keep options stable

Components derive their renderer from `options`. They render the QR code again when:

- `options` is reassigned;
- state read by the options changes, such as a property of a `$state` object or a value used in an
  inline `options={{...}}` expression.

Unrelated parent updates do not render it again. Changing a property of a plain object that is not
`$state` has no effect.

## Errors

Components throw `QRCodeError` for invalid payloads and options.

| Component                   | Where it throws  |
| --------------------------- | ---------------- |
| `QRCodeSVG`                 | During rendering |
| Image and Canvas components | In an `$effect`  |

To handle them:

- With Svelte 5.3 or newer, wrap the component in a `<svelte:boundary>` to catch errors in the
  browser. Give it a `failed` snippet or an `onerror` handler. Without one, Svelte rethrows the
  error. Svelte 5.0 to 5.2 have no `<svelte:boundary>`.
- Boundaries have no effect during server-side rendering by default. A throwing `QRCodeSVG` fails
  the whole server render.
- Without a boundary, and for server-side rendering, validate user-controlled payloads before
  rendering.
- Wrap downloads called from an event handler in your own `try`/`catch`.

```svelte
<svelte:boundary onerror={(error) => console.error(error)}>
  <QRCodeSVG payload="https://qrcodesdk.dev" />

  {#snippet failed()}
    <p>This QR code could not be rendered.</p>
  {/snippet}
</svelte:boundary>
```

See [Check errors from framework packages](https://qrcodesdk.dev/reference/errors/#check-errors-from-framework-packages).

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
  automaticSegmenter,
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
- [Errors](https://qrcodesdk.dev/reference/errors/)
- [Add a center image](https://qrcodesdk.dev/guides/center-images/)
- [Download or save a QR code as SVG, PNG, WebP, GIF, or JPEG](https://qrcodesdk.dev/guides/download-or-save/)
- [SVG string renderer](https://qrcodesdk.dev/reference/renderers/svg/)
- [Image element renderers](https://qrcodesdk.dev/reference/renderers/image/)
- [Canvas element renderer](https://qrcodesdk.dev/reference/renderers/canvas/)
