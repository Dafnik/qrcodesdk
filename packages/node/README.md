<!-- Generated from apps/docs/src/content/docs/libs/node.mdx. Run `pnpm --filter docs generate-readmes` to update. -->

# @qrcodesdk/node

[![npm version](https://npmx.dev/api/registry/badge/version/@angular/core?color=7469B6&style=shieldsio)](https://npmx.dev/package/@angular/core) [![npm bundle size](https://npmx.dev/api/registry/badge/size/@angular/core?color=7469B6&style=shieldsio)](https://npmx.dev/package/@angular/core) [![npm downloads per month](https://npmx.dev/api/registry/badge/downloads-month/@angular/core?color=7469B6&style=shieldsio)](https://npmx.dev/package/@angular/core)

Node.js renderers for QRCodeSDK. Use this package with `@qrcodesdk/core` when you need a PNG `Buffer` for files, HTTP responses, downloads, email attachments, or other server-side integrations.

## Install

```sh
npm install @qrcodesdk/core @qrcodesdk/node
```

```sh
pnpm add @qrcodesdk/core @qrcodesdk/node
```

<details>
<summary>Other package managers</summary>

**vp**

```sh
vp add @qrcodesdk/core @qrcodesdk/node
```

**deno**

```sh
deno add @qrcodesdk/core @qrcodesdk/node
```

**bun**

```sh
bun add @qrcodesdk/core @qrcodesdk/node
```

**yarn**

```sh
yarn add @qrcodesdk/core @qrcodesdk/node
```

</details>

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

`@qrcodesdk/node` provides Node-specific renderers and does not replace `@qrcodesdk/core`. The core package still provides `qrcode()`, matrix generation, builder options, and shared styling normalization.

## Public API

```ts
import {QRCodePNGRenderer, type QRCodePNGRendererOptions} from '@qrcodesdk/node';
```

## Documentation

- [@qrcodesdk/node](https://qrcodesdk.dev/libs/node/)
- [Installation](https://qrcodesdk.dev/guides/installation/)
- [Render PNG in Node.js](https://qrcodesdk.dev/renderers/node/png/)
- [Customize QR Codes](https://qrcodesdk.dev/guides/customize/)
