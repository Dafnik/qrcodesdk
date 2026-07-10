# @qrcodesdk/core

Runtime-neutral QR code generation for TypeScript and JavaScript.

`@qrcodesdk/core` contains the QR builder, matrix generator, SVG renderer, terminal text renderer, shared styling parser, and public types used by the rest of the QRCodeSDK package family.

## Install

```sh
pnpm add @qrcodesdk/core
```

## Render SVG

```ts
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev')
  .renderer(
    QRCodeSVGRenderer({
      size: 6,
      margin: 4,
      colors: {
        colorLight: '#ffffff',
        colorDark: '#111111',
      },
      ariaLabel: 'Open QRCodeSDK',
    }),
  )
  .render();
```

## Render terminal text

```ts
import {QRCodeTextRenderer, qrcode} from '@qrcodesdk/core';

const output = qrcode('HELLO WORLD')
  .mode('alphanumeric')
  .renderer(QRCodeTextRenderer({size: 1, margin: 2}))
  .render();

console.log(output);
```

## Generate a matrix

Use `.matrix()` when you want to inspect QR modules or write a custom renderer.

```ts
import {type QRCodeMatrix, qrcode} from '@qrcodesdk/core';

const matrix: QRCodeMatrix = qrcode('custom renderer').matrix();
```

A matrix is a two-dimensional array where `1` is a dark module and `0` is a light module.

## Builder options

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

| Method                    | Description                                         |
| ------------------------- | --------------------------------------------------- |
| `.data(value)`            | Sets QR input data after creating an empty builder. |
| `.mode(mode)`             | Sets `numeric`, `alphanumeric`, or `octet`.         |
| `.errorCorrection(level)` | Sets `L`, `M`, `Q`, or `H`. Defaults to `M`.        |
| `.version(version)`       | Pins QR version `1` through `40`.                   |
| `.mask(mask)`             | Pins mask `0` through `7`.                          |
| `.matrix()`               | Returns a `QRCodeMatrix`.                           |
| `.renderer(renderer)`     | Stores a renderer for `.render()`.                  |
| `.render(renderer?)`      | Returns renderer output.                            |

## Renderer options

Default styling:

| Option              | Default     |
| ------------------- | ----------- |
| `size`              | `5`         |
| `margin`            | `4`         |
| `colors.colorLight` | `'#ffffff'` |
| `colors.colorDark`  | `'#000000'` |

`QRCodeSVGRenderer` accepts shared styling plus `alt`, `ariaLabel`, and `title`.

`QRCodeTextRenderer` accepts `size` and `margin`. Both must map cleanly to terminal cells: `size` must be a positive integer and `margin` must be a non-negative integer.

## Public API

```ts
import {
  QRCodeBuilder,
  type QRCodeMask,
  type QRCodeMatrix,
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
