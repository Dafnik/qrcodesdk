---
title: Customize QR Codes
description: Control QR code size, margin, colors, accessibility labels, error correction, version, and mask.

related:
  - ../renderers/core/svg.md
  - ../renderers/node/png.md
  - ../renderers/browser/canvas.md
  - ../renderers/browser/image.md
  - ../libs/core.md
---

QRCodeSDK separates QR code data from renderer output. Builder options control the QR matrix, and renderer options control how that matrix looks.

## Size and margin

Most visual renderers accept `size` and `margin`.

```ts
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev').render(
  QRCodeSVGRenderer({
    size: 8,
    margin: 4,
  }),
);
```

`size` is the pixel size of each QR module for SVG, PNG, Canvas, and Image output. For terminal text, it is an integer scale factor. `margin` is the quiet zone around the QR code, measured in modules.

Defaults:

| Option   | Default | Notes                                  |
| -------- | ------: | -------------------------------------- |
| `size`   |     `5` | Must be a positive integer for pixels. |
| `margin` |     `4` | Must be a non-negative integer.        |

## Colors

SVG, PNG, Canvas, and Image renderers support `colors.colorDark` and `colors.colorLight`.

```ts
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev').render(
  QRCodeSVGRenderer({
    colors: {
      colorDark: '#111827',
      colorLight: '#ffffff',
    },
  }),
);
```

Colors must be 6-digit hex values such as `'#000000'`, `'#ffffff'`, or `'#111827'`.

## Accessibility labels

SVG and Image renderers support accessibility attributes.

```ts
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev').render(
  QRCodeSVGRenderer({
    title: 'QR code for qrcodesdk.dev',
    ariaLabel: 'Scan to open qrcodesdk.dev',
  }),
);
```

```ts
import {QRCodeImageRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const image = qrcode('https://qrcodesdk.dev').render(
  QRCodeImageRenderer({
    alt: 'QR code for qrcodesdk.dev',
    ariaLabel: 'Scan to open qrcodesdk.dev',
    title: 'QR code for qrcodesdk.dev',
  }),
);
```

Use labels for user-facing QR codes so assistive technologies can describe the destination or action.

## Error correction

The default error correction level is `M`.

```ts
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev').errorCorrection('H').render(QRCodeSVGRenderer());
```

Available levels are `L`, `M`, `Q`, and `H`. Higher levels can survive more damage, but they reduce capacity and can require a larger QR version.

## Version and mask

Most applications should let the builder choose the version and mask automatically.

Pin them only when you need deterministic output for a test fixture, compatibility target, or visual comparison.

```ts
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('HELLO WORLD')
  .mode('alphanumeric')
  .version(1)
  .mask(2)
  .render(QRCodeSVGRenderer());
```

Versions range from `1` to `40`. Masks range from `0` to `7`.

## Common recipe

```ts
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev')
  .errorCorrection('H')
  .render(
    QRCodeSVGRenderer({
      size: 8,
      margin: 4,
      colors: {
        colorDark: '#111827',
        colorLight: '#ffffff',
      },
      ariaLabel: 'Scan to open qrcodesdk.dev',
    }),
  );
```
