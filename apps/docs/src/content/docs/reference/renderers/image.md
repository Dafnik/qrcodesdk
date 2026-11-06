---
title: Image element renderers
description: Reference for rendering an HTMLImageElement backed by a PNG, WebP, GIF, or JPEG data URL with @qrcodesdk/browser.
docType: reference

related:
  - ../../packages/browser.mdx
  - ./canvas.md
  - ./browser-downloads.mdx
---

## When to use

Use an Image element renderer when browser code needs an `HTMLImageElement` with native `alt` text
rather than a drawing surface. Choose the renderer by the encoded format:

| Renderer                  | Entry point               | Data URL type | Encoder                            |
| ------------------------- | ------------------------- | ------------- | ---------------------------------- |
| `QRCodePNGImageRenderer`  | `@qrcodesdk/browser/png`  | `image/png`   | The browser's `canvas.toDataURL()` |
| `QRCodeWebPImageRenderer` | `@qrcodesdk/browser/webp` | `image/webp`  | Bundled lossless WebP encoder      |
| `QRCodeGIFImageRenderer`  | `@qrcodesdk/browser/gif`  | `image/gif`   | Bundled single-frame GIF encoder   |
| `QRCodeJPEGImageRenderer` | `@qrcodesdk/browser/jpeg` | `image/jpeg`  | Bundled baseline JPEG encoder      |

PNG is the default choice. WebP is lossless and usually the smallest file for a QR code. GIF and
JPEG suit destinations that only accept those formats, and JPEG also keeps photographic center images
small. Each renderer has its own entry point, so a bundle only includes the encoder it imports. The
root `@qrcodesdk/browser` entry point re-exports all four.

## Minimal example

```ts
import {QRCodePNGImageRenderer} from '@qrcodesdk/browser/png';
import {qrcode} from '@qrcodesdk/core';

const image = qrcode('https://qrcodesdk.dev').render(
  QRCodePNGImageRenderer({accessibility: {alt: 'Scan to open qrcodesdk.dev'}}),
);
```

