---
title: Serve a QR code
description: Return SVG strings or PNG, WebP, GIF, and JPEG Buffers from HTTP handlers with correct content types and response behavior.
docType: guide

related:
  - ../reference/renderers/svg.md
  - ../reference/renderers/png.mdx
  - ../reference/renderers/webp.md
  - ../reference/renderers/gif.md
  - ../reference/renderers/jpeg.md
  - ../packages/core.mdx
  - ../packages/node.mdx
---

Generate output inside an HTTP handler, set the matching media type, and return the renderer result
without converting raster bytes through a text encoding.

## Choose the response format

| Format | Renderer and package                        | Body     | `Content-Type`                 |
| ------ | ------------------------------------------- | -------- | ------------------------------ |
| SVG    | `QRCodeSVGRenderer` from `@qrcodesdk/core`  | `string` | `image/svg+xml; charset=utf-8` |
| PNG    | `QRCodePNGRenderer` from `@qrcodesdk/node`  | `Buffer` | `image/png`                    |
| WebP   | `QRCodeWebPRenderer` from `@qrcodesdk/node` | `Buffer` | `image/webp`                   |
| GIF    | `QRCodeGIFRenderer` from `@qrcodesdk/node`  | `Buffer` | `image/gif`                    |
| JPEG   | `QRCodeJPEGRenderer` from `@qrcodesdk/node` | `Buffer` | `image/jpeg`                   |

Choose SVG for scalable text output. Choose a raster format for clients that require image bytes or
do not accept SVG. PNG is the most widely supported, lossless WebP is usually the smallest, and GIF
and JPEG serve clients that only accept those formats. GIF is limited to 256 colors and binary
transparency. JPEG is lossy, larger for plain QR codes, and blends transparent pixels onto a solid
matte color.

The examples below use PNG. For WebP, GIF, or JPEG, swap the renderer and the `Content-Type`; the `Buffer`
is sent the same way.

## Return a platform-neutral response

Use a Web `Response` where your server or edge framework supports it. SVG requires only Core:

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

The `Uint8Array` view preserves the raster bytes for Web `Response` implementations. Node.js HTTP
frameworks that accept `Buffer` can send `png` directly.

## Express

Set the media type before calling `send()`. Express accepts both the SVG string and raster `Buffer`
output directly:

```ts
import express from 'express';

import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';
import {QRCodePNGRenderer, QRCodeWebPRenderer} from '@qrcodesdk/node';

const app = express();

app.get('/qrcode.svg', (_request, response) => {
  const svg = qrcode('https://qrcodesdk.dev').render(QRCodeSVGRenderer());

  response.set('Content-Type', 'image/svg+xml; charset=utf-8').send(svg);
});

app.get('/qrcode.png', (_request, response) => {
  const png = qrcode('https://qrcodesdk.dev').render(QRCodePNGRenderer());

  response.type('image/png').send(png);
});

app.get('/qrcode.webp', (_request, response) => {
  const webp = qrcode('https://qrcodesdk.dev').render(QRCodeWebPRenderer());

  response.type('image/webp').send(webp);
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

Hono can return the SVG string through its Web API-based context on any supported runtime. The raster
renderers come from `@qrcodesdk/node`, so use that route only with a Node.js-compatible Hono runtime:

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
matrices and more rendering work; rejected capacity throws `QRCode: Payload too large`. Include the
payload and every output-affecting option, including the renderer, style, and matrix options, in
public output cache keys. A stable ETag must identify that output. Disable caching for private payloads.

Use `Content-Disposition: attachment; filename="qrcode.svg"` only when the response should download
instead of display inline. When a framework calculates `Content-Length`, let it do so from the final
string or Buffer; otherwise use the UTF-8 byte length for SVG and the `Buffer` length for PNG, WebP, GIF, and JPEG.
