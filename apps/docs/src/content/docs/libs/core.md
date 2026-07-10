---
title: Builder API
description: Use @qrcodesdk/core to generate QR matrices, render runtime-neutral output, and build custom renderers.
---

`@qrcodesdk/core` is the foundation of QRCodeSDK. It turns data into a QR code matrix and lets renderers decide how that matrix becomes SVG, terminal text, PNG, DOM output, or any custom format.

Install it when you need:

- `qrcode()` and the immutable builder API
- SVG output
- terminal text output
- matrix output
- custom renderers

## Builder API

Start with `qrcode()` and chain the options you need.

```ts
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev')
  .mode('octet')
  .errorCorrection('M')
  .version(4)
  .mask(2)
  .renderer(QRCodeSVGRenderer())
  .render();
```

You can also create the builder first and provide data later.

```ts
import {QRCodeTextRenderer, qrcode} from '@qrcodesdk/core';

const terminalRenderer = QRCodeTextRenderer({size: 1, margin: 2});

const output = qrcode()
  .data('HELLO WORLD')
  .mode('alphanumeric')
  .renderer(terminalRenderer)
  .render();
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
| `.data(value)`            | Sets QR input data.                                     | -        |
| `.config(mode)`           | Sets all options in one call.                           | -        |
| `.mode(mode)`             | Sets the mode: `numeric`, `alphanumeric`, or `octet`.   | `Auto`   |
| `.errorCorrection(level)` | Sets the error correction level: `L`, `M`, `Q`, or `H`. | `M`      |
| `.version(version)`       | Pins a QR version from `1` to `40`.                     | `Auto`   |
| `.mask(mask)`             | Pins a mask from `0` to `7`.                            | `Auto`   |
| `.matrix()`               | Returns the generated `QRCodeMatrix`.                   | -        |
| `.renderer(renderer)`     | Stores a renderer for a later `.render()` call.         | -        |
| `.render(renderer?)`      | Generates the matrix and returns renderer output.       | -        |

### Error correction

The default error correction level is `M`.

```ts
qrcode('https://qrcodesdk.dev').errorCorrection('H');
```

Available levels are `L`, `M`, `Q`, and `H`. Higher levels can survive more damage, but they reduce capacity and can require a larger QR version.

### Version and mask

Most applications should let the builder choose the version and mask automatically.

```ts
const matrix = qrcode('HELLO WORLD').mode('alphanumeric').version(1).mask(2).matrix();
```

Versions range from `1` to `40`. Masks range from `0` to `7`.

## Matrix output

Use `.matrix()` when you want to build your own renderer or inspect the QR code directly.

```ts
import {type QRCodeMatrix, qrcode} from '@qrcodesdk/core';

const matrix: QRCodeMatrix = qrcode('custom renderer').matrix();
```

A matrix is a two-dimensional array of modules. `1` means dark and `0` means light.

## Custom renderers

A renderer is a function that receives a matrix and returns any output type.

```ts
import {type QRCodeRenderer, qrcode} from '@qrcodesdk/core';

const jsonRenderer: QRCodeRenderer<string> = (matrix) =>
  JSON.stringify({size: matrix.length, matrix});

const json = qrcode('renderer output').render(jsonRenderer);
```

Renderers can be passed directly to `.render(renderer)` or stored with `.renderer(renderer).render()`.

## Built-in core renderers

`@qrcodesdk/core` includes runtime-neutral renderers:

- [Render SVG](/renderers/core/svg/)
- [Render Terminal Text](/renderers/core/text/)

For runtime-specific output, add:

- [`@qrcodesdk/node`](/libs/node/) for PNG buffers
- [`@qrcodesdk/browser`](/libs/browser/) for Canvas and Image elements

For framework-specific components, add:

- [`@qrcodesdk/angular`](/libs/angular/) for Angular
- [`@qrcodesdk/react`](/libs/react/) for React
