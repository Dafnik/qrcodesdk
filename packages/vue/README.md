<!-- Generated from apps/docs/src/content/docs/packages/vue.mdx. Run `pnpm turbo run generate-readmes --filter=docs` to update. -->

<div align="center"><img src="https://qrcodesdk.dev/favicon.svg" alt="QRCodeSDK logo" width="240"></div>

# @qrcodesdk/vue

[![Open @qrcodesdk/vue on npmx.dev](https://npmx.dev/api/registry/badge/name/@qrcodesdk/vue?color=24272c&style=shieldsio)](https://npmx.dev/@qrcodesdk/vue) ![@qrcodesdk/vue version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/vue?color=24272c&label=version&style=shieldsio) ![@qrcodesdk/vue install size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/vue?color=24272c&label=install%20size&style=shieldsio) ![@qrcodesdk/vue download/mo](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/vue?color=24272c&label=download%2Fmo&style=shieldsio) [![@qrcodesdk/vue source code](https://npmx.dev/api/registry/badge/name/@qrcodesdk/vue?color=24272c&label=source%20code&value=GitHub%20%E2%86%97&style=shieldsio)](https://github.com/Dafnik/qrcodesdk/tree/main/packages/vue)

**[Documentation](https://qrcodesdk.dev) | [Live Demo](https://qrcodesdk.dev/playground/?package=vue)**

Vue components for rendering QR codes as inline SVG, PNG, WebP, GIF, and JPEG Image elements, and Canvas elements.

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
deno add @qrcodesdk/vue
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

Import the components directly in a Vue single-file component:

```vue
<script setup lang="ts">
import {QRCodeCanvas, QRCodePNG, QRCodeSVG} from '@qrcodesdk/vue';
</script>

<template>
  <QRCodeSVG payload="https://qrcodesdk.dev" />
  <QRCodePNG payload="https://qrcodesdk.dev" />
  <QRCodeCanvas payload="https://qrcodesdk.dev" />
</template>
```

## Version compatibility

| @qrcodesdk/vue | Vue      |
| -------------- | -------- |
| `0.x.x`        | `^3.3.0` |

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

| Prop      | Type                         | Description                                             |
| --------- | ---------------------------- | ------------------------------------------------------- |
| `payload` | `string \| number`           | Required QR code payload.                               |
| `options` | `Component-specific options` | Optional matrix and renderer configuration.             |
| `class`   | `string \| object \| array`  | Vue class binding applied to the component wrapper div. |

Each image format has its own component, so your bundle only includes the encoders of the components
you import. `QRCodePNG` uses the browser's native PNG encoder. `QRCodeWebP` renders lossless WebP,
usually the smallest file, with an encoder bundled in the SDK that also works in Safari. `QRCodeGIF`
is limited to 256 colors and binary transparency, so prefer PNG or WebP for transparent backgrounds
and photographic center images. `QRCodeJPEG` is lossy and has no transparency: it blends
transparent pixels onto a white matte by default, and `quality` (1 to 100, default 92) trades file
size for detail. Use it when a destination requires JPEG. See the
[Image element renderers](https://qrcodesdk.dev/reference/renderers/image/) reference for details.

Vue applies `class`, `style`, and other fallthrough attributes to the component's wrapper `<div>`.
Use a template ref when you need a download handle; the rendered SVG, Image, or Canvas remains
inside that wrapper.

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
    alt: 'QR code for qrcodesdk.dev',
    ariaLabel: 'Scan to open qrcodesdk.dev',
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
    alt: 'QR code for qrcodesdk.dev',
    ariaLabel: 'Scan to open qrcodesdk.dev',
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
    alt: 'QR code for qrcodesdk.dev',
    ariaLabel: 'Scan to open qrcodesdk.dev',
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
    alt: 'QR code for qrcodesdk.dev',
    ariaLabel: 'Scan to open qrcodesdk.dev',
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
const options: QRCodePNGImageOptions = {accessibility: {alt: 'QR code for qrcodesdk.dev'}};
</script>

<template>
  <div class="flex flex-col items-center gap-2">
    <QRCodePNG ref="qrcode" payload="https://qrcodesdk.dev" :options="options" />
    <button class="btn-primary" type="button" @click="qrcode?.download('qrcodesdk')">
      Download PNG
    </button>
  </div>
</template>
```

## Center images

Load and decode a browser image first, store it in a `shallowRef`, and pass
`canvasCenterImage(image)` as `options.centerImage`. Render the PNG, WebP, GIF, JPEG, or Canvas component
only after the source is ready. `QRCodeSVG` takes `svgCenterImage()` with an embedded data URL instead. See
[Add a center image](https://qrcodesdk.dev/guides/center-images/#vue) for a complete
Vue example.

## Download files

`QRCodeSVG`, `QRCodePNG`, `QRCodeWebP`, `QRCodeGIF`, and `QRCodeJPEG` expose `download(filename?)`
for SVG, PNG, WebP, GIF, and JPEG files respectively. The method appends the matching file extension when needed.
`QRCodeCanvas` has no download method.

See [Download or save](https://qrcodesdk.dev/guides/download-or-save/#download-from-vue) for the complete
Vue example, or its [Canvas export section](https://qrcodesdk.dev/guides/download-or-save/#export-a-canvas-manually)
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
import {type QRCodeSVGOptions, circle, finder, rounded} from '@qrcodesdk/vue';

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

Import shape and pattern factories, and center-image factories from `@qrcodesdk/vue` alongside the components.

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
} from '@qrcodesdk/vue';
```

## Documentation

- [@qrcodesdk/vue](https://qrcodesdk.dev/packages/vue/)
- [Customize appearance](https://qrcodesdk.dev/guides/customize/)
- [Add a center image](https://qrcodesdk.dev/guides/center-images/)
- [Download or save a QR code as SVG, PNG, WebP, GIF, or JPEG](https://qrcodesdk.dev/guides/download-or-save/)
- [SVG string renderer](https://qrcodesdk.dev/reference/renderers/svg/)
- [Image element renderers](https://qrcodesdk.dev/reference/renderers/image/)
- [Canvas element renderer](https://qrcodesdk.dev/reference/renderers/canvas/)
