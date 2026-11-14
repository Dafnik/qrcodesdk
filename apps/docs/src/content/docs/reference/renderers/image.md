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

Use an Image element renderer when browser code needs an `HTMLImageElement` with native `alt`
text, not a drawing surface. Choose the renderer by format:

| Renderer                  | Entry point               | Data URL type | Encoder                            | Choose it for                         |
| ------------------------- | ------------------------- | ------------- | ---------------------------------- | ------------------------------------- |
| `QRCodePNGImageRenderer`  | `@qrcodesdk/browser/png`  | `image/png`   | The browser's `canvas.toDataURL()` | The default choice                    |
| `QRCodeWebPImageRenderer` | `@qrcodesdk/browser/webp` | `image/webp`  | Bundled lossless WebP encoder      | Usually the smallest file             |
| `QRCodeGIFImageRenderer`  | `@qrcodesdk/browser/gif`  | `image/gif`   | Bundled single-frame GIF encoder   | Destinations that only accept GIF     |
| `QRCodeJPEGImageRenderer` | `@qrcodesdk/browser/jpeg` | `image/jpeg`  | Bundled baseline JPEG encoder      | JPEG-only destinations, photo centers |

Each renderer has its own entry point, so your bundle only includes the encoder you import. The
root `@qrcodesdk/browser` entry point re-exports all four.

## Minimal example

```ts
import {QRCodePNGImageRenderer} from '@qrcodesdk/browser/png';
import {qrcode} from '@qrcodesdk/core';

const image = qrcode('https://qrcodesdk.dev').render(
  QRCodePNGImageRenderer({accessibility: {alt: 'QR code: scan to open qrcodesdk.dev'}}),
);
```