Swap in `QRCodeWebPImageRenderer`, `QRCodeGIFImageRenderer`, or `QRCodeJPEGImageRenderer` for the
other formats; they take the same options. See the [Image element section of Render QR codes in the browser](/guides/browser-usage/#image-element)
for insertion and data URL examples.

## Return value

Each renderer synchronously returns a new `HTMLImageElement`. Its `src` is a data URL encoded from
an intermediate Canvas element, and its width and height match that Canvas backing size. `alt` is
always set and defaults to an empty string.

## Renderer-specific options

All four renderers accept the [shared visual style](/guides/customize/#shared-visual-style), a
`centerImage` created with [`canvasCenterImage()`](/reference/renderers/canvas/#center-image) as for
the Canvas renderer, and these DOM attributes:

| Option                    | Type     | Default     | Effect                                           |
| ------------------------- | -------- | ----------- | ------------------------------------------------ |
| `accessibility.alt`       | `string` | `''`        | Sets the Image element's `alt` property          |
| `accessibility.ariaLabel` | `string` | `undefined` | Sets `aria-label` and meaningful image semantics |
| `accessibility.title`     | `string` | `undefined` | Sets the Image element's `title` property        |

`QRCodeImageRendererOptions` from `@qrcodesdk/browser/image` describes these shared options. Each
format also exports its own type: `QRCodePNGImageRendererOptions`, `QRCodeWebPImageRendererOptions`,
`QRCodeGIFImageRendererOptions`, and `QRCodeJPEGImageRendererOptions`. Framework components take the
matching `QRCodePNGImageOptions`, `QRCodeWebPImageOptions`, `QRCodeGIFImageOptions`, or
`QRCodeJPEGImageOptions`, which add `matrix`.

`QRCodeGIFImageRenderer` adds one option:

| Option                   | Type              | Default | Effect                                                   |
| ------------------------ | ----------------- | ------- | -------------------------------------------------------- |
| `transparency.threshold` | integer `0`–`256` | `128`   | Pixels with a lower alpha value become fully transparent |

A threshold of `0` keeps every pixel opaque; `256` makes every pixel transparent.

`QRCodeJPEGImageRenderer` adds two options:

| Option               | Type                 | Default     | Effect                                         |
| -------------------- | -------------------- | ----------- | ---------------------------------------------- |
| `quality`            | integer `1`–`100`    | `92`        | Trades file size for detail                    |
| `transparency.matte` | opaque `QRCodeColor` | `'#ffffff'` | Color that transparent pixels are blended onto |

## PNG

`QRCodePNGImageRenderer` encodes with the browser's native `canvas.toDataURL('image/png')`. PNG keeps
the full alpha channel and is the safest choice for photographic center images and transparent
backgrounds.

## WebP

`QRCodeWebPImageRenderer` encodes lossless WebP with an encoder bundled in the SDK, so output is the
same in every browser, including Safari, which cannot encode WebP natively. WebP keeps the full alpha
channel. QR codes have few colors and long runs of equal pixels, so lossless WebP is usually much
smaller than PNG.

## GIF

`QRCodeGIFImageRenderer` encodes a single-frame GIF with an encoder bundled in the SDK. GIF has two
format limits:

- **256 colors.** Images with more colors are reduced with median-cut quantization. The most frequent
  colors, such as the background and module colors, stay exact; antialiased edges and center images
  may shift slightly.
- **Binary transparency.** A pixel is either fully transparent or opaque, decided by
  `transparency.threshold`. Partially transparent pixels at or above the threshold become opaque, so
  antialiased edges over a transparent background look rough.

Prefer PNG or WebP for transparent backgrounds and photographic center images.

## JPEG

`QRCodeJPEGImageRenderer` encodes a baseline JPEG with an encoder bundled in the SDK. The browser's
own `canvas.toDataURL('image/jpeg')` is not used, because it turns transparent pixels black and
encodes differently in each browser. The bundled encoder produces the same bytes as the Node.js
[JPEG renderer](/reference/renderers/jpeg/) for the same pixels.

- **Lossy.** Pixels near module edges shift slightly. The default quality is `92`; test the output
  with the scanners you target.
- **No transparency.** Every pixel is blended onto `transparency.matte`, which defaults to white.
- **Larger files.** For a plain QR code, PNG and WebP are usually smaller. JPEG pays off for
  photographic center images and destinations that require it.

When every pixel is gray, such as the default black-on-white style, the file stores one grayscale
channel. A `style.moduleSize` that is a multiple of 8 lines modules up with JPEG's 8 × 8 pixel blocks
and makes files several times smaller; see [Smaller files](/reference/renderers/jpeg/#smaller-files).

## Renderer-specific constraints

:::caution[Browser-only output]
Create these renderers only where the DOM and Canvas 2D APIs are available. For server output,
choose SVG or the Node.js [PNG](/reference/renderers/png/), [WebP](/reference/renderers/webp/),
[GIF](/reference/renderers/gif/), or [JPEG](/reference/renderers/jpeg/) renderer.
:::

- Rendering is synchronous; center-image sources must already be loaded and have positive intrinsic
  dimensions.
- Center images must be same-origin or CORS-enabled so the Canvas can be encoded or its pixels read.
  Otherwise rendering throws `QRCodeError` with code `RENDER_FAILED`.
- Options are validated and copied when the renderer factory is called. `transparency.threshold`
  must be an integer from `0` through `256`, `quality` an integer from `1` through `100`, and
  `transparency.matte` an opaque color; other values throw `INVALID_OPTIONS`. The center image
  retains its source by identity and checks it when rendering.
- WebP output is limited to 16,384 pixels per side, and GIF and JPEG output to 65,535. Larger output throws
  `QRCodeError` with code `RENDER_FAILED`.
- The image is encoded into the element's data URL. Use the
  [Canvas renderer](/reference/renderers/canvas/) when the next step needs direct drawing or
  `toBlob()` rather than an Image element.

## Related guides

- [Customize appearance](/guides/customize/) for shared styling, labels, and scan reliability.
- [Add a center image](/guides/center-images/) for preparing a `CanvasImageSource`.
- [Render QR codes in the browser](/guides/browser-usage/) for DOM insertion and layout.
- [Download or save](/guides/download-or-save/) for PNG, WebP, GIF, and JPEG downloads.
