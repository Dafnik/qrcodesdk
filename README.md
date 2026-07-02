# QRCodeSDK

A modular TypeScript package family for generating QR codes and rendering them in the format your runtime needs.

`@qrcodesdk/core` builds QR code matrices and includes runtime-neutral SVG and terminal text renderers. `@qrcodesdk/node` adds Node.js PNG output on top of the same builder API.

## Packages

| Package           | Purpose                                                               | Renderers                                         |
| ----------------- | --------------------------------------------------------------------- | ------------------------------------------------- |
| `@qrcodesdk/core` | Runtime-neutral QR generation for browsers, servers, CLIs, and tests. | SVG strings, terminal text strings, raw matrices. |
| `@qrcodesdk/node` | Node-specific QR output.                                              | PNG `Buffer` output.                              |

## Install

```sh
pnpm add @qrcodesdk/core
```

Install the Node renderer package when you need PNG output:

```sh
pnpm add @qrcodesdk/core @qrcodesdk/node
```

## Quick examples

### SVG

```ts
import {SVGQRCodeRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev')
  .renderer(
    SVGQRCodeRenderer({
      size: 6,
      margin: 4,
      colors: {
        colorLight: '#ffffff',
        colorDark: '#111111',
      },
      ariaLabel: 'QRCodeSDK documentation',
    }),
  )
  .render();
```

### Terminal text

```ts
import {QRCodeTextRenderer, qrcode} from '@qrcodesdk/core';

const text = qrcode('HELLO WORLD')
  .mode('alphanumeric')
  .renderer(QRCodeTextRenderer({size: 1, margin: 2}))
  .render();

console.log(text);
```

### PNG in Node.js

```ts
import {writeFileSync} from 'node:fs';

import {qrcode} from '@qrcodesdk/core';
import {PNGQRCodeRenderer} from '@qrcodesdk/node';

const png = qrcode('https://qrcodesdk.dev')
  .renderer(PNGQRCodeRenderer({size: 8, margin: 4}))
  .render();

writeFileSync('qrcode.png', png);
```

## Core concepts

QRCodeSDK separates generation from rendering. The builder creates a QR matrix, and renderers convert that matrix into an output type.

```ts
import {type QRCodeMatrix, qrcode} from '@qrcodesdk/core';

const matrix: QRCodeMatrix = qrcode('custom output').matrix();
```

Defaults are designed for readable output:

| Option              | Default     |
| ------------------- | ----------- |
| Error correction    | `M`         |
| `size`              | `5`         |
| `margin`            | `4`         |
| `colors.colorLight` | `'#ffffff'` |
| `colors.colorDark`  | `'#000000'` |

## Documentation

- [Installation](apps/docs/src/content/docs/guides/installation/core.md)
- [Core library](apps/docs/src/content/docs/libraries/core.md)
- [Core renderers](apps/docs/src/content/docs/core/renderers.md)
- [Node renderers](apps/docs/src/content/docs/libraries/node.md)
- [API reference](apps/docs/src/content/docs/reference/api.md)

## Workspace development

```sh
pnpm install
pnpm build
pnpm test
pnpm check-types
```

Run the docs site:

```sh
pnpm --filter docs start
```
