<!-- Generated from apps/docs/src/content/docs/packages/vue.mdx. Run `pnpm turbo run generate-readmes --filter=docs` to update. -->

<div align="center"><img src="https://qrcodesdk.dev/favicon.svg" alt="QRCodeSDK logo" width="240"></div>

# @qrcodesdk/vue

[![Open @qrcodesdk/vue on npmx.dev](https://npmx.dev/api/registry/badge/name/@qrcodesdk/vue?color=24272c&style=shieldsio)](https://npmx.dev/@qrcodesdk/vue) ![@qrcodesdk/vue version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/vue?color=24272c&label=version&style=shieldsio) ![@qrcodesdk/vue install size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/vue?color=24272c&label=install%20size&style=shieldsio) ![@qrcodesdk/vue download/mo](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/vue?color=24272c&label=download%2Fmo&style=shieldsio) [![@qrcodesdk/vue source code](https://npmx.dev/api/registry/badge/name/@qrcodesdk/vue?color=24272c&label=source%20code&value=GitHub%20%E2%86%97&style=shieldsio)](https://github.com/Dafnik/qrcodesdk/tree/main/packages/vue)

**[Documentation](https://qrcodesdk.dev) | [Live Demo](https://qrcodesdk.dev/playground/?package=vue)**

Vue components that render QR codes as inline SVG, as PNG, WebP, GIF, or JPEG Image elements, or as
Canvas elements.

## Install

```sh
npm install @qrcodesdk/vue
```

```sh
pnpm add @qrcodesdk/vue
```

<details>
<summary>Other package managers</summary>

**vp**

```sh
vp add @qrcodesdk/vue
```

**deno**

```sh
deno add npm:@qrcodesdk/vue
```

**bun**

```sh
bun add @qrcodesdk/vue
```

**yarn**

```sh
yarn add @qrcodesdk/vue
```

</details>

## Quick start

Import a component in a Vue single-file component:

```vue
<script setup lang="ts">
import {QRCodeSVG, type QRCodeSVGOptions} from '@qrcodesdk/vue';

const options: QRCodeSVGOptions = {
  accessibility: {ariaLabel: 'Scan to open qrcodesdk.dev'},
};
</script>

<template>
  <figure>
    <QRCodeSVG payload="https://qrcodesdk.dev" :options="options" />
    <figcaption>
      Scan the code or open
      <a href="https://qrcodesdk.dev">qrcodesdk.dev</a>
    </figcaption>
  </figure>
</template>
```

- `ariaLabel` names the QR code for screen readers. The link gives everyone another way to reach the
  destination.
- Without `accessibility` options, the QR code is decorative and hidden from assistive technology.
  Leave it unlabeled only when nearby content, such as this link, already explains it.
- `QRCodePNG`, `QRCodeWebP`, `QRCodeGIF`, `QRCodeJPEG`, and `QRCodeCanvas` take the same `payload`
  and `options` props. Image components also accept `accessibility.alt`.

## Version compatibility

| @qrcodesdk/vue | Vue      |
| -------------- | -------- |
| `0.x.x`        | `^3.3.0` |

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

| Prop                                             | Type                       | Description                                                                                                               |
| ------------------------------------------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `payload`                                        | `string \| number`         | Required QR code payload.                                                                                                 |
| `options`                                        | Component-specific options | Optional `matrix` options and renderer options, such as `QRCodeSVGOptions` for `QRCodeSVG`.                               |
| `class`, `style`, other attributes and listeners | Fallthrough attributes     | Applied to the wrapper `<div>` that contains the output element. `innerHTML`, `innerText`, and `textContent` are dropped. |
| Template `ref`                                   | `QRCodeDownloadHandle`     | Exposes `download(filename?)` on every component except `QRCodeCanvas`, which exposes nothing.                            |

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

```vue
<script setup lang="ts">
import {QRCodeSVG, type QRCodeSVGOptions} from '@qrcodesdk/vue';

const options: QRCodeSVGOptions = {
  accessibility: {
    title: 'QR code for qrcodesdk.dev',
    ariaLabel: 'Scan to open qrcodesdk.dev',
  },
};
</script>

<template>
  <QRCodeSVG payload="https://qrcodesdk.dev" :options="options" />
</template>
```

### PNG component

```vue
<script setup lang="ts">
import {QRCodePNG, type QRCodePNGImageOptions} from '@qrcodesdk/vue';

const options: QRCodePNGImageOptions = {
  style: {moduleSize: 8, quietZone: 4},
  accessibility: {
    alt: 'QR code: scan to open qrcodesdk.dev',
  },
};
</script>

<template>
  <QRCodePNG payload="https://qrcodesdk.dev" :options="options" />
</template>
```

### WebP component

```vue
<script setup lang="ts">
import {QRCodeWebP, type QRCodeWebPImageOptions} from '@qrcodesdk/vue';

const options: QRCodeWebPImageOptions = {
  style: {moduleSize: 8, quietZone: 4},
  accessibility: {
    alt: 'QR code: scan to open qrcodesdk.dev',
  },
};
</script>

<template>
  <QRCodeWebP payload="https://qrcodesdk.dev" :options="options" />
</template>
```

### GIF component

```vue
<script setup lang="ts">
import {QRCodeGIF, type QRCodeGIFImageOptions} from '@qrcodesdk/vue';

const options: QRCodeGIFImageOptions = {
  style: {moduleSize: 8, quietZone: 4},
  accessibility: {
    alt: 'QR code: scan to open qrcodesdk.dev',
  },
};
</script>

<template>
  <QRCodeGIF payload="https://qrcodesdk.dev" :options="options" />
</template>
```

### JPEG component

```vue
<script setup lang="ts">
import {QRCodeJPEG, type QRCodeJPEGImageOptions} from '@qrcodesdk/vue';

const options: QRCodeJPEGImageOptions = {
  style: {moduleSize: 8, quietZone: 4},
  quality: 90,
  accessibility: {
    alt: 'QR code: scan to open qrcodesdk.dev',
  },
};
</script>

<template>
  <QRCodeJPEG payload="https://qrcodesdk.dev" :options="options" />
</template>
```

### Canvas component

```vue
<script setup lang="ts">
import {QRCodeCanvas, type QRCodeCanvasOptions} from '@qrcodesdk/vue';

const options: QRCodeCanvasOptions = {
  style: {
    moduleSize: 8,
    quietZone: 4,
    foreground: '#111827',
    background: '#ffffff',
  },
  accessibility: {ariaLabel: 'Scan to open qrcodesdk.dev'},
};
</script>

<template>
  <QRCodeCanvas payload="https://qrcodesdk.dev" :options="options" />
</template>
```

### PNG download

```vue
<script setup lang="ts">
import {ref} from 'vue';

import {type QRCodeDownloadHandle, QRCodePNG, type QRCodePNGImageOptions} from '@qrcodesdk/vue';

const qrcode = ref<QRCodeDownloadHandle | null>(null);
const options: QRCodePNGImageOptions = {
  accessibility: {alt: 'QR code: scan to open qrcodesdk.dev'},
};
</script>

<template>
  <QRCodePNG ref="qrcode" payload="https://qrcodesdk.dev" :options="options" />
  <button type="button" @click="qrcode?.download('qrcodesdk')">Download PNG</button>
</template>
```

## Center images

For PNG, WebP, GIF, JPEG, and Canvas components:

1. Load and decode a browser image.
2. Store it in a `shallowRef`.
3. Pass `canvasCenterImage(image)` as `options.centerImage`.
4. Render the component only after the image is ready.

`QRCodeSVG` takes `svgCenterImage()` with an embedded data URL instead. See
[Add a center image](https://qrcodesdk.dev/guides/center-images/#vue) for the complete Vue example.

## Download files

Every component except `QRCodeCanvas` exposes `download(filename?)`. Get it through a template
`ref`. The method appends the file extension when needed.

See [Download or save](https://qrcodesdk.dev/guides/download-or-save/#download-from-vue) for a complete Vue example. For
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
import {type QRCodeSVGOptions, circle, finder, rounded} from '@qrcodesdk/vue';

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

Mixed-mode segmentation is opt-in. Import `automaticSegmenter` from `@qrcodesdk/vue` and pass it as
`matrix.segmenter`:

```ts
import {type QRCodeSVGOptions, automaticSegmenter} from '@qrcodesdk/vue';

const options: QRCodeSVGOptions = {matrix: {mode: 'auto', segmenter: automaticSegmenter}};
```

### Keep options stable

Vue tracks `options` reactively.

- Replacing the object renders the QR code again.
- Changing a property of a reactive object also renders it again.
- Changing a property of a plain, non-reactive object has no effect.
- An object literal in the template, such as `:options="{style: {moduleSize: 8}}"`, is a new object
  on every parent render. The QR code renders again each time.

Define options in `<script setup>`, or derive them with `computed()`.

## Errors

Components throw `QRCodeError` for invalid payloads and options.

| Component                   | Where it throws                          |
| --------------------------- | ---------------------------------------- |
| `QRCodeSVG`                 | During rendering, from `computed` values |
| Image and Canvas components | In a watcher after mounting              |

To handle them:

- Catch both cases with `onErrorCaptured()` in a parent component or with `app.config.errorHandler`.
- For server-side rendering, validate user-controlled payloads before rendering.
- Wrap downloads called from an event handler in your own `try`/`catch`.

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
} from '@qrcodesdk/vue';
```

## Documentation

- [@qrcodesdk/vue](https://qrcodesdk.dev/packages/vue/)
- [Customize appearance](https://qrcodesdk.dev/guides/customize/)
- [Errors](https://qrcodesdk.dev/reference/errors/)
- [Add a center image](https://qrcodesdk.dev/guides/center-images/)
- [Download or save a QR code as SVG, PNG, WebP, GIF, or JPEG](https://qrcodesdk.dev/guides/download-or-save/)
- [SVG string renderer](https://qrcodesdk.dev/reference/renderers/svg/)
- [Image element renderers](https://qrcodesdk.dev/reference/renderers/image/)
- [Canvas element renderer](https://qrcodesdk.dev/reference/renderers/canvas/)
