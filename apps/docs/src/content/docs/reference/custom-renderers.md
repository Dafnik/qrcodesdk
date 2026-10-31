---
title: Custom renderers
description: Render QR matrices directly or use the styler for shared colors and geometry.
docType: reference

related:
  - ../guides/customize.md
  - ../packages/core.mdx
---

A `QRCodeRenderer<T>` receives an immutable QR matrix and returns any output type. Read the matrix
directly for unstyled output, or use `createQRCodeStyler()` from `@qrcodesdk/core/drawing` when a
custom renderer should support the same `QRCodeVisualStyle` as SVG, Canvas, Image, and PNG.

## Matrix-only renderer

```ts
import {type QRCodeRenderer, qrcode} from '@qrcodesdk/core';

const textRenderer: QRCodeRenderer<string> = ({size, modules}) => {
  const rows: string[] = [];
  for (let y = 0; y < size; y++) {
    let row = '';
    for (let x = 0; x < size; x++) row += modules[y * size + x] === 1 ? '#' : '.';
    rows.push(row);
  }
  return rows.join('\n');
};

const text = qrcode('custom output').render(textRenderer);
```

### Matrix data

A `QRCodeMatrix` is a read-only object with flat, row-major module data. The module at column `x`
and row `y` is at index `y * size + x` in both arrays:

