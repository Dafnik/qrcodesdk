---
title: API Reference
description: Public API exported by @qrcodesdk/core and @qrcodesdk/node.
---

## @qrcodesdk/core

### qrcode

### SVGQRCodeRenderer

Creates a renderer that returns an SVG string.

```ts
SVGQRCodeRenderer(options?);
```

Options include shared styling plus SVG accessibility attributes: `alt`, `ariaLabel`, and `title`.

### QRCodeTextRenderer

Creates a renderer that returns terminal text.

```ts
QRCodeTextRenderer(options?);
```

Options include `size` and `margin`.

### parseQRCodeStylingOptions

Normalizes styling options into complete defaults.

```ts
parseQRCodeStylingOptions(options?);
```

Defaults are `size: 5`, `margin: 4`, `colors.colorLight: '#ffffff'`, and `colors.colorDark: '#000000'`.

### Types

The core package exports these public types:

```ts
type ParsedQRCodeStylingOptions;
type QRCodeMask;
type QRCodeMatrix;
type QRCodeMode;
type QRCodeRenderer;
type QRCodeStylingOptions;
type QRCodeTextRendererOptions;
type QRCodeSVGRendererOptions;
type QRCodeVersion;
```

## @qrcodesdk/node

### PNGQRCodeRenderer

Creates a renderer that returns a PNG `Buffer`.

```ts
PNGQRCodeRenderer(options?);
```

Options use the shared styling shape: `size`, `margin`, `colors.colorLight`, and `colors.colorDark`.

### Types

The Node package exports:

```ts
type QRCodePNGRendererOptions;
```
