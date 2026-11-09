<!-- Generated from apps/docs/src/content/docs/packages/browser.mdx. Run `pnpm turbo run generate-readmes --filter=docs` to update. -->

<div align="center"><img src="https://qrcodesdk.dev/favicon.svg" alt="QRCodeSDK logo" width="240"></div>

# @qrcodesdk/browser

[![Open @qrcodesdk/browser on npmx.dev](https://npmx.dev/api/registry/badge/name/@qrcodesdk/browser?color=24272c&style=shieldsio)](https://npmx.dev/@qrcodesdk/browser) ![@qrcodesdk/browser version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/browser?color=24272c&label=version&style=shieldsio) ![@qrcodesdk/browser install size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/browser?color=24272c&label=install%20size&style=shieldsio) ![@qrcodesdk/browser download/mo](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/browser?color=24272c&label=download%2Fmo&style=shieldsio) [![@qrcodesdk/browser source code](https://npmx.dev/api/registry/badge/name/@qrcodesdk/browser?color=24272c&label=source%20code&value=GitHub%20%E2%86%97&style=shieldsio)](https://github.com/Dafnik/qrcodesdk/tree/main/packages/browser)

**[Documentation](https://qrcodesdk.dev) | [Live Demo](https://qrcodesdk.dev/playground)**

`@qrcodesdk/browser` adds renderers that depend on browser DOM APIs. Use it with `@qrcodesdk/core` to create Canvas or Image elements and trigger file downloads in the browser.

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

## Entry points

Each image format has its own entry point, so code that imports one renderer only loads that
format's encoder. The root `@qrcodesdk/browser` entry point re-exports everything; bundlers with
tree shaking drop the encoders you do not use. Import from the format entry points when your build
does not tree-shake. The package is ES modules that import `@qrcodesdk/core` by its package name, so
browsers load it through a bundler or another tool that resolves package names.

| Entry point                 | Exports                                                             |
| --------------------------- | ------------------------------------------------------------------- |
| `@qrcodesdk/browser/png`    | `QRCodePNGImageRenderer`                                            |
| `@qrcodesdk/browser/webp`   | `QRCodeWebPImageRenderer`                                           |
| `@qrcodesdk/browser/gif`    | `QRCodeGIFImageRenderer`                                            |
| `@qrcodesdk/browser/jpeg`   | `QRCodeJPEGImageRenderer`                                           |
| `@qrcodesdk/browser/image`  | `QRCodeDownloadImageRenderer` and shared Image element option types |
| `@qrcodesdk/browser/canvas` | `QRCodeCanvasRenderer` and `canvasCenterImage()`                    |
| `@qrcodesdk/browser/svg`    | `QRCodeDownloadSVGRenderer`                                         |

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

- PNG uses the browser's native encoder and is the default choice.
- WebP is lossless and usually the smallest file. Its encoder is bundled in the SDK, so it also works
  in Safari, which cannot encode WebP natively. The browser still draws the Canvas that the encoder
  reads, so bytes match across browsers only when their Canvas pixels match.
- GIF is limited to 256 colors and binary transparency. Prefer PNG or WebP for transparent
  backgrounds and photographic center images.
- JPEG is lossy, has no transparency, and is larger for plain QR codes. Its bundled encoder blends
  transparent pixels onto a white matte instead of the black that browsers' native JPEG encoding
  produces. Use it when a destination requires JPEG.

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

`QRCodePNGImageRenderer()` returns an `HTMLImageElement`. Its `src` is a PNG data URL, and its
`width` and `height` match the rendered QR code size. `QRCodeWebPImageRenderer()`,
`QRCodeGIFImageRenderer()`, and `QRCodeJPEGImageRenderer()` take the same options and return WebP,
GIF, and JPEG data URLs.

See [Render QR codes in the browser](https://qrcodesdk.dev/guides/browser-usage/) for inserting and replacing browser output.

## Configure and download output

Each output has a dedicated reference for its return value, options, and browser constraints:

- [Canvas element](https://qrcodesdk.dev/reference/renderers/canvas/)
- [PNG, WebP, GIF, and JPEG Image elements](https://qrcodesdk.dev/reference/renderers/image/)
- [SVG and image download wrappers](https://qrcodesdk.dev/reference/renderers/browser-downloads/)

Canvas and Image element output take an optional center image created with `canvasCenterImage()`.
Follow [Add a center image](https://qrcodesdk.dev/guides/center-images/) to prepare a `CanvasImageSource`, and
[Download or save](https://qrcodesdk.dev/guides/download-or-save/) for browser helpers and manual Canvas export.

## Runtime constraints

Create these renderers only where `document`, Canvas, and browser download APIs are available.
For server rendering, defer them until hydration or use the runtime-neutral SVG renderer from
`@qrcodesdk/core`. Use `@qrcodesdk/node` when you need PNG, WebP, GIF, or JPEG bytes without a DOM.

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