| Property  | Type                | Meaning                                          |
| --------- | ------------------- | ------------------------------------------------ |
| `size`    | `number`            | Modules per side, without a quiet zone           |
| `modules` | `readonly number[]` | `1` for a dark module and `0` for a light module |
| `roles`   | `readonly number[]` | The [module role](#module-roles) of every module |

### Module roles

`roles` records the function of every module, light or dark. `QR_CODE_MODULE_ROLES` from
`@qrcodesdk/core/drawing` names the values:

| Value | Name              | Modules                                                 |
| ----- | ----------------- | ------------------------------------------------------- |
| `0`   | `data`            | Data and error correction                               |
| `1`   | `finderRing`      | 7 × 7 finder ring, including the light gap inside it    |
| `2`   | `finderCenter`    | 3 × 3 finder center                                     |
| `3`   | `separator`       | Light border around each finder pattern                 |
| `4`   | `alignmentRing`   | 5 × 5 alignment ring, including the light gap inside it |
| `5`   | `alignmentCenter` | 1 × 1 alignment center                                  |
| `6`   | `timing`          | Timing patterns                                         |
| `7`   | `format`          | Format information, including the always-dark module    |
| `8`   | `version`         | Version information, in version 7 and later             |

Roles depend only on the version. Every matrix of the same size shares one `roles` array.
Both arrays are frozen. Use `slice()` to obtain a mutable copy.

```ts
import {qrcode} from '@qrcodesdk/core';
import {QR_CODE_MODULE_ROLES} from '@qrcodesdk/core/drawing';

const {size, modules, roles} = qrcode('custom output').matrix();
let darkDataModules = 0;
for (let index = 0; index < size * size; index++) {
  if (modules[index] === 1 && roles[index] === QR_CODE_MODULE_ROLES.data) darkDataModules++;
}
```

## Styled renderer

`createQRCodeStyler(style)` validates and snapshots a `QRCodeVisualStyle` immediately and returns a
function that turns a matrix into a `QRCodeDrawing`. The drawing is plain data, so a renderer only
has to fill rectangles and paths:

```ts
import {type QRCodeRenderer, type QRCodeVisualStyle, qrcode} from '@qrcodesdk/core';
import {createQRCodeStyler, toQRCodePathData} from '@qrcodesdk/core/drawing';
import {rounded} from '@qrcodesdk/core/style';

function offscreenRenderer(style?: QRCodeVisualStyle): QRCodeRenderer<OffscreenCanvas> {
  const draw = createQRCodeStyler(style);
  return (matrix) => {
    const drawing = draw(matrix);
    const canvas = new OffscreenCanvas(drawing.outputSize, drawing.outputSize);
    const context = canvas.getContext('2d')!;
    // Draw in module units.
    context.scale(drawing.moduleSize, drawing.moduleSize);
    context.fillStyle = drawing.background;
    context.fillRect(0, 0, drawing.viewSize, drawing.viewSize);
    for (const layer of drawing.layers) {
      context.fillStyle = layer.color;
      context.fill(new Path2D(toQRCodePathData(layer)), 'evenodd');
    }
    return canvas;
  };
}

const canvas = qrcode('custom output').render(offscreenRenderer({modules: rounded()}));
```

### Drawing data

| Property      | Type                            | Meaning                                                            |
| ------------- | ------------------------------- | ------------------------------------------------------------------ |
| `moduleCount` | `number`                        | Matrix width before adding the quiet zone                          |
| `moduleSize`  | `number`                        | Requested output pixels per module                                 |
| `quietZone`   | `number`                        | Quiet-zone width in modules                                        |
| `viewSize`    | `number`                        | Drawing width and height in modules: `moduleCount + 2 × quietZone` |
| `outputSize`  | `number`                        | Output width and height in pixels: `viewSize × moduleSize`         |
| `background`  | `QRCodeColor`                   | Color that fills the whole `viewSize × viewSize` drawing           |
| `layers`      | `readonly QRCodeDrawingLayer[]` | Filled geometry in paint order                                     |

Each `QRCodeDrawingLayer` has one fill color and two kinds of geometry:

| Property | Type                           | Meaning                                                                  |
| -------- | ------------------------------ | ------------------------------------------------------------------------ |
| `color`  | `QRCodeColor`                  | Fill color for all geometry in the layer                                 |
| `rects`  | `readonly number[]`            | Filled rectangles as flat `x, y, width, height` values                   |
| `tiles`  | `readonly [path, positions][]` | Shaped pieces: one path and the flat `x, y` positions where it is placed |

Coordinates start at the upper-left corner of the drawing, including its quiet zone. X increases to
the right and Y increases downward. One unit is one module. Scale by `moduleSize` when drawing to
pixels. For SVG, use `viewSize` for the viewBox and `outputSize` for the width and height.

Colors are lowercase `#rrggbb` or `#rrggbbaa` values. A tile path uses the format of
[custom shapes](/guides/customize/#custom-shapes): relative path data from the piece's top-left
corner. Prepend a move to its position to place it.

Geometry never overlaps, within or across layers. Fill every layer with the even-odd rule. The
number of layers, the split between rectangles and tiles, and the merging of rectangles may change
between releases; the filled area does not.

### Path data

`toQRCodePathData(layer)` serializes one layer, rectangles and tiles, into compact SVG path data in
view coordinates. Use it as the `d` attribute of an SVG `<path>` with `fill-rule="evenodd"`, or pass
it to `new Path2D()` and fill with `'evenodd'`. Renderers that cannot read path data, such as a
rasterizer, can use `rects` and `tiles` directly.

### Center images

`createQRCodeCenterImage(layout?)` validates the center-image layout options `size`, `padding`, and
`clearBackground` and returns two members:

| Member           | Type              | Meaning                                                                |
| ---------------- | ----------------- | ---------------------------------------------------------------------- |
| `part`           | `QRCodeStylePart` | Removes every module the image or its padding touches, unless disabled |
| `place(drawing)` | `{x, y, size}`    | Square box for the image in view coordinates                           |

Pass `part` to the styler and composite your decoded image into the box after filling the layers:

```ts
import {type QRCodeRenderer, qrcode} from '@qrcodesdk/core';
import {
  createQRCodeCenterImage,
  createQRCodeStyler,
  toQRCodePathData,
} from '@qrcodesdk/core/drawing';

function logoRenderer(logo: ImageBitmap): QRCodeRenderer<OffscreenCanvas> {
  const {part, place} = createQRCodeCenterImage({size: 0.3, padding: 1});
  const draw = createQRCodeStyler({moduleSize: 8}, [part]);
  return (matrix) => {
    const drawing = draw(matrix);
    const canvas = new OffscreenCanvas(drawing.outputSize, drawing.outputSize);
    const context = canvas.getContext('2d')!;
    context.scale(drawing.moduleSize, drawing.moduleSize);
    context.fillStyle = drawing.background;
    context.fillRect(0, 0, drawing.viewSize, drawing.viewSize);
    for (const layer of drawing.layers) {
      context.fillStyle = layer.color;
      context.fill(new Path2D(toQRCodePathData(layer)), 'evenodd');
    }
    const box = place(drawing);
    context.drawImage(logo, box.x, box.y, box.size, box.size);
    return canvas;
  };
}

const logo = await createImageBitmap(await (await fetch('/logo.png')).blob());
const canvas = qrcode('custom output').errorCorrection('H').render(logoRenderer(logo));
```

Cleared modules leave the background visible, and neighboring shapes round against the gap.
See [Add a center image](/guides/center-images/#configure-the-center-image) for layout defaults.

## Custom style parts

A style part draws one group of modules before the remaining modules are drawn. `finder()` and
`alignment()` from `@qrcodesdk/core/style` are style parts. A part is any function of type
`QRCodeStylePart`, and it receives a `QRCodeDrawContext`:

| Member                               | Type              | Meaning                                                            |
| ------------------------------------ | ----------------- | ------------------------------------------------------------------ |
| `matrix`                             | `QRCodeMatrix`    | The matrix being drawn                                             |
| `claimRoles(...roles)`               | `void`            | Stops drawing modules with these [roles](#module-roles) as modules |
| `claimArea(x, y, width, height)`     | `void`            | Stops drawing the modules in this area, leaving the background     |
| `isAreaClaimed(x, y, width, height)` | `boolean`         | Whether the area overlaps any previously claimed area              |
| `layer(color?)`                      | `QRCodeDrawLayer` | Layer for a color, or for the foreground when the color is omitted |

Areas and layers use matrix coordinates, without the quiet zone. A layer collects geometry:

- `rect(x, y, width, height)` fills a rectangle with non-negative dimensions.
- `tile(path, x, y)` places shape path data with its top-left corner at `x, y`.

Coordinates must be finite and may be fractional. Area claims remove every whole module the area
touches. Zero-width or zero-height areas and rectangles have no effect.

Claim the roles you draw yourself and draw only within their modules, so geometry never overlaps.
Claims only affect the remaining modules: claimed modules are not drawn and count as light neighbors
for their shapes, while geometry that parts add to layers is always drawn. This part draws the
timing patterns in their own color:

```ts
import {qrcode} from '@qrcodesdk/core';
import {
  type QRCodeStylePart,
  QR_CODE_MODULE_ROLES,
  createQRCodeStyler,
} from '@qrcodesdk/core/drawing';
import {finder, rounded} from '@qrcodesdk/core/style';

const {timing} = QR_CODE_MODULE_ROLES;

const timingPart: QRCodeStylePart = (context) => {
  context.claimRoles(timing);
  const {size, modules, roles} = context.matrix;
  const layer = context.layer('#2563eb');
  for (let index = 0; index < size * size; index++) {
    if (roles[index] === timing && modules[index] === 1) {
      layer.rect(index % size, Math.floor(index / size), 1, 1);
    }
  }
};

const draw = createQRCodeStyler({modules: rounded(), finder: finder()}, [timingPart]);
const drawing = draw(qrcode('https://qrcodesdk.dev').matrix());
```

`createQRCodeStyler(style, parts?)` runs the extra parts in order, then `style.finder`, then
`style.alignment`. This lets renderer parts claim areas before style parts draw them.
With a built-in renderer, compose parts in `style.finder` or `style.alignment`:

```ts
import {QRCodeSVGRenderer, type QRCodeStylePart, qrcode} from '@qrcodesdk/core';
import {alignment, circle} from '@qrcodesdk/core/style';

const circularAlignment = alignment({ring: circle(), center: circle()});
const combined: QRCodeStylePart = (context) => {
  circularAlignment(context);
  timingPart(context);
};

const svg = qrcode('https://qrcodesdk.dev').render(
  QRCodeSVGRenderer({style: {alignment: combined}}),
);
```

Layers are painted in the order they are first requested, and the foreground layer of the remaining
modules is requested last unless a part requested it first. A part's tile paths are validated when
the matrix is drawn, and invalid path data throws `INVALID_OPTIONS`.

See [Builder and matrix](/reference/builder/) for storing a renderer on a builder.
