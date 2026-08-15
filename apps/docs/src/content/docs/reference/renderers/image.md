---
title: PNG-backed Image element renderer
description: Reference for rendering an HTMLImageElement backed by a PNG data URL with @qrcodesdk/browser.
docType: reference

related:
  - ../../packages/browser.mdx
  - ./canvas.md
  - ./browser-downloads.mdx
---

## When to use

Use `QRCodeImageRenderer` when browser code needs a CSS-customizable, accessible `HTMLImageElement`
rather than a drawing surface.

## Minimal example

```ts
import {QRCodeImageRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const image = qrcode('https://qrcodesdk.dev').render(
  QRCodeImageRenderer({alt: 'Scan to open qrcodesdk.dev'}),
);
```

[Learn here](/guides/browser-usage/#image-element) more about using the Image Element in the browser.

## Return value

The renderer synchronously returns a new `HTMLImageElement`. Its `src` is a PNG data URL generated
from an intermediate Canvas element, and its width and height match that Canvas backing size.
`alt` is always set and defaults to an empty string.

## Renderer-specific options

The renderer accepts the [shared visual options](/guides/customize/#shared-visual-options), the same
prepared `image` overlay and `ariaLabel` as the
[Canvas renderer](/reference/renderers/canvas/#renderer-specific-options), and these DOM attributes:

| Option  | Type     | Default     | Effect                                    |
| ------- | -------- | ----------- | ----------------------------------------- |
| `alt`   | `string` | `''`        | Sets the Image element's `alt` property   |
| `title` | `string` | `undefined` | Sets the Image element's `title` property |

## Renderer-specific constraints

:::caution[Browser-only output]
Create this renderer only where the DOM, Canvas 2D, and PNG `canvas.toDataURL()` APIs are available.
For server output, choose SVG or the Node.js PNG renderer.
:::

- Rendering is synchronous; center-image sources must already be loaded and have positive intrinsic
  dimensions.
- The PNG is encoded into the element's data URL. Use the
  [Canvas renderer](/reference/renderers/canvas/) when the next step needs direct drawing or
  `toBlob()` rather than an Image element.

## Related guides

- [Customize appearance](/guides/customize/) for shared styling, labels, and scan safety.
- [Add a center image](/guides/center-images/) for preparing a `CanvasImageSource`.
- [Browser Usage](/guides/browser-usage/) for rendering in the browser.
- [Download or save](/guides/download-or-save/) for PNG downloads.
