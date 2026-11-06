---
title: WebP Buffer renderer
description: Reference for rendering a lossless WebP Buffer with QRCodeWebPRenderer from @qrcodesdk/node.
docType: reference

related:
  - ../../packages/node.mdx
  - ./png.mdx
  - ./gif.md
  - ./jpeg.md
  - ../../guides/download-or-save.md
  - ../../guides/server-output.md
---

## When to use

Use `QRCodeWebPRenderer` when Node.js-compatible code needs small raster bytes for a file, HTTP
response, attachment, or object store, and the destination accepts WebP. The output is lossless WebP,
so it keeps every pixel of the [PNG Buffer renderer](/reference/renderers/png/) output. It is usually
much smaller: a default QR code for `https://qrcodesdk.dev` is about 310 bytes as WebP and 1.1 KB as
PNG.

## Minimal example

```ts
import {qrcode} from '@qrcodesdk/core';
import {QRCodeWebPRenderer} from '@qrcodesdk/node';

const webp = qrcode('https://qrcodesdk.dev').render(QRCodeWebPRenderer());
```

## Styled example

```ts
import {qrcode} from '@qrcodesdk/core';
import {diagonal, finder} from '@qrcodesdk/core/style';
import {QRCodeWebPRenderer} from '@qrcodesdk/node';

const webp = qrcode('https://qrcodesdk.dev').render(
  QRCodeWebPRenderer({
    style: {
      moduleSize: 8,
      modules: diagonal(),
      finder: finder({ring: diagonal(), color: '#7c3aed'}),
    },
  }),
);
```

See [Customize appearance](/guides/customize/) for every color, shape, and finder option.

## Return value

The renderer synchronously returns a Node.js `Buffer` containing a complete lossless WebP (VP8L)
file. Pixels are identical to the PNG renderer's output for the same options. The width and height
are `style.moduleSize × (matrix width + 2 × style.quietZone)`, shaped edges are anti-aliased, and
RGBA colors keep their alpha. Output above 8192 × 8192 pixels (67,108,864 pixels) throws
`QRCodeError` with code `INVALID_OPTIONS` before any pixels are allocated.

## Renderer-specific options

`QRCodeWebPRendererOptions` accepts `style` and `centerImage`. TypeScript rejects every other key;
the renderer does not repeat that check at runtime.

| Option        | Type                      | Default         | Effect                                           |
| ------------- | ------------------------- | --------------- | ------------------------------------------------ |
| `style`       | `QRCodeVisualStyle`       | shared defaults | Applies graphical dimensions, colors, and shapes |
| `centerImage` | `QRCodeRasterCenterImage` | `undefined`     | Draws a center image from `rasterCenterImage()`  |

The encoder has no quality or effort setting. Output is always lossless.

## Center image

Create the center image with `rasterCenterImage()` from PNG bytes, as for the
[PNG renderer](/reference/renderers/png/#center-image). One center image can be reused across the
PNG, WebP, GIF, and JPEG renderers:

```ts
import {readFile} from 'node:fs/promises';

import {qrcode} from '@qrcodesdk/core';
import {QRCodeWebPRenderer, rasterCenterImage} from '@qrcodesdk/node';

const centerImage = rasterCenterImage(await readFile('./logo.png'), {size: 0.3});
const webp = qrcode('https://qrcodesdk.dev')
  .errorCorrection('H')
  .render(QRCodeWebPRenderer({centerImage}));
```

## Renderer-specific constraints

- The center-image source must contain PNG bytes, even for WebP output. See the
  [PNG renderer constraints](/reference/renderers/png/#renderer-specific-constraints) for its limits.
- Choose PNG when a destination, such as an older email client or document format, does not accept
  WebP.
- Option values are copied when `QRCodeWebPRenderer()` is called.

## Related guides

- [Customize appearance](/guides/customize/) for shared styling and scan reliability.
- [Add a center image](/guides/center-images/) for reading and sizing a PNG center image.
- [Download or save](/guides/download-or-save/) for writing the `Buffer` to disk.
- [Serve a QR code](/guides/server-output/) for `image/webp` HTTP responses.
