---
title: Render PNG in Node.js
description: Render a QR code as a PNG Buffer with @qrcodesdk/node.

related:
  - ../../getting-started/installation.mdx
  - ../../advanced/customize.md
  - ../core/svg.md
---

Use this when you need raster image bytes in Node.js, such as a file saved to disk, an API response, a downloadable asset, an email attachment, or any integration that expects PNG image bytes.

## Minimal example

```ts
import {qrcode} from '@qrcodesdk/core';
import {QRCodePNGRenderer} from '@qrcodesdk/node';

const png = qrcode('https://qrcodesdk.dev').render(QRCodePNGRenderer());
```

The returned value is a Node.js `Buffer` containing PNG image bytes.

## Common options

You can customize the PNG output by passing styling options to `QRCodePNGRenderer`.

```ts
import {qrcode} from '@qrcodesdk/core';
import {QRCodePNGRenderer} from '@qrcodesdk/node';

const png = qrcode('https://qrcodesdk.dev').render(
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

| Option                       |                     Type |            Default | Description                                       |
| ---------------------------- | -----------------------: | -----------------: | ------------------------------------------------- |
| `size`                       |                 `number` |                `5` | Pixel size of each QR module.                     |
| `margin`                     |                 `number` |                `4` | Quiet-zone margin around the QR code, in modules. |
| `colors.colorDark`           |                 `string` |        `'#000000'` | Color used for dark QR modules.                   |
| `colors.colorLight`          |                 `string` |        `'#ffffff'` | Background color.                                 |
| `dotsOptions.type`           |          `QRCodeDotType` |         `'square'` | Shape used for ordinary data modules.             |
| `dotsOptions.color`          |                 `string` | `colors.colorDark` | Color used for ordinary data modules.             |
| `cornersSquareOptions.type`  | `QRCodeCornerSquareType` |         `'square'` | Shape used for finder outer rings.                |
| `cornersSquareOptions.color` |                 `string` | `colors.colorDark` | Color used for finder outer rings.                |
| `cornersDotOptions.type`     |    `QRCodeCornerDotType` |         `'square'` | Shape used for finder centers.                    |
| `cornersDotOptions.color`    |                 `string` | `colors.colorDark` | Color used for finder centers.                    |
| `image.source`               |                 `Buffer` |        `undefined` | PNG bytes already loaded by the caller.           |
| `image.size`                 |                 `number` |              `0.4` | Image box as a fraction of matrix width.          |
| `image.padding`              |                 `number` |                `1` | Clear padding in QR module units.                 |
| `image.clearBackground`      |                `boolean` |             `true` | Clears modules behind the image and padding.      |

Colors must be 6-digit hex values such as `'#000000'`, `'#ffffff'`, or `'#111827'`.

Data-module types are `square`, `rounded`, `dots`, `classy`, `classy-rounded`, and
`extra-rounded`. Finder rings and centers additionally support `dot`. Each feature color override
is independent; omit it to inherit `colors.colorDark`.

### Add prepared PNG bytes

Read or download the PNG before invoking the renderer. `QRCodePNGRenderer` decodes the supplied
bytes in memory but performs no filesystem or network I/O.

```ts
import {readFile} from 'node:fs/promises';

import {qrcode} from '@qrcodesdk/core';
import {QRCodePNGRenderer} from '@qrcodesdk/node';

const logo = await readFile('./logo.png');

const png = qrcode('https://qrcodesdk.dev')
  .errorCorrection('H')
  .render(
    QRCodePNGRenderer({
      image: {
        source: logo,
        size: 0.3,
        padding: 1,
        clearBackground: true,
      },
    }),
  );
```

Only PNG source bytes are accepted. The source is centered, resized without cropping, and
alpha-composited into the opaque output. Although `size` values through `1` are valid, large
overlays can prevent scanning.

## Common recipes

### Save to disk

```ts
import {writeFile} from 'node:fs/promises';

import {qrcode} from '@qrcodesdk/core';
import {QRCodePNGRenderer} from '@qrcodesdk/node';

const png = qrcode('https://qrcodesdk.dev').render(QRCodePNGRenderer());

await writeFile('qrcode.png', png);
```

### Serve with Express

```ts
import express from 'express';

import {qrcode} from '@qrcodesdk/core';
import {QRCodePNGRenderer} from '@qrcodesdk/node';

const app = express();

app.get('/qrcode.png', (_req, res) => {
  const png = qrcode('https://qrcodesdk.dev').render(QRCodePNGRenderer());

  res.type('image/png').send(png);
});

app.listen(3000);
```

### Return from Hono

```ts
import {serve} from '@hono/node-server';
import {Hono} from 'hono';

import {qrcode} from '@qrcodesdk/core';
import {QRCodePNGRenderer} from '@qrcodesdk/node';

const app = new Hono();

app.get('/qrcode.png', (c) => {
  const png = qrcode('https://qrcodesdk.dev').render(QRCodePNGRenderer());

  return c.body(png, 200, {
    'Content-Type': 'image/png',
  });
});

serve({
  fetch: app.fetch,
  port: 3000,
});
```
