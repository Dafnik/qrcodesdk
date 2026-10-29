---
title: Custom renderers
description: Build matrix-only or styled custom QRCodeSDK renderers with the stable drawing protocol.
docType: reference

related:
  - ../guides/customize.md
  - ../packages/core.mdx
---

A `QRCodeRenderer<T>` receives an immutable QR matrix and returns any output type. Use the matrix
directly for unstyled output, or use `createQRCodeStyler()` and the public drawing protocol when a
custom renderer should support the same graphical style as SVG, Canvas, Image, and PNG.

## Matrix-only renderer

```ts
import {type QRCodeRenderer, qrcode} from '@qrcodesdk/core';

const jsonRenderer: QRCodeRenderer<string> = (matrix) =>
  JSON.stringify({moduleCount: matrix.length, matrix});

const json = qrcode('custom output').render(jsonRenderer);
```

The matrix is a two-dimensional array. `1` means a dark module and `0` means a light module.

## Styled renderer

Import `createQRCodeStyler()` and the drawing types from `@qrcodesdk/core/drawing`.
The factory validates and snapshots a `QRCodeVisualStyle` immediately. Its `draw()`
method caches immutable drawings by matrix identity. Implement `QRCodeStyledDrawingTarget` to translate
the callback stream into your output format.

```ts
import {type QRCodeRenderer, type QRCodeVisualStyle, qrcode} from '@qrcodesdk/core';
import {type QRCodeStyledDrawingTarget, createQRCodeStyler} from '@qrcodesdk/core/drawing';

class CommandTarget implements QRCodeStyledDrawingTarget {
  readonly commands: string[] = [];

  drawBackground(r: number, g: number, b: number, a: number) {
    this.commands.push(`background ${r} ${g} ${b} ${a}`);
  }
  beginLayer(r: number, g: number, b: number, a: number) {
    this.commands.push(`layer ${r} ${g} ${b} ${a}`);
  }
  drawRectangle(x: number, y: number, width: number, height: number) {
    this.commands.push(`rectangle ${x} ${y} ${width} ${height}`);
  }
  beginPath(fillRule: 'nonzero' | 'evenodd') {
    this.commands.push(`path ${fillRule}`);
  }
  moveTo(x: number, y: number) {
    this.commands.push(`move ${x} ${y}`);
  }
  lineTo(x: number, y: number) {
    this.commands.push(`line ${x} ${y}`);
  }
  arc(
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    counterclockwise: boolean,
  ) {
    this.commands.push(
      `arc ${centerX} ${centerY} ${radius} ${startAngle} ${endAngle} ${counterclockwise}`,
    );
  }
  closePath() {
    this.commands.push('close');
  }
  endPath() {
    this.commands.push('end-path');
  }
  endLayer() {
    this.commands.push('end-layer');
  }
}

function commandRenderer(style?: QRCodeVisualStyle): QRCodeRenderer<readonly string[]> {
  const styler = createQRCodeStyler(style);
  return (matrix) => {
    const target = new CommandTarget();
    styler.draw(matrix).paint(target);
    return target.commands;
  };
}

const commands = qrcode('custom output').render(
  commandRenderer({modules: {shape: 'rounded'}, background: '#ffffff00'}),
);
```

### Drawing dimensions

`styler.draw(matrix)` returns an immutable `QRCodeStyledDrawing` with these properties and methods:

| Member                       | Type             | Meaning                                                            |
| ---------------------------- | ---------------- | ------------------------------------------------------------------ |
| `moduleCount`                | `number`         | Matrix width before adding the quiet zone                          |
| `moduleSize`                 | `number`         | Requested output pixels per module                                 |
| `quietZone`                  | `number`         | Quiet-zone width in modules                                        |
| `viewSize`                   | `number`         | Drawing width and height in modules: `moduleCount + 2 × quietZone` |
| `outputSize`                 | `number`         | Output width and height in pixels: `viewSize × moduleSize`         |
| `paint(target)`              | `void`           | Sends drawing commands to a `QRCodeStyledDrawingTarget`            |
| `placeCenterImage(options?)` | placement object | Returns center-image and optional clearing boxes in module units   |

Coordinates start at the upper-left corner of the drawing, including its quiet zone. X increases to
the right and Y increases downward. All coordinates and lengths are finite module units. Scale
them by `moduleSize` when drawing to pixels. For SVG, use `viewSize` for the viewBox and `outputSize`
for the output width and height.

### Drawing callbacks

Implement every method of `QRCodeStyledDrawingTarget`. RGBA channels are integers from `0` through
`255`, including alpha.

| Callback                                                                | Required behavior                                                                                             |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `drawBackground(r, g, b, a)`                                            | Fill the entire `viewSize × viewSize` drawing with this color                                                 |
| `beginLayer(r, g, b, a)`                                                | Select the fill color for subsequent rectangles and paths                                                     |
| `drawRectangle(x, y, width, height)`                                    | Fill a rectangle in module units without a stroke                                                             |
| `beginPath(fillRule)`                                                   | Begin a path using the `'nonzero'` or `'evenodd'` fill rule                                                   |
| `moveTo(x, y)`                                                          | Start a new subpath at these coordinates                                                                      |
| `lineTo(x, y)`                                                          | Add a straight segment from the current point                                                                 |
| `arc(centerX, centerY, radius, startAngle, endAngle, counterclockwise)` | Add a circular arc with angles in radians, measured from the positive X axis; increasing angles run clockwise |
| `closePath()`                                                           | Close the current subpath                                                                                     |
| `endPath()`                                                             | Fill the complete path with the current layer color and path fill rule                                        |
| `endLayer()`                                                            | Finish the current layer                                                                                      |

Each `paint()` call starts with one background callback, followed by layers. Layers do not nest.
Paths begin and end within their layer. Each begin callback has a matching end callback. Errors
thrown by a target propagate to the caller unchanged. Callback counts, batching, command order
within these rules, and exact path segmentation may change between releases.

### Center-image placement

For a center image, call `drawing.placeCenterImage()` with the layout options `size`, `padding`, and
`clearBackground`. The returned `centerImage` box has `x`, `y`, and `size` in module units. The
`clear` property has the same shape when clearing is enabled and is `undefined` otherwise. The clear
box includes padding around the image.

The placement method only calculates boxes. Your renderer must load and decode the source, clear
the covered QR modules when a clear box is present, and composite the image. See
[Add a center image](/guides/center-images/#configure-the-center-image) for defaults and constraints.

## Store a renderer on the builder

Pass a renderer directly to `.render(renderer)` or store it with `.renderer(renderer).render()`.

```ts
const moduleCountRenderer: QRCodeRenderer<number> = (matrix) => matrix.length;
const moduleCount = qrcode('https://qrcodesdk.dev').renderer(moduleCountRenderer).render();
```
