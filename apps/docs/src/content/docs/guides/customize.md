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
  - ./troubleshooting.md
---

Every graphical renderer accepts the same `QRCodeVisualStyle` through its `style` option. That
covers SVG, Canvas, browser Images, and Node.js PNG, WebP, GIF, and JPEG.

Styling only changes how the code looks. The encoded matrix stays the same.

## Before you start

- Install the package for your output. See [Choose your setup](/getting-started/choose-your-setup/).
- Render one unstyled QR code first, so you have something to compare against.
- Have the scanner apps and devices your users will use. Styling can make a code harder to read, so
  you test with them in the last step.

To try options visually first, use the [Playground](/playground/).

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

- Import shapes, `finder()`, and `alignment()` from `@qrcodesdk/core/style`.
- In React, Vue, Svelte, and Angular, import them from your framework package instead, such as
  `import {finder, rounded} from '@qrcodesdk/react'`. Pass the style through the component's
  `options`.
- Renderer factories validate and copy the style when you call them. Changing a `style` property
  afterwards does not change the renderer.

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

The output width and height are `moduleSize × (matrix width + 2 × quietZone)`.

Colors must be exactly `#RRGGBB` or `#RRGGBBAA`. Hexadecimal digits are case-insensitive. What
happens to the alpha channel depends on the output format:

| Output                     | Alpha behavior                                                                               |
| -------------------------- | -------------------------------------------------------------------------------------------- |
| SVG, Canvas, PNG, and WebP | Kept for every pixel                                                                         |
| GIF                        | Each pixel becomes fully transparent or opaque at `transparency.threshold`, `128` by default |
| JPEG                       | Blended onto the opaque `transparency.matte` color, `'#ffffff'` by default                   |
| Terminal text              | Composited over white, because terminals have no alpha channel                               |

## Colors

