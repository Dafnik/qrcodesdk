---
title: Serve a QR code
description: Return SVG strings or PNG Buffers from HTTP handlers with correct content types and response behavior.
docType: guide

related:
  - ../reference/renderers/svg.md
  - ../reference/renderers/png.mdx
  - ../packages/core.mdx
  - ../packages/node.mdx
---

Generate output inside an HTTP handler, set the matching media type, and return the renderer result
without converting PNG bytes through a text encoding.

## Choose the response format

| Format | Renderer and package                       | Body     | `Content-Type`                 |
| ------ | ------------------------------------------ | -------- | ------------------------------ |
| SVG    | `QRCodeSVGRenderer` from `@qrcodesdk/core` | `string` | `image/svg+xml; charset=utf-8` |
| PNG    | `QRCodePNGRenderer` from `@qrcodesdk/node` | `Buffer` | `image/png`                    |

Choose SVG for scalable, usually smaller text output. Choose PNG for clients that require raster
image bytes or do not accept SVG.

## Return a platform-neutral response

The Web `Response` API works in modern server and edge frameworks. SVG requires only Core:

```ts
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

export function handleQRCodeRequest(): Response {
  const svg = qrcode('https://qrcodesdk.dev').render(QRCodeSVGRenderer());

  return new Response(svg, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Content-Type': 'image/svg+xml; charset=utf-8',
    },
  });
}
```

For PNG in a Node.js-compatible Web API handler, change the renderer and body:

```ts
import {qrcode} from '@qrcodesdk/core';
import {QRCodePNGRenderer} from '@qrcodesdk/node';

const png = qrcode('https://qrcodesdk.dev').render(QRCodePNGRenderer());

return new Response(new Uint8Array(png), {
  headers: {'Content-Type': 'image/png'},
});
```

The `Uint8Array` view preserves the PNG bytes for Web `Response` implementations. Node.js HTTP
frameworks that accept `Buffer` can send `png` directly.

## Express

Set the media type before calling `send()`. Express accepts both the SVG string and PNG `Buffer`
directly:

```ts
import express from 'express';

import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';
import {QRCodePNGRenderer} from '@qrcodesdk/node';

const app = express();

app.get('/qrcode.svg', (_request, response) => {
  const svg = qrcode('https://qrcodesdk.dev').render(QRCodeSVGRenderer());

  response.set('Content-Type', 'image/svg+xml; charset=utf-8').send(svg);
});

app.get('/qrcode.png', (_request, response) => {
  const png = qrcode('https://qrcodesdk.dev').render(QRCodePNGRenderer());

  response.type('image/png').send(png);
});
```

## Fastify

Fastify treats strings and Buffers as already serialized. Return the reply after setting its type:

```ts
import Fastify from 'fastify';

import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';
import {QRCodePNGRenderer} from '@qrcodesdk/node';

const fastify = Fastify();

fastify.get('/qrcode.svg', (_request, reply) => {
  const svg = qrcode('https://qrcodesdk.dev').render(QRCodeSVGRenderer());

  return reply.type('image/svg+xml; charset=utf-8').send(svg);
});

fastify.get('/qrcode.png', (_request, reply) => {
  const png = qrcode('https://qrcodesdk.dev').render(QRCodePNGRenderer());

  return reply.type('image/png').send(png);
});
```

## NestJS

Use `@Header()` for an SVG string. Wrap the PNG `Buffer` in `StreamableFile` so the controller stays
compatible with both the Express and Fastify Nest adapters:

```ts
import {Controller, Get, Header, StreamableFile} from '@nestjs/common';

import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';
import {QRCodePNGRenderer} from '@qrcodesdk/node';

@Controller()
export class QRCodeController {
  @Get('qrcode.svg')
  @Header('Content-Type', 'image/svg+xml; charset=utf-8')
  svg(): string {
    return qrcode('https://qrcodesdk.dev').render(QRCodeSVGRenderer());
  }

  @Get('qrcode.png')
  png(): StreamableFile {
    const png = qrcode('https://qrcodesdk.dev').render(QRCodePNGRenderer());

    return new StreamableFile(png, {type: 'image/png'});
  }
}
```

## Hono

Hono can return the SVG string through its Web API-based context on any supported runtime. The PNG
renderer comes from `@qrcodesdk/node`, so use that route only with a Node.js-compatible Hono runtime:

```ts
import {Hono} from 'hono';

import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';
import {QRCodePNGRenderer} from '@qrcodesdk/node';

const app = new Hono();

app.get('/qrcode.svg', (context) => {
  const svg = qrcode('https://qrcodesdk.dev').render(QRCodeSVGRenderer());

  context.header('Content-Type', 'image/svg+xml; charset=utf-8');
  return context.body(svg);
});

app.get('/qrcode.png', (context) => {
  const png = qrcode('https://qrcodesdk.dev').render(QRCodePNGRenderer());

  context.header('Content-Type', 'image/png');
  return context.body(new Uint8Array(png));
});
```

## Handle dynamic input safely

Validate and bound user-controlled payloads before generation. Long payloads can require larger
matrices and more rendering work; rejected capacity throws `QRCode: Data too large`. Decide whether
the endpoint should cache by payload, disable caching for private data, or set a stable ETag for
repeatable public output.

Use `Content-Disposition: attachment; filename="qrcode.svg"` only when the response should download
instead of display inline. When a framework calculates `Content-Length`, let it do so from the final
string or Buffer; otherwise use the UTF-8 byte length for SVG and `png.length` for PNG.

## Result and next step

The endpoint now returns image output with a matching media type. Use the
[SVG string reference](/reference/renderers/svg/) or [PNG Buffer reference](/reference/renderers/png/)
to tune renderer-specific options, and [Customize appearance](/guides/customize/) for shared visual
settings.
