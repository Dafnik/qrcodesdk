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
  - ../reference/errors.md
---

Generate output inside an HTTP handler, set the matching media type, and return the renderer result
without converting raster bytes through a text encoding.

## Before you start

- Install `@qrcodesdk/core` for SVG. PNG, WebP, GIF, and JPEG also need `@qrcodesdk/node` and a
  Node.js-compatible runtime, Node.js 22 or newer.
- Have an HTTP handler in your server framework. The examples cover Web `Response` handlers,
  Express, Fastify, NestJS, and Hono.
- Decide whether the payload is fixed or comes from the request. Request input needs the checks in
  [Handle dynamic input](#handle-dynamic-input).

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

export function handlePNGRequest(): Response {
  const png = qrcode('https://qrcodesdk.dev').render(QRCodePNGRenderer({style: {moduleSize: 8}}));

  return new Response(new Uint8Array(png), {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Content-Type': 'image/png',
    },
  });
}
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

## Handle dynamic input

Validate and bound user-controlled payloads before generation. Long payloads need larger matrices
and more rendering work. Answer client mistakes with a `4xx` status and other failures with a generic
`500`, without echoing error details:

```ts
import {QRCodeError, QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

const MAX_PAYLOAD_LENGTH = 1024;
const renderer = QRCodeSVGRenderer({style: {moduleSize: 8}});

export function handleDynamicQRCodeRequest(request: Request): Response {
  const payload = new URL(request.url).searchParams.get('text');

  if (!payload) {
    return textResponse(400, 'Pass the QR code text in the "text" query parameter.');
  }
  if (payload.length > MAX_PAYLOAD_LENGTH) {
    return textResponse(413, `The text must not exceed ${MAX_PAYLOAD_LENGTH} characters.`);
  }

  try {
    const svg = qrcode(payload).render(renderer);

    return new Response(svg, {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'image/svg+xml; charset=utf-8',
      },
    });
  } catch (error) {
    if (error instanceof QRCodeError && error.code === 'INVALID_PAYLOAD') {
      return textResponse(400, 'The text cannot be encoded as a QR code.');
    }
    if (error instanceof QRCodeError && error.code === 'PAYLOAD_TOO_LARGE') {
      return textResponse(413, 'The text is too long for a QR code.');
    }

    console.error(error);
    return textResponse(500, 'The QR code could not be generated.');
  }
}

function textResponse(status: number, message: string): Response {
  return new Response(message, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
```

The renderer is created once at module level, so invalid renderer options fail at startup instead
of on every request. The length limit rejects oversized input before any QR work. `PAYLOAD_TOO_LARGE`
still catches text below the limit that does not fit, for example many multi-byte characters. See
the [errors reference](/reference/errors/) for every code.

`no-store` keeps responses for user-supplied text out of shared caches. To cache public output,
include the payload and every output-affecting option, including the renderer, style, and matrix
options, in the cache key. A stable ETag must identify that output.

## Verify the result

Request each route and check the status, the `Content-Type` header, and the body:

```sh
curl -i "http://localhost:3000/qrcode.svg"
curl -o qrcode.png "http://localhost:3000/qrcode.png"
```

Open the downloaded file in an image viewer and scan it. For the dynamic handler, also request an
empty and an oversized `text` parameter and check for `400` and `413`.

## Caveats

- Use `Content-Disposition: attachment; filename="qrcode.svg"` only when the response should
  download instead of display inline.
- When a framework calculates `Content-Length`, let it do so from the final string or Buffer;
  otherwise use the UTF-8 byte length for SVG and the `Buffer` length for PNG, WebP, GIF, and JPEG.
- `@qrcodesdk/node` needs Node.js APIs. Edge runtimes without them can serve SVG only.
- Raster output size grows with `style.moduleSize`. The Node.js renderers reject output above
  67,108,864 pixels with `INVALID_OPTIONS`.

## Next step

To write the same output to files, follow [Download or save](/guides/download-or-save/). To style
it, see [Customize appearance](/guides/customize/).
