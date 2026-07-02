---
title: SVG Renderer
description: The SVG renderer outputs a QR code as an SVG string. SVG is the best default when you want a crisp, scalable image that stays sharp at any size. It works well in web apps, dashboards, emails, documentation pages, server-rendered routes, and generated static assets.
---

The SVG renderer outputs a QR code as an SVG string.

SVG is the best default when you want a crisp, scalable image that stays sharp at any size. It works well in web apps, dashboards, emails, documentation pages, server-rendered routes, and generated static assets.

## Minimal example

```ts
import {SVGQRCodeRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev').render(SVGQRCodeRenderer());
```

## Styling options

You can customize the rendered SVG by passing options to `SVGQRCodeRenderer`.

```ts
import {SVGQRCodeRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev').render(
  SVGQRCodeRenderer({
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
| `colors.colorDark`  | `string` | `'#000000'` | Color used for dark modules.                      |
| `colors.colorLight` | `string` | `'#ffffff'` | Background color.                                 |
| `alt`               | `string` | `undefined` | Adds an `alt` attribute to the SVG.               |
| `ariaLabel`         | `string` | `undefined` | Adds an `aria-label` attribute to the SVG.        |
| `title`             | `string` | `undefined` | Adds a `title` attribute to the SVG.              |

Colors must be 6-digit hex values such as `'#000000'`, `'#ffffff'`, or `'#111827'`.

## Accessibility

For user-facing QR codes, provide a meaningful label so assistive technologies can describe what the code points to.

```ts
import {SVGQRCodeRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev').render(
  SVGQRCodeRenderer({
    title: 'QR code for qrcodesdk.dev',
    ariaLabel: 'Scan to open qrcodesdk.dev',
  }),
);
```

## Node.js examples

### Save to disk

```ts
import {writeFile} from 'node:fs/promises';

import {SVGQRCodeRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev').render(SVGQRCodeRenderer());

await writeFile('qrcode.svg', svg, 'utf8');
```

### Serve with Express

```ts
import express from 'express';

import {SVGQRCodeRenderer, qrcode} from '@qrcodesdk/core';

const app = express();

app.get('/qrcode.svg', (_req, res) => {
  const svg = qrcode('https://qrcodesdk.dev').render(SVGQRCodeRenderer());

  res.type('image/svg+xml').send(svg);
});

app.listen(3000);
```

### Serve with Fastify

```ts
import Fastify from 'fastify';

import {SVGQRCodeRenderer, qrcode} from '@qrcodesdk/core';

const fastify = Fastify();

fastify.get('/qrcode.svg', async (_request, reply) => {
  const svg = qrcode('https://qrcodesdk.dev').render(SVGQRCodeRenderer());

  return reply.type('image/svg+xml').send(svg);
});

await fastify.listen({port: 3000});
```

### Serve with Hono

```ts
import {serve} from '@hono/node-server';
import {Hono} from 'hono';

import {SVGQRCodeRenderer, qrcode} from '@qrcodesdk/core';

const app = new Hono();

app.get('/qrcode.svg', (c) => {
  const svg = qrcode('https://qrcodesdk.dev').render(SVGQRCodeRenderer());

  return c.body(svg, 200, {
    'Content-Type': 'image/svg+xml',
  });
});

serve({
  fetch: app.fetch,
  port: 3000,
});
```

## Inline in HTML

```ts
import {SVGQRCodeRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev').render(
  SVGQRCodeRenderer({
    ariaLabel: 'Scan to open qrcodesdk.dev',
  }),
);

const html = `
  <!doctype html>
  <html>
    <body>
      <h1>Scan this QR code</h1>
      ${svg}
    </body>
  </html>
`;
```

## Browser examples

### Insert into the DOM

```ts
import {SVGQRCodeRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev').render(
  SVGQRCodeRenderer({
    ariaLabel: 'Scan to open qrcodesdk.dev',
  }),
);

const container = document.querySelector('#qrcode');

if (container) {
  container.innerHTML = svg;
}
```

```html
<div id="qrcode"></div>
```
