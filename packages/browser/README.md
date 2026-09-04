<!-- Generated from apps/docs/src/content/docs/packages/browser.mdx. Run `pnpm turbo run generate-readmes --filter=docs` to update. -->

<div align="center"><img src="https://qrcodesdk.dev/favicon.svg" alt="QRCodeSDK logo" width="240"></div>

# @qrcodesdk/browser

[![Open @qrcodesdk/browser on npmx.dev](https://npmx.dev/api/registry/badge/name/@qrcodesdk/browser?color=7469B6&style=shieldsio)](https://npmx.dev/@qrcodesdk/browser) ![@qrcodesdk/browser version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/browser?color=7469B6&label=version&style=shieldsio) ![@qrcodesdk/browser install size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/browser?color=7469B6&label=install%20size&style=shieldsio) ![@qrcodesdk/browser download/mo](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/browser?color=7469B6&label=download%2Fmo&style=shieldsio) [![@qrcodesdk/browser source code](https://npmx.dev/api/registry/badge/name/@qrcodesdk/browser?color=7469B6&label=source%20code&value=GitHub%20%E2%86%97&style=shieldsio)](https://github.com/Dafnik/qrcodesdk/tree/main/packages/browser)

**[Documentation](https://qrcodesdk.dev) | [Live Demo](https://qrcodesdk.dev/playground)**

`@qrcodesdk/browser` adds renderers that depend on browser DOM APIs. Use it with `@qrcodesdk/core` when your output should be an element created in the browser or a browser-triggered download.

## Install

```sh
npm install @qrcodesdk/core @qrcodesdk/browser
```

```sh
pnpm add @qrcodesdk/core @qrcodesdk/browser
```

<details>
<summary>Other package managers</summary>

**vp**

```sh
vp add @qrcodesdk/core @qrcodesdk/browser
```

**deno**

```sh
deno add @qrcodesdk/core @qrcodesdk/browser
```

**bun**

```sh
bun add @qrcodesdk/core @qrcodesdk/browser
```

**yarn**

```sh
yarn add @qrcodesdk/core @qrcodesdk/browser
```

</details>

## Choose an output

| Need                            | Renderer                      | Return value        |
| ------------------------------- | ----------------------------- | ------------------- |
| Insert a PNG-backed image       | `QRCodeImageRenderer`         | `HTMLImageElement`  |
| Draw or export with Canvas APIs | `QRCodeCanvasRenderer`        | `HTMLCanvasElement` |
| Trigger an SVG download         | `QRCodeDownloadSVGRenderer`   | `void`              |
| Trigger a PNG download          | `QRCodeDownloadImageRenderer` | `void`              |

## Render an Image element

```ts
import {QRCodeImageRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const image = qrcode('https://qrcodesdk.dev').render(
  QRCodeImageRenderer({
    accessibility: {
      alt: 'QR code for qrcodesdk.dev',
      ariaLabel: 'Scan to open qrcodesdk.dev',
    },
  }),
);

document.body.append(image);
```

`QRCodeImageRenderer()` returns an `HTMLImageElement`. Its `src` is a PNG data URL, and its `width` and `height` match the rendered QR code size.

[Learn here](https://qrcodesdk.dev/guides/browser-usage/) more about using the library in the browser.

## Configure and download output

Each output has a dedicated reference for its return value, options, and browser constraints:

- [Canvas element](https://qrcodesdk.dev/reference/renderers/canvas/)
- [PNG-backed Image element](https://qrcodesdk.dev/reference/renderers/image/)
- [SVG and PNG download wrappers](https://qrcodesdk.dev/reference/renderers/browser-downloads/)

Follow [Add a center image](https://qrcodesdk.dev/guides/center-images/) to prepare a `CanvasImageSource`, and
[Download or save](https://qrcodesdk.dev/guides/download-or-save/) for browser helpers and manual Canvas export.

## Runtime constraints

Create these renderers only where `document`, Canvas, and browser download APIs are available.
For server rendering, defer them until hydration or use the runtime-neutral SVG renderer from
`@qrcodesdk/core`. Use `@qrcodesdk/node` when you need PNG bytes without a DOM.

## Package boundary

`@qrcodesdk/browser` depends on browser DOM APIs and does not replace `@qrcodesdk/core`. The core package still provides `qrcode()`, matrix generation, builder options, and shared styling normalization.

## Public API

```ts
import {
  type QRCodeCanvasImageOptions,
  type QRCodeCanvasOptions,
  QRCodeCanvasRenderer,
  type QRCodeCanvasRendererOptions,
  QRCodeDownloadImageRenderer,
  type QRCodeDownloadImageRendererOptions,
  QRCodeDownloadSVGRenderer,
  type QRCodeDownloadSVGRendererOptions,
  type QRCodeImageOptions,
  QRCodeImageRenderer,
  type QRCodeImageRendererOptions,
} from '@qrcodesdk/browser';
```

## Documentation

- [@qrcodesdk/browser](https://qrcodesdk.dev/packages/browser/)
- [Choose your setup](https://qrcodesdk.dev/getting-started/choose-your-setup/)
- [Canvas element renderer](https://qrcodesdk.dev/reference/renderers/canvas/)
- [PNG-backed Image element renderer](https://qrcodesdk.dev/reference/renderers/image/)
- [SVG string renderer](https://qrcodesdk.dev/reference/renderers/svg/)
- [Customize appearance](https://qrcodesdk.dev/guides/customize/)
