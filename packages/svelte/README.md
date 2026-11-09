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

Import the components directly in a Svelte component:

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

The label names the QR code for screen readers, and the link gives everyone another way to reach the
destination. Without `accessibility` options, the output is decorative and hidden from assistive
technology. Leave a QR code unlabeled only when nearby content, such as this link, already gives its
meaning.

`QRCodePNG`, `QRCodeWebP`, `QRCodeGIF`, `QRCodeJPEG`, and `QRCodeCanvas` take the same `payload` and
`options` props. Image components also accept `accessibility.alt`.

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

### Component props

| Prop                                       | Type                             | Description                                                                                    |
| ------------------------------------------ | -------------------------------- | ---------------------------------------------------------------------------------------------- |
| `payload`                                  | `string \| number`               | Required QR code payload.                                                                      |
| `options`                                  | Component-specific options       | Optional `matrix` options and renderer options, such as `QRCodeSVGOptions` for `QRCodeSVG`.    |
| `class`, `style`, other `<div>` attributes | `HTMLAttributes<HTMLDivElement>` | Spread onto the wrapper `<div>` that contains the output element. `children` is not accepted.  |
| `bind:this`                                | `QRCodeDownloadHandle`           | Exposes `download(filename?)` on every component except `QRCodeCanvas`, which exports nothing. |

Each image format has its own component, so your bundle only includes the encoders of the components
you import. `QRCodePNG` uses the browser's native PNG encoder. `QRCodeWebP` uses a lossless encoder
bundled in the SDK, which also works in Safari, and usually produces the smallest file.

`QRCodeGIF` is limited to 256 colors and binary transparency. Prefer PNG or WebP for transparent
backgrounds and photographic center images.

`QRCodeJPEG` is lossy and has no transparency. It blends transparent pixels onto a white matte by
default. Its `quality` option ranges from 1 to 100, defaults to 92, and trades file size for detail.
Use it when a destination requires JPEG. See the
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

Load and decode a browser image first, store it in rune-mode state, and pass
`canvasCenterImage(image)` as `options.centerImage`. Render the PNG, WebP, GIF, JPEG, or Canvas component
only after the source is ready. `QRCodeSVG` takes `svgCenterImage()` with an embedded data URL instead. See
[Add a center image](https://qrcodesdk.dev/guides/center-images/#svelte) for a complete
Svelte example.

## Download files

All components except `QRCodeCanvas` expose `download(filename?)`. The method appends the
component's file extension when needed.

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

Mixed-mode segmentation is opt-in. Import `automaticSegmenter` from `@qrcodesdk/svelte` and pass it
as `matrix.segmenter`:

```ts
import {type QRCodeSVGOptions, automaticSegmenter} from '@qrcodesdk/svelte';

const options: QRCodeSVGOptions = {matrix: {mode: 'auto', segmenter: automaticSegmenter}};
```

To build payloads with [payload helpers](https://qrcodesdk.dev/reference/payloads/) or check `instanceof QRCodeError`,
import them from `@qrcodesdk/core` after you
[add Core to the project](https://qrcodesdk.dev/getting-started/choose-your-setup/#add-core-to-a-framework-project).

See [Builder and matrix](https://qrcodesdk.dev/reference/builder/) for the fields inside `matrix`,
[Customize appearance](https://qrcodesdk.dev/guides/customize/) for `style`, and
[Renderer outputs](https://qrcodesdk.dev/reference/renderers/) for output-specific options.

### Keep options stable

Components derive their renderer from `options`. They render the QR code again when `options` is
reassigned, or when state read by the options changes, such as a property of a `$state` object or a
value used in an inline `options={{...}}` expression. Unrelated parent updates do not render it
again. Changing a property of a plain object that is not `$state` has no effect.

## Errors

Components throw `QRCodeError` for invalid payloads and options. `QRCodeSVG` throws during
rendering. The Image and Canvas components throw in an `$effect`.

With Svelte 5.3 or newer, catch them in the browser with a `<svelte:boundary>` around the component.
Svelte 5.0 to 5.2 have no `<svelte:boundary>`. Boundaries also have no effect during server-side
rendering by default, so a throwing `QRCodeSVG` fails the whole server render. In both cases,
validate user-controlled payloads before rendering. Downloads called from an event handler need
their own `try`/`catch`. See
[Check errors from framework packages](https://qrcodesdk.dev/reference/errors/#check-errors-from-framework-packages).

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
