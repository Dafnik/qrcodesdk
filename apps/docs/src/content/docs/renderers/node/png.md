---
title: Node PNG Renderer
description: The Node PNG renderer outputs a QR code as a PNG Buffer. Use it when you need a raster image such as a file saved to disk, an API response, a downloadable asset, an email attachment, or any integration that expects PNG image bytes.
---

The Node PNG renderer outputs a QR code as a PNG `Buffer`.

Use it when you need a raster image such as a file saved to disk, an API response, a downloadable asset, an email attachment, or any integration that expects PNG image bytes.

## Minimal example

```ts
import {qrcode} from '@qrcodesdk/core';
import {PNGQRCodeRenderer} from '@qrcodesdk/node';

const png = qrcode('https://qrcodesdk.dev').render(PNGQRCodeRenderer());
```

The returned value is a Node.js `Buffer` containing PNG image bytes.

## Styling options

You can customize the PNG output by passing styling options to `PNGQRCodeRenderer`.

```ts
import {qrcode} from '@qrcodesdk/core';
import {PNGQRCodeRenderer} from '@qrcodesdk/node';

const png = qrcode('https://qrcodesdk.dev').render(
  PNGQRCodeRenderer({
    size: 8,
    margin: 4,
    colors: {
      colorDark: '#111827',
      colorLight: '#ffffff',
    },
  }),
);
```

### Options

| Option              |     Type |     Default | Description                                       |
| ------------------- | -------: | ----------: | ------------------------------------------------- |
| `size`              | `number` |         `5` | Pixel size of each QR module.                     |
| `margin`            | `number` |         `4` | Quiet-zone margin around the QR code, in modules. |
| `colors.colorDark`  | `string` | `'#000000'` | Color used for dark QR modules.                   |
| `colors.colorLight` | `string` | `'#ffffff'` | Background color.                                 |

Colors must be 6-digit hex values such as `'#000000'`, `'#ffffff'`, or `'#111827'`.

## Node.js examples

Because the PNG renderer returns a `Buffer`, you can write it directly to disk or send it from an HTTP server.

### Save to disk

```ts
import {writeFile} from 'node:fs/promises';

import {qrcode} from '@qrcodesdk/core';
import {PNGQRCodeRenderer} from '@qrcodesdk/node';

const png = qrcode('https://qrcodesdk.dev').render(PNGQRCodeRenderer());

await writeFile('qrcode.png', png);
```

### Serve with Express

```ts
import express from 'express';

import {qrcode} from '@qrcodesdk/core';
import {PNGQRCodeRenderer} from '@qrcodesdk/node';

const app = express();

app.get('/qrcode.png', (_req, res) => {
  const png = qrcode('https://qrcodesdk.dev').render(PNGQRCodeRenderer());

  res.type('image/png').send(png);
});

app.listen(3000);
```

### Serve with Fastify

```ts
import Fastify from 'fastify';

import {qrcode} from '@qrcodesdk/core';
import {PNGQRCodeRenderer} from '@qrcodesdk/node';

const fastify = Fastify();

fastify.get('/qrcode.png', async (_request, reply) => {
  const png = qrcode('https://qrcodesdk.dev').render(PNGQRCodeRenderer());

  return reply.type('image/png').send(png);
});

await fastify.listen({port: 3000});
```

### Serve with Hono

```ts
import {serve} from '@hono/node-server';
import {Hono} from 'hono';

import {qrcode} from '@qrcodesdk/core';
import {PNGQRCodeRenderer} from '@qrcodesdk/node';

const app = new Hono();

app.get('/qrcode.png', (c) => {
  const png = qrcode('https://qrcodesdk.dev').render(PNGQRCodeRenderer());

  return c.body(png, 200, {
    'Content-Type': 'image/png',
  });
});

serve({
  fetch: app.fetch,
  port: 3000,
});
```

## Output details

The PNG renderer generates:

- A square PNG image
- One pixel block per scaled QR module
- A solid background using `colors.colorLight`
- Dark modules using `colors.colorDark`
- Fully opaque pixels
- A Node.js `Buffer`

The final image size is calculated as:

```ts
const imageSize = size * (moduleCount + 2 * margin);
```

For example, a QR matrix with `21` modules, `size: 8`, and `margin: 4` produces:

```txt
8 * (21 + 2 * 4) = 232
```

So the output PNG is `232 × 232` pixels.
