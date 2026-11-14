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

Use `QRCodeGIFRenderer` when Node.js-compatible code must deliver a GIF to a destination that only
accepts GIF.

Otherwise, prefer the [PNG](/reference/renderers/png/) or [WebP](/reference/renderers/webp/)
renderer. GIF is limited to 256 colors and binary transparency.

## Minimal example

```ts
import {qrcode} from '@qrcodesdk/core';
import {QRCodeGIFRenderer} from '@qrcodesdk/node';

const gif = qrcode('https://qrcodesdk.dev').render(QRCodeGIFRenderer());
```

## Styled example

This example renders a transparent background:

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

The renderer synchronously returns a Node.js `Buffer` with a complete single-frame GIF89a file. Its
width and height are `style.moduleSize × (matrix width + 2 × style.quietZone)` pixels.

Output above 8192 × 8192 pixels (67,108,864 pixels) throws `QRCodeError` with code
`INVALID_OPTIONS` before any pixels are allocated.

## Options

| Option                   | Type                      | Default         | Effect                                                   |
| ------------------------ | ------------------------- | --------------- | -------------------------------------------------------- |
| `style`                  | `QRCodeVisualStyle`       | shared defaults | Applies graphical dimensions, colors, and shapes         |
| `transparency.threshold` | integer `0`–`256`         | `128`           | Pixels with a lower alpha value become fully transparent |
| `centerImage`            | `QRCodeRasterCenterImage` | `undefined`     | Draws a center image from `rasterCenterImage()`          |

- `QRCodeGIFRendererOptions` accepts only these keys.
- A threshold of `0` keeps every pixel opaque. `256` makes every pixel transparent.
- Raise the threshold to drop more faint anti-aliased edge pixels. Lower it to keep them.

## Format limits

- **256 colors.** Images with more colors are reduced with median-cut quantization. This affects
  photographic center images and anti-aliased edges between many colors. The most frequent colors,
  such as the background and module colors, stay exact.
- **Binary transparency.** Each pixel is fully transparent or opaque. Partially transparent pixels
  at or above the threshold become opaque, so anti-aliased edges over a transparent background look
  rough.
- **Single frame.** The renderer does not produce animations.

## Center image

Create the center image with `rasterCenterImage()` from PNG bytes, as for the
[PNG renderer](/reference/renderers/png/#center-image). One center image works for the PNG, WebP,
GIF, and JPEG renderers.

```ts
import {readFile} from 'node:fs/promises';

import {qrcode} from '@qrcodesdk/core';
import {QRCodeGIFRenderer, rasterCenterImage} from '@qrcodesdk/node';

const centerImage = rasterCenterImage(await readFile('./logo.png'), {size: 0.3});
const gif = qrcode('https://qrcodesdk.dev')
  .errorCorrection('H')
  .render(QRCodeGIFRenderer({centerImage}));
```

## Constraints

- **Threshold.** `transparency.threshold` must be a safe integer from `0` through `256`. Other
  values throw `QRCodeError` with code `INVALID_OPTIONS` when `QRCodeGIFRenderer()` is called.
- **Center image source.** The source must contain PNG bytes, even for GIF output. See the
  [PNG renderer constraints](/reference/renderers/png/#constraints) for its limits.
- **Option checks.** TypeScript rejects unknown keys. The renderer does not repeat that check at
  runtime.
- **Option copies.** `QRCodeGIFRenderer()` copies option values when it is called.

## Related guides

- [Customize appearance](/guides/customize/) for shared styling and scan reliability.
- [Add a center image](/guides/center-images/) for reading and sizing a PNG center image.
- [Download or save](/guides/download-or-save/) for writing the `Buffer` to disk.
- [Serve a QR code](/guides/server-output/) for `image/gif` HTTP responses.
