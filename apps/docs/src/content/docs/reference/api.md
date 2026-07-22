---
title: API Reference
description: Public API exported by @qrcodesdk/core, @qrcodesdk/browser, and @qrcodesdk/node.
---

## @qrcodesdk/core

### qrcode

### QRCodeSVGRenderer

Creates a renderer that returns an SVG string.

```ts
QRCodeSVGRenderer(options?);
```

Options include shared styling plus SVG accessibility attributes: `alt`, `ariaLabel`, and `title`.

### QRCodeTextRenderer

Creates a renderer that returns terminal text.

```ts
QRCodeTextRenderer(options?);
```

Options include `size`, `margin`, `colors`, `small`, `ansiColors`, and `onlyAnsiColors`. Compact UTF-8 output is enabled by default with `small: true`; use `small: false` for double-width `██` modules. ANSI styling is disabled by default and, when enabled, uses the shared dark foreground and light background colors. `onlyAnsiColors: true` suppresses UTF-8 glyphs and renders every module as two ANSI-background-colored spaces.

### parseQRCodeStylingOptions

`parseQRCodeStylingOptions` normalizes styling options into complete defaults and validates the
shared renderer contract.

```ts
parseQRCodeStylingOptions(options?);
```

Defaults are `size: 5`, `margin: 4`, `colors.colorLight: '#ffffff'`, `colors.colorDark: '#000000'`,
and `type: 'square'` for ordinary modules, finder rings, and finder centers. Each feature color
defaults independently to `colors.colorDark`.
Sizes must be positive safe integers, margins must be non-negative safe integers, and colors must
be hash-prefixed six-digit hexadecimal values.

### Validation predicates

Use the non-throwing predicates when validating application input:

```ts
isValidQRCodeSize(value);
isValidQRCodeMargin(value);
isQRCodeColorHex(value);
isQRCodeDotType(value);
isQRCodeCornerSquareType(value);
isQRCodeCornerDotType(value);
```

`isQRCodeColorHex` is a type guard for `QRCodeColorHex`.

### createQRCodeStylePlan

Creates the platform-neutral drawing plan used by the built-in visual renderers. Pass a matrix and
the result of `parseQRCodeStylingOptions()`:

```ts
const styling = parseQRCodeStylingOptions({
  dotsOptions: {type: 'rounded'},
  cornersSquareOptions: {type: 'extra-rounded'},
  cornersDotOptions: {type: 'dot'},
});
const plan = createQRCodeStylePlan(matrix, styling);
```

Coordinates and sizes in `plan.primitives` are expressed in QR modules and already include the
quiet-zone offset. Multiply them by `styling.size` when drawing pixels. Primitives are emitted in
ordinary-module, finder-ring, finder-center order and include their role, resolved color, shape,
and quarter-turn rotation. `plan.hasCurves` identifies plans that require curved rendering.

Canonical 7×7 finder patterns are recognized only in square QR-sized matrices of at least 21
modules. Malformed or hand-authored matrices without canonical finders are planned entirely as
ordinary modules.

### calculateQRCodeRenderedSize

Calculates the square output dimension for a matrix and resolved styling, including the quiet-zone
margin. It rejects invalid styling and dimensions that are not positive safe integers.

```ts
calculateQRCodeRenderedSize(matrix, styling);
```

### Types

The core package exports these public types:

```ts
type QRCodeParsedStylingOptions;
type QRCodeDotType;
type QRCodeCornerSquareType;
type QRCodeCornerDotType;
type QRCodeDotsOptions;
type QRCodeCornersSquareOptions;
type QRCodeCornersDotOptions;
type QRCodeAccessibilityOptions;
type QRCodeColorHex;
type QRCodeErrorCorrectionLevel;
type QRCodeInputData;
type QRCodeMask;
type QRCodeMatrix;
type QRCodeMatrixOptions;
type QRCodeMode;
type QRCodeOptions<TRendererOptions>;
type QRCodeRenderer;
type QRCodeStylingColors;
type QRCodeStylingOptions;
type QRCodeStylePlan;
type QRCodeStylePrimitive;
type QRCodeModuleStylePrimitive;
type QRCodeFinderRingStylePrimitive;
type QRCodeFinderCenterStylePrimitive;
type QRCodeModuleShape;
type QRCodeStyleRole;
type QRCodeStyleRotation;
type QRCodeTextRendererOptions;
type QRCodeSVGOptions;
type QRCodeSVGRendererOptions;
type QRCodeVersion;
```

## @qrcodesdk/browser

### QRCodeCanvasRenderer

Creates a renderer that returns an `HTMLCanvasElement`.

```ts
QRCodeCanvasRenderer(options?);
```

Options use the shared styling shape: `size`, `margin`, `colors.colorLight`, and `colors.colorDark`.

### QRCodeImageRenderer

Creates a renderer that returns an `HTMLImageElement` with a PNG data URL.

```ts
QRCodeImageRenderer(options?);
```

Options include shared styling plus image accessibility attributes: `alt`, `ariaLabel`, and `title`.

### QRCodeDownloadImageRenderer

Creates a renderer that triggers a PNG download in the browser and returns `void`.

```ts
QRCodeDownloadImageRenderer(options);
```

Options include `renderer`, an image renderer such as `QRCodeImageRenderer(options)`, and optional `filename`.

### QRCodeDownloadSVGRenderer

Creates a renderer that triggers an SVG download in the browser and returns `void`.

```ts
QRCodeDownloadSVGRenderer(options);
```

Options include `renderer`, an SVG renderer such as `QRCodeSVGRenderer(options)`, and optional `filename`.

### Types

The browser package exports:

```ts
type QRCodeCanvasRendererOptions;
type QRCodeCanvasOptions;
type QRCodeDownloadImageRendererOptions;
type QRCodeDownloadSVGRendererOptions;
type QRCodeImageOptions;
type QRCodeImageRendererOptions;
```

## @qrcodesdk/node

### QRCodePNGRenderer

Creates a renderer that returns a PNG `Buffer`.

```ts
QRCodePNGRenderer(options?);
```

Options use the shared styling shape: `size`, `margin`, `colors.colorLight`, and `colors.colorDark`.

### Types

The Node package exports:

```ts
type QRCodePNGRendererOptions;
```
