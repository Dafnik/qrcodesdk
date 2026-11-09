---
title: JPEG Buffer renderer
description: Reference for rendering a baseline JPEG Buffer with QRCodeJPEGRenderer from @qrcodesdk/node.
docType: reference

related:
  - ../../packages/node.mdx
  - ./png.mdx
  - ./webp.md
  - ./gif.md
  - ../../guides/download-or-save.md
  - ../../guides/server-output.md
---

## When to use

Use `QRCodeJPEGRenderer` when Node.js-compatible code must deliver a JPEG file, for example to a
form, print service, or upload field that only accepts JPEG images. JPEG also suits QR codes with a
photographic [center image](/guides/center-images/), where lossy compression keeps the photo small.

Prefer the [PNG](/reference/renderers/png/) or [WebP](/reference/renderers/webp/) renderer
otherwise:

- **Lossy.** JPEG slightly blurs module edges. Test the output with the scanners you target.
- **No transparency.** Transparent pixels are blended onto a solid matte color.
- **Larger files.** For a plain QR code with a few flat colors, PNG and lossless WebP are much
  smaller. A default QR code for `https://qrcodesdk.dev` is about 9.7 KB as JPEG, 1.1 KB as PNG,
  and 310 bytes as WebP. A [block-aligned module size](#smaller-files) closes most of that gap.

## Minimal example

```ts
import {qrcode} from '@qrcodesdk/core';
import {QRCodeJPEGRenderer} from '@qrcodesdk/node';

const jpeg = qrcode('https://qrcodesdk.dev').render(QRCodeJPEGRenderer());
```

## Quality and matte example

```ts
import {qrcode} from '@qrcodesdk/core';
import {QRCodeJPEGRenderer} from '@qrcodesdk/node';

const jpeg = qrcode('https://qrcodesdk.dev').render(
  QRCodeJPEGRenderer({
    style: {moduleSize: 8, background: '#ffffff00'},
    quality: 85,
    transparency: {matte: '#f8fafc'},
  }),
);
```

See [Customize appearance](/guides/customize/) for every color, shape, and finder option.

## Return value

The renderer synchronously returns a Node.js `Buffer` containing a complete baseline JPEG (JFIF)
file. Its pixel width and height are `style.moduleSize × (matrix width + 2 × style.quietZone)`.
Output above 8192 × 8192 pixels (67,108,864 pixels) throws `QRCodeError` with code
`INVALID_OPTIONS` before any pixels are allocated.

## Renderer-specific options

`QRCodeJPEGRendererOptions` accepts `style`, `centerImage`, `quality`, and `transparency`.
TypeScript rejects every other key; the renderer does not repeat that check at runtime.

| Option               | Type                      | Default         | Effect                                           |
| -------------------- | ------------------------- | --------------- | ------------------------------------------------ |
| `style`              | `QRCodeVisualStyle`       | shared defaults | Applies graphical dimensions, colors, and shapes |
| `quality`            | integer `1`–`100`         | `92`            | Trades file size for detail                      |
| `transparency.matte` | opaque `QRCodeColor`      | `'#ffffff'`     | Color that transparent pixels are blended onto   |
| `centerImage`        | `QRCodeRasterCenterImage` | `undefined`     | Draws a center image from `rasterCenterImage()`  |

Lower values make smaller files with blurrier edges. Test the result with the scanners you target
before going below about `75`.

## Format details

- **Baseline JPEG.** The file is a single-pass JFIF image. Every JPEG decoder can read it.
- **Optimized Huffman tables.** The encoder counts the symbols of each image first and fits its
  Huffman tables to them, which makes files 10–50% smaller than the standard tables at no cost in
  quality.
- **No chroma subsampling.** Color is stored at full resolution, so colored module edges stay crisp.
- **Grayscale output.** When every pixel is gray, such as the default black-on-white style, the
  file stores one grayscale channel. It is smaller and has no color fringes.
- **Transparency.** JPEG has no alpha channel. Every pixel is blended onto `transparency.matte`,
  including partially transparent module colors and antialiased edges. Pick the color of the page or
  print medium behind the QR code.
- **Identical output everywhere.** The encoder uses integer arithmetic only, so the same pixels
  produce the same bytes in Node.js and in every browser.

## Smaller files

JPEG compresses the image in blocks of 8 × 8 pixels. When module edges fall inside a block, the
block has to store sharp detail, which costs most of the file size and causes the slight blur around
modules. Choose a `style.moduleSize` that is a multiple of 8 so every block covers a single module
and is one flat color:

```ts
import {qrcode} from '@qrcodesdk/core';
import {QRCodeJPEGRenderer} from '@qrcodesdk/node';

const jpeg = qrcode('https://qrcodesdk.dev').render(QRCodeJPEGRenderer({style: {moduleSize: 8}}));
```

| `style.moduleSize` | Image size       | JPEG size |
| ------------------ | ---------------- | --------- |
| `4`                | 132 × 132 pixels | 3.0 KB    |
| `5`                | 165 × 165 pixels | 9.7 KB    |
| `8`                | 264 × 264 pixels | 870 bytes |

Sizes are for `https://qrcodesdk.dev` at the default quality and quiet zone. A module size of `8`,
`16`, or `24` gives the smallest files and keeps square module edges exact. Sizes that divide 8,
such as `4` or `2`, also align modules with the blocks but save less. Rounded or circular module
shapes, center images, and antialiased edges still add detail within blocks.

## Center image

Create the center image with `rasterCenterImage()` from PNG bytes, as for the
[PNG renderer](/reference/renderers/png/#center-image). One center image can be reused across the
PNG, WebP, GIF, and JPEG renderers:

```ts
import {readFile} from 'node:fs/promises';

import {qrcode} from '@qrcodesdk/core';
import {QRCodeJPEGRenderer, rasterCenterImage} from '@qrcodesdk/node';

const centerImage = rasterCenterImage(await readFile('./photo.png'), {size: 0.3});
const jpeg = qrcode('https://qrcodesdk.dev')
  .errorCorrection('H')
  .render(QRCodeJPEGRenderer({centerImage}));
```

## Renderer-specific constraints

- `quality` must be a safe integer from `1` through `100`. Other values throw `QRCodeError` with
  code `INVALID_OPTIONS` when `QRCodeJPEGRenderer()` is called.
- `transparency.matte` must be an opaque `#rrggbb` color, or `#rrggbbff`. Other values throw
  `QRCodeError` with code `INVALID_OPTIONS` when `QRCodeJPEGRenderer()` is called.
- The center-image source must contain PNG bytes, even for JPEG output. See the
  [PNG renderer constraints](/reference/renderers/png/#renderer-specific-constraints) for its limits.
- Option values are copied when `QRCodeJPEGRenderer()` is called.

## Related guides

- [Customize appearance](/guides/customize/) for shared styling and scan reliability.
- [Add a center image](/guides/center-images/) for reading and sizing a PNG center image.
- [Download or save](/guides/download-or-save/) for writing the `Buffer` to disk.
- [Serve a QR code](/guides/server-output/) for `image/jpeg` HTTP responses.
