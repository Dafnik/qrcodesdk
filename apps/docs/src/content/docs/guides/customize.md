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

Import shapes and the `finder()` and `alignment()` parts from `@qrcodesdk/core/style`.
React, Vue, Svelte, and Angular users import them from their framework package, such as
`import {finder, rounded} from '@qrcodesdk/react'`, and pass the style through the component's
`options`.

Renderer factories validate style options when called and copy their values. Replacing a `style`
property later does not change the renderer. Custom parts run when rendering and validate their
geometry then.

## Shared visual style

| Property     | Default     | Validation and meaning                                     |
| ------------ | ----------- | ---------------------------------------------------------- |
| `moduleSize` | `5`         | Positive safe integer; pixels per module                   |
| `quietZone`  | `4`         | Non-negative safe integer; quiet-zone width in modules     |
| `foreground` | `'#000000'` | RGB or RGBA hexadecimal color of every dark module         |
| `background` | `'#ffffff'` | RGB or RGBA hexadecimal color behind the code              |
| `modules`    | square      | `QRCodeModuleShape`, such as `rounded()` or `circle()`     |
| `finder`     | square      | `QRCodeStylePart`, such as `finder({ring, center, color})` |
| `alignment`  | `modules`   | `QRCodeStylePart`, such as `alignment({ring, center})`     |

Colors must be exactly `#RRGGBB` or `#RRGGBBAA`, with case-insensitive hexadecimal digits. Alpha is
preserved by all graphical renderers.

The output width and height are `moduleSize × (matrix width + 2 × quietZone)`.

## Colors

`foreground` colors every dark module, and `background` fills the whole output, including the quiet
zone. The only other colors are the finder and alignment colors, set with
[`finder()`](#finder-patterns) and [`alignment()`](#alignment-patterns). Colors need no import:

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

Connected dark modules keep straight shared edges with `rounded()` and `diagonal()`. Modules claimed
by style parts or cleared areas count as light neighbors, so the remaining modules round against
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
center module. Without a part, they take the module shape and the foreground color. Pass
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

A shape is plain, serializable data, so you can define your own. Each piece is SVG path data in
module units, measured from the piece's top-left corner:

```ts
import {QRCodeSVGRenderer, type QRCodeShape, qrcode} from '@qrcodesdk/core';
import {alignment, finder} from '@qrcodesdk/core/style';

const dot = 'm.25 0h.5l.25 .25v.5l-.25 .25h-.5l-.25 -.25v-.5z';
const octagon: QRCodeShape = {
  module: dot,
  finderRing: 'm1 0h5l1 1v5l-1 1h-5l-1 -1v-5zm0 1v5h5v-5z',
  finderCenter: 'm.75 0h1.5l.75 .75v1.5l-.75 .75h-1.5l-.75 -.75v-1.5z',
  alignmentRing: 'm1 0h3l1 1v3l-1 1h-3l-1 -1v-3zm0 1v3h3v-3z',
  alignmentCenter: dot,
};

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

| Property          | Size  | Meaning                                                     |
| ----------------- | ----- | ----------------------------------------------------------- |
| `module`          | 1 × 1 | One path for every module, or 16 paths indexed by neighbors |
| `finderRing`      | 7 × 7 | The finder ring, including its 5 × 5 hole                   |
| `finderCenter`    | 3 × 3 | The finder center                                           |
| `alignmentRing`   | 5 × 5 | The alignment ring, including its 3 × 3 hole                |
| `alignmentCenter` | 1 × 1 | The alignment center                                        |

Path data must use only the relative `m`, `l`, `h`, `v`, `c`, `a`, and `z` commands, and every
subpath must be closed. Pieces are filled with the even-odd rule, so a second subpath inside the
first one cuts a hole, like the 5 × 5 hole of the finder ring above. `modules` only reads `module`,
`finder()` only reads `finderRing` from its `ring` and `finderCenter` from its `center`, and
`alignment()` only reads `alignmentRing` and `alignmentCenter` the same way. A shape used in one
place may omit the other properties.

`module` may also be an array of 16 paths indexed by the module's remaining dark neighbors: add `1` for left,
`2` for right, `4` for top, and `8` for bottom. An `undefined` entry draws a filled square. This
example draws isolated modules as dots and keeps connected modules square:

```ts
import type {QRCodeModuleShape} from '@qrcodesdk/core';

const dot = 'm0 .5a.5 .5 0 0 1 1 0a.5 .5 0 0 1 -1 0z';
const isolatedDots: QRCodeModuleShape = {
  module: Array.from({length: 16}, (_, neighbors) => (neighbors === 0 ? dot : undefined)),
};
```

Renderer factories validate custom paths and throw `INVALID_OPTIONS` for unsupported commands or
open subpaths.

## Bundle size

Import only the shapes, parts, and center-image factories you use. Bundlers with tree shaking can
remove the others. Dimensions and colors need no import from `@qrcodesdk/core/style`.

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
