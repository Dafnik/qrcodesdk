<!-- Generated from apps/docs/src/content/docs/packages/node.mdx. Run `pnpm turbo run generate-readmes --filter=docs` to update. -->

<div align="center"><img src="https://qrcodesdk.dev/favicon.svg" alt="QRCodeSDK logo" width="240"></div>

# @qrcodesdk/node

[![Open @qrcodesdk/node on npmx.dev](https://npmx.dev/api/registry/badge/name/@qrcodesdk/node?color=7469B6&style=shieldsio)](https://npmx.dev/@qrcodesdk/node) ![@qrcodesdk/node version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/node?color=7469B6&label=version&style=shieldsio) ![@qrcodesdk/node install size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/node?color=7469B6&label=install%20size&style=shieldsio) ![@qrcodesdk/node download/mo](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/node?color=7469B6&label=download%2Fmo&style=shieldsio) [![@qrcodesdk/node source code](https://npmx.dev/api/registry/badge/name/@qrcodesdk/node?color=7469B6&label=source%20code&value=GitHub%20%E2%86%97&style=shieldsio)](https://github.com/Dafnik/qrcodesdk/tree/main/packages/node)

**[Documentation](https://qrcodesdk.dev) | [Live Demo](https://qrcodesdk.dev/playground)**

Node.js renderers for QRCodeSDK. Use this package with `@qrcodesdk/core` when you need a PNG `Buffer` for files, HTTP responses, downloads, email attachments, or other server-side integrations.

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

`QRCodePNGRenderer()` returns a Node.js `Buffer` containing a square, fully opaque PNG image.

## Work with PNG output

See the [PNG Buffer renderer](https://qrcodesdk.dev/reference/renderers/png/) for compression, prepared PNG overlays,
and exact constraints. Follow [Download or save](https://qrcodesdk.dev/guides/download-or-save/) to write the Buffer to
disk or [Serve a QR code](https://qrcodesdk.dev/guides/server-output/) to return it as `image/png`.

## Runtime requirements

`@qrcodesdk/node` directly supports Node.js 22.0.0 or newer. Bun and Deno are supported through
their Node.js compatibility layers.

The public TypeScript API uses Node's global `Buffer` type. TypeScript consumers must include
`@types/node` in their development dependencies and make Node types available in their TypeScript
configuration.

## Package boundary

`@qrcodesdk/node` provides Node-specific renderers and does not replace `@qrcodesdk/core`. The core package still provides `qrcode()`, matrix generation and builder options.

## Public API

```ts
import {
  type QRCodePNGImageOptions,
  QRCodePNGRenderer,
  type QRCodePNGRendererOptions,
} from '@qrcodesdk/node';
```

## Documentation

- [@qrcodesdk/node](https://qrcodesdk.dev/packages/node/)
- [Choose your setup](https://qrcodesdk.dev/getting-started/choose-your-setup/)
- [Customize appearance](https://qrcodesdk.dev/guides/customize/)
- [PNG Buffer renderer](https://qrcodesdk.dev/reference/renderers/png/)
- [Download or save a QR code as SVG or PNG](https://qrcodesdk.dev/guides/download-or-save/)
- [Serve a QR code](https://qrcodesdk.dev/guides/server-output/)
