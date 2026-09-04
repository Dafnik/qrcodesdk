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

`createQRCodeStyler()` validates and snapshots a `QRCodeVisualStyle` immediately. Its `draw()`
method caches immutable drawings by matrix identity. Implement `QRCodeDrawingTarget` to translate
the callback stream into your output format.

```ts
import {
  type QRCodeRenderer,
  type QRCodeVisualStyle,
  createQRCodeStyler,
  qrcode,
} from '@qrcodesdk/core';
import type {QRCodeDrawingTarget} from '@qrcodesdk/core/drawing';

class CommandTarget implements QRCodeDrawingTarget {
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
  cubicTo(
    control1X: number,
    control1Y: number,
    control2X: number,
    control2Y: number,
    x: number,
    y: number,
  ) {
    this.commands.push(`cubic ${control1X} ${control1Y} ${control2X} ${control2Y} ${x} ${y}`);
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

Coordinates are finite module units. RGBA channels are integers from 0 through 255. A paint starts
with one background callback, then emits balanced, non-nested layer and path lifecycles. Target
exceptions propagate unchanged. Callback counts, batching, command order within those lifecycle
rules, and exact path segmentation are implementation details.

For a renderer-specific center image, call `drawing.placeImage({size, padding,
clearBackground})`. It returns the image box and optional clear box in the same module coordinate
system. Loading, decoding, clearing, and compositing the actual source remain the renderer's job.

## Store a renderer on the builder

Pass a renderer directly to `.render(renderer)` or store it with `.renderer(renderer).render()`.

```ts
const moduleCountRenderer: QRCodeRenderer<number> = (matrix) => matrix.length;
const moduleCount = qrcode('https://qrcodesdk.dev').renderer(moduleCountRenderer).render();
```
