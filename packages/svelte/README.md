<!-- Generated from apps/docs/src/content/docs/packages/svelte.mdx. Run `pnpm turbo run generate-readmes --filter=docs` to update. -->

<div align="center"><img src="https://qrcodesdk.dev/favicon.svg" alt="QRCodeSDK logo" width="240"></div>

# @qrcodesdk/svelte

[![Open @qrcodesdk/svelte on npmx.dev](https://npmx.dev/api/registry/badge/name/@qrcodesdk/svelte?color=24272c&style=shieldsio)](https://npmx.dev/@qrcodesdk/svelte) ![@qrcodesdk/svelte version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/svelte?color=24272c&label=version&style=shieldsio) ![@qrcodesdk/svelte install size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/svelte?color=24272c&label=install%20size&style=shieldsio) ![@qrcodesdk/svelte download/mo](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/svelte?color=24272c&label=download%2Fmo&style=shieldsio) [![@qrcodesdk/svelte source code](https://npmx.dev/api/registry/badge/name/@qrcodesdk/svelte?color=24272c&label=source%20code&value=GitHub%20%E2%86%97&style=shieldsio)](https://github.com/Dafnik/qrcodesdk/tree/main/packages/svelte)

**[Documentation](https://qrcodesdk.dev) | [Live Demo](https://qrcodesdk.dev/playground/?package=svelte)**

Svelte components for rendering QR codes as inline SVG, PNG-backed Image elements, and Canvas
elements.

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
  import {QRCodeCanvas, QRCodeImage, QRCodeSVG} from '@qrcodesdk/svelte';
</script>

<QRCodeSVG payload="https://qrcodesdk.dev" />
<QRCodeImage payload="https://qrcodesdk.dev" />
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
| `QRCodeImage`  | `PNG-backed <img>`   | PNG              |
| `QRCodeCanvas` | `<canvas> element`   | None             |

### Options

| Prop      | Type                         | Description                                     |
| --------- | ---------------------------- | ----------------------------------------------- |
| `payload` | `string \| number`           | Required QR code payload.                       |
| `options` | `Component-specific options` | Optional matrix and renderer configuration.     |
| `class`   | `string`                     | CSS class applied to the component wrapper div. |

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

### Image component

```svelte
<script lang="ts">
  import {QRCodeImage, type QRCodeImageOptions} from '@qrcodesdk/svelte';

  const options: QRCodeImageOptions = {
    style: {moduleSize: 8, quietZone: 2},
    accessibility: {alt: 'QR code for qrcodesdk.dev'},
  };
</script>

<QRCodeImage class="mx-auto" payload="https://qrcodesdk.dev" {options} />
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
  import {type QRCodeDownloadHandle, QRCodeImage, type QRCodeImageOptions} from '@qrcodesdk/svelte';

  let qrcode: QRCodeDownloadHandle | undefined;
  const options: QRCodeImageOptions = {accessibility: {alt: 'QR code for qrcodesdk.dev'}};
</script>

<div class="flex flex-col items-center gap-2">
  <QRCodeImage bind:this={qrcode} payload="https://qrcodesdk.dev" {options} />
  <button class="btn-primary" type="button" onclick={() => qrcode?.download('qrcodesdk')}>
    Download PNG
  </button>
</div>
```

## Center images

Load and decode a browser image first, store it in rune-mode state, and pass it through
`options.centerImage.source`. Render the Image or Canvas component only after the source is ready. See
[Add a center image](https://qrcodesdk.dev/guides/center-images/#svelte) for a complete
Svelte example.

## Download files

`QRCodeSVG` and `QRCodeImage` expose `download(filename?)` for SVG and PNG files respectively.
The method appends the file extension when needed. `QRCodeCanvas` has no download method.

See [Download or save](https://qrcodesdk.dev/guides/download-or-save/#download-from-svelte) for the complete
Svelte example, or its [Canvas export section](https://qrcodesdk.dev/guides/download-or-save/#export-a-canvas-manually)
for manual downloads.

## Server-side rendering

`QRCodeSVG` produces runtime-neutral SVG and can render on the server.

`QRCodeImage` and `QRCodeCanvas` rely on browser DOM and Canvas APIs, so they render an empty wrapper
on the server and populate it after mounting in the browser. Their download methods also skip work
outside the browser.

## Shared options

The `options` prop groups encoding settings under `matrix`. Renderer settings such as
`style`, `accessibility`, and `centerImage` go alongside it:

```ts
import type {QRCodeSVGOptions} from '@qrcodesdk/svelte';

const options: QRCodeSVGOptions = {
  matrix: {errorCorrectionLevel: 'H'},
  style: {moduleSize: 8, quietZone: 4},
  accessibility: {ariaLabel: 'Scan to open qrcodesdk.dev'},
};
```

Pass this object through the component's `options` prop. Use `QRCodeImageOptions` or
`QRCodeCanvasOptions` for the corresponding component.

See [Builder and matrix](https://qrcodesdk.dev/reference/builder/) for the fields inside `matrix`,
[Customize appearance](https://qrcodesdk.dev/guides/customize/) for `style`, and
[Renderer outputs](https://qrcodesdk.dev/reference/renderers/) for output-specific options.

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
} from '@qrcodesdk/svelte';
```

## Documentation

- [@qrcodesdk/svelte](https://qrcodesdk.dev/packages/svelte/)
- [Customize appearance](https://qrcodesdk.dev/guides/customize/)
- [Add a center image](https://qrcodesdk.dev/guides/center-images/)
- [Download or save a QR code as SVG or PNG](https://qrcodesdk.dev/guides/download-or-save/)
- [SVG string renderer](https://qrcodesdk.dev/reference/renderers/svg/)
- [PNG-backed Image element renderer](https://qrcodesdk.dev/reference/renderers/image/)
- [Canvas element renderer](https://qrcodesdk.dev/reference/renderers/canvas/)
