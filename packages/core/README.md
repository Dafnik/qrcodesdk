<!-- Generated from apps/docs/src/content/docs/packages/core.mdx. Run `pnpm turbo run generate-readmes --filter=docs` to update. -->

<div align="center"><img src="https://qrcodesdk.dev/favicon.svg" alt="QRCodeSDK logo" width="240"></div>

# @qrcodesdk/core

[![Open @qrcodesdk/core on npmx.dev](https://npmx.dev/api/registry/badge/name/@qrcodesdk/core?color=24272c&style=shieldsio)](https://npmx.dev/@qrcodesdk/core) ![@qrcodesdk/core version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/core?color=24272c&label=version&style=shieldsio) ![@qrcodesdk/core install size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/core?color=24272c&label=install%20size&style=shieldsio) ![@qrcodesdk/core download/mo](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/core?color=24272c&label=download%2Fmo&style=shieldsio) [![@qrcodesdk/core source code](https://npmx.dev/api/registry/badge/name/@qrcodesdk/core?color=24272c&label=source%20code&value=GitHub%20%E2%86%97&style=shieldsio)](https://github.com/Dafnik/qrcodesdk/tree/main/packages/core)

**[Documentation](https://qrcodesdk.dev) | [Live Demo](https://qrcodesdk.dev/playground)**

`@qrcodesdk/core` generates QR matrices, SVG strings, and terminal text. It needs no browser or
Node.js APIs. Custom renderers can turn its matrices into other formats.

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
deno add npm:@qrcodesdk/core
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

The result is an SVG `string`. See the [SVG renderer](https://qrcodesdk.dev/reference/renderers/svg/) for its options.

## What Core adds

| Capability                    | API                        | Return type    |
| ----------------------------- | -------------------------- | -------------- |
| Generate a QR matrix          | `qrcode(payload).matrix()` | `QRCodeMatrix` |
| Render scalable vector output | `QRCodeSVGRenderer`        | SVG `string`   |
| Render terminal output        | `QRCodeTextRenderer`       | text `string`  |

See [Builder and matrix](https://qrcodesdk.dev/reference/builder/) for payloads, matrix options, and builder methods.

## Style the output

Import shape and pattern factories from `@qrcodesdk/core/style`:

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

See [Customize appearance](https://qrcodesdk.dev/guides/customize/) for every style option and custom shapes.

## Encode common values

Typed [payload helpers](https://qrcodesdk.dev/reference/payloads/) turn email, phone, SMS, geographic, and Wi-Fi data
into payload strings. Import them from `@qrcodesdk/core/payload`.

## Runtime compatibility

Core runs in any JavaScript runtime with native ESM, ES2020, and a global `TextEncoder`. It has no
Node.js, DOM, filesystem, or framework dependency.

| Runtime                         | Support policy                                          |
| ------------------------------- | ------------------------------------------------------- |
| Node.js                         | 22.0.0 or newer; tested on 22, 24, and 26               |
| Deno                            | Current stable major                                    |
| Bun                             | Current stable release                                  |
| Browsers                        | Current evergreen browser families                      |
| Other runtimes and edge workers | Native ESM, ES2020, and a global `TextEncoder` required |

Module format:

- The package is ES modules only. CommonJS code needs Node.js 22.12 or newer for `require()`, or a
  dynamic `import()`. See [Module format](https://qrcodesdk.dev/getting-started/choose-your-setup/#module-format).
- TypeScript projects need `moduleResolution: 'bundler'`, `'node16'`, or `'nodenext'` to resolve the
  package's entry points and subpaths.

## Other outputs

Add a runtime or framework package for other outputs:

| Package                                                         | Use it for                                                                 | Return value                                       |
| --------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------- |
| [`@qrcodesdk/browser`](https://qrcodesdk.dev/packages/browser/) | Canvas element, PNG, WebP, GIF, and JPEG Image elements, browser downloads | `HTMLCanvasElement`, `HTMLImageElement`, `void`    |
| [`@qrcodesdk/node`](https://qrcodesdk.dev/packages/node/)       | PNG, WebP, GIF, and JPEG bytes                                             | `Buffer`                                           |
| [`@qrcodesdk/cli`](https://qrcodesdk.dev/packages/cli/)         | Command line generation from terminals and scripts                         | Terminal text, SVG, PNG, WebP, GIF, and JPEG files |
| [`@qrcodesdk/react`](https://qrcodesdk.dev/packages/react/)     | React SVG, PNG, WebP, GIF, JPEG, and Canvas components                     | React element                                      |
| [`@qrcodesdk/vue`](https://qrcodesdk.dev/packages/vue/)         | Vue SVG, PNG, WebP, GIF, JPEG, and Canvas components                       | Vue component                                      |
| [`@qrcodesdk/svelte`](https://qrcodesdk.dev/packages/svelte/)   | Svelte SVG, PNG, WebP, GIF, JPEG, and Canvas components                    | Svelte component                                   |
| [`@qrcodesdk/angular`](https://qrcodesdk.dev/packages/angular/) | Angular SVG, PNG, WebP, GIF, JPEG, and Canvas components                   | Angular component                                  |

Compare every built-in output in [Renderer outputs](https://qrcodesdk.dev/reference/renderers/).

## Public API

| Entry point                 | Contains                                                         |
| --------------------------- | ---------------------------------------------------------------- |
| `@qrcodesdk/core`           | The builder, SVG and text renderers, errors, and shared types    |
| `@qrcodesdk/core/matrix`    | The builder, matrix types, and module role names                 |
| `@qrcodesdk/core/svg`       | The SVG renderer and `svgCenterImage()`                          |
| `@qrcodesdk/core/text`      | The terminal text renderer                                       |
| `@qrcodesdk/core/error`     | `QRCodeError` and its codes                                      |
| `@qrcodesdk/core/style`     | Shape and pattern factories and custom path types                |
| `@qrcodesdk/core/payload`   | Payload helpers                                                  |
| `@qrcodesdk/core/segmenter` | The optional mixed-mode optimizer, available only from this path |

Bundlers with tree shaking drop the parts you do not use. Without tree shaking, for example directly
in Node.js, import from a subpath to avoid loading unrelated renderers.

- Build your own output with [Custom renderers](https://qrcodesdk.dev/reference/custom-renderers/).
- Look up `QRCodeError` codes in the [errors reference](https://qrcodesdk.dev/reference/errors/).

```ts
import {
  type QRCodeDataImageURL,
  QRCodeError,
  type QRCodeErrorCode,
  type QRCodeErrorOptions,
  type QRCodeSVGAccessibilityOptions,
  type QRCodeSVGCenterImage,
  type QRCodeSVGOptions,
  QRCodeSVGRenderer,
  type QRCodeSVGRendererOptions,
  type QRCodeTextANSIBackgroundOptions,
  type QRCodeTextANSIOptions,
  QRCodeTextRenderer,
  type QRCodeTextRendererOptions,
  type QRCodeTextStyle,
  QR_CODE_ERROR_CODES,
  svgCenterImage,
} from '@qrcodesdk/core';
import {
  QRCodeBuilder,
  type QRCodeEncodingMode,
  type QRCodeErrorCorrectionLevel,
  type QRCodeMask,
  type QRCodeMatrix,
  type QRCodeMatrixOptions,
  type QRCodeMode,
  type QRCodeModuleRole,
  type QRCodePayload,
  type QRCodeRenderer,
  type QRCodeSegment,
  type QRCodeSegmenter,
  type QRCodeSegmenterOptions,
  type QRCodeVersion,
  QR_CODE_MODULE_ROLES,
  qrcode,
} from '@qrcodesdk/core/matrix';
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
import {automaticSegmenter} from '@qrcodesdk/core/segmenter';
import {
  type QRCodeAlignmentCenterShape,
  type QRCodeAlignmentOptions,
  type QRCodeAlignmentRingShape,
  type QRCodeAlignmentStyle,
  type QRCodeCenterImageLayout,
  type QRCodeCircleShapeOptions,
  type QRCodeColor,
  type QRCodeFinderCenterShape,
  type QRCodeFinderOptions,
  type QRCodeFinderRingShape,
  type QRCodeFinderStyle,
  type QRCodeModulePattern,
  type QRCodeModuleShape,
  type QRCodeRoundedShapeOptions,
  type QRCodeShape,
  type QRCodeShapePath,
  type QRCodeShapePiece,
  type QRCodeVisualStyle,
  alignment,
  circle,
  customShape,
  diagonal,
  finder,
  rounded,
} from '@qrcodesdk/core/style';
```

## Generated output stability

Output is deterministic for one installed version. Matrix modules, SVG markup, and PNG, WebP, GIF,
and JPEG bytes may change between releases. When exact output matters, pin exact package versions
and keep fixtures. See the [version and output policy](https://qrcodesdk.dev/project/release-policy/).

## Optional mixed-mode segmentation

By default, auto mode picks one encoding mode for the whole payload. Import the optimizer to mix
modes when that makes the QR code smaller:

```ts
import {qrcode} from '@qrcodesdk/core';
import {automaticSegmenter} from '@qrcodesdk/core/segmenter';

qrcode('ABCD12345678901234567890abcd').mode('auto').segmenter(automaticSegmenter).matrix();
```

- `mode: 'auto'` works with or without the segmenter.
- Concrete modes, such as `'octet'`, bypass it.

See [Builder and matrix](https://qrcodesdk.dev/reference/builder/#optional-mixed-mode-optimization) for the callback
contract and version selection.

## Documentation

- [@qrcodesdk/core](https://qrcodesdk.dev/packages/core/)
- [Builder and matrix](https://qrcodesdk.dev/reference/builder/)
- [Payload helpers](https://qrcodesdk.dev/reference/payloads/)
- [SVG string renderer](https://qrcodesdk.dev/reference/renderers/svg/)
- [Terminal text renderer](https://qrcodesdk.dev/reference/renderers/text/)
- [Customize appearance](https://qrcodesdk.dev/guides/customize/)
- [Errors](https://qrcodesdk.dev/reference/errors/)
