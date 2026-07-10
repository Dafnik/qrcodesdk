# @qrcodesdk/node

Node.js renderers for QRCodeSDK.

`@qrcodesdk/node` extends `@qrcodesdk/core` with renderers that depend on Node.js packages or server-side APIs. Today it provides PNG output as a Node `Buffer`.

## Install

```sh
pnpm add @qrcodesdk/core @qrcodesdk/node
```

## Render a PNG

```ts
import {writeFileSync} from 'node:fs';

import {qrcode} from '@qrcodesdk/core';
import {QRCodePNGRenderer} from '@qrcodesdk/node';

const png = qrcode('https://qrcodesdk.dev')
  .renderer(
    QRCodePNGRenderer({
      size: 8,
      margin: 4,
      colors: {
        colorLight: '#ffffff',
        colorDark: '#111111',
      },
    }),
  )
  .render();

writeFileSync('qrcode.png', png);
```

## Output type

`QRCodePNGRenderer()` returns a renderer whose output is a Node `Buffer`.

```ts
import {qrcode} from '@qrcodesdk/core';
import {QRCodePNGRenderer} from '@qrcodesdk/node';

const png: Buffer = qrcode('buffer output').render(QRCodePNGRenderer());
```

## Options

The PNG renderer uses the shared QRCodeSDK styling shape.

| Option              | Default     | Description                                                         |
| ------------------- | ----------- | ------------------------------------------------------------------- |
| `size`              | `5`         | Pixel size for each QR module. Must be a positive integer.          |
| `margin`            | `4`         | Light modules around the QR matrix. Must be a non-negative integer. |
| `colors.colorLight` | `'#ffffff'` | Background pixel color.                                             |
| `colors.colorDark`  | `'#000000'` | Foreground module pixel color.                                      |

Colors must be six-digit hex values such as `#ffffff` or `#111111`.

## Public API

```ts
import {QRCodePNGRenderer, type QRCodePNGRendererOptions} from '@qrcodesdk/node';
```
