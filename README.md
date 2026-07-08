# QRCodeSDK

A modular TypeScript package family for generating QR codes and rendering them in the format your runtime needs.

`@qrcodesdk/core` builds QR code matrices and includes runtime-neutral SVG and terminal text renderers. `@qrcodesdk/browser` adds DOM element renderers, `@qrcodesdk/node` adds Node.js PNG output, and the framework packages expose the same output through Angular and React components.

## Packages

| Package              | Purpose                                                               | Renderers                                         |
| -------------------- | --------------------------------------------------------------------- | ------------------------------------------------- |
| `@qrcodesdk/core`    | Runtime-neutral QR generation for browsers, servers, CLIs, and tests. | SVG strings, terminal text strings, raw matrices. |
| `@qrcodesdk/browser` | Browser-specific DOM output.                                          | Canvas and image elements.                        |
| `@qrcodesdk/node`    | Node-specific QR output.                                              | PNG `Buffer` output.                              |
| `@qrcodesdk/angular` | Angular component output.                                             | SVG, image, and canvas components.                |
| `@qrcodesdk/react`   | React component output.                                               | SVG, image, and canvas components.                |

## Install

```sh
pnpm add @qrcodesdk/core
```

Install the Node renderer package when you need PNG output:

```sh
pnpm add @qrcodesdk/core @qrcodesdk/node
```

Install the browser renderer package when you need DOM output:

```sh
pnpm add @qrcodesdk/core @qrcodesdk/browser
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

### Browser image

```ts
import {ImageQRCodeRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const image = qrcode('https://qrcodesdk.dev').render(
  ImageQRCodeRenderer({
    alt: 'QRCodeSDK documentation',
  }),
);

document.body.append(image);
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

- [Installation](apps/docs/src/content/docs/guides/installation.md)
- [Core library](apps/docs/src/content/docs/libs/core.md)
- [Renderers](apps/docs/src/content/docs/renderers/index.md)
- [Browser library](apps/docs/src/content/docs/libs/browser.md)
- [Node renderers](apps/docs/src/content/docs/libs/node.md)
- [Angular components](apps/docs/src/content/docs/libs/angular.mdx)
- [React components](apps/docs/src/content/docs/libs/react.mdx)
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
