<!-- Generated from apps/docs/src/content/docs/packages/node.mdx. Run `pnpm turbo run generate-readmes --filter=docs` to update. -->

<div align="center"><img src="https://qrcodesdk.dev/favicon.svg" alt="QRCodeSDK logo" width="240"></div>

# @qrcodesdk/node

[![Open @qrcodesdk/node on npmx.dev](https://npmx.dev/api/registry/badge/name/@qrcodesdk/node?color=24272c&style=shieldsio)](https://npmx.dev/@qrcodesdk/node) ![@qrcodesdk/node version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/node?color=24272c&label=version&style=shieldsio) ![@qrcodesdk/node install size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/node?color=24272c&label=install%20size&style=shieldsio) ![@qrcodesdk/node download/mo](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/node?color=24272c&label=download%2Fmo&style=shieldsio) [![@qrcodesdk/node source code](https://npmx.dev/api/registry/badge/name/@qrcodesdk/node?color=24272c&label=source%20code&value=GitHub%20%E2%86%97&style=shieldsio)](https://github.com/Dafnik/qrcodesdk/tree/main/packages/node)

**[Documentation](https://qrcodesdk.dev) | [Live Demo](https://qrcodesdk.dev/playground)**

Node.js renderers for QRCodeSDK. Use them with `@qrcodesdk/core` to get a PNG, WebP, GIF, or JPEG
`Buffer` for files, HTTP responses, downloads, or email attachments.

## Install

```sh
npm install @qrcodesdk/core @qrcodesdk/node
```

```sh
pnpm add @qrcodesdk/core @qrcodesdk/node
```

<details>
<summary>Other package managers</summary>

**vp**

```sh
vp add @qrcodesdk/core @qrcodesdk/node
```

**deno**

```sh
deno add npm:@qrcodesdk/core npm:@qrcodesdk/node
```

**bun**

```sh
bun add @qrcodesdk/core @qrcodesdk/node
```

**yarn**

```sh
yarn add @qrcodesdk/core @qrcodesdk/node
```

</details>

## Minimal example

```ts
import {qrcode} from '@qrcodesdk/core';
import {QRCodePNGRenderer} from '@qrcodesdk/node';

const png = qrcode('https://qrcodesdk.dev').render(QRCodePNGRenderer());
```

The result is a Node.js `Buffer` with a square PNG image. RGB and RGBA colors are kept, including
transparent backgrounds.

## Choose a format

| Format | Renderer             | `Content-Type` | Choose it when                                                    |
| ------ | -------------------- | -------------- | ----------------------------------------------------------------- |
| PNG    | `QRCodePNGRenderer`  | `image/png`    | The destination needs the most widely supported raster format     |
| WebP   | `QRCodeWebPRenderer` | `image/webp`   | The destination accepts WebP and file size matters                |
| GIF    | `QRCodeGIFRenderer`  | `image/gif`    | The destination only accepts GIF                                  |
| JPEG   | `QRCodeJPEGRenderer` | `image/jpeg`   | The destination only accepts JPEG, or the center image is a photo |

All four renderers draw the same pixels from the same `style` and `centerImage` options.

```ts
import {qrcode} from '@qrcodesdk/core';
import {QRCodeGIFRenderer, QRCodeJPEGRenderer, QRCodeWebPRenderer} from '@qrcodesdk/node';

const builder = qrcode('https://qrcodesdk.dev');
const webp = builder.render(QRCodeWebPRenderer());
const gif = builder.render(QRCodeGIFRenderer());
const jpeg = builder.render(QRCodeJPEGRenderer({quality: 90}));
```

Format differences:

- **WebP** is lossless and usually much smaller than PNG.
- **GIF** is a single frame with at most 256 colors. Pixels with alpha below
  `transparency.threshold` become transparent; all others become opaque.
- **JPEG** is lossy and has no transparency. Transparent pixels blend onto `transparency.matte`,
  white by default.

File sizes for a default QR code for `https://qrcodesdk.dev`:

| Format                                                                                        | Size        |
| --------------------------------------------------------------------------------------------- | ----------- |
| WebP                                                                                          | \~310 bytes |
| PNG                                                                                           | \~1.1 KB    |
| JPEG                                                                                          | \~9.7 KB    |
| JPEG with a [module size of 8](https://qrcodesdk.dev/reference/renderers/jpeg/#smaller-files) | \~870 bytes |

## Work with raster output

- Options and constraints: [PNG](https://qrcodesdk.dev/reference/renderers/png/), [WebP](https://qrcodesdk.dev/reference/renderers/webp/),
  [GIF](https://qrcodesdk.dev/reference/renderers/gif/), and [JPEG](https://qrcodesdk.dev/reference/renderers/jpeg/) Buffer renderers.
- Center images: create one from PNG bytes with `rasterCenterImage()`. It works with all four
  renderers. See [Add a center image](https://qrcodesdk.dev/guides/center-images/).
- Write a Buffer to disk: [Download or save](https://qrcodesdk.dev/guides/download-or-save/).
- Return it from an HTTP handler: [Serve a QR code](https://qrcodesdk.dev/guides/server-output/).

## Runtime requirements

- Node.js 22.0.0 or newer; tested on 22, 24, and 26.
- Deno (current stable major) and Bun (current stable release), through their Node.js compatibility
  layers.
- Not for browsers: use [`@qrcodesdk/browser`](https://qrcodesdk.dev/packages/browser/) there. Edge workers are untested.
- TypeScript: the public API uses Node's global `Buffer` type. Add `@types/node` to your development
  dependencies and enable Node types in your TypeScript options.

## Public API

```ts
import {
  QRCodeGIFRenderer,
  type QRCodeGIFRendererOptions,
  QRCodeJPEGRenderer,
  type QRCodeJPEGRendererOptions,
  QRCodePNGRenderer,
  type QRCodePNGRendererOptions,
  type QRCodeRasterCenterImage,
  type QRCodeRasterRendererOptions,
  QRCodeWebPRenderer,
  type QRCodeWebPRendererOptions,
  rasterCenterImage,
} from '@qrcodesdk/node';
```

## Documentation

- [@qrcodesdk/node](https://qrcodesdk.dev/packages/node/)
- [Choose your setup](https://qrcodesdk.dev/getting-started/choose-your-setup/)
- [Customize appearance](https://qrcodesdk.dev/guides/customize/)
- [PNG Buffer renderer](https://qrcodesdk.dev/reference/renderers/png/)
- [WebP Buffer renderer](https://qrcodesdk.dev/reference/renderers/webp/)
- [GIF Buffer renderer](https://qrcodesdk.dev/reference/renderers/gif/)
- [JPEG Buffer renderer](https://qrcodesdk.dev/reference/renderers/jpeg/)
- [Download or save a QR code as SVG, PNG, WebP, GIF, or JPEG](https://qrcodesdk.dev/guides/download-or-save/)
- [Serve a QR code](https://qrcodesdk.dev/guides/server-output/)
