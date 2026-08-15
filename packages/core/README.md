<!-- Generated from apps/docs/src/content/docs/packages/core.mdx. Run `pnpm turbo run generate-readmes --filter=docs` to update. -->

<div align="center"><img src="https://qrcodesdk.dev/favicon.svg" alt="QRCodeSDK logo" width="240"></div>

# @qrcodesdk/core

[![Open @qrcodesdk/core on npmx.dev](https://npmx.dev/api/registry/badge/name/@qrcodesdk/core?color=7469B6&style=shieldsio)](https://npmx.dev/@qrcodesdk/core) ![@qrcodesdk/core version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/core?color=7469B6&label=version&style=shieldsio) ![@qrcodesdk/core install size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/core?color=7469B6&label=install%20size&style=shieldsio) ![@qrcodesdk/core download/mo](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/core?color=7469B6&label=download%2Fmo&style=shieldsio) [![@qrcodesdk/core source code](https://npmx.dev/api/registry/badge/name/@qrcodesdk/core?color=7469B6&label=source%20code&value=GitHub%20%E2%86%97&style=shieldsio)](https://github.com/Dafnik/qrcodesdk/tree/main/packages/core)

**[Documentation](https://qrcodesdk.dev) | [Live Demo](https://qrcodesdk.dev/playground)**

`@qrcodesdk/core` is the runtime-neutral foundation of QRCodeSDK.
It turns data into a QR code matrix and lets renderers decide how that matrix becomes SVG, terminal text, PNG, DOM output, or any custom format.

## Install

```sh
npm install @qrcodesdk/core
```

```sh
pnpm add @qrcodesdk/core
```

<details>
<summary>Other package managers</summary>

**vp**

```sh
vp add @qrcodesdk/core
```

**deno**

```sh
deno add @qrcodesdk/core
```

**bun**

```sh
bun add @qrcodesdk/core
```

**yarn**

```sh
yarn add @qrcodesdk/core
```

</details>

## Quick start

```ts
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev').render(QRCodeSVGRenderer());
```

The result is an SVG `string`. See the [SVG renderer reference](https://qrcodesdk.dev/reference/renderers/svg/) for its
options and constraints.

## What Core adds

| Capability                    | API                     | Return type    |
| ----------------------------- | ----------------------- | -------------- |
| Generate a QR matrix          | `qrcode(data).matrix()` | `QRCodeMatrix` |
| Render scalable vector output | `QRCodeSVGRenderer`     | SVG `string`   |
| Render terminal output        | `QRCodeTextRenderer`    | text `string`  |

The complete input, matrix-option, builder-method, and matrix-output contracts live in
[Builder and matrix](https://qrcodesdk.dev/reference/builder/). Shared visual options and scan-safety guidance live in
[Customize appearance](https://qrcodesdk.dev/guides/customize/).

## Runtime compatibility

> `@qrcodesdk/core` supports any JavaScript runtime providing native ESM, ES2020 support, and a global `TextEncoder`.
> It has no Node.js, DOM, filesystem, or framework dependency.

| Runtime                         | Support policy                                     |
| ------------------------------- | -------------------------------------------------- |
| Node.js                         | All maintained LTS lines                           |
| Deno                            | Current stable major                               |
| Bun                             | Current stable release                             |
| Browsers                        | Current evergreen browser families                 |
| Other runtimes and edge workers | Supported when they meet the Core runtime contract |

For runtime-specific output, add the owning package:

| Package                                                         | Additional output                                           | Return type                                     |
| --------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------- |
| [`@qrcodesdk/browser`](https://qrcodesdk.dev/packages/browser/) | Canvas element, PNG-backed Image element, browser downloads | `HTMLCanvasElement`, `HTMLImageElement`, `void` |
| [`@qrcodesdk/node`](https://qrcodesdk.dev/packages/node/)       | PNG bytes                                                   | `Buffer`                                        |
| [`@qrcodesdk/cli`](https://qrcodesdk.dev/packages/cli/)         | Command line generation from terminals and scripts.         | Terminal text, SVG files, PNG files.            |
| [`@qrcodesdk/react`](https://qrcodesdk.dev/packages/react/)     | React SVG, Image, and Canvas components                     | React element                                   |
| [`@qrcodesdk/angular`](https://qrcodesdk.dev/packages/angular/) | Angular SVG, Image, and Canvas components                   | Angular component                               |

Compare every built-in output in [Renderer outputs](https://qrcodesdk.dev/reference/renderers/).

## Public API

```ts
import {
  type QRCodeAccessibilityOptions,
  QRCodeBuilder,
  type QRCodeColorHex,
  type QRCodeCornerDotType,
  type QRCodeCornerSquareType,
  type QRCodeCornersDotOptions,
  type QRCodeCornersSquareOptions,
  type QRCodeDataImageURL,
  type QRCodeDotType,
  type QRCodeDotsOptions,
  type QRCodeErrorCorrectionLevel,
  type QRCodeImageOverlayOptions,
  type QRCodeInputData,
  type QRCodeMask,
  type QRCodeMatrix,
  type QRCodeMatrixOptions,
  type QRCodeMode,
  type QRCodeOptions,
  type QRCodeRenderer,
  type QRCodeSVGImageOptions,
  type QRCodeSVGOptions,
  QRCodeSVGRenderer,
  type QRCodeSVGRendererOptions,
  type QRCodeStylingColors,
  type QRCodeStylingOptions,
  QRCodeTextRenderer,
  type QRCodeTextRendererOptions,
  type QRCodeVersion,
  qrcode,
} from '@qrcodesdk/core';
```

Exports whose names begin with `ɵ` are private integration contracts for QRCodeSDK sibling packages.
They are not part of the public API and can change without compatibility guarantees.

## Documentation

- [@qrcodesdk/core](https://qrcodesdk.dev/packages/core/)
- [Builder and matrix](https://qrcodesdk.dev/reference/builder/)
- [SVG string renderer](https://qrcodesdk.dev/reference/renderers/svg/)
- [Terminal text renderer](https://qrcodesdk.dev/reference/renderers/text/)
- [Customize appearance](https://qrcodesdk.dev/guides/customize/)
