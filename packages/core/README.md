# @qrcodesdk/core

[![Open @qrcodesdk/core on npmx.dev](https://npmx.dev/api/registry/badge/name/@qrcodesdk/core?color=7469B6&style=shieldsio)](https://npmx.dev/@qrcodesdk/core) ![@qrcodesdk/core version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/core?color=7469B6&label=version&style=shieldsio) ![@qrcodesdk/core install size](<https://npmx.dev/api/registry/badge/size/@qrcodesdk/core?color=7469B6&label=install size&style=shieldsio>) ![@qrcodesdk/core download/mo](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/core?color=7469B6&label=download/mo&style=shieldsio) [![@qrcodesdk/core Source code](<https://npmx.dev/api/registry/badge/name/@qrcodesdk/core?color=7469B6&label=Source code&value=GitHub ↗&style=shieldsio>)](https://github.com/Dafnik/qrcodesdk/tree/main/packages/core)

[![Core runtime compatibility](https://github.com/Dafnik/qrcodesdk/actions/workflows/core-runtime.yml/badge.svg)](https://github.com/Dafnik/qrcodesdk/actions/workflows/core-runtime.yml)

`@qrcodesdk/core` is the runtime-neutral foundation of QRCodeSDK. It turns data into a QR code matrix and lets renderers decide how that matrix becomes SVG, terminal text, PNG, DOM output, or any custom format.

## Install

```sh
npm install @qrcodesdk/core
```

```sh
pnpm add @qrcodesdk/core
```

## Quick start

```ts
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev').render(QRCodeSVGRenderer());
```

`@qrcodesdk/core` includes:

- `qrcode()` and `QRCodeBuilder`
- SVG string output
- terminal text output
- raw matrix output
- custom renderer support

## Runtime compatibility

> `@qrcodesdk/core` supports any JavaScript runtime providing native ESM, ES2020 support, and a global `TextEncoder`.

| Runtime                         | Support policy                                         | CI verification                          |
| ------------------------------- | ------------------------------------------------------ | ---------------------------------------- |
| Node.js                         | All maintained LTS lines                               | Latest Node 22.x and 24.x                |
| Deno                            | Current stable major                                   | Latest Deno 2.x                          |
| Bun                             | Current stable release                                 | Latest stable Bun                        |
| Browsers                        | Current evergreen browser families                     | Playwright Chromium, Firefox, and WebKit |
| Other runtimes and edge workers | Supported with ESM, ES2020, and a global `TextEncoder` | Not individually verified                |

Core has no Node, DOM, filesystem, or framework dependency. Every verified runtime executes the
same published ESM artifact, and no polyfills are bundled. Playwright WebKit is the Safari-class
engine check; it is not a claim that branded Safari runs in Linux CI.

Use [`@qrcodesdk/browser`](https://qrcodesdk.dev/packages/browser/) for DOM-dependent output and
[`@qrcodesdk/node`](https://qrcodesdk.dev/packages/node/) for Node.js PNG buffers.

## Package guide

| Package              | Install when you need                                 | Outputs                                                |
| -------------------- | ----------------------------------------------------- | ------------------------------------------------------ |
| `@qrcodesdk/core`    | Runtime-neutral generation and common output formats. | SVG strings, terminal text strings, raw matrices.      |
| `@qrcodesdk/cli`     | Command line generation from terminals and scripts.   | Terminal text, SVG files, PNG files.                   |
| `@qrcodesdk/browser` | DOM elements and client-side browser workflows.       | `HTMLCanvasElement`, `HTMLImageElement`, downloads.    |
| `@qrcodesdk/angular` | Angular components & download helpers.                | `QRCodeSVG`, `QRCodeImage`, `QRCodeCanvas`, downloads. |
| `@qrcodesdk/react`   | React components & download helpers.                  | `QRCodeSVG`, `QRCodeImage`, `QRCodeCanvas`, downloads. |
| `@qrcodesdk/node`    | Server-side PNG generation in Node.js.                | PNG `Buffer`.                                          |

## Builder API

`qrcode()` accepts `string` or `number` input. The builder is immutable: every configuration method returns a new builder.

```ts
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('HELLO WORLD')
  .mode('alphanumeric')
  .errorCorrection('H')
  .version(4)
  .mask(2)
  .renderer(QRCodeSVGRenderer())
  .render();
```

You can also create an empty builder and provide data later:

```ts
const builder = qrcode().data('https://qrcodesdk.dev');
```

### Data

QRCodeSDK accepts `string` and `number` input.

```ts
qrcode('https://qrcodesdk.dev');
qrcode(1234567890);
```

Number inputs must be non-negative safe integers. Use a string when the value has leading
zeroes or exceeds JavaScript's safe integer range.

Use a mode when you know the shape of your data.

| Mode           | Best for                                              |
| -------------- | ----------------------------------------------------- |
| `numeric`      | Digits only.                                          |
| `alphanumeric` | Uppercase QR alphanumeric data such as `HELLO WORLD`. |
| `octet`        | UTF-8 text, URLs, JSON, emoji, and general byte data. |

If you do not provide a mode, the builder resolves one from the input.

QRCodeSDK implements QR Code Model 2 matrix generation for numeric, alphanumeric, and UTF-8
octet payloads. Kanji mode and structured append are not supported, so this is a documented
subset of ISO/IEC 18004 rather than full feature coverage.

### Methods

The builder is immutable. Each method returns a new builder with the updated option.

| Method                                   | Description                                             | Defaults |
| ---------------------------------------- | ------------------------------------------------------- | :------- |
| `.data(value)`                           | Sets QR code input data.                                | -        |
| `.config(options?: QRCodeMatrixOptions)` | Sets all matrix options in one call.                    | -        |
| `.mode(mode)`                            | Sets the mode: `numeric`, `alphanumeric`, or `octet`.   | `Auto`   |
| `.errorCorrection(level)`                | Sets the error correction level: `L`, `M`, `Q`, or `H`. | `M`      |
| `.version(version)`                      | Pins a QR code version from `1` to `40`.                | `Auto`   |
| `.mask(mask)`                            | Pins a mask from `0` to `7`.                            | `Auto`   |
| `.matrix()`                              | Returns the generated `QRCodeMatrix`.                   | -        |
| `.renderer(renderer)`                    | Stores a renderer for a later `.render()` call.         | -        |
| `.render(renderer?)`                     | Generates the matrix and returns renderer output.       | -        |

For example, configure multiple matrix options together:

```ts
qrcode('https://qrcodesdk.dev').config({
  mode: 'octet',
  errorCorrectionLevel: 'H',
  version: 4,
  mask: 2,
});
```

### Error correction

The default error correction level is `M`.

```ts
qrcode('https://qrcodesdk.dev').errorCorrection('H');
```

Available levels are `L`, `M`, `Q`, and `H`. Higher levels can survive more damage, but they reduce capacity and can require a larger QR code version.

### Version and mask

Most applications should let the builder choose the version and mask automatically.

```ts
const matrix = qrcode('HELLO WORLD').mode('alphanumeric').version(1).mask(2).matrix();
```

Versions range from `1` to `40`. Masks range from `0` to `7`.

Capacity depends on both the encoding mode and error correction level. When a pinned version
cannot contain the payload, matrix generation throws `QRCode: Data too large`. Removing the
version override helps only when a larger supported version can fit the payload. If automatic
selection cannot fit any version, reduce or change the payload.

## Built-in core renderers

`@qrcodesdk/core` includes runtime-neutral renderers:

- [Render SVG](https://qrcodesdk.dev/renderers/core/svg/)
- [Render Terminal Text](https://qrcodesdk.dev/renderers/core/text/)

For runtime-specific output, add:

- [`@qrcodesdk/node`](https://qrcodesdk.dev/packages/node/) for PNG buffers
- [`@qrcodesdk/browser`](https://qrcodesdk.dev/packages/browser/) for Canvas and Image elements

For framework-specific components, add:

- [`@qrcodesdk/angular`](https://qrcodesdk.dev/packages/angular/) for Angular
- [`@qrcodesdk/react`](https://qrcodesdk.dev/packages/react/) for React

## Renderer options

| Option                  | Type                         |            Default | Description                                                 |
| ----------------------- | ---------------------------- | -----------------: | ----------------------------------------------------------- |
| `size`                  | `number`                     |                `5` | Pixel size or text scale of each QR module.                 |
| `margin`                | `number`                     |                `4` | Quiet-zone width in modules.                                |
| `colors.colorDark`      | `string`                     |        `'#000000'` | Dark module or ANSI foreground color.                       |
| `colors.colorLight`     | `string`                     |        `'#ffffff'` | Background color for visual and ANSI text renderers.        |
| `dotsOptions`           | `QRCodeDotsOptions`          | `{type: 'square'}` | Ordinary-module shape and optional color for visual output. |
| `cornersSquareOptions`  | `QRCodeCornersSquareOptions` | `{type: 'square'}` | Finder-ring shape and optional color for visual output.     |
| `cornersDotOptions`     | `QRCodeCornersDotOptions`    | `{type: 'square'}` | Finder-center shape and optional color for visual output.   |
| `small`                 | `boolean`                    |             `true` | Packs two text-renderer rows into each terminal line.       |
| `ansiColors`            | `boolean`                    |            `false` | Enables ANSI colors for terminal text.                      |
| `onlyAnsiColors`        | `boolean`                    |            `false` | Uses ANSI background cells without UTF-8 block glyphs.      |
| `alt`                   | `string`                     |        `undefined` | Adds an `alt` attribute to SVG output.                      |
| `ariaLabel`             | `string`                     |        `undefined` | Adds an `aria-label` attribute to SVG output.               |
| `title`                 | `string`                     |        `undefined` | Adds a `title` attribute to SVG output.                     |
| `image.source`          | `QRCodeDataImageURL`         |        `undefined` | Embedded image data URL used by SVG output.                 |
| `image.size`            | `number`                     |              `0.4` | Image-box side relative to the QR matrix area.              |
| `image.padding`         | `number`                     |                `1` | Background-clearing padding in QR module units.             |
| `image.clearBackground` | `boolean`                    |             `true` | Clears QR modules behind the image and padding.             |

Color options use six-digit hash-prefixed values such as `#111827`. All renderers require a positive safe integer `size` and a non-negative safe integer `margin`. Terminal text is compact plain UTF-8 by default; ANSI styling and full-height `██` output are enabled independently with `ansiColors: true` and `small: false`. Use `onlyAnsiColors: true` for ANSI background cells containing spaces instead of UTF-8 block glyphs.

Feature colors independently inherit `colors.colorDark`. Visual shape options are supported by
SVG, browser Canvas/Image, and Node PNG output; they do not affect terminal text geometry.

## Styling contract

All built-in renderers apply shared defaults and validate resolved styling before producing output.
Custom renderers receive the generated matrix and can define their own output geometry.

### Prepared SVG images

SVG output accepts one centered image whose source is already embedded as a `data:image/...` URL.
The renderer performs no URL or filesystem I/O.

```ts
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

const response = await fetch('/logo.png');
const bytes = new Uint8Array(await response.arrayBuffer());
const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
const source = `data:image/png;base64,${btoa(binary)}` as const;

const svg = qrcode('https://qrcodesdk.dev', {
  errorCorrectionLevel: 'H',
}).render(QRCodeSVGRenderer({image: {source, size: 0.25}}));
```

The image is fitted without cropping. Large overlays, including the accepted maximum `size: 1`,
can cover too many modules to scan; keep overlays small and test the final QR code with the intended
scanners.

## Matrix output and custom renderers

Use `.matrix()` to inspect modules or take full control over rendering. A matrix is a two-dimensional array where `1` is dark and `0` is light.

```ts
import {type QRCodeMatrix, qrcode} from '@qrcodesdk/core';

const matrix: QRCodeMatrix = qrcode('custom output').matrix();
```

A renderer is any function that receives a matrix and returns an output value:

```ts
import {type QRCodeRenderer, qrcode} from '@qrcodesdk/core';

const jsonRenderer: QRCodeRenderer<string> = (matrix) =>
  JSON.stringify({size: matrix.length, matrix});

const json = qrcode('renderer output').render(jsonRenderer);
```

Renderers can be passed directly to `.render(renderer)` or stored with `.renderer(renderer).render()`.

## Styling primitive types

The style-plan types exported by `@qrcodesdk/core` describe the platform-neutral primitives used
inside the built-in visual renderers.

| Export                             | Contract                                                                     |
| ---------------------------------- | ---------------------------------------------------------------------------- |
| `QRCodeStylePlan`                  | Platform-neutral dimensions, background, curve flag, and ordered primitives. |
| `QRCodeStylePrimitive`             | Union of module, finder-ring, and finder-center primitives.                  |
| `QRCodeModuleStylePrimitive`       | Shape, role, color, position, size, and rotation for an ordinary module.     |
| `QRCodeFinderRingStylePrimitive`   | Styling primitive for a finder pattern's outer ring.                         |
| `QRCodeFinderCenterStylePrimitive` | Styling primitive for a finder pattern's center.                             |
| `QRCodeStyleRole`                  | Primitive role: `dots`, `cornersSquare`, or `cornersDot`.                    |
| `QRCodeModuleShape`                | Resolved geometry used to draw an ordinary module.                           |
| `QRCodeStyleRotation`              | Clockwise primitive rotation: `0`, `90`, `180`, or `270` degrees.            |

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
  type QRCodeFinderCenterStylePrimitive,
  type QRCodeFinderRingStylePrimitive,
  type QRCodeImageOverlayOptions,
  type QRCodeInputData,
  type QRCodeMask,
  type QRCodeMatrix,
  type QRCodeMatrixOptions,
  type QRCodeMode,
  type QRCodeModuleShape,
  type QRCodeModuleStylePrimitive,
  type QRCodeOptions,
  type QRCodeParsedStylingOptions,
  type QRCodeRenderer,
  type QRCodeSVGImageOptions,
  type QRCodeSVGOptions,
  QRCodeSVGRenderer,
  type QRCodeSVGRendererOptions,
  type QRCodeStylePlan,
  type QRCodeStylePrimitive,
  type QRCodeStyleRole,
  type QRCodeStyleRotation,
  type QRCodeStylingColors,
  type QRCodeStylingOptions,
  QRCodeTextRenderer,
  type QRCodeTextRendererOptions,
  type QRCodeVersion,
  qrcode,
} from '@qrcodesdk/core';
```

Exports whose names begin with `ɵ` are private integration contracts for QRCodeSDK's sibling
packages. They are not part of the public API and can change without compatibility guarantees.

## Documentation

- [Builder API](https://qrcodesdk.dev/packages/core/)
- [Render SVG](https://qrcodesdk.dev/renderers/core/svg/)
- [Render terminal text](https://qrcodesdk.dev/renderers/core/text/)
- [Customize QR codes](https://qrcodesdk.dev/advanced/customize/)
- [Custom renderers](https://qrcodesdk.dev/advanced/custom-renderers/)
