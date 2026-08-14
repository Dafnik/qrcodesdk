---
title: Canvas element renderer
description: Reference for rendering an HTMLCanvasElement with QRCodeCanvasRenderer from @qrcodesdk/browser.
docType: reference

related:
  - ../../packages/browser.mdx
  - ../../guides/customize.md
  - ../../guides/center-images.md
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

## Return value

The renderer synchronously returns a new `HTMLCanvasElement`. Its pixel width and height are both
`size × (matrix width + 2 × margin)`. The backing context is opaque and filled with
`colors.colorLight`.

## Renderer-specific options

`QRCodeCanvasRendererOptions` accepts the
[shared visual options](/guides/customize/#shared-visual-options) and a prepared overlay:

| Option                  | Type                | Default               | Effect                                      |
| ----------------------- | ------------------- | --------------------- | ------------------------------------------- |
| `image.source`          | `CanvasImageSource` | required with `image` | Draws an already-ready browser image source |
| `image.size`            | `number`            | `0.4`                 | Image box as a fraction of matrix width     |
| `image.padding`         | `number`            | `1`                   | Clear padding measured in modules           |
| `image.clearBackground` | `boolean`           | `true`                | Clears modules behind the image and padding |

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
- The Canvas element has no built-in accessible label. Add semantics where it is inserted, or choose
  the [PNG-backed Image renderer](/reference/renderers/image/) for native image attributes.

## Use the Canvas element in a browser

### Insert it into the DOM

Append the returned element wherever the QR code should appear:

```ts
import {QRCodeCanvasRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const canvas = qrcode('https://qrcodesdk.dev').render(QRCodeCanvasRenderer({size: 8, margin: 4}));

document.querySelector('#qrcode')?.append(canvas);
```

```html
<div id="qrcode" role="img" aria-label="Scan to open qrcodesdk.dev"></div>
```

### Draw it into another Canvas

Use the QR Canvas as a source for a larger composition:

```ts
import {QRCodeCanvasRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const qrCanvas = qrcode('https://qrcodesdk.dev').render(QRCodeCanvasRenderer());
const target = document.querySelector<HTMLCanvasElement>('#target');
const context = target?.getContext('2d');

if (target && context) {
  target.width = qrCanvas.width;
  target.height = qrCanvas.height;
  context.drawImage(qrCanvas, 0, 0);
}
```

### Export it as PNG

Convert the returned Canvas to a `Blob` for a manual download or upload:

```ts
import {QRCodeCanvasRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const canvas = qrcode('https://qrcodesdk.dev').render(QRCodeCanvasRenderer());

canvas.toBlob((blob) => {
  if (!blob) return;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = 'qrcode.png';
  link.click();

  URL.revokeObjectURL(url);
}, 'image/png');
```

## Related guides

- [Customize appearance](/guides/customize/) for shared styling and scan safety.
- [Add a center image](/guides/center-images/) for loading browser image sources.
- [Download or save](/guides/download-or-save/) for `toBlob()` export.
