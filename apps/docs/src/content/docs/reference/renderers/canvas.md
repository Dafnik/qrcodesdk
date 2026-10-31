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

See the [Canvas element section of Render QR codes in the browser](/guides/browser-usage/#canvas-element)
for insertion and compositing examples.

## Styled example

```ts
import {QRCodeCanvasRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';
import {circle, finder} from '@qrcodesdk/core/style';

const canvas = qrcode('https://qrcodesdk.dev').render(
  QRCodeCanvasRenderer({
    style: {moduleSize: 8, modules: circle(), finder: finder({center: circle(), color: '#2563eb'})},
  }),
);
```

See [Customize appearance](/guides/customize/) for every color, shape, and finder option.

## Return value

The renderer synchronously returns a new `HTMLCanvasElement`. Its pixel width and height are both
`style.moduleSize × (matrix width + 2 × style.quietZone)`. RGBA colors retain their alpha.

## Renderer-specific options

`QRCodeCanvasRendererOptions` accepts the
[shared visual style](/guides/customize/#shared-visual-style) and a prepared center image:

| Option                    | Type                      | Default         | Effect                                           |
| ------------------------- | ------------------------- | --------------- | ------------------------------------------------ |
| `style`                   | `QRCodeVisualStyle`       | shared defaults | Applies graphical dimensions, colors, and shapes |
| `accessibility.ariaLabel` | `string`                  | `undefined`     | Sets an `aria-label` attribute                   |
| `accessibility.title`     | `string`                  | `undefined`     | Sets a `title` attribute                         |
| `centerImage`             | `QRCodeCanvasCenterImage` | `undefined`     | Draws a center image from `canvasCenterImage()`  |

## Center image

`canvasCenterImage(source, layout?)` from `@qrcodesdk/browser` creates the `centerImage` value for
Canvas and [Image](/reference/renderers/image/) output:

```ts
import {QRCodeCanvasRenderer, canvasCenterImage} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const logo = new Image();
logo.src = '/logo.png';
await logo.decode();

const canvas = qrcode('https://qrcodesdk.dev')
  .errorCorrection('H')
  .render(QRCodeCanvasRenderer({centerImage: canvasCenterImage(logo, {size: 0.3})}));
```

| Parameter                | Type                | Default  | Effect                                                |
| ------------------------ | ------------------- | -------- | ----------------------------------------------------- |
| `source`                 | `CanvasImageSource` | required | Loaded browser image source                           |
| `layout.size`            | `number`            | `0.4`    | Image box as a fraction of matrix width               |
| `layout.padding`         | `number`            | `1`      | Cleared border around the image, in modules           |
| `layout.clearBackground` | `boolean`           | `true`   | Removes every module the image or its padding touches |

## Renderer-specific constraints

:::caution[Canvas APIs required]
Create this renderer only where the browser DOM, `document.createElement('canvas')`, and a 2D
Canvas context are available. For environments without Canvas, choose the runtime-neutral SVG
renderer.
:::

- The renderer is synchronous. An image source must be loaded and expose positive intrinsic
  dimensions before rendering; unloaded or zero-sized sources throw.
- The center-image source may be any ready `CanvasImageSource`, such as an `HTMLImageElement`,
  another canvas, or an `ImageBitmap`.
- `centerImage` must be created with `canvasCenterImage()`; plain option objects throw
  `INVALID_OPTIONS`. `canvasCenterImage()` validates its layout when it is called.
- A non-empty `ariaLabel`, or a non-empty `title` when `ariaLabel` is blank, sets `role="img"` and
  `aria-label` on the Canvas element. The Canvas is decorative only when both are blank. For more accessibility controls, use the
  [PNG-backed Image renderer](/reference/renderers/image/) for native image attributes.
- Options are validated and copied when `QRCodeCanvasRenderer()` is called. The center image
  retains its source by identity and checks it when rendering.

## Related guides

- [Customize appearance](/guides/customize/) for shared styling and scan reliability.
- [Add a center image](/guides/center-images/) for loading browser image sources.
- [Render QR codes in the browser](/guides/browser-usage/) for DOM insertion and layout.
- [Download or save](/guides/download-or-save/) for `toBlob()` export.
