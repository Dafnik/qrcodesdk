---
title: Render to Canvas
description: Render a QR code as an HTMLCanvasElement with @qrcodesdk/browser.

related:
  - ./image.md
  - ../../guides/customize.md
  - ../../libs/browser.mdx
---

Use this when you need a browser-owned `HTMLCanvasElement` that can be inserted into a page, drawn into another canvas, converted to image bytes, or downloaded as a PNG.

## Minimal example

```ts
import {QRCodeCanvasRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const canvas = qrcode('https://qrcodesdk.dev').render(QRCodeCanvasRenderer());
```

The returned value is an `HTMLCanvasElement` containing rasterized QR code pixels.

## Common options

You can customize the canvas output by passing styling options to `QRCodeCanvasRenderer`.

```ts
import {QRCodeCanvasRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const canvas = qrcode('https://qrcodesdk.dev').render(
  QRCodeCanvasRenderer({
    size: 8,
    margin: 4,
    colors: {
      colorDark: '#111827',
      colorLight: '#ffffff',
    },
    dotsOptions: {type: 'rounded'},
    cornersSquareOptions: {type: 'extra-rounded', color: '#7c3aed'},
    cornersDotOptions: {type: 'dot'},
  }),
);
```

| Option                       |                     Type |            Default | Description                                       |
| ---------------------------- | -----------------------: | -----------------: | ------------------------------------------------- |
| `size`                       |                 `number` |                `5` | Pixel size of each QR module.                     |
| `margin`                     |                 `number` |                `4` | Quiet-zone margin around the QR code, in modules. |
| `colors.colorDark`           |                 `string` |        `'#000000'` | Color used for dark QR modules.                   |
| `colors.colorLight`          |                 `string` |        `'#ffffff'` | Background color.                                 |
| `dotsOptions.type`           |          `QRCodeDotType` |         `'square'` | Shape used for ordinary data modules.             |
| `dotsOptions.color`          |                 `string` | `colors.colorDark` | Color used for ordinary data modules.             |
| `cornersSquareOptions.type`  | `QRCodeCornerSquareType` |         `'square'` | Shape used for finder outer rings.                |
| `cornersSquareOptions.color` |                 `string` | `colors.colorDark` | Color used for finder outer rings.                |
| `cornersDotOptions.type`     |    `QRCodeCornerDotType` |         `'square'` | Shape used for finder centers.                    |
| `cornersDotOptions.color`    |                 `string` | `colors.colorDark` | Color used for finder centers.                    |

Colors must be 6-digit hex values such as `'#000000'`, `'#ffffff'`, or `'#111827'`.

Data-module types are `square`, `rounded`, `dots`, `classy`, `classy-rounded`, and
`extra-rounded`. Finder rings and centers additionally support `dot`. Each feature color override
is independent; omit it to inherit `colors.colorDark`.

Canvas output requires `size` to be a positive integer and `margin` to be a non-negative integer.

## Common recipes

### Insert into the DOM

```ts
import {QRCodeCanvasRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const canvas = qrcode('https://qrcodesdk.dev').render(
  QRCodeCanvasRenderer({
    size: 8,
    margin: 4,
  }),
);

const container = document.querySelector('#qrcode');

if (container) {
  container.append(canvas);
}
```

```html
<div id="qrcode"></div>
```

### Draw into another canvas

```ts
import {QRCodeCanvasRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const qrCanvas = qrcode('https://qrcodesdk.dev').render(QRCodeCanvasRenderer());
const target = document.querySelector<HTMLCanvasElement>('#target');
const context = target?.getContext('2d');

if (target && context) {
  target.width = qrCanvas.width;
  target.height = qrCanvas.height;
  context.drawImage(qrCanvas, 0, 0);
}
```

### Download as PNG

```ts
import {QRCodeCanvasRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const canvas = qrcode('https://qrcodesdk.dev').render(QRCodeCanvasRenderer());

canvas.toBlob((blob) => {
  if (!blob) return;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = 'qrcode.png';
  link.click();

  URL.revokeObjectURL(url);
}, 'image/png');
```

## Output details

The Canvas renderer generates:

- A square `HTMLCanvasElement`
- Square or antialiased curved modules, depending on the selected feature types
- A solid background using `colors.colorLight`
- Independently colored data modules, finder rings, and finder centers
- Fully opaque pixels
- Browser-owned PNG bytes when exported with `toBlob()` or `toDataURL('image/png')`

The final canvas size is calculated as:

```ts
const imageSize = size * (moduleCount + 2 * margin);
```

For example, a QR matrix with `21` modules, `size: 8`, and `margin: 4` produces:

```txt
8 * (21 + 2 * 4) = 232
```

So the output canvas is `232 x 232` pixels.
