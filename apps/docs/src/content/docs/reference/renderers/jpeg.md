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

Use `QRCodeJPEGRenderer` when Node.js-compatible code must deliver a JPEG. Examples are forms, print
services, and upload fields that only accept JPEG. JPEG also suits QR codes with a photographic
[center image](/guides/center-images/), where lossy compression keeps the photo small.

Otherwise, prefer the [PNG](/reference/renderers/png/) or [WebP](/reference/renderers/webp/)
renderer:

- **Lossy.** JPEG slightly blurs module edges. Test the output with the scanners you target.
- **No transparency.** Transparent pixels are blended onto a solid matte color.
- **Larger files.** For a plain QR code with a few flat colors, PNG and WebP are much smaller. A
  default QR code for `https://qrcodesdk.dev` is about 9.7 KB as JPEG, 1.1 KB as PNG, and 310 bytes
  as WebP. A [block-aligned module size](#smaller-files) closes most of that gap.

## Minimal example

```ts
import {qrcode} from '@qrcodesdk/core';
import {QRCodeJPEGRenderer} from '@qrcodesdk/node';

const jpeg = qrcode('https://qrcodesdk.dev').render(QRCodeJPEGRenderer());
```

## Styled example

This example sets the quality and the matte color behind a transparent background:

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

The renderer synchronously returns a Node.js `Buffer` with a complete baseline JPEG (JFIF) file. Its
width and height are `style.moduleSize × (matrix width + 2 × style.quietZone)` pixels.

Output above 8192 × 8192 pixels (67,108,864 pixels) throws `QRCodeError` with code
`INVALID_OPTIONS` before any pixels are allocated.

## Options

| Option               | Type                      | Default         | Effect                                           |
| -------------------- | ------------------------- | --------------- | ------------------------------------------------ |
| `style`              | `QRCodeVisualStyle`       | shared defaults | Applies graphical dimensions, colors, and shapes |
| `quality`            | integer `1`–`100`         | `92`            | Trades file size for detail                      |
| `transparency.matte` | opaque `QRCodeColor`      | `'#ffffff'`     | Color that transparent pixels are blended onto   |
| `centerImage`        | `QRCodeRasterCenterImage` | `undefined`     | Draws a center image from `rasterCenterImage()`  |

- `QRCodeJPEGRendererOptions` accepts only these keys.
- A lower `quality` makes smaller files with blurrier edges. Test with the scanners you target
  before going below about `75`.
- Set `transparency.matte` to the color of the page or print medium behind the QR code.

## Format details

- **Baseline JPEG.** The file is a single-pass JFIF image that every JPEG decoder can read.
- **Optimized Huffman tables.** The encoder fits its Huffman tables to each image. Files are 10–50%
  smaller than with the standard tables, at the same quality.
- **No chroma subsampling.** Color is stored at full resolution, so colored module edges stay crisp.
- **Grayscale output.** When every pixel is gray, such as the default black-on-white style, the file
  stores one grayscale channel. It is smaller and has no color fringes.
- **Transparency.** JPEG has no alpha channel. Every pixel is blended onto `transparency.matte`,
  including partially transparent module colors and anti-aliased edges.
- **Identical output everywhere.** The encoder uses only integer arithmetic. The same pixels produce
  the same bytes in Node.js and in every browser.

## Smaller files

JPEG compresses the image in blocks of 8 × 8 pixels. A block that contains a module edge must store
sharp detail. That detail costs most of the file size and causes the slight blur around modules.

Choose a `style.moduleSize` that is a multiple of 8. Then every block covers a single module and is
one flat color:

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

Sizes are for `https://qrcodesdk.dev` at the default quality and quiet zone.

- `8`, `16`, or `24` give the smallest files and keep square module edges exact.
- Sizes that divide 8, such as `4` or `2`, also align modules with the blocks, but save less.
- Rounded or circular modules, center images, and anti-aliased edges still add detail within
  blocks.

## Center image

Create the center image with `rasterCenterImage()` from PNG bytes, as for the
[PNG renderer](/reference/renderers/png/#center-image). One center image works for the PNG, WebP,
GIF, and JPEG renderers.

```ts
import {readFile} from 'node:fs/promises';

import {qrcode} from '@qrcodesdk/core';
import {QRCodeJPEGRenderer, rasterCenterImage} from '@qrcodesdk/node';

const centerImage = rasterCenterImage(await readFile('./photo.png'), {size: 0.3});
const jpeg = qrcode('https://qrcodesdk.dev')
  .errorCorrection('H')
  .render(QRCodeJPEGRenderer({centerImage}));
```

## Constraints

- **Quality.** `quality` must be a safe integer from `1` through `100`. Other values throw
  `QRCodeError` with code `INVALID_OPTIONS` when `QRCodeJPEGRenderer()` is called.
- **Matte.** `transparency.matte` must be an opaque `#rrggbb` color, or `#rrggbbff`. Other values
  throw `QRCodeError` with code `INVALID_OPTIONS` when `QRCodeJPEGRenderer()` is called.
- **Center image source.** The source must contain PNG bytes, even for JPEG output. See the
  [PNG renderer constraints](/reference/renderers/png/#constraints) for its limits.
- **Option checks.** TypeScript rejects unknown keys. The renderer does not repeat that check at
  runtime.
- **Option copies.** `QRCodeJPEGRenderer()` copies option values when it is called.

## Related guides

- [Customize appearance](/guides/customize/) for shared styling and scan reliability.
- [Add a center image](/guides/center-images/) for reading and sizing a PNG center image.
- [Download or save](/guides/download-or-save/) for writing the `Buffer` to disk.
- [Serve a QR code](/guides/server-output/) for `image/jpeg` HTTP responses.
