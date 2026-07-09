---
title: Installation
description: Choose the QRCodeSDK package for your output format and runtime.
---

Most projects start with `@qrcodesdk/core`.

- Install `@qrcodesdk/core` if you need SVG, terminal text, matrix output, or custom renderers.
- Add `@qrcodesdk/node` if you need PNG buffers in Node.js.
- Add `@qrcodesdk/browser` if you need Canvas, Image elements, or browser downloads.
- Install `@qrcodesdk/cli` if you want the `qrc` command for terminal and file output.

## Start with core

Use `@qrcodesdk/core` for runtime-neutral QR code generation.

```sh
pnpm add @qrcodesdk/core
npm install @qrcodesdk/core
yarn add @qrcodesdk/core
bun add @qrcodesdk/core
```

```ts
import {SVGQRCodeRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev').render(SVGQRCodeRenderer());
```

`@qrcodesdk/core` includes:

- `qrcode()` and `QRCodeBuilder`
- SVG string output
- terminal text output
- raw matrix output
- custom renderer support

## Add PNG output in Node.js

Use `@qrcodesdk/node` when the result must be PNG bytes in a Node.js process.

Install it alongside `@qrcodesdk/core`.

```sh
pnpm add @qrcodesdk/core @qrcodesdk/node
npm install @qrcodesdk/core @qrcodesdk/node
yarn add @qrcodesdk/core @qrcodesdk/node
bun add @qrcodesdk/core @qrcodesdk/node
```

```ts
import {qrcode} from '@qrcodesdk/core';
import {PNGQRCodeRenderer} from '@qrcodesdk/node';

const png = qrcode('https://qrcodesdk.dev').render(PNGQRCodeRenderer());
```

Use PNG buffers for files, API responses, downloads, email attachments, and other integrations that expect `image/png` bytes.

## Add browser DOM output

Use `@qrcodesdk/browser` when the result should be a DOM element created in the browser.

Install it alongside `@qrcodesdk/core`.

```sh
pnpm add @qrcodesdk/core @qrcodesdk/browser
npm install @qrcodesdk/core @qrcodesdk/browser
yarn add @qrcodesdk/core @qrcodesdk/browser
bun add @qrcodesdk/core @qrcodesdk/browser
```

```ts
import {ImageQRCodeRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const image = qrcode('https://qrcodesdk.dev').render(
  ImageQRCodeRenderer({
    alt: 'QR code for qrcodesdk.dev',
  }),
);

document.body.append(image);
```

Use browser renderers when you want an `HTMLCanvasElement`, an `HTMLImageElement`, a client-side SVG or PNG download, or DOM/CSS integration.

## Add the CLI

Use `@qrcodesdk/cli` when you want to generate QR codes from a terminal, shell script, or CI job.

Install it globally when you want the `qrc` command available anywhere.

```sh
pnpm add -g @qrcodesdk/cli
npm install -g @qrcodesdk/cli
yarn global add @qrcodesdk/cli
bun add -g @qrcodesdk/cli
```

```sh
qrc "https://qrcodesdk.dev"
qrc "https://qrcodesdk.dev" --output qrcode.svg
qrc "https://qrcodesdk.dev" --output qrcode.png
```

The CLI can print terminal text or write SVG and PNG files.

## Package guide

| Package              | Install when you need                                 | Outputs                                             |
| -------------------- | ----------------------------------------------------- | --------------------------------------------------- |
| `@qrcodesdk/core`    | Runtime-neutral generation and common output formats. | SVG strings, terminal text strings, raw matrices.   |
| `@qrcodesdk/cli`     | Command line generation from terminals and scripts.   | Terminal text, SVG files, PNG files.                |
| `@qrcodesdk/node`    | Server-side PNG generation in Node.js.                | PNG `Buffer`.                                       |
| `@qrcodesdk/browser` | DOM elements and client-side browser workflows.       | `HTMLCanvasElement`, `HTMLImageElement`, downloads. |

## Next steps

- [Render SVG](/renderers/core/svg/)
- [Render PNG in Node.js](/renderers/node/png/)
- [Use the CLI](/guides/cli/)
- [Render to Canvas](/renderers/browser/canvas/)
- [Render to an Image Element](/renderers/browser/image/)
- [Render Terminal Text](/renderers/core/text/)
