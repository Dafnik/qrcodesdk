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
type QRCodeParsedStylingOptions;
type QRCodeErrorCorrectionLevel;
type QRCodeInputData;
type QRCodeMask;
type QRCodeMatrix;
type QRCodeMatrixOptions;
type QRCodeMode;
type QRCodeRenderer;
type QRCodeStylingOptions;
type QRCodeTextRendererOptions;
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
type QRCodeDownloadImageRendererOptions;
type QRCodeDownloadSVGRendererOptions;
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
