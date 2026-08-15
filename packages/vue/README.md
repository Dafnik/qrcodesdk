<!-- Generated from apps/docs/src/content/docs/packages/vue.mdx. Run `pnpm turbo run generate-readmes --filter=docs` to update. -->

<div align="center"><img src="https://qrcodesdk.dev/favicon.svg" alt="QRCodeSDK logo" width="240"></div>

# @qrcodesdk/vue

[![Open @qrcodesdk/vue on npmx.dev](https://npmx.dev/api/registry/badge/name/@qrcodesdk/vue?color=7469B6&style=shieldsio)](https://npmx.dev/@qrcodesdk/vue) ![@qrcodesdk/vue version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/vue?color=7469B6&label=version&style=shieldsio) ![@qrcodesdk/vue install size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/vue?color=7469B6&label=install%20size&style=shieldsio) ![@qrcodesdk/vue download/mo](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/vue?color=7469B6&label=download%2Fmo&style=shieldsio) [![@qrcodesdk/vue source code](https://npmx.dev/api/registry/badge/name/@qrcodesdk/vue?color=7469B6&label=source%20code&value=GitHub%20%E2%86%97&style=shieldsio)](https://github.com/Dafnik/qrcodesdk/tree/main/packages/vue)

**[Documentation](https://qrcodesdk.dev) | [Live Demo](https://qrcodesdk.dev/playground/?package=vue)**

Vue components for rendering QR codes as inline SVG, PNG-backed Image elements, and Canvas elements.

## Install

```sh
npm install @qrcodesdk/vue @qrcodesdk/core @qrcodesdk/browser
```

```sh
pnpm add @qrcodesdk/vue @qrcodesdk/core @qrcodesdk/browser
```

<details>
<summary>Other package managers</summary>

**vp**

```sh
vp add @qrcodesdk/vue @qrcodesdk/core @qrcodesdk/browser
```

**deno**

```sh
deno add @qrcodesdk/vue @qrcodesdk/core @qrcodesdk/browser
```

**bun**

```sh
bun add @qrcodesdk/vue @qrcodesdk/core @qrcodesdk/browser
```

**yarn**

```sh
yarn add @qrcodesdk/vue @qrcodesdk/core @qrcodesdk/browser
```

</details>

## Quick start

Import the components directly in a Vue single-file component:

```vue
<script setup lang="ts">
import {QRCodeCanvas, QRCodeImage, QRCodeSVG} from '@qrcodesdk/vue';
</script>

<template>
  <QRCodeSVG data="https://qrcodesdk.dev" />
  <QRCodeImage data="https://qrcodesdk.dev" />
  <QRCodeCanvas data="https://qrcodesdk.dev" />
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
| `QRCodeImage`  | `PNG-backed <img>`   | PNG              |
| `QRCodeCanvas` | `<canvas> element`   | None             |

### Options

| Prop      | Type                         | Description                                             |
| --------- | ---------------------------- | ------------------------------------------------------- |
| `data`    | `string \| number`           | Required QR code payload.                               |
| `options` | `Component-specific options` | Optional matrix and renderer configuration.             |
| `class`   | `string \| object \| array`  | Vue class binding applied to the component wrapper div. |

Vue applies `class`, `style`, and other fallthrough attributes to the component's wrapper `<div>`.
Use a template ref when you need a download handle; the rendered SVG, Image, or Canvas remains
inside that wrapper.

## Live examples

### SVG component

```vue
<script setup lang="ts">
import type {QRCodeSVGOptions} from '@qrcodesdk/core';
import {QRCodeSVG} from '@qrcodesdk/vue';

const options: QRCodeSVGOptions = {
  title: 'QR code for qrcodesdk.dev',
  ariaLabel: 'Scan to open qrcodesdk.dev',
};
</script>

<template>
  <QRCodeSVG data="https://qrcodesdk.dev" :options />
</template>
```

### Image component

```vue
<script setup lang="ts">
import type {QRCodeImageOptions} from '@qrcodesdk/browser';
import {QRCodeImage} from '@qrcodesdk/vue';

const options: QRCodeImageOptions = {
  size: 8,
  margin: 4,
  alt: 'QR code for qrcodesdk.dev',
  ariaLabel: 'Scan to open qrcodesdk.dev',
};
</script>

<template>
  <QRCodeImage data="https://qrcodesdk.dev" :options />
</template>
```

### Canvas component

```vue
<script setup lang="ts">
import type {QRCodeCanvasOptions} from '@qrcodesdk/browser';
import {QRCodeCanvas} from '@qrcodesdk/vue';

const options: QRCodeCanvasOptions = {
  size: 8,
  margin: 4,
  colors: {
    colorDark: '#111827',
    colorLight: '#ffffff',
  },
};
</script>

<template>
  <QRCodeCanvas data="https://qrcodesdk.dev" :options />
</template>
```

### PNG download

```vue
<script setup lang="ts">
import {ref} from 'vue';

import type {QRCodeImageOptions} from '@qrcodesdk/browser';
import {type QRCodeDownloadHandle, QRCodeImage} from '@qrcodesdk/vue';

const qrcode = ref<QRCodeDownloadHandle | null>(null);
const options: QRCodeImageOptions = {alt: 'QR code for qrcodesdk.dev'};
</script>

<template>
  <div class="flex flex-col items-center">
    <QRCodeImage ref="qrcode" data="https://qrcodesdk.dev" :options />
    <button class="btn-primary" type="button" @click="qrcode?.download('qrcodesdk')">
      Download PNG
    </button>
  </div>
</template>
```

## Center images

Load and decode a browser image first, store it in a `shallowRef`, and pass it through
`options.image.source`. Render the Image or Canvas component only after the source is ready. See
[Add a center image](https://qrcodesdk.dev/guides/center-images/#wire-prepared-sources-into-frameworks) for a complete
Vue example.

## Download files

- `QRCodeSVG` exposes `download(filename?)` and writes an SVG file through a template ref.
- `QRCodeImage` exposes `download(filename?)` and writes a PNG file through a template ref.

```vue
<script setup lang="ts">
import {ref} from 'vue';

import {type QRCodeDownloadHandle, QRCodeImage} from '@qrcodesdk/vue';

const qrcode = ref<QRCodeDownloadHandle | null>(null);
</script>

<template>
  <button type="button" @click="qrcode?.download('qrcodesdk')">Download PNG</button>
  <QRCodeImage ref="qrcode" data="https://qrcodesdk.dev" />
</template>
```

The appropriate `.svg` or `.png` extension is appended when necessary.

`QRCodeCanvas` does not include a download method. Use `QRCodeImage` when you want built-in PNG
download support.

See [Download or save](https://qrcodesdk.dev/guides/download-or-save/#download-from-vue) for SVG, PNG, and manual Canvas
downloads.

## Server-side rendering

`QRCodeSVG` produces runtime-neutral SVG and can render on the server.

`QRCodeImage` and `QRCodeCanvas` rely on browser DOM and Canvas APIs, so they render an empty wrapper
on the server and populate it after mounting in the browser. Their download methods also skip work
outside the browser.

## Shared configuration

The `options` prop combines matrix settings with the selected renderer's settings. Use the
[builder reference](https://qrcodesdk.dev/reference/builder/) for encoding, version, mask, and error correction;
[Customize output](https://qrcodesdk.dev/guides/customize/) for shared visual options; and the dedicated
[renderer references](https://qrcodesdk.dev/reference/renderers/) for output-specific options and constraints.

## Public API

```ts
import {
  type QRCodeBaseProps,
  QRCodeCanvas,
  type QRCodeCanvasProps,
  type QRCodeDownloadHandle,
  QRCodeImage,
  type QRCodeImageProps,
  QRCodeSVG,
  type QRCodeSVGProps,
} from '@qrcodesdk/vue';
```

## Documentation

- [@qrcodesdk/vue](https://qrcodesdk.dev/packages/vue/)
- [Customize appearance](https://qrcodesdk.dev/guides/customize/)
- [Add a center image](https://qrcodesdk.dev/guides/center-images/)
- [Download or save a QR code as SVG or PNG](https://qrcodesdk.dev/guides/download-or-save/)
- [SVG string renderer](https://qrcodesdk.dev/reference/renderers/svg/)
- [PNG-backed Image element renderer](https://qrcodesdk.dev/reference/renderers/image/)
- [Canvas element renderer](https://qrcodesdk.dev/reference/renderers/canvas/)
