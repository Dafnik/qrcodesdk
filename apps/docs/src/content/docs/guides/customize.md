---
title: Customize appearance
description: Set QR code dimensions, colors, module shapes, and finder and alignment patterns with shared styling options.
docType: guide

related:
  - ../reference/builder.mdx
  - ../reference/renderers/svg.md
  - ../reference/renderers/text.md
  - ../reference/renderers/canvas.md
  - ../reference/renderers/image.md
  - ./center-images.md
  - ../reference/custom-renderers.md
---

SVG, Canvas, browser Image, and Node.js PNG renderers accept the same `QRCodeVisualStyle`.
Pass it to the renderer's `style` option. Styling changes the appearance without changing the encoded
matrix.

## Apply a visual theme

```ts
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';
import {circle, finder, rounded} from '@qrcodesdk/core/style';

const svg = qrcode('https://qrcodesdk.dev').render(
  QRCodeSVGRenderer({
    style: {
      moduleSize: 8,
      foreground: '#0f172a',
      modules: rounded(),
      finder: finder({ring: rounded({radius: 1}), center: circle(), color: '#e11d48'}),
    },
    accessibility: {
      title: 'QRCodeSDK website',
      ariaLabel: 'Scan to open qrcodesdk.dev',
    },
  }),
);
```

Import shapes and the `finder()` and `alignment()` factories from `@qrcodesdk/core/style`.
React, Vue, Svelte, and Angular users import them from their framework package, such as
`import {finder, rounded} from '@qrcodesdk/react'`, and pass the style through the component's
`options`.

Renderer factories check style value constraints when called and copy their values. TypeScript
checks option names and types. Replacing a `style`
property later does not change the renderer. `finder()` and `alignment()` return opaque style
values. Pass those values to the matching style property; they expose no drawing methods.

## Shared visual style

| Property     | Default     | Validation and meaning                                            |
| ------------ | ----------- | ----------------------------------------------------------------- |
| `moduleSize` | `5`         | Positive safe integer; pixels per module                          |
| `quietZone`  | `4`         | Non-negative safe integer; quiet-zone width in modules            |
| `foreground` | `'#000000'` | RGB or RGBA hexadecimal color of every dark module                |
| `background` | `'#ffffff'` | RGB or RGBA hexadecimal color behind the code                     |
| `modules`    | square      | `QRCodeModuleShape`, such as `rounded()` or `circle()`            |
| `finder`     | square      | `QRCodeFinderStyle`, created with `finder({ring, center, color})` |
| `alignment`  | `modules`   | `QRCodeAlignmentStyle`, created with `alignment({ring, center})`  |

Colors must be exactly `#RRGGBB` or `#RRGGBBAA`, with case-insensitive hexadecimal digits. Alpha is
preserved by all graphical renderers.

The output width and height are `moduleSize × (matrix width + 2 × quietZone)`.

## Colors

