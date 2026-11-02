---
title: Image element renderers
description: Reference for rendering an HTMLImageElement backed by a PNG, WebP, or GIF data URL with @qrcodesdk/browser.
docType: reference

related:
  - ../../packages/browser.mdx
  - ./canvas.md
  - ./browser-downloads.mdx
---

## When to use

Use an Image element renderer when browser code needs a CSS-customizable, accessible
`HTMLImageElement` rather than a drawing surface. Choose the renderer by the encoded format:

| Renderer                  | Entry point               | Data URL type | Encoder                            |
| ------------------------- | ------------------------- | ------------- | ---------------------------------- |
| `QRCodePNGImageRenderer`  | `@qrcodesdk/browser/png`  | `image/png`   | The browser's `canvas.toDataURL()` |
| `QRCodeWebPImageRenderer` | `@qrcodesdk/browser/webp` | `image/webp`  | Bundled lossless WebP encoder      |
| `QRCodeGIFImageRenderer`  | `@qrcodesdk/browser/gif`  | `image/gif`   | Bundled single-frame GIF encoder   |

PNG is the default choice. WebP is lossless and usually the smallest file for a QR code. GIF suits
destinations that only accept GIF. Each renderer has its own entry point, so a bundle only includes
the encoder it imports. The root `@qrcodesdk/browser` entry point re-exports all three.

## Minimal example

```ts
import {QRCodePNGImageRenderer} from '@qrcodesdk/browser/png';
import {qrcode} from '@qrcodesdk/core';

const image = qrcode('https://qrcodesdk.dev').render(
  QRCodePNGImageRenderer({accessibility: {alt: 'Scan to open qrcodesdk.dev'}}),
);
```

Swap in `QRCodeWebPImageRenderer` or `QRCodeGIFImageRenderer` for the other formats; they take the
same options. See the [Image element section of Render QR codes in the browser](/guides/browser-usage/#image-element)
for insertion and data URL examples.

## Return value

Each renderer synchronously returns a new `HTMLImageElement`. Its `src` is a data URL encoded from
an intermediate Canvas element, and its width and height match that Canvas backing size. `alt` is
always set and defaults to an empty string.

## Renderer-specific options

All three renderers accept the [shared visual style](/guides/customize/#shared-visual-style), a
`centerImage` created with [`canvasCenterImage()`](/reference/renderers/canvas/#center-image) as for
the Canvas renderer, and these DOM attributes:

| Option                    | Type     | Default     | Effect                                           |
| ------------------------- | -------- | ----------- | ------------------------------------------------ |
| `accessibility.alt`       | `string` | `''`        | Sets the Image element's `alt` property          |
| `accessibility.ariaLabel` | `string` | `undefined` | Sets `aria-label` and meaningful image semantics |
| `accessibility.title`     | `string` | `undefined` | Sets the Image element's `title` property        |

`QRCodeImageRendererOptions` from `@qrcodesdk/browser/image` describes these shared options. Each
format also exports its own type: `QRCodePNGImageRendererOptions`, `QRCodeWebPImageRendererOptions`,
and `QRCodeGIFImageRendererOptions`. Framework components take the matching
`QRCodePNGImageOptions`, `QRCodeWebPImageOptions`, or `QRCodeGIFImageOptions`, which add `matrix`.

`QRCodeGIFImageRenderer` adds one option:

| Option                   | Type              | Default | Effect                                                   |
| ------------------------ | ----------------- | ------- | -------------------------------------------------------- |
| `transparency.threshold` | integer `0`–`256` | `128`   | Pixels with a lower alpha value become fully transparent |

A threshold of `0` keeps every pixel opaque; `256` makes every pixel transparent.

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

## Renderer-specific constraints

:::caution[Browser-only output]
Create these renderers only where the DOM and Canvas 2D APIs are available. For server output,
choose SVG or the Node.js [PNG](/reference/renderers/png/), [WebP](/reference/renderers/webp/), or
[GIF](/reference/renderers/gif/) renderer.
:::

- Rendering is synchronous; center-image sources must already be loaded and have positive intrinsic
  dimensions.
- Center images must be same-origin or CORS-enabled so the Canvas can be encoded or its pixels read.
  Otherwise rendering throws `QRCodeError` with code `RENDER_FAILED`.
- Options are validated and copied when the renderer factory is called. `transparency.threshold`
  must be an integer from `0` through `256`; other values throw `INVALID_OPTIONS`. The center image
  retains its source by identity and checks it when rendering.
- WebP output is limited to 16,384 pixels per side and GIF output to 65,535. Larger output throws
  `QRCodeError` with code `RENDER_FAILED`.
- The image is encoded into the element's data URL. Use the
  [Canvas renderer](/reference/renderers/canvas/) when the next step needs direct drawing or
  `toBlob()` rather than an Image element.

## Related guides

- [Customize appearance](/guides/customize/) for shared styling, labels, and scan reliability.
- [Add a center image](/guides/center-images/) for preparing a `CanvasImageSource`.
- [Render QR codes in the browser](/guides/browser-usage/) for DOM insertion and layout.
- [Download or save](/guides/download-or-save/) for PNG, WebP, and GIF downloads.
