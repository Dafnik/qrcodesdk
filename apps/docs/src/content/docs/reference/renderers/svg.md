---
title: SVG string renderer
description: Reference for rendering a scalable SVG string with QRCodeSVGRenderer from @qrcodesdk/core.
docType: reference

related:
  - ../../packages/core.mdx
  - ./browser-downloads.mdx
---

## When to use

Use `QRCodeSVGRenderer` for scalable output in web pages, email, print, generated assets, or HTTP
responses. It is the recommended default when the consumer accepts SVG text. Output stays sharp at
every size, and the renderer has no browser or Node.js dependency.

## Minimal example

```ts
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev').render(QRCodeSVGRenderer());
```

See the [SVG string section of Render QR codes in the browser](/guides/browser-usage/#svg-string)
for DOM insertion examples.

## Return value

The renderer returns a complete SVG `string` with an explicit width, height, and `viewBox`. A
non-empty accessible name adds `role="img"`; decorative output has no image role. Output with only
square shapes uses `shape-rendering="crispEdges"`; curved styles omit that hint.

## Renderer-specific options

`QRCodeSVGRendererOptions` accepts `style`, `accessibility`, and `centerImage`. It rejects every other key.

| Option                        | Type                 | Default                     | Effect                                           |
| ----------------------------- | -------------------- | --------------------------- | ------------------------------------------------ |
| `style`                       | `QRCodeVisualStyle`  | shared defaults             | Applies graphical dimensions, colors, and shapes |
| `accessibility.ariaLabel`     | `string`             | `undefined`                 | Sets `aria-label` and meaningful image semantics |
| `accessibility.title`         | `string`             | `undefined`                 | Adds a child `<title>` element                   |
| `centerImage.source`          | `QRCodeDataImageURL` | required with `centerImage` | Embeds a prepared `data:image/...` URL           |
| `centerImage.size`            | `number`             | `0.4`                       | Image box as a fraction of matrix width          |
| `centerImage.padding`         | `number`             | `1`                         | Clear padding measured in modules                |
| `centerImage.clearBackground` | `boolean`            | `true`                      | Clears modules behind the image and padding      |

## Renderer-specific constraints

The renderer escapes label text and image URL attributes. It encodes the payload as QR modules,
so payload text does not become HTML. When inserting the returned SVG into a page, do not
concatenate unescaped user input into it. Validate uploaded center images before creating a data
URL; the renderer checks the URL format but does not inspect the embedded image.

- `centerImage.source` must be a non-empty embedded image data URL. The renderer does not read paths or
  fetch remote URLs.
- SVG does not accept `accessibility.alt`; use `ariaLabel` and optionally `title`.
- Image `size` must be finite, greater than `0`, and at most `1`; padding must be finite and
  non-negative.
- Options are validated and copied when `QRCodeSVGRenderer()` is called.
- The renderer supports the same [runtimes as Core](/packages/core/#runtime-compatibility).

## Related guides

- [Customize appearance](/guides/customize/) for shared colors, module shapes, quiet zones, labels,
  and scan reliability.
- [Add a center image](/guides/center-images/) for preparing an SVG center image source.
- [Render QR codes in the browser](/guides/browser-usage/) for DOM insertion and layout.
- [Download or save](/guides/download-or-save/) for files and browser downloads.
- [Serve a QR code](/guides/server-output/) for HTTP responses.
