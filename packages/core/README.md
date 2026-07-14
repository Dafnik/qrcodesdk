# @qrcodesdk/core

[![npm version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/core?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/core)
[![npm bundle size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/core?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/core)
[![npm download per month](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/core?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/core)

`@qrcodesdk/core` is the foundation of QRCodeSDK. It turns data into a QR code matrix and lets renderers decide how that matrix becomes SVG, terminal text, PNG, DOM output, or any custom format.

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

Use a mode when you know the shape of your data.

| Mode           | Best for                                              |
| -------------- | ----------------------------------------------------- |
| `numeric`      | Digits only.                                          |
| `alphanumeric` | Uppercase QR alphanumeric data such as `HELLO WORLD`. |
| `octet`        | UTF-8 text, URLs, JSON, emoji, and general byte data. |

If you do not provide a mode, the builder resolves one from the input.

### Methods

The builder is immutable. Each method returns a new builder with the updated option.

| Method                    | Description                                             | Defaults |
| ------------------------- | ------------------------------------------------------- | :------- |
| `.data(value)`            | Sets QR code input data.                                | -        |
| `.config(mode)`           | Sets all options in one call.                           | -        |
| `.mode(mode)`             | Sets the mode: `numeric`, `alphanumeric`, or `octet`.   | `Auto`   |
| `.errorCorrection(level)` | Sets the error correction level: `L`, `M`, `Q`, or `H`. | `M`      |
| `.version(version)`       | Pins a QR code version from `1` to `40`.                | `Auto`   |
| `.mask(mask)`             | Pins a mask from `0` to `7`.                            | `Auto`   |
| `.matrix()`               | Returns the generated `QRCodeMatrix`.                   | -        |
| `.renderer(renderer)`     | Stores a renderer for a later `.render()` call.         | -        |
| `.render(renderer?)`      | Generates the matrix and returns renderer output.       | -        |

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

## Built-in core renderers

`@qrcodesdk/core` includes runtime-neutral renderers:

- [Render SVG](https://qrcodesdk.dev/renderers/core/svg/)
- [Render Terminal Text](https://qrcodesdk.dev/renderers/core/text/)

For runtime-specific output, add:

- [`@qrcodesdk/node`](https://qrcodesdk.dev/libs/node/) for PNG buffers
- [`@qrcodesdk/browser`](https://qrcodesdk.dev/libs/browser/) for Canvas and Image elements

For framework-specific components, add:

- [`@qrcodesdk/angular`](https://qrcodesdk.dev/libs/angular/) for Angular
- [`@qrcodesdk/react`](https://qrcodesdk.dev/libs/react/) for React

## Renderer options

| Option              | Type     |     Default | Description                                   |
| ------------------- | -------- | ----------: | --------------------------------------------- |
| `size`              | `number` |         `5` | Pixel size or text scale of each QR module.   |
| `margin`            | `number` |         `4` | Quiet-zone width in modules.                  |
| `colors.colorDark`  | `string` | `'#000000'` | Dark module color for visual renderers.       |
| `colors.colorLight` | `string` | `'#ffffff'` | Background color for visual renderers.        |
| `alt`               | `string` | `undefined` | Adds an `alt` attribute to SVG output.        |
| `ariaLabel`         | `string` | `undefined` | Adds an `aria-label` attribute to SVG output. |
| `title`             | `string` | `undefined` | Adds a `title` attribute to SVG output.       |

Color options use hash-prefixed values such as `#111827`. Pixel renderers and terminal text require a positive integer `size` and a non-negative integer `margin`.

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

## Public API

```ts
import {
  type QRCodeAccessibilityOptions,
  QRCodeBuilder,
  type QRCodeErrorCorrectionLevel,
  type QRCodeInputData,
  type QRCodeMask,
  type QRCodeMatrix,
  type QRCodeMatrixOptions,
  type QRCodeMode,
  type QRCodeParsedStylingOptions,
  type QRCodeRenderer,
  QRCodeSVGRenderer,
  type QRCodeSVGRendererOptions,
  type QRCodeStylingOptions,
  QRCodeTextRenderer,
  type QRCodeTextRendererOptions,
  type QRCodeVersion,
  parseQRCodeStylingOptions,
  qrcode,
} from '@qrcodesdk/core';
```

## Documentation

- [Builder API](https://qrcodesdk.dev/libs/core/)
- [Render SVG](https://qrcodesdk.dev/renderers/core/svg/)
- [Render terminal text](https://qrcodesdk.dev/renderers/core/text/)
- [Customize QR codes](https://qrcodesdk.dev/guides/customize/)
- [Custom renderers](https://qrcodesdk.dev/libs/core/#custom-renderers)
- [API reference](https://qrcodesdk.dev/reference/api/)