`foreground` colors every dark module, and `background` fills the whole output, including the quiet
zone. Use [`finder()`](#finder-patterns) and [`alignment()`](#alignment-patterns) to override
pattern colors. Colors need no import:

```ts
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev').render(
  QRCodeSVGRenderer({style: {foreground: '#1e3a8a', background: '#eff6ff'}}),
);
```

## Module shapes

Import a shape from `@qrcodesdk/core/style` and pass it as `modules`. To keep square modules, omit
`modules`.

| Shape                | Option   | Default | Effect                                                                 |
| -------------------- | -------- | ------- | ---------------------------------------------------------------------- |
| `rounded({radius})`  | `radius` | `0.5`   | Rounds module corners that face no dark neighbor; `0` to `1` modules   |
| `diagonal({radius})` | `radius` | `0.5`   | Rounds only the top-left and bottom-right corners for a leaf-like look |
| `circle({size})`     | `size`   | `1`     | Draws each module as a dot; diameter greater than `0` and at most `1`  |

Connected dark modules keep straight shared edges with `rounded()` and `diagonal()`. Modules drawn
by finder/alignment styles or cleared for center images count as light neighbors, so the remaining modules round against
those boundaries. A `radius` of `1` gives the roundest result. Alignment patterns take the module
shape unless you style them with [`alignment()`](#alignment-patterns).

```ts
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';
import {circle} from '@qrcodesdk/core/style';

const svg = qrcode('https://qrcodesdk.dev').render(QRCodeSVGRenderer({style: {modules: circle()}}));
```

## Finder patterns

The three finder patterns in the corners stay square in the foreground color, even when `modules`
has a shape. Pass `finder()` to shape or color them:

```ts
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';
import {circle, finder, rounded} from '@qrcodesdk/core/style';

const svg = qrcode('https://qrcodesdk.dev').render(
  QRCodeSVGRenderer({
    style: {
      modules: circle(),
      finder: finder({ring: rounded({radius: 1}), center: circle(), color: '#7c3aed'}),
    },
  }),
);
```

| Option   | Default    | Effect                                                       |
| -------- | ---------- | ------------------------------------------------------------ |
| `ring`   | square     | Shape of the 7 × 7 finder ring, such as `rounded()`          |
| `center` | square     | Shape of the 3 × 3 finder center, such as `circle()`         |
| `color`  | foreground | One RGB or RGBA hexadecimal color for both rings and centers |

The ring and the center take any shape, independently of the module shape and of each other.
`rounded()` and `diagonal()` scale their radius to the size of each finder piece. `circle()` always
draws full circles for finder pieces; its `size` option only applies to modules.

## Alignment patterns

Larger QR codes, from version 2, contain smaller alignment patterns: a 5 × 5 ring around a single
center module. Without an alignment style, they take the module shape and the foreground color. Pass
`alignment()` to draw every alignment pattern with its own shapes and color:

```ts
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';
import {alignment, circle, finder, rounded} from '@qrcodesdk/core/style';

const svg = qrcode('https://qrcodesdk.dev').render(
  QRCodeSVGRenderer({
    style: {
      modules: rounded(),
      finder: finder({ring: rounded({radius: 1}), center: circle(), color: '#7c3aed'}),
      alignment: alignment({ring: rounded({radius: 1}), center: circle(), color: '#7c3aed'}),
    },
  }),
);
```

| Option   | Default    | Effect                                                       |
| -------- | ---------- | ------------------------------------------------------------ |
| `ring`   | square     | Shape of the 5 × 5 alignment ring, such as `rounded()`       |
| `center` | square     | Shape of the 1 × 1 alignment center, such as `circle()`      |
| `color`  | foreground | One RGB or RGBA hexadecimal color for both rings and centers |

As with `finder()`, `rounded()` and `diagonal()` scale their radius to each piece, and `circle()`
draws full circles. `alignment()` without a `ring` or `center` draws square pieces, even when
`modules` has a shape.

## Custom shapes

Use `customShape()` to prepare your own paths once, then share the result across renderers. Each
piece is SVG path data in module units, measured from the piece's top-left corner:

```ts
import {QRCodeSVGRenderer, type QRCodeShape, qrcode} from '@qrcodesdk/core';
import {alignment, customShape, finder} from '@qrcodesdk/core/style';

const dot = 'm.25 0h.5l.25 .25v.5l-.25 .25h-.5l-.25 -.25v-.5z';
const octagon: QRCodeShape = customShape({
  module: dot,
  finderRing: 'm1 0h5l1 1v5l-1 1h-5l-1 -1v-5zm0 1v5h5v-5z',
  finderCenter: 'm.75 0h1.5l.75 .75v1.5l-.75 .75h-1.5l-.75 -.75v-1.5z',
  alignmentRing: 'm1 0h3l1 1v3l-1 1h-3l-1 -1v-3zm0 1v3h3v-3z',
  alignmentCenter: dot,
});

const svg = qrcode('https://qrcodesdk.dev').render(
  QRCodeSVGRenderer({
    style: {
      modules: octagon,
      finder: finder({ring: octagon, center: octagon}),
      alignment: alignment({ring: octagon, center: octagon}),
    },
  }),
);
```

| Property          | Size  | Meaning                                      |
| ----------------- | ----- | -------------------------------------------- |
| `module`          | 1 × 1 | One path for every module                    |
| `finderRing`      | 7 × 7 | The finder ring, including its 5 × 5 hole    |
| `finderCenter`    | 3 × 3 | The finder center                            |
| `alignmentRing`   | 5 × 5 | The alignment ring, including its 3 × 3 hole |
| `alignmentCenter` | 1 × 1 | The alignment center                         |

Path data must use only the relative `m`, `l`, `h`, `v`, `c`, `a`, and `z` commands, and every
subpath must be closed. Pieces are filled with the even-odd rule, so a second subpath inside the
first one cuts a hole, like the 5 × 5 hole of the finder ring above. `modules` only reads `module`,
`finder()` only reads `finderRing` from its `ring` and `finderCenter` from its `center`, and
`alignment()` only reads `alignmentRing` and `alignmentCenter` the same way. A shape used in one
place may omit the other properties.

For example, this module shape draws a hexagon:

```ts
import {type QRCodeModuleShape, customShape} from '@qrcodesdk/core/style';

const hexagon: QRCodeModuleShape = customShape({
  module: 'm.5 0 .5 .25v.5l-.5 .25-.5-.25v-.5z',
});
```

Built-in `rounded()` and `diagonal()` shapes contain an opaque `QRCodeModulePattern` that adapts
to neighboring dark modules. Its representation and neighbor masks are internal; custom shapes
supply a single path for each piece.

`customShape()` validates its paths and throws `INVALID_OPTIONS` for unsupported commands or open
subpaths. Its result contains opaque `QRCodeShapePiece` values. Renderer factories reuse them
without parsing the paths again.

## Bundle size

Import only the shape, pattern, and center-image factories you use. Bundlers with tree shaking can
remove the others. Dimensions and colors need no import from `@qrcodesdk/core/style`.
Built-in factories generate prepared geometry directly. The custom-path parser is included only
when you import `customShape()` in SVG and Canvas consumers. PNG rasterization also uses the parser.

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

Center images are also renderer options because their source types differ by runtime. Each renderer
takes a center image created by its own factory, such as `svgCenterImage()`. See
[Add a center image](/guides/center-images/) for preparation and sizing.

## Scan reliability

The API accepts transparent colors, low contrast, a zero quiet zone, every shape, custom path data,
and the full image-size range. Those values are structurally valid, but not necessarily easy to
scan. Small `circle()` sizes and custom shapes that leave little of each module dark are harder to
read. Test the final displayed or printed QR code on the devices and at the sizes used in
production.
