---
title: Customize appearance
description: Style QR code size, quiet zone, colors, modules, finder patterns, and accessible labels without compromising scan reliability.
docType: guide

related:
  - ../reference/builder.mdx
  - ../reference/renderers/svg.md
  - ../reference/renderers/text.md
  - ../reference/renderers/canvas.md
  - ../reference/renderers/image.md
  - ./center-images.md
---

Built-in visual renderers share the same styling options, defaults, and validation rules. This guide
uses SVG, but the size, quiet-zone, color, module, and finder settings also apply to Canvas,
PNG-backed Image, and Node.js PNG output.

## Prerequisite

Start with a working renderer. For the recommended default, install `@qrcodesdk/core` and confirm
that the [minimal SVG example](/reference/renderers/svg/#minimal-example) produces output.

## Apply a visual theme

```ts
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev').render(
  QRCodeSVGRenderer({
    size: 8,
    margin: 4,
    colors: {
      colorDark: '#111827',
      colorLight: '#ffffff',
    },
    dotsOptions: {type: 'rounded'},
    cornersSquareOptions: {type: 'extra-rounded', color: '#7c3aed'},
    cornersDotOptions: {type: 'dot', color: '#2563eb'},
    title: 'QRCodeSDK website',
    ariaLabel: 'Scan to open qrcodesdk.dev',
  }),
);
```

## Shared visual options

| Option                       | Default            | Validation and meaning                                     |
| ---------------------------- | ------------------ | ---------------------------------------------------------- |
| `size`                       | `5`                | Positive safe integer; pixels per module for visual output |
| `margin`                     | `4`                | Non-negative safe integer; quiet zone in modules           |
| `colors.colorDark`           | `'#000000'`        | Hash-prefixed, six-digit hexadecimal color                 |
| `colors.colorLight`          | `'#ffffff'`        | Hash-prefixed, six-digit hexadecimal color                 |
| `dotsOptions.type`           | `'square'`         | Shape of ordinary dark modules                             |
| `dotsOptions.color`          | `colors.colorDark` | Ordinary-module color override                             |
| `cornersSquareOptions.type`  | `'square'`         | Shape of finder outer rings                                |
| `cornersSquareOptions.color` | `colors.colorDark` | Finder-ring color override                                 |
| `cornersDotOptions.type`     | `'square'`         | Shape of finder centers                                    |
| `cornersDotOptions.color`    | `colors.colorDark` | Finder-center color override                               |

The rendered width and height are `size × (matrix width + 2 × margin)`. For terminal text, `size` is
an integer scale rather than a pixel measurement; see the [Terminal text reference](/reference/renderers/text/).

### Module and finder types

| Feature            | Option                      | Supported types                                                          |
| ------------------ | --------------------------- | ------------------------------------------------------------------------ |
| Ordinary modules   | `dotsOptions.type`          | `square`, `rounded`, `dots`, `classy`, `classy-rounded`, `extra-rounded` |
| Finder outer rings | `cornersSquareOptions.type` | all ordinary-module types plus `dot`                                     |
| Finder centers     | `cornersDotOptions.type`    | all ordinary-module types plus `dot`                                     |

Color overrides are independent. Omitting one keeps that feature on `colors.colorDark`. Curved shapes
are neighbor-aware and raster renderers antialias their edges. Shape options do not change terminal
text geometry.

## Keep the quiet zone clear

`margin` is the light quiet zone surrounding the encoded matrix. Keep the default four-module
margin unless the destination format adds an equivalent clear border. Do not place text, borders,
background art, or adjacent UI inside it.

When reducing the margin for a constrained layout, scan-test the final composition—not only the raw
renderer output—at its smallest displayed size.

## Add accessible labels

SVG and PNG-backed Image output support `title` and `ariaLabel`; Image output also supports `alt`.
Describe the destination or action rather than the visual grid.

```ts
QRCodeSVGRenderer({
  title: 'Event registration',
  ariaLabel: 'Scan to open event registration',
});
```

For a decorative QR code that repeats a nearby link, follow the accessibility semantics of the
element or component where you render it. The renderer reference lists the attributes emitted by
each output.

## Add a center image

SVG, Canvas, PNG-backed Image, Node.js PNG, React, and Angular accept prepared center-image sources,
but their source types and loading behavior differ. Follow [Add a center image](/guides/center-images/)
for preparation, sizing, padding, and framework-specific examples.

## Protect scan reliability

- Keep every dark feature in strong contrast with `colors.colorLight`; do not rely on hue difference
  alone.
- Preserve a clear quiet zone and render modules large enough to survive the final display or print
  process.
- Prefer conservative shapes when the QR code will be small, compressed, printed, or viewed by older
  scanners.
- Use `.errorCorrection('H')` when a center image intentionally covers modules, while remembering
  that higher redundancy cannot guarantee recovery from an oversized overlay.
- Test the final artifact with the devices, apps, lighting, scale, and compression used in production.

Error correction changes matrix capacity rather than appearance. Its complete definition and the
version/mask controls are in [Builder and matrix](/reference/builder/#matrix-options).

## Result and next step

The output now uses one shared visual theme without changing its payload. Look up output-specific
options in [Renderer outputs](/reference/renderers/), or add a prepared logo with
[Add a center image](/guides/center-images/).
