<!-- Generated from apps/docs/src/content/docs/packages/node.mdx. Run `pnpm --filter docs generate-readmes` to update. -->

<p align="center"><img src="https://qrcodesdk.dev/favicon.svg" alt="QRCodeSDK logo" width="240"></p>

# @qrcodesdk/node

[![Open @qrcodesdk/node on npmx.dev](https://npmx.dev/api/registry/badge/name/@qrcodesdk/node?color=7469B6&style=shieldsio)](https://npmx.dev/@qrcodesdk/node) ![@qrcodesdk/node version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/node?color=7469B6&label=version&style=shieldsio) ![@qrcodesdk/node install size](<https://npmx.dev/api/registry/badge/size/@qrcodesdk/node?color=7469B6&label=install size&style=shieldsio>) ![@qrcodesdk/node download/mo](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/node?color=7469B6&label=download/mo&style=shieldsio) [![@qrcodesdk/node Source code](<https://npmx.dev/api/registry/badge/name/@qrcodesdk/node?color=7469B6&label=Source code&value=GitHub ↗&style=shieldsio>)](https://github.com/Dafnik/qrcodesdk/tree/main/packages/node)

Node.js renderers for QRCodeSDK. Use this package with `@qrcodesdk/core` when you need a PNG `Buffer` for files, HTTP responses, downloads, email attachments, or other server-side integrations.

## Runtime requirements

`@qrcodesdk/node` requires Node.js 22.0.0 or newer. Packed consumers are verified in CI on Node
22.0.0 and the latest Node 24.x release. Installation through another package manager does not
mean that the package is verified under that package manager's JavaScript runtime.

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
    dotsOptions: {type: 'rounded'},
    cornersSquareOptions: {type: 'extra-rounded', color: '#7c3aed'},
    cornersDotOptions: {type: 'dot'},
  }),
);
```

`QRCodePNGRenderer()` returns a Node.js `Buffer` containing a square, fully opaque PNG image.

## Options

| Option                  | Type                         |            Default | Description                               |
| ----------------------- | ---------------------------- | -----------------: | ----------------------------------------- |
| `size`                  | `number`                     |                `5` | Pixel size of each QR module.             |
| `margin`                | `number`                     |                `4` | Quiet-zone width in modules.              |
| `colors.colorDark`      | `string`                     |        `'#000000'` | Dark module color.                        |
| `colors.colorLight`     | `string`                     |        `'#ffffff'` | Background color.                         |
| `dotsOptions`           | `QRCodeDotsOptions`          | `{type: 'square'}` | Ordinary module shape and optional color. |
| `cornersSquareOptions`  | `QRCodeCornersSquareOptions` | `{type: 'square'}` | Finder-ring shape and optional color.     |
| `cornersDotOptions`     | `QRCodeCornersDotOptions`    | `{type: 'square'}` | Finder-center shape and optional color.   |
| `image.source`          | `Buffer`                     |        `undefined` | PNG bytes loaded by the caller.           |
| `image.size`            | `number`                     |              `0.4` | Relative centered image-box size.         |
| `image.padding`         | `number`                     |                `1` | Clear padding in QR modules.              |
| `image.clearBackground` | `boolean`                    |             `true` | Clears modules behind the image.          |

Colors must be six-digit hex values such as `#111827`. `size` must be a positive integer and `margin` must be a non-negative integer.

All feature colors inherit `colors.colorDark` when omitted. Curves are rendered with deterministic
subpixel coverage and blended into the opaque background.

### Prepared PNG images

Load PNG bytes before calling the renderer:

```ts
import {readFile} from 'node:fs/promises';

const logo = await readFile('./logo.png');
const png = qrcode('https://qrcodesdk.dev')
  .errorCorrection('H')
  .render(QRCodePNGRenderer({image: {source: logo, size: 0.3}}));
```

The renderer synchronously decodes and composites the provided buffer but performs no filesystem or
network I/O. Only PNG source bytes are accepted.

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
import {
  type QRCodePNGImageOptions,
  QRCodePNGRenderer,
  type QRCodePNGRendererOptions,
} from '@qrcodesdk/node';
```

## Documentation

- [@qrcodesdk/node](https://qrcodesdk.dev/packages/node/)
- [Installation](https://qrcodesdk.dev/getting-started/installation/)
- [Render PNG in Node.js](https://qrcodesdk.dev/renderers/node/png/)
- [Customize QR Codes](https://qrcodesdk.dev/advanced/customize/)
