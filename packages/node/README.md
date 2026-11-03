<!-- Generated from apps/docs/src/content/docs/packages/node.mdx. Run `pnpm turbo run generate-readmes --filter=docs` to update. -->

<div align="center"><img src="https://qrcodesdk.dev/favicon.svg" alt="QRCodeSDK logo" width="240"></div>

# @qrcodesdk/node

[![Open @qrcodesdk/node on npmx.dev](https://npmx.dev/api/registry/badge/name/@qrcodesdk/node?color=24272c&style=shieldsio)](https://npmx.dev/@qrcodesdk/node) ![@qrcodesdk/node version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/node?color=24272c&label=version&style=shieldsio) ![@qrcodesdk/node install size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/node?color=24272c&label=install%20size&style=shieldsio) ![@qrcodesdk/node download/mo](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/node?color=24272c&label=download%2Fmo&style=shieldsio) [![@qrcodesdk/node source code](https://npmx.dev/api/registry/badge/name/@qrcodesdk/node?color=24272c&label=source%20code&value=GitHub%20%E2%86%97&style=shieldsio)](https://github.com/Dafnik/qrcodesdk/tree/main/packages/node)

**[Documentation](https://qrcodesdk.dev) | [Live Demo](https://qrcodesdk.dev/playground)**

Node.js renderers for QRCodeSDK. Use this package with `@qrcodesdk/core` when you need a PNG, WebP, GIF, or JPEG `Buffer` for files, HTTP responses, downloads, email attachments, or other server-side integrations.

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
deno add @qrcodesdk/core @qrcodesdk/node
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

`QRCodePNGRenderer()` returns a Node.js `Buffer` containing a square PNG image. RGB and RGBA style
colors are preserved, including transparent backgrounds.

## Choose a format

| Format | Renderer             | `Content-Type` | Choose it when                                                    |
| ------ | -------------------- | -------------- | ----------------------------------------------------------------- |
| PNG    | `QRCodePNGRenderer`  | `image/png`    | The destination needs the most widely supported raster format     |
| WebP   | `QRCodeWebPRenderer` | `image/webp`   | The destination accepts WebP and file size matters                |
| GIF    | `QRCodeGIFRenderer`  | `image/gif`    | The destination only accepts GIF                                  |
| JPEG   | `QRCodeJPEGRenderer` | `image/jpeg`   | The destination only accepts JPEG, or the center image is a photo |

All four renderers draw the same pixels from the same `style` and `centerImage` options and return
a `Buffer`. WebP output is lossless and usually much smaller than PNG; a default QR code for
`https://qrcodesdk.dev` is about 310 bytes as WebP and 1.1 KB as PNG. GIF output is a single frame
with at most 256 colors and binary transparency: pixels below `transparency.threshold` alpha become
transparent and all others opaque. JPEG output is lossy and has no transparency: transparent pixels
are blended onto `transparency.matte`, white by default. It is about 9.7 KB for the same QR code, or
870 bytes with a [module size of 8](https://qrcodesdk.dev/reference/renderers/jpeg/#smaller-files), so use it only when
the destination requires JPEG or a photographic center image benefits from it.

```ts
import {qrcode} from '@qrcodesdk/core';
import {QRCodeGIFRenderer, QRCodeJPEGRenderer, QRCodeWebPRenderer} from '@qrcodesdk/node';

const builder = qrcode('https://qrcodesdk.dev');
const webp = builder.render(QRCodeWebPRenderer());
const gif = builder.render(QRCodeGIFRenderer());
const jpeg = builder.render(QRCodeJPEGRenderer({quality: 90}));
```

## Work with raster output

See the [PNG](https://qrcodesdk.dev/reference/renderers/png/), [WebP](https://qrcodesdk.dev/reference/renderers/webp/),
[GIF](https://qrcodesdk.dev/reference/renderers/gif/), and [JPEG](https://qrcodesdk.dev/reference/renderers/jpeg/) Buffer renderers for their
options and exact constraints. Center images created with `rasterCenterImage()` from PNG bytes work
with all four renderers. Follow
[Download or save](https://qrcodesdk.dev/guides/download-or-save/) to write a Buffer to disk or
[Serve a QR code](https://qrcodesdk.dev/guides/server-output/) to return it with its media type.

## Runtime requirements

`@qrcodesdk/node` directly supports Node.js 22.0.0 or newer. Bun and Deno are supported through
their Node.js compatibility layers.

The public TypeScript API uses Node's global `Buffer` type. TypeScript consumers must include
`@types/node` in their development dependencies and make Node types available in their TypeScript
options.

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
