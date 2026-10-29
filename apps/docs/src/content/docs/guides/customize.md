---
title: Customize appearance
description: Set QR code dimensions, colors, module shapes, and finder patterns with shared styling options.
docType: guide

related:
  - ../reference/builder.mdx
  - ../reference/renderers/svg.md
  - ../reference/renderers/text.md
  - ../reference/renderers/canvas.md
  - ../reference/renderers/image.md
  - ./center-images.md
---

SVG, Canvas, browser Image, and Node.js PNG renderers accept the same `QRCodeVisualStyle`.
Pass it to the renderer's `style` option. Styling changes the appearance without changing the encoded
matrix.

## Apply a visual theme

```ts
import {QRCodeSVGRenderer, type QRCodeVisualStyle, qrcode} from '@qrcodesdk/core';

const style: QRCodeVisualStyle = {
  moduleSize: 8,
  quietZone: 4,
  foreground: '#111827',
  background: '#ffffff',
  modules: {shape: 'rounded'},
  finder: {
    outer: {shape: 'extra-rounded', color: '#7c3aed'},
    center: {shape: 'circle', color: '#2563eb'},
  },
};

const svg = qrcode('https://qrcodesdk.dev').render(
  QRCodeSVGRenderer({
    style,
    accessibility: {
      title: 'QRCodeSDK website',
      ariaLabel: 'Scan to open qrcodesdk.dev',
    },
  }),
);
```

Renderer factories validate and copy the complete option tree immediately. Unknown properties and
invalid values throw when the factory is called. Later mutations to `style` do not change the
renderer.

## Shared visual style

| Property              | Default      | Validation and meaning                                 |
| --------------------- | ------------ | ------------------------------------------------------ |
| `moduleSize`          | `5`          | Positive safe integer; pixels per module               |
| `quietZone`           | `4`          | Non-negative safe integer; quiet-zone width in modules |
| `foreground`          | `'#000000'`  | RGB or RGBA hexadecimal color                          |
| `background`          | `'#ffffff'`  | RGB or RGBA hexadecimal color                          |
| `modules.shape`       | `'square'`   | Shape of ordinary dark modules                         |
| `modules.color`       | `foreground` | Ordinary-module color override                         |
| `finder.outer.shape`  | `'square'`   | Shape of finder outer rings                            |
| `finder.outer.color`  | `foreground` | Finder-ring color override                             |
| `finder.center.shape` | `'square'`   | Shape of finder centers                                |
| `finder.center.color` | `foreground` | Finder-center color override                           |

Colors must be exactly `#RRGGBB` or `#RRGGBBAA`, with case-insensitive hexadecimal digits. Alpha is
preserved by all graphical renderers.

Ordinary modules support `square`, `circle`, `rounded`, `extra-rounded`, `diagonal`, and
`diagonal-rounded`. Finder outer rings and centers support `square`, `rounded`, `extra-rounded`, and
`circle`. The `extra-rounded` finder shape has rounder corners than `rounded`, with short straight
edges. The `circle` shape is fully circular. Finder shapes do not inherit the ordinary module shape.

The output width and height are `moduleSize × (matrix width + 2 × quietZone)`.

## Text styling

Terminal text accepts a smaller `QRCodeTextStyle` with only `moduleSize` and `quietZone`.
Configure ANSI colors and the compact or full layout on `QRCodeTextRenderer`.

```ts
import {QRCodeTextRenderer} from '@qrcodesdk/core';

QRCodeTextRenderer({
  style: {moduleSize: 1, quietZone: 2},
  layout: 'compact',
  ansi: {mode: 'blocks', foreground: '#111827', background: '#ffffff'},
});
```

## Accessibility and center images

Accessibility is output-specific and lives under `accessibility`. SVG accepts `ariaLabel` and
`title`; Canvas accepts `ariaLabel` and `title`; Image accepts `alt`, `ariaLabel`, and `title`.

Center images also remain renderer options because their source types differ by runtime. See
[Add a center image](/guides/center-images/) for preparation and sizing.

## Scan reliability

The API accepts transparent colors, low contrast, a zero quiet zone, all supported shapes, and the
full image-size range. Those values are structurally valid, but not necessarily easy to scan. Test
the final displayed or printed QR code on the devices and at the sizes used in production.
