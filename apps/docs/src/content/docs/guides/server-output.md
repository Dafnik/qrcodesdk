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

Render the QR code inside an HTTP handler, set the matching `Content-Type`, and return the result.
Send raster bytes as they are, never through a text encoding.

## Before you start

- Install `@qrcodesdk/core` for SVG.
- For PNG, WebP, GIF, or JPEG, also install `@qrcodesdk/node`. It needs Node.js 22 or newer, or a
  Node.js-compatible runtime.
- Have an HTTP handler ready. The examples cover Web `Response`, Express, Fastify, NestJS, and Hono.
- Payload from the request? Read [Handle dynamic input](#handle-dynamic-input) first.

## Choose the response format

| Format | Renderer             | Package           | Body     | `Content-Type`                 |
| ------ | -------------------- | ----------------- | -------- | ------------------------------ |
| SVG    | `QRCodeSVGRenderer`  | `@qrcodesdk/core` | `string` | `image/svg+xml; charset=utf-8` |
| PNG    | `QRCodePNGRenderer`  | `@qrcodesdk/node` | `Buffer` | `image/png`                    |
| WebP   | `QRCodeWebPRenderer` | `@qrcodesdk/node` | `Buffer` | `image/webp`                   |
| GIF    | `QRCodeGIFRenderer`  | `@qrcodesdk/node` | `Buffer` | `image/gif`                    |
| JPEG   | `QRCodeJPEGRenderer` | `@qrcodesdk/node` | `Buffer` | `image/jpeg`                   |

- **SVG** is scalable text. Use it unless the client needs image bytes.
- **PNG** has the widest support.
- **WebP** is lossless and usually the smallest.
- **GIF** and **JPEG** are for clients that only accept them. See
  [Choose a file format](/guides/download-or-save/#choose-a-file-format) for their trade-offs.

The raster examples below use PNG. For another format, swap the renderer and the `Content-Type`.
The `Buffer` is sent the same way.

## Return a platform-neutral response

Use a Web `Response` where your server or edge framework supports it. SVG needs only Core:

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

For PNG in a Node.js-compatible handler, change the renderer and wrap the body in a `Uint8Array`:

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

The `Uint8Array` view keeps the bytes intact for Web `Response`. Frameworks that accept a `Buffer`
can send `png` directly.

## Express

Set the type, then call `send()`. Express accepts the string and the `Buffer` as they are:

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

Fastify sends strings and `Buffer`s without serializing them. Set the type and return the reply:

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

- **SVG:** set the type with `@Header()` and return the string.
- **PNG:** wrap the `Buffer` in `StreamableFile`. This works with both the Express and the Fastify
  adapter.

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

The SVG route works on every Hono runtime. The PNG route uses `@qrcodesdk/node`, so it needs a
Node.js-compatible runtime:

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

When the payload comes from the request:

- Check it and cap its length before rendering. Long payloads mean larger matrices and more work.
- Answer client mistakes with a `4xx` status.
- Answer everything else with a generic `500`. Don't echo error details.

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

What this example does:

- **Renderer at module level.** Invalid renderer options fail once at startup, not on every
  request.
- **Length limit.** Rejects oversized input before any QR code work.
- **`PAYLOAD_TOO_LARGE`.** Still catches shorter text that doesn't fit, such as many multi-byte
  characters. See the [errors reference](/reference/errors/) for every code.
- **`no-store`.** Keeps responses for user-supplied text out of shared caches.

To cache public output instead, put the payload and every output-affecting option in the cache key:
renderer, style, and matrix options. A stable ETag must identify that same output.

## Verify the result

Request each route and check the status, the `Content-Type` header, and the body:

```sh
curl -i "http://localhost:3000/qrcode.svg"
curl -o qrcode.png "http://localhost:3000/qrcode.png"
```

1. Open the downloaded file in an image viewer and scan it.
2. For the dynamic handler, request an empty `text` parameter and expect `400`.
3. Request an oversized `text` parameter and expect `413`.

## Caveats

- Add `Content-Disposition: attachment; filename="qrcode.svg"` only when the response should
  download instead of display inline.
- Let the framework set `Content-Length` when it can. Otherwise use the UTF-8 byte length for SVG
  and the `Buffer` length for raster formats.
- `@qrcodesdk/node` needs Node.js APIs. Edge runtimes without them can serve SVG only.
- Raster output grows with `style.moduleSize`. The Node.js renderers reject output above 67,108,864
  pixels with `INVALID_OPTIONS`.

## Next step

To write the same output to files, follow [Download or save](/guides/download-or-save/). To style
it, see [Customize appearance](/guides/customize/).
