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
raster output with the Canvas API.

For native `alt` text and other image attributes, use the
[Image element renderers](/reference/renderers/image/) instead.

## Minimal example

```ts
import {QRCodeCanvasRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const canvas = qrcode('https://qrcodesdk.dev').render(QRCodeCanvasRenderer());
```

To insert or composite the canvas, see
[Render QR codes in the browser](/guides/browser-usage/#canvas-element).

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

The renderer synchronously returns a new `HTMLCanvasElement`:

- Width and height: `style.moduleSize × (matrix width + 2 × style.quietZone)` pixels.
- RGBA colors keep their alpha.

Accessibility depends on the labels you pass:

- A non-empty `ariaLabel` sets `role="img"` and `aria-label`.
- If `ariaLabel` is blank, a non-empty `title` sets them instead.
- If both are blank, the canvas is decorative and gets `aria-hidden="true"`.

## Options

| Option                    | Type                      | Default         | Effect                                           |
| ------------------------- | ------------------------- | --------------- | ------------------------------------------------ |
| `style`                   | `QRCodeVisualStyle`       | shared defaults | Applies graphical dimensions, colors, and shapes |
| `accessibility.ariaLabel` | `string`                  | `undefined`     | Sets an `aria-label` attribute                   |
| `accessibility.title`     | `string`                  | `undefined`     | Sets a `title` attribute                         |
| `centerImage`             | `QRCodeCanvasCenterImage` | `undefined`     | Draws a center image from `canvasCenterImage()`  |

`style` takes the [shared visual style](/guides/customize/#shared-visual-style).

## Center image

Create the `centerImage` value with `canvasCenterImage(source, layout?)` from `@qrcodesdk/browser`.
The same value works for Canvas and for every [Image element](/reference/renderers/image/) format.

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
| `layout.size`            | `number`            | `0.3`    | Image box as a fraction of matrix width               |
| `layout.padding`         | `number`            | `1`      | Cleared border around the image, in modules           |
| `layout.clearBackground` | `boolean`           | `true`   | Removes every module the image or its padding touches |

The source can be any ready `CanvasImageSource`, such as an `HTMLImageElement`, another canvas, or
an `ImageBitmap`.

## Constraints

:::caution[Canvas APIs required]
Create this renderer only where the browser DOM, `document.createElement('canvas')`, and a 2D
Canvas context exist. Without Canvas, use the runtime-neutral [SVG renderer](/reference/renderers/svg/).
:::

- **Synchronous rendering.** The center-image source must be loaded and have positive intrinsic
  dimensions before rendering. Unloaded or zero-sized sources throw.
- **Center image layout.** `size` must be finite, greater than `0`, and at most `1`. `padding` must
  be finite and non-negative. `canvasCenterImage()` validates both when it is called.
- **Option checks.** TypeScript checks that `centerImage` comes from `canvasCenterImage()`.
- **Option copies.** `QRCodeCanvasRenderer()` copies option values when it is called. The center
  image keeps its source by identity and checks it when rendering.

## Related guides

- [Customize appearance](/guides/customize/) for shared styling and scan reliability.
- [Add a center image](/guides/center-images/) for loading browser image sources.
- [Render QR codes in the browser](/guides/browser-usage/) for DOM insertion and layout.
- [Download or save](/guides/download-or-save/) for `toBlob()` export.
