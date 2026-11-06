---
title: GIF Buffer renderer
description: Reference for rendering a single-frame GIF Buffer with QRCodeGIFRenderer from @qrcodesdk/node.
docType: reference

related:
  - ../../packages/node.mdx
  - ./png.mdx
  - ./webp.md
  - ./jpeg.md
  - ../../guides/download-or-save.md
  - ../../guides/server-output.md
---

## When to use

Use `QRCodeGIFRenderer` when Node.js-compatible code must deliver a GIF file to a destination that
only accepts GIF. Otherwise, prefer the [PNG](/reference/renderers/png/) or
[WebP](/reference/renderers/webp/) renderer. GIF is limited to 256 colors and binary transparency.

## Minimal example

```ts
import {qrcode} from '@qrcodesdk/core';
import {QRCodeGIFRenderer} from '@qrcodesdk/node';

const gif = qrcode('https://qrcodesdk.dev').render(QRCodeGIFRenderer());
```

## Transparent background example

```ts
import {qrcode} from '@qrcodesdk/core';
import {QRCodeGIFRenderer} from '@qrcodesdk/node';

const gif = qrcode('https://qrcodesdk.dev').render(
  QRCodeGIFRenderer({
    style: {moduleSize: 8, background: '#ffffff00'},
    transparency: {threshold: 128},
  }),
);
```

See [Customize appearance](/guides/customize/) for every color, shape, and finder option.

## Return value

The renderer synchronously returns a Node.js `Buffer` containing a complete single-frame GIF89a file.
Its pixel width and height are `style.moduleSize × (matrix width + 2 × style.quietZone)`. Output above
8192 × 8192 pixels (67,108,864 pixels) throws `QRCodeError` with code `INVALID_OPTIONS` before any
pixels are allocated.

## Renderer-specific options

`QRCodeGIFRendererOptions` accepts `style`, `centerImage`, and `transparency`. TypeScript rejects
every other key; the renderer does not repeat that check at runtime.

| Option                   | Type                      | Default         | Effect                                                   |
| ------------------------ | ------------------------- | --------------- | -------------------------------------------------------- |
| `style`                  | `QRCodeVisualStyle`       | shared defaults | Applies graphical dimensions, colors, and shapes         |
| `transparency.threshold` | integer `0`–`256`         | `128`           | Pixels with a lower alpha value become fully transparent |
| `centerImage`            | `QRCodeRasterCenterImage` | `undefined`     | Draws a center image from `rasterCenterImage()`          |

A threshold of `0` keeps every pixel opaque; `256` makes every pixel transparent. Raise the threshold
to drop more of the faint antialiased edge pixels; lower it to keep them.

## Format limits

- **256 colors.** Images with more colors, such as photographic center images or antialiased edges
  between many colors, are reduced with median-cut quantization. The most frequent colors, such as
  the background and module colors, stay exact.
- **Binary transparency.** A pixel is either fully transparent or opaque. Partially transparent
  pixels at or above the threshold become opaque, so antialiased edges over a transparent background
  look rough.
- **Single frame.** The renderer does not produce animations.

## Center image

Create the center image with `rasterCenterImage()` from PNG bytes, as for the
[PNG renderer](/reference/renderers/png/#center-image). One center image can be reused across the
PNG, WebP, GIF, and JPEG renderers:

```ts
import {readFile} from 'node:fs/promises';

import {qrcode} from '@qrcodesdk/core';
import {QRCodeGIFRenderer, rasterCenterImage} from '@qrcodesdk/node';

const centerImage = rasterCenterImage(await readFile('./logo.png'), {size: 0.3});
const gif = qrcode('https://qrcodesdk.dev')
  .errorCorrection('H')
  .render(QRCodeGIFRenderer({centerImage}));
```

## Renderer-specific constraints

- `transparency.threshold` must be a safe integer from `0` through `256`. Other values throw
  `QRCodeError` with code `INVALID_OPTIONS` when `QRCodeGIFRenderer()` is called.
- The center-image source must contain PNG bytes, even for GIF output. See the
  [PNG renderer constraints](/reference/renderers/png/#renderer-specific-constraints) for its limits.
- Option values are copied when `QRCodeGIFRenderer()` is called.

## Related guides

- [Customize appearance](/guides/customize/) for shared styling and scan reliability.
- [Add a center image](/guides/center-images/) for reading and sizing a PNG center image.
- [Download or save](/guides/download-or-save/) for writing the `Buffer` to disk.
- [Serve a QR code](/guides/server-output/) for `image/gif` HTTP responses.
