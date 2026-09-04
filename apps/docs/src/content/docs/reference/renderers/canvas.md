---
title: Canvas element renderer
description: Reference for rendering an HTMLCanvasElement with QRCodeCanvasRenderer from @qrcodesdk/browser.
docType: reference

related:
  - ../../packages/browser.mdx
  - ./image.md
---

## When to use

Use `QRCodeCanvasRenderer` when browser code needs to draw, composite, inspect, or manually export
raster output through the Canvas API.

## Minimal example

```ts
import {QRCodeCanvasRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const canvas = qrcode('https://qrcodesdk.dev').render(QRCodeCanvasRenderer());
```

[Learn here](/guides/browser-usage/#canvas-element) more about using the Canvas Element in the browser.

## Return value

The renderer synchronously returns a new `HTMLCanvasElement`. Its pixel width and height are both
`style.moduleSize × (matrix width + 2 × style.quietZone)`. RGBA colors retain their alpha.

## Renderer-specific options

`QRCodeCanvasRendererOptions` accepts the
[shared visual style](/guides/customize/#shared-visual-style) and a prepared overlay:

| Option                    | Type                | Default               | Effect                                           |
| ------------------------- | ------------------- | --------------------- | ------------------------------------------------ |
| `style`                   | `QRCodeVisualStyle` | shared defaults       | Applies graphical dimensions, colors, and shapes |
| `accessibility.ariaLabel` | `string`            | `undefined`           | Sets an `aria-label` attribute                   |
| `accessibility.title`     | `string`            | `undefined`           | Sets a `title` attribute                         |
| `image.source`            | `CanvasImageSource` | required with `image` | Draws an already-ready browser image source      |
| `image.size`              | `number`            | `0.4`                 | Image box as a fraction of matrix width          |
| `image.padding`           | `number`            | `1`                   | Clear padding measured in modules                |
| `image.clearBackground`   | `boolean`           | `true`                | Clears modules behind the image and padding      |

## Renderer-specific constraints

:::caution[Canvas APIs required]
Create this renderer only where the browser DOM, `document.createElement('canvas')`, and a 2D
Canvas context are available. For environments without Canvas, choose the runtime-neutral SVG
renderer.
:::

- The renderer is synchronous. An image source must be loaded and expose positive intrinsic
  dimensions before rendering; unloaded or zero-sized sources throw.
- `image.source` may be any ready `CanvasImageSource`, such as an `HTMLImageElement`, another canvas,
  or an `ImageBitmap`.
- A non-empty `ariaLabel` sets `role="img"` and `aria-label` on the Canvas element. Without it, the
  Canvas remains unlabelled. For more accessibility controls, use the
  [PNG-backed Image renderer](/reference/renderers/image/) for native image attributes.
- Options are validated and copied when `QRCodeCanvasRenderer()` is called. The prepared image
  source is retained by identity and checked when rendering.

## Related guides

- [Customize appearance](/guides/customize/) for shared styling and scan safety.
- [Add a center image](/guides/center-images/) for loading browser image sources.
- [Browser Usage](/guides/browser-usage/) for rendering in the browser.
- [Download or save](/guides/download-or-save/) for `toBlob()` export.
