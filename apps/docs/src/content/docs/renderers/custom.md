---
title: Custom Renderers
description: Build your own QRCodeSDK renderer by converting a QR matrix into any output type.

related:
  - ../guides/customize.md
  - ../libs/core.mdx
  - ../reference/api.md
---

Renderers convert a QR matrix into an output value. QRCodeSDK includes renderers for SVG, PNG, Canvas, Image elements, browser downloads, and terminal text, and you can write your own renderer for any other format.

## Choose a built-in renderer

| Renderer                                                | Output              | Best for                                              | Package              |
| ------------------------------------------------------- | ------------------- | ----------------------------------------------------- | -------------------- |
| [Render SVG](/renderers/core/svg/)                      | `string`            | Web apps, emails, dashboards, HTML, static assets     | `@qrcodesdk/core`    |
| [Render PNG in Node.js](/renderers/node/png/)           | `Buffer`            | Servers, downloads, files, API responses, attachments | `@qrcodesdk/node`    |
| [Render to Canvas](/renderers/browser/canvas/)          | `HTMLCanvasElement` | Browser DOM, canvas workflows, client-side downloads  | `@qrcodesdk/browser` |
| [Render to an Image Element](/renderers/browser/image/) | `HTMLImageElement`  | Browser DOM, CSS styling, accessible image elements   | `@qrcodesdk/browser` |
| [Render Terminal Text](/renderers/core/text/)           | `string`            | CLIs, logs, terminals, snapshot tests                 | `@qrcodesdk/core`    |

Browser downloads are recipes on the SVG and Image renderer pages: use the browser package to wrap `QRCodeSVGRenderer()` for `.svg` downloads, or `QRCodeImageRenderer()` for `.png` downloads.

## Write a custom renderer

A renderer is a function that receives a `QRCodeMatrix` and returns any output type.

```ts
import {type QRCodeRenderer, qrcode} from '@qrcodesdk/core';

const jsonRenderer: QRCodeRenderer<string> = (matrix) =>
  JSON.stringify({
    size: matrix.length,
    matrix,
  });

const json = qrcode('custom output').render(jsonRenderer);
```

The matrix is a two-dimensional array. `1` means a dark module and `0` means a light module.

## Reuse the visual style planner

Custom visual renderers can consume the same platform-neutral drawing plan as the built-in SVG,
Canvas, and PNG renderers.

```ts
import {
  type QRCodeRenderer,
  type QRCodeStylePlan,
  createQRCodeStylePlan,
  parseQRCodeStylingOptions,
} from '@qrcodesdk/core';

const stylingOptions = parseQRCodeStylingOptions({
  dotsOptions: {type: 'rounded'},
  cornersSquareOptions: {type: 'extra-rounded'},
  cornersDotOptions: {type: 'dot'},
});

const planRenderer: QRCodeRenderer<QRCodeStylePlan> = (matrix) =>
  createQRCodeStylePlan(matrix, stylingOptions);
```

The plan contains a resolved background color and ordered drawing primitives. Primitive `x`, `y`,
and `size` values use QR-module coordinates and include the quiet-zone offset. Multiply those
values by the parsed `size` for pixel output. The discriminated `kind` values are `module`,
`finder-ring`, and `finder-center`; each primitive also carries its styling role, color, shape, and
quarter-turn rotation.

## Store a renderer on the builder

You can pass a renderer directly to `.render(renderer)` or store it with `.renderer(renderer).render()`.

```ts
import {type QRCodeRenderer, qrcode} from '@qrcodesdk/core';

const moduleCountRenderer: QRCodeRenderer<number> = (matrix) => matrix.length;

const moduleCount = qrcode('https://qrcodesdk.dev').renderer(moduleCountRenderer).render();
```

## Use matrix output directly

Use `.matrix()` when you want full control over rendering and do not need the renderer function shape.

```ts
import {type QRCodeMatrix, qrcode} from '@qrcodesdk/core';

const matrix: QRCodeMatrix = qrcode('https://qrcodesdk.dev').matrix();
```
