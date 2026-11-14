<!-- Generated from apps/docs/src/content/docs/packages/browser.mdx. Run `pnpm turbo run generate-readmes --filter=docs` to update. -->

<div align="center"><img src="https://qrcodesdk.dev/favicon.svg" alt="QRCodeSDK logo" width="240"></div>

# @qrcodesdk/browser

[![Open @qrcodesdk/browser on npmx.dev](https://npmx.dev/api/registry/badge/name/@qrcodesdk/browser?color=24272c&style=shieldsio)](https://npmx.dev/@qrcodesdk/browser) ![@qrcodesdk/browser version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/browser?color=24272c&label=version&style=shieldsio) ![@qrcodesdk/browser install size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/browser?color=24272c&label=install%20size&style=shieldsio) ![@qrcodesdk/browser download/mo](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/browser?color=24272c&label=download%2Fmo&style=shieldsio) [![@qrcodesdk/browser source code](https://npmx.dev/api/registry/badge/name/@qrcodesdk/browser?color=24272c&label=source%20code&value=GitHub%20%E2%86%97&style=shieldsio)](https://github.com/Dafnik/qrcodesdk/tree/main/packages/browser)

**[Documentation](https://qrcodesdk.dev) | [Live Demo](https://qrcodesdk.dev/playground)**

`@qrcodesdk/browser` adds renderers that need browser DOM APIs. Use it with `@qrcodesdk/core` to
create Canvas and Image elements and to download files.

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
deno add npm:@qrcodesdk/core npm:@qrcodesdk/browser
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

## Render an Image element

```ts
import {QRCodePNGImageRenderer} from '@qrcodesdk/browser/png';
import {qrcode} from '@qrcodesdk/core';

const image = qrcode('https://qrcodesdk.dev').render(
  QRCodePNGImageRenderer({
    accessibility: {alt: 'QR code: scan to open qrcodesdk.dev'},
  }),
);

document.body.append(image);
```

The result is an `HTMLImageElement` with a PNG data URL as its `src`. Its `width` and `height` match
the QR code size. The WebP, GIF, and JPEG renderers take the same options.

See [Render QR codes in the browser](https://qrcodesdk.dev/guides/browser-usage/) to insert and replace browser output.

## Choose an output

| Need                                       | Renderer                      | Return value        |
| ------------------------------------------ | ----------------------------- | ------------------- |
| Insert a PNG-backed image                  | `QRCodePNGImageRenderer`      | `HTMLImageElement`  |
| Insert a smaller WebP image                | `QRCodeWebPImageRenderer`     | `HTMLImageElement`  |
| Insert a GIF image                         | `QRCodeGIFImageRenderer`      | `HTMLImageElement`  |
| Insert a JPEG image                        | `QRCodeJPEGImageRenderer`     | `HTMLImageElement`  |
| Draw or export with Canvas APIs            | `QRCodeCanvasRenderer`        | `HTMLCanvasElement` |
| Trigger an SVG download                    | `QRCodeDownloadSVGRenderer`   | `void`              |
| Trigger a PNG, WebP, GIF, or JPEG download | `QRCodeDownloadImageRenderer` | `void`              |

Which image format?

- **PNG** is the default. It uses the browser's native encoder.
- **WebP** is lossless and usually the smallest. QRCodeSDK bundles its encoder, so it also works in
  Safari, which cannot encode WebP natively.
- **GIF** has at most 256 colors and on-or-off transparency. Prefer PNG or WebP for transparent
  backgrounds and photo center images.
- **JPEG** is lossy, has no transparency, and is larger for plain QR codes. Use it only when a
  destination requires JPEG.

The bundled WebP encoder reads pixels the browser draws on a Canvas. Bytes therefore match across
browsers only when their Canvas pixels match.

The bundled JPEG encoder blends transparent pixels onto white. Browsers' native JPEG encoding uses
black.

## Configure and download output

Each output has its own reference for options and browser constraints:

- [Canvas element](https://qrcodesdk.dev/reference/renderers/canvas/)
- [PNG, WebP, GIF, and JPEG Image elements](https://qrcodesdk.dev/reference/renderers/image/)
- [SVG and image download wrappers](https://qrcodesdk.dev/reference/renderers/browser-downloads/)

Related guides:

- [Add a center image](https://qrcodesdk.dev/guides/center-images/): Canvas and Image output take a center image created
  with `canvasCenterImage()`.
- [Download or save](https://qrcodesdk.dev/guides/download-or-save/): browser download helpers and manual Canvas export.

## Entry points

Each image format has its own entry point. Importing one renderer loads only that format's encoder.

| Entry point                 | Exports                                                             |
| --------------------------- | ------------------------------------------------------------------- |
| `@qrcodesdk/browser/png`    | `QRCodePNGImageRenderer`                                            |
| `@qrcodesdk/browser/webp`   | `QRCodeWebPImageRenderer`                                           |
| `@qrcodesdk/browser/gif`    | `QRCodeGIFImageRenderer`                                            |
| `@qrcodesdk/browser/jpeg`   | `QRCodeJPEGImageRenderer`                                           |
| `@qrcodesdk/browser/image`  | `QRCodeDownloadImageRenderer` and shared Image element option types |
| `@qrcodesdk/browser/canvas` | `QRCodeCanvasRenderer` and `canvasCenterImage()`                    |
| `@qrcodesdk/browser/svg`    | `QRCodeDownloadSVGRenderer`                                         |

- The root `@qrcodesdk/browser` entry point re-exports everything. Bundlers with tree shaking drop
  the encoders you do not use. Without tree shaking, import from the format entry points.
- The package imports `@qrcodesdk/core` by its package name. Load it through a bundler or another
  tool that resolves package names.

## Runtime constraints

Create these renderers only where `document`, Canvas, and browser download APIs exist.

- **Server rendering:** create them after hydration, or use the SVG renderer from `@qrcodesdk/core`.
- **PNG, WebP, GIF, or JPEG bytes without a DOM:** use [`@qrcodesdk/node`](https://qrcodesdk.dev/packages/node/).

## Public API

```ts
import {
  type QRCodeCanvasAccessibilityOptions,
  type QRCodeCanvasCenterImage,
  type QRCodeCanvasOptions,
  QRCodeCanvasRenderer,
  type QRCodeCanvasRendererOptions,
  QRCodeDownloadImageRenderer,
  type QRCodeDownloadImageRendererOptions,
  QRCodeDownloadSVGRenderer,
  type QRCodeDownloadSVGRendererOptions,
  type QRCodeGIFImageOptions,
  QRCodeGIFImageRenderer,
  type QRCodeGIFImageRendererOptions,
  type QRCodeImageAccessibilityOptions,
  type QRCodeImageRendererOptions,
  type QRCodeJPEGImageOptions,
  QRCodeJPEGImageRenderer,
  type QRCodeJPEGImageRendererOptions,
  type QRCodePNGImageOptions,
  QRCodePNGImageRenderer,
  type QRCodePNGImageRendererOptions,
  type QRCodeWebPImageOptions,
  QRCodeWebPImageRenderer,
  type QRCodeWebPImageRendererOptions,
  canvasCenterImage,
} from '@qrcodesdk/browser';
```

## Documentation

- [@qrcodesdk/browser](https://qrcodesdk.dev/packages/browser/)
- [Choose your setup](https://qrcodesdk.dev/getting-started/choose-your-setup/)
- [Canvas element renderer](https://qrcodesdk.dev/reference/renderers/canvas/)
- [Image element renderers](https://qrcodesdk.dev/reference/renderers/image/)
- [SVG string renderer](https://qrcodesdk.dev/reference/renderers/svg/)
- [Customize appearance](https://qrcodesdk.dev/guides/customize/)