- `foreground` colors every dark module.
- `background` fills the whole output, including the quiet zone.
- [`finder()`](#finder-patterns) and [`alignment()`](#alignment-patterns) can override the pattern
  colors.

Colors need no import:

```ts
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev').render(
  QRCodeSVGRenderer({style: {foreground: '#1e3a8a', background: '#eff6ff'}}),
);
```

## Module shapes

Import a shape from `@qrcodesdk/core/style` and pass it as `modules`. Omit `modules` to keep square
modules.

```ts
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';
import {circle} from '@qrcodesdk/core/style';

const svg = qrcode('https://qrcodesdk.dev').render(QRCodeSVGRenderer({style: {modules: circle()}}));
```

| Shape                | Option   | Default | Effect on modules                                                        |
| -------------------- | -------- | ------- | ------------------------------------------------------------------------ |
| `rounded({radius})`  | `radius` | `0.5`   | Rounds corners that face no dark neighbor; radius from `0` to `1` module |
| `diagonal({radius})` | `radius` | `0.5`   | Like `rounded()`, but only top-left and bottom-right corners round       |
| `circle({size})`     | `size`   | `1`     | Draws each module as a dot; diameter from `0.001` to `1` module          |

How `rounded()` and `diagonal()` behave:

- Connected dark modules keep straight shared edges.
- A `radius` of `1` gives the roundest result.
- Modules drawn by finder or alignment styles, and modules cleared for a center image, count as
  light neighbors. Nearby modules round against them.

Alignment patterns use the module shape unless you style them with
[`alignment()`](#alignment-patterns).

## Finder patterns

Finder patterns are the three large squares in the corners. Scanners use them to locate the code, as
[How QR codes work](/learn/how-qr-codes-work/#function-patterns) explains.

By default they stay square and use the foreground color, even when `modules` has a shape. Pass
`finder()` to shape or color them:

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

The ring and the center can each take any shape. They don't depend on the module shape or on each
other. Each piece is drawn as one closed outline, without looking at neighboring modules:

| Shape        | Finder ring (7 × 7)                     | Finder center (3 × 3)                   |
| ------------ | --------------------------------------- | --------------------------------------- |
| `rounded()`  | All four corners, radius × 2.8          | All four corners, radius × 1.2          |
| `diagonal()` | Top-left and bottom-right, radius × 2.8 | Top-left and bottom-right, radius × 1.2 |
| `circle()`   | Full circular ring; ignores `size`      | Full circle; ignores `size`             |

## Alignment patterns

From version 2, QR codes also contain smaller alignment patterns: a 5 × 5 ring around a single center
module.

By default they use the module shape and the foreground color. Pass `alignment()` to give them their
own shapes and color:

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

Alignment pieces follow the same rules as finder pieces, with one exception: the 1 × 1 center is
drawn like a module. So `circle({size})` shrinks it to the same dot as the modules.

| Shape        | Alignment ring (5 × 5)                | Alignment center (1 × 1)                 |
| ------------ | ------------------------------------- | ---------------------------------------- |
| `rounded()`  | All four corners, radius × 2          | All four corners, radius capped at `0.5` |
| `diagonal()` | Top-left and bottom-right, radius × 2 | Top-left and bottom-right, radius        |
| `circle()`   | Full circular ring; ignores `size`    | Dot with diameter `size`                 |

There is a difference between no style and an empty style:

- **No `alignment` style:** alignment modules are ordinary modules. They round against their
  neighbors like data modules.
- **`alignment()` without `ring` or `center`:** pieces are drawn square, even when `modules` has a
  shape.

## Custom shapes

Use `customShape()` to define your own paths. Prepare the shape once and reuse it across renderers.

Each piece is SVG path data in module units, measured from the piece's top-left corner:

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

| Property          | Box   | Used by               | Meaning                                      |
| ----------------- | ----- | --------------------- | -------------------------------------------- |
| `module`          | 1 × 1 | `modules`             | One path for every module                    |
| `finderRing`      | 7 × 7 | `finder({ring})`      | The finder ring, including its 5 × 5 hole    |
| `finderCenter`    | 3 × 3 | `finder({center})`    | The finder center                            |
| `alignmentRing`   | 5 × 5 | `alignment({ring})`   | The alignment ring, including its 3 × 3 hole |
| `alignmentCenter` | 1 × 1 | `alignment({center})` | The alignment center                         |

Each place reads only its own property. A shape used in one place can omit the others. For example,
this module shape draws a hexagon:

```ts
import {type QRCodeModuleShape, customShape} from '@qrcodesdk/core/style';

const hexagon: QRCodeModuleShape = customShape({
  module: 'm.5 0 .5 .25v.5l-.5 .25-.5-.25v-.5z',
});
```

### Path rules

- Use only the relative `m`, `l`, `h`, `v`, `c`, `a`, and `z` commands.
- Close every subpath.
- Stay inside the piece's box from the table above. Curves and arcs count with their full extent.
- Pieces are filled with the even-odd rule. A second subpath inside the first cuts a hole, like the
  5 × 5 hole of the finder ring above.

`customShape()` validates the paths when you call it. It throws `INVALID_OPTIONS` for unsupported
commands, open subpaths, or geometry outside the box.

Because pieces stay inside their boxes, they never overlap. SVG, Canvas, and raster output fill them
identically.

### Details

- `customShape()` returns opaque `QRCodeShapePiece` values. Renderer factories reuse them without
  parsing the paths again.
- Built-in `rounded()` and `diagonal()` contain an opaque `QRCodeModulePattern` that adapts to
  neighboring dark modules. Custom shapes use one fixed path per piece instead.
- `finder()` and `alignment()` also return opaque values. They only work as the matching style
  property.

## Bundle size

- Import only the shape, pattern, and center-image factories you use. Tree shaking removes the rest.
- Dimensions and colors need no import from `@qrcodesdk/core/style`.
- SVG and Canvas output include the custom-path parser only when you import `customShape()`.
- Node.js raster output always includes the parser.

## Text styling

Terminal text takes a smaller `QRCodeTextStyle` with only `moduleSize` and `quietZone`. Set ANSI
colors and the compact or full layout directly on `QRCodeTextRenderer`:

```ts
import {QRCodeTextRenderer} from '@qrcodesdk/core';

QRCodeTextRenderer({
  style: {moduleSize: 1, quietZone: 2},
  layout: 'compact',
  ansi: {mode: 'blocks', foreground: '#111827', background: '#ffffff'},
});
```

Text output uses the graphical defaults, `moduleSize: 5` and `quietZone: 4`. A version 1 code then
prints 145 columns wide. For terminals, use `moduleSize: 1` as above, like the CLI does.

## Accessibility

Accessibility options live under `accessibility` and depend on the output:

| Output        | Options                     | Without a label           |
| ------------- | --------------------------- | ------------------------- |
| SVG, Canvas   | `ariaLabel`, `title`        | Gets `aria-hidden="true"` |
| Image element | `alt`, `ariaLabel`, `title` | Gets an empty `alt`       |

Unlabeled output is treated as decorative. Label every QR code unless nearby content already says
what it does.

## Center images

Center images are renderer options, not style options, because their source types differ by runtime.
Each renderer takes a center image from its own factory, such as `svgCenterImage()`.

See [Add a center image](/guides/center-images/) for preparation and sizing.

## Verify the result

Render the styled code in its final format and size. Scan it with each app and device from
[Before you start](#before-you-start). It should open the same payload as the unstyled version.

### Scan reliability

The API accepts many values that are valid but hard to scan:

- transparent colors or low contrast;
- a zero quiet zone;
- small `circle()` sizes, or custom shapes that leave little of each module dark;
- large center images.

Test the final displayed or printed QR code on the devices and at the sizes used in production.

## Caveats

- Factories validate options when you call them. Out-of-range values throw `QRCodeError` with code
  `INVALID_OPTIONS`. See the [errors reference](/reference/errors/#invalid_options).
- Styles from `finder()` and `alignment()` cannot cross a React Server Component boundary. See
  [Next.js client boundary](/packages/react/#nextjs-client-boundary).
- Terminal text accepts only `moduleSize` and `quietZone` in `style`. Set its colors through `ansi`.
  Shapes and pattern styles don't apply.

## Next step

Add a logo with [Add a center image](/guides/center-images/), or compare output formats in
[Renderer outputs](/reference/renderers/).
