<!-- Generated from apps/docs/src/content/docs/packages/core.mdx. Run `pnpm turbo run generate-readmes --filter=docs` to update. -->

<div align="center"><img src="https://qrcodesdk.dev/favicon.svg" alt="QRCodeSDK logo" width="240"></div>

# @qrcodesdk/core

[![Open @qrcodesdk/core on npmx.dev](https://npmx.dev/api/registry/badge/name/@qrcodesdk/core?color=24272c&style=shieldsio)](https://npmx.dev/@qrcodesdk/core) ![@qrcodesdk/core version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/core?color=24272c&label=version&style=shieldsio) ![@qrcodesdk/core install size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/core?color=24272c&label=install%20size&style=shieldsio) ![@qrcodesdk/core download/mo](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/core?color=24272c&label=download%2Fmo&style=shieldsio) [![@qrcodesdk/core source code](https://npmx.dev/api/registry/badge/name/@qrcodesdk/core?color=24272c&label=source%20code&value=GitHub%20%E2%86%97&style=shieldsio)](https://github.com/Dafnik/qrcodesdk/tree/main/packages/core)

**[Documentation](https://qrcodesdk.dev) | [Live Demo](https://qrcodesdk.dev/playground)**

`@qrcodesdk/core` generates QR matrices, SVG strings, and terminal text without browser or Node.js
APIs. Custom renderers can turn its matrices into other formats.

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

| Capability                    | API                        | Return type    |
| ----------------------------- | -------------------------- | -------------- |
| Generate a QR matrix          | `qrcode(payload).matrix()` | `QRCodeMatrix` |
| Render scalable vector output | `QRCodeSVGRenderer`        | SVG `string`   |
| Render terminal output        | `QRCodeTextRenderer`       | text `string`  |

See [Builder and matrix](https://qrcodesdk.dev/reference/builder/) for accepted payloads, matrix options, builder methods,
and matrix output.

## Style the output

Import shapes and pattern parts from `@qrcodesdk/core/style`:

```ts
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';
import {circle, finder, rounded} from '@qrcodesdk/core/style';

const svg = qrcode('https://qrcodesdk.dev').render(
  QRCodeSVGRenderer({
    style: {
      moduleSize: 8,
      foreground: '#0f172a',
      modules: rounded(),
      finder: finder({ring: rounded({radius: 1}), center: circle(), color: '#e11d48'}),
    },
  }),
);
```

See [Customize appearance](https://qrcodesdk.dev/guides/customize/) for style options and custom shapes.

Typed helpers serialize common application values before generation. See
[Payload helpers](https://qrcodesdk.dev/reference/payloads/) for email, phone, SMS, geographic, and Wi-Fi payloads.

## Runtime compatibility

> `@qrcodesdk/core` supports any JavaScript runtime providing native ESM, ES2020 support, and a global `TextEncoder`.
> It has no Node.js, DOM, filesystem, or framework dependency.

| Runtime                         | Support policy                                          |
| ------------------------------- | ------------------------------------------------------- |
| Node.js                         | All maintained LTS lines                                |
| Deno                            | Current stable major                                    |
| Bun                             | Current stable release                                  |
| Browsers                        | Current evergreen browser families                      |
| Other runtimes and edge workers | Native ESM, ES2020, and a global `TextEncoder` required |

For runtime-specific output, add the package for your runtime or framework:

| Package                                                         | Use it for                                                  | Return value                                    |
| --------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------- |
| [`@qrcodesdk/browser`](https://qrcodesdk.dev/packages/browser/) | Canvas element, PNG-backed Image element, browser downloads | `HTMLCanvasElement`, `HTMLImageElement`, `void` |
| [`@qrcodesdk/node`](https://qrcodesdk.dev/packages/node/)       | PNG bytes                                                   | `Buffer`                                        |
| [`@qrcodesdk/cli`](https://qrcodesdk.dev/packages/cli/)         | Command line generation from terminals and scripts          | Terminal text, SVG files, PNG files             |
| [`@qrcodesdk/react`](https://qrcodesdk.dev/packages/react/)     | React SVG, Image, and Canvas components                     | React element                                   |
| [`@qrcodesdk/vue`](https://qrcodesdk.dev/packages/vue/)         | Vue SVG, Image, and Canvas components                       | Vue component                                   |
| [`@qrcodesdk/svelte`](https://qrcodesdk.dev/packages/svelte/)   | Svelte SVG, Image, and Canvas components                    | Svelte component                                |
| [`@qrcodesdk/angular`](https://qrcodesdk.dev/packages/angular/) | Angular SVG, Image, and Canvas components                   | Angular component                               |

Compare every built-in output in [Renderer outputs](https://qrcodesdk.dev/reference/renderers/).

## Public API

The root exports the builder, renderers, errors, and shared types. For direct ESM imports without a
bundler, use `@qrcodesdk/core/matrix`, `@qrcodesdk/core/svg`, `@qrcodesdk/core/text`, or
`@qrcodesdk/core/error` to avoid loading unrelated renderers. Bundled applications can use root
imports with tree shaking.

Import shapes and the finder and alignment parts from `@qrcodesdk/core/style`, the styler, module
roles, and drawing helpers from `@qrcodesdk/core/drawing`, and payload helpers from
`@qrcodesdk/core/payload`. These APIs are available only through those entry points.
`@qrcodesdk/core/drawing` also re-exports the `QRCodeCenterImageLayout`, `QRCodeModuleRole`, and
`QRCodeStylePart` types. See [Custom renderers](https://qrcodesdk.dev/reference/custom-renderers/) for the matrix roles
and the drawing data.

```ts
import {
  type QRCodeAlignmentCenterShape,
  type QRCodeAlignmentRingShape,
  QRCodeBuilder,
  type QRCodeColor,
  type QRCodeDataImageURL,
  QRCodeError,
  type QRCodeErrorCode,
  type QRCodeErrorCorrectionLevel,
  type QRCodeErrorOptions,
  type QRCodeFinderCenterShape,
  type QRCodeFinderRingShape,
  type QRCodeMask,
  type QRCodeMatrix,
  type QRCodeMatrixOptions,
  type QRCodeMode,
  type QRCodeModuleShape,
  type QRCodePayload,
  type QRCodeRenderer,
  type QRCodeSVGAccessibilityOptions,
  type QRCodeSVGCenterImage,
  type QRCodeSVGOptions,
  QRCodeSVGRenderer,
  type QRCodeSVGRendererOptions,
  type QRCodeShape,
  type QRCodeShapePath,
  type QRCodeTextANSIBackgroundOptions,
  type QRCodeTextANSIOptions,
  QRCodeTextRenderer,
  type QRCodeTextRendererOptions,
  type QRCodeTextStyle,
  type QRCodeVersion,
  type QRCodeVisualStyle,
  QR_CODE_ERROR_CODES,
  qrcode,
  svgCenterImage,
} from '@qrcodesdk/core';
import {
  type QRCodeCenterImageBox,
  type QRCodeCenterImageLayout,
  type QRCodeCenterImagePlacement,
  type QRCodeDrawContext,
  type QRCodeDrawLayer,
  type QRCodeDrawing,
  type QRCodeDrawingLayer,
  type QRCodeModuleRole,
  type QRCodeStylePart,
  type QRCodeStyler,
  QR_CODE_MODULE_ROLES,
  createQRCodeCenterImage,
  createQRCodeStyler,
  toQRCodePathData,
} from '@qrcodesdk/core/drawing';
import {
  type QRCodeEmailPayload,
  type QRCodeGeoPayload,
  type QRCodePhonePayload,
  type QRCodeSMSPayload,
  type QRCodeWiFiEncryption,
  type QRCodeWiFiPayload,
  emailPayload,
  geoPayload,
  phonePayload,
  smsPayload,
  wifiPayload,
} from '@qrcodesdk/core/payload';
import {
  type QRCodeAlignmentOptions,
  type QRCodeCircleShapeOptions,
  type QRCodeFinderOptions,
  type QRCodeRoundedShapeOptions,
  alignment,
  circle,
  diagonal,
  finder,
  rounded,
} from '@qrcodesdk/core/style';
```

## Generated output stability

Output is deterministic for one installed implementation, but matrix modules, SVG markup, and PNG
bytes may change between QRCodeSDK releases. Pin exact package versions and keep fixtures when exact
artifacts matter. See the [version and output policy](https://qrcodesdk.dev/project/release-policy/).

## Documentation

- [@qrcodesdk/core](https://qrcodesdk.dev/packages/core/)
- [Builder and matrix](https://qrcodesdk.dev/reference/builder/)
- [Payload helpers](https://qrcodesdk.dev/reference/payloads/)
- [SVG string renderer](https://qrcodesdk.dev/reference/renderers/svg/)
- [Terminal text renderer](https://qrcodesdk.dev/reference/renderers/text/)
- [Customize appearance](https://qrcodesdk.dev/guides/customize/)
