<!-- Generated from apps/docs/src/content/docs/packages/svelte.mdx. Run `pnpm turbo run generate-readmes --filter=docs` to update. -->

<div align="center"><img src="https://qrcodesdk.dev/favicon.svg" alt="QRCodeSDK logo" width="240"></div>

# @qrcodesdk/svelte

[![Open @qrcodesdk/svelte on npmx.dev](https://npmx.dev/api/registry/badge/name/@qrcodesdk/svelte?color=7469B6&style=shieldsio)](https://npmx.dev/@qrcodesdk/svelte) ![@qrcodesdk/svelte version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/svelte?color=7469B6&label=version&style=shieldsio) ![@qrcodesdk/svelte install size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/svelte?color=7469B6&label=install%20size&style=shieldsio) ![@qrcodesdk/svelte download/mo](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/svelte?color=7469B6&label=download%2Fmo&style=shieldsio) [![@qrcodesdk/svelte source code](https://npmx.dev/api/registry/badge/name/@qrcodesdk/svelte?color=7469B6&label=source%20code&value=GitHub%20%E2%86%97&style=shieldsio)](https://github.com/Dafnik/qrcodesdk/tree/main/packages/svelte)

**[Documentation](https://qrcodesdk.dev) | [Live Demo](https://qrcodesdk.dev/playground/?package=svelte)**

Svelte components for rendering QR codes as inline SVG, PNG-backed Image elements, and Canvas
elements.

## Install

```sh
npm install @qrcodesdk/svelte @qrcodesdk/core @qrcodesdk/browser
```

```sh
pnpm add @qrcodesdk/svelte @qrcodesdk/core @qrcodesdk/browser
```

<details>
<summary>Other package managers</summary>

**vp**

```sh
vp add @qrcodesdk/svelte @qrcodesdk/core @qrcodesdk/browser
```

**deno**

```sh
deno add @qrcodesdk/svelte @qrcodesdk/core @qrcodesdk/browser
```

**bun**

```sh
bun add @qrcodesdk/svelte @qrcodesdk/core @qrcodesdk/browser
```

**yarn**

```sh
yarn add @qrcodesdk/svelte @qrcodesdk/core @qrcodesdk/browser
```

</details>

## Quick start

Import the components directly in a Svelte component:

```svelte
<script lang="ts">
  import {QRCodeCanvas, QRCodeImage, QRCodeSVG} from '@qrcodesdk/svelte';
</script>

<QRCodeSVG data="https://qrcodesdk.dev" />
<QRCodeImage data="https://qrcodesdk.dev" />
<QRCodeCanvas data="https://qrcodesdk.dev" />
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
| `data`    | `string \| number`           | Required QR code payload.                       |
| `options` | `Component-specific options` | Optional matrix and renderer configuration.     |
| `class`   | `string`                     | CSS class applied to the component wrapper div. |

The components forward `class`, `style`, and other native `<div>` attributes to their wrapper.
Use `bind:this` when you need a download handle; the rendered SVG, Image, or Canvas remains inside
that wrapper.

## Live examples

### SVG component

```svelte
<script lang="ts">
  import type {QRCodeSVGOptions} from '@qrcodesdk/core';
  import {QRCodeSVG} from '@qrcodesdk/svelte';

  const options: QRCodeSVGOptions = {
    size: 8,
    margin: 2,
    ariaLabel: 'Scan to open qrcodesdk.dev',
  };
</script>

<QRCodeSVG class="mx-auto" data="https://qrcodesdk.dev" {options} />
```

### Image component

```svelte
<script lang="ts">
  import type {QRCodeImageOptions} from '@qrcodesdk/browser';
  import {QRCodeImage} from '@qrcodesdk/svelte';

  const options: QRCodeImageOptions = {
    size: 8,
    margin: 2,
    alt: 'QR code for qrcodesdk.dev',
  };
</script>

<QRCodeImage class="mx-auto" data="https://qrcodesdk.dev" {options} />
```

### Canvas component

```svelte
<script lang="ts">
  import type {QRCodeCanvasOptions} from '@qrcodesdk/browser';
  import {QRCodeCanvas} from '@qrcodesdk/svelte';

  const options: QRCodeCanvasOptions = {size: 8, margin: 2};
</script>

<QRCodeCanvas class="mx-auto" data="https://qrcodesdk.dev" {options} />
```

### PNG download

```svelte
<script lang="ts">
  import type {QRCodeImageOptions} from '@qrcodesdk/browser';
  import {type QRCodeDownloadHandle, QRCodeImage} from '@qrcodesdk/svelte';

  let qrcode: QRCodeDownloadHandle | undefined;
  const options: QRCodeImageOptions = {alt: 'QR code for qrcodesdk.dev'};
</script>

<div class="flex flex-col items-center">
  <QRCodeImage bind:this={qrcode} data="https://qrcodesdk.dev" {options} />
  <button class="btn-primary" type="button" onclick={() => qrcode?.download('qrcodesdk')}>
    Download PNG
  </button>
</div>
```

## Center images

Load and decode a browser image first, store it in rune-mode state, and pass it through
`options.image.source`. Render the Image or Canvas component only after the source is ready. See
[Add a center image](https://qrcodesdk.dev/guides/center-images/#svelte) for a complete
Svelte example.

## Download files

- `QRCodeSVG` exports `download(filename?)` and writes an SVG file through `bind:this`.
- `QRCodeImage` exports `download(filename?)` and writes a PNG file through `bind:this`.

```svelte
<script lang="ts">
  import {type QRCodeDownloadHandle, QRCodeImage} from '@qrcodesdk/svelte';

  let qrcode: QRCodeDownloadHandle | undefined;
</script>

<button type="button" onclick={() => qrcode?.download('qrcodesdk')}>Download PNG</button>
<QRCodeImage bind:this={qrcode} data="https://qrcodesdk.dev" />
```

The appropriate `.svg` or `.png` extension is appended when necessary.

`QRCodeCanvas` does not include a download method. Use `QRCodeImage` when you want built-in PNG
download support.

See [Download or save](https://qrcodesdk.dev/guides/download-or-save/#download-from-svelte) for SVG, PNG, and manual
Canvas downloads.

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
