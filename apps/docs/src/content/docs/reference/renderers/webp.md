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

Use `QRCodeWebPRenderer` when Node.js-compatible code needs small raster bytes and the destination
accepts WebP. Typical uses are files, HTTP responses, attachments, and object stores.

The output is lossless, so it has the same pixels as the [PNG Buffer renderer](/reference/renderers/png/).
It is usually much smaller. A default QR code for `https://qrcodesdk.dev` is about 310 bytes as WebP
and 1.1 KB as PNG.

Choose PNG when a destination, such as an older email client or document format, does not accept
WebP.

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

The renderer synchronously returns a Node.js `Buffer` with a complete lossless WebP (VP8L) file:

- Pixels are identical to the PNG renderer's output for the same options.
- Width and height: `style.moduleSize × (matrix width + 2 × style.quietZone)` pixels.
- Shaped edges are anti-aliased.
- RGBA colors keep their alpha.

Output above 8192 × 8192 pixels (67,108,864 pixels) throws `QRCodeError` with code
`INVALID_OPTIONS` before any pixels are allocated.

## Options

| Option        | Type                      | Default         | Effect                                           |
| ------------- | ------------------------- | --------------- | ------------------------------------------------ |
| `style`       | `QRCodeVisualStyle`       | shared defaults | Applies graphical dimensions, colors, and shapes |
| `centerImage` | `QRCodeRasterCenterImage` | `undefined`     | Draws a center image from `rasterCenterImage()`  |

- `QRCodeWebPRendererOptions` accepts only these keys.
- The encoder has no quality or effort setting. Output is always lossless.

## Center image

Create the center image with `rasterCenterImage()` from PNG bytes, as for the
[PNG renderer](/reference/renderers/png/#center-image). One center image works for the PNG, WebP,
GIF, and JPEG renderers.

```ts
import {readFile} from 'node:fs/promises';

import {qrcode} from '@qrcodesdk/core';
import {QRCodeWebPRenderer, rasterCenterImage} from '@qrcodesdk/node';

const centerImage = rasterCenterImage(await readFile('./logo.png'), {size: 0.3});
const webp = qrcode('https://qrcodesdk.dev')
  .errorCorrection('H')
  .render(QRCodeWebPRenderer({centerImage}));
```

## Constraints

- **Center image source.** The source must contain PNG bytes, even for WebP output. See the
  [PNG renderer constraints](/reference/renderers/png/#constraints) for its limits.
- **Option checks.** TypeScript rejects unknown keys. The renderer does not repeat that check at
  runtime.
- **Option copies.** `QRCodeWebPRenderer()` copies option values when it is called.

## Related guides

- [Customize appearance](/guides/customize/) for shared styling and scan reliability.
- [Add a center image](/guides/center-images/) for reading and sizing a PNG center image.
- [Download or save](/guides/download-or-save/) for writing the `Buffer` to disk.
- [Serve a QR code](/guides/server-output/) for `image/webp` HTTP responses.