The other three renderers take the same options. To insert the image into a page, see
[Render QR codes in the browser](/guides/browser-usage/#image-element).

## Return value

Each renderer synchronously returns a new `HTMLImageElement`:

- Its `src` is a data URL, encoded from an intermediate Canvas element.
- Its width and height match that Canvas backing size.
- `alt` is always set. The default empty string marks the image as decorative.

Set a meaningful `alt` unless nearby content already explains the QR code. Prefer `alt` over
`ariaLabel`. When both are set, assistive technology announces `ariaLabel`.

## Options

All four renderers accept these options:

| Option                    | Type                      | Default         | Effect                                           |
| ------------------------- | ------------------------- | --------------- | ------------------------------------------------ |
| `style`                   | `QRCodeVisualStyle`       | shared defaults | Applies graphical dimensions, colors, and shapes |
| `accessibility.alt`       | `string`                  | `''`            | Sets the Image element's `alt` property          |
| `accessibility.ariaLabel` | `string`                  | `undefined`     | Sets `aria-label`, which overrides `alt`         |
| `accessibility.title`     | `string`                  | `undefined`     | Sets the Image element's `title` property        |
| `centerImage`             | `QRCodeCanvasCenterImage` | `undefined`     | Draws a center image from `canvasCenterImage()`  |

- `style` takes the [shared visual style](/guides/customize/#shared-visual-style).
- `centerImage` works as for the [Canvas renderer](/reference/renderers/canvas/#center-image).

`QRCodeGIFImageRenderer` adds one option:

| Option                   | Type              | Default | Effect                                                   |
| ------------------------ | ----------------- | ------- | -------------------------------------------------------- |
| `transparency.threshold` | integer `0`–`256` | `128`   | Pixels with a lower alpha value become fully transparent |

A threshold of `0` keeps every pixel opaque. `256` makes every pixel transparent.

`QRCodeJPEGImageRenderer` adds two options:

| Option               | Type                 | Default     | Effect                                         |
| -------------------- | -------------------- | ----------- | ---------------------------------------------- |
| `quality`            | integer `1`–`100`    | `92`        | Trades file size for detail                    |
| `transparency.matte` | opaque `QRCodeColor` | `'#ffffff'` | Color that transparent pixels are blended onto |

### Option types

- `QRCodeImageRendererOptions` from `@qrcodesdk/browser/image` describes the shared options.
- Each format exports its own type: `QRCodePNGImageRendererOptions`,
  `QRCodeWebPImageRendererOptions`, `QRCodeGIFImageRendererOptions`, and
  `QRCodeJPEGImageRendererOptions`.
- Framework components take `QRCodePNGImageOptions`, `QRCodeWebPImageOptions`,
  `QRCodeGIFImageOptions`, or `QRCodeJPEGImageOptions`. These add `matrix`.

## PNG

`QRCodePNGImageRenderer` encodes with the browser's native `canvas.toDataURL('image/png')`.

- PNG keeps the full alpha channel.
- It is the safest choice for transparent backgrounds and photographic center images.

## WebP

`QRCodeWebPImageRenderer` encodes lossless WebP with an encoder bundled in the SDK.

- It also works in Safari, which cannot encode WebP natively.
- WebP keeps the full alpha channel.
- QR codes have few colors and long runs of equal pixels, so lossless WebP is usually much smaller
  than PNG.

The encoder produces identical bytes from identical RGBA pixels. But each browser draws the
intermediate Canvas itself, and anti-aliasing of shaped modules and center images can differ. So
bytes can differ between browsers.

## GIF

`QRCodeGIFImageRenderer` encodes a single-frame GIF with an encoder bundled in the SDK. GIF has two
format limits:

- **256 colors.** Images with more colors are reduced with median-cut quantization. The most
  frequent colors, such as the background and module colors, stay exact. Anti-aliased edges and
  center images may shift slightly.
- **Binary transparency.** Each pixel is fully transparent or opaque, decided by
  `transparency.threshold`. Partially transparent pixels at or above the threshold become opaque,
  so anti-aliased edges over a transparent background look rough.

Prefer PNG or WebP for transparent backgrounds and photographic center images.

## JPEG

`QRCodeJPEGImageRenderer` encodes a baseline JPEG with an encoder bundled in the SDK. It does not
use the browser's `canvas.toDataURL('image/jpeg')`, which turns transparent pixels black and encodes
differently in each browser.

- **Lossy.** Pixels near module edges shift slightly. The default quality is `92`. Test the output
  with the scanners you target.
- **No transparency.** Every pixel is blended onto `transparency.matte`, white by default.
- **Larger files.** For a plain QR code, PNG and WebP are usually smaller. JPEG pays off for
  photographic center images and destinations that require it.
- **Grayscale output.** When every pixel is gray, such as the default black-on-white style, the
  file stores one grayscale channel.
- **Block alignment.** A `style.moduleSize` that is a multiple of 8 lines modules up with JPEG's
  8 × 8 pixel blocks. Files get several times smaller. See
  [Smaller files](/reference/renderers/jpeg/#smaller-files).

The bundled encoder produces the same bytes as the Node.js [JPEG renderer](/reference/renderers/jpeg/)
for the same RGBA pixels. Browser Canvas and Node.js can anti-alias shaped modules and center images
differently, though, so identical options do not guarantee identical pixels.

## Constraints

:::caution[Browser-only output]
Create these renderers only where the DOM and Canvas 2D APIs exist. For server output, use SVG or
the Node.js [PNG](/reference/renderers/png/), [WebP](/reference/renderers/webp/),
[GIF](/reference/renderers/gif/), or [JPEG](/reference/renderers/jpeg/) renderer.
:::

- **Synchronous rendering.** Center-image sources must already be loaded and have positive
  intrinsic dimensions.
- **Cross-origin images.** Center images must be same-origin or CORS-enabled, so the Canvas can be
  encoded or its pixels read. Otherwise rendering throws `QRCodeError` with code `RENDER_FAILED`.
- **Option values.** These throw `INVALID_OPTIONS` when the renderer factory is called:
  - `transparency.threshold` that is not an integer from `0` through `256`
  - `quality` that is not an integer from `1` through `100`
  - `transparency.matte` that is not an opaque color
- **Maximum size.** WebP output is limited to 16,384 pixels per side. GIF and JPEG output is limited
  to 65,535. Larger output throws `QRCodeError` with code `RENDER_FAILED`.
- **Option copies.** Renderer factories validate and copy options when they are called. The center
  image keeps its source by identity and checks it when rendering.
- **Data URL only.** The image is encoded into the element's data URL. If the next step needs
  direct drawing or `toBlob()`, use the [Canvas renderer](/reference/renderers/canvas/).

## Related guides

- [Customize appearance](/guides/customize/) for shared styling, labels, and scan reliability.
- [Add a center image](/guides/center-images/) for preparing a `CanvasImageSource`.
- [Render QR codes in the browser](/guides/browser-usage/) for DOM insertion and layout.
- [Download or save](/guides/download-or-save/) for PNG, WebP, GIF, and JPEG downloads.
