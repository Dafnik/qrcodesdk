# @qrcodesdk/node

[![npm version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/node?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/node)
[![npm bundle size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/node?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/node)
[![npm download per month](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/node?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/node)

**[Live Demo](https://qrcodesdk.dev/playground/)**

Node.js renderers for QRCodeSDK. Use this package with `@qrcodesdk/core` when you need a PNG `Buffer` for files, HTTP responses, downloads, email attachments, or other server-side integrations.

## Install

```sh
npm install @qrcodesdk/core @qrcodesdk/node
```

```sh
pnpm add @qrcodesdk/core @qrcodesdk/node
```

## Render PNG output

```ts
import {qrcode} from '@qrcodesdk/core';
import {QRCodePNGRenderer} from '@qrcodesdk/node';

const png: Buffer = qrcode('https://qrcodesdk.dev').render(
  QRCodePNGRenderer({
    size: 8,
    margin: 4,
    colors: {
      colorDark: '#111827',
      colorLight: '#ffffff',
    },
  }),
);
```

`QRCodePNGRenderer()` returns a Node.js `Buffer` containing a square, fully opaque PNG image.

## Options

| Option              | Type     |     Default | Description                   |
| ------------------- | -------- | ----------: | ----------------------------- |
| `size`              | `number` |         `5` | Pixel size of each QR module. |
| `margin`            | `number` |         `4` | Quiet-zone width in modules.  |
| `colors.colorDark`  | `string` | `'#000000'` | Dark module color.            |
| `colors.colorLight` | `string` | `'#ffffff'` | Background color.             |

Colors must be six-digit hex values such as `#111827`. `size` must be a positive integer and `margin` must be a non-negative integer.

## Save to disk

```ts
import {writeFile} from 'node:fs/promises';

import {qrcode} from '@qrcodesdk/core';
import {QRCodePNGRenderer} from '@qrcodesdk/node';

const png = qrcode('https://qrcodesdk.dev').render(QRCodePNGRenderer());

await writeFile('qrcode.png', png);
```

## Send an HTTP response

The returned buffer can be sent from any Node.js HTTP framework as `image/png`:

```ts
import {createServer} from 'node:http';

import {qrcode} from '@qrcodesdk/core';
import {QRCodePNGRenderer} from '@qrcodesdk/node';

createServer((_request, response) => {
  const png = qrcode('https://qrcodesdk.dev').render(QRCodePNGRenderer());

  response.writeHead(200, {
    'Content-Length': png.length,
    'Content-Type': 'image/png',
  });
  response.end(png);
}).listen(3000);
```

## Package boundary

`@qrcodesdk/node` provides Node-specific renderers and does not replace Core. Import `qrcode()`, matrix options, and shared styling from `@qrcodesdk/core`.

## Public API

```ts
import {QRCodePNGRenderer, type QRCodePNGRendererOptions} from '@qrcodesdk/node';
```

## Documentation

- [Node library](https://qrcodesdk.dev/libs/node/)
- [Render PNG in Node.js](https://qrcodesdk.dev/renderers/node/png/)
- [Customize QR codes](https://qrcodesdk.dev/guides/customize/)
- [API reference](https://qrcodesdk.dev/reference/api/)
