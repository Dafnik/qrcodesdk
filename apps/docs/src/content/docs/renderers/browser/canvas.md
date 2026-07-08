---
title: Render to Canvas
description: Render a QR code as an HTMLCanvasElement with @qrcodesdk/browser.
---

Use this when you need a browser-owned `HTMLCanvasElement` that can be inserted into a page, drawn into another canvas, converted to image bytes, or downloaded as a PNG.

## Minimal example

```ts
import {CanvasQRCodeRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const canvas = qrcode('https://qrcodesdk.dev').render(CanvasQRCodeRenderer());
```

The returned value is an `HTMLCanvasElement` containing rasterized QR code pixels.

## Common options

You can customize the canvas output by passing styling options to `CanvasQRCodeRenderer`.

```ts
import {CanvasQRCodeRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const canvas = qrcode('https://qrcodesdk.dev').render(
  CanvasQRCodeRenderer({
    size: 8,
    margin: 4,
    colors: {
      colorDark: '#111827',
      colorLight: '#ffffff',
    },
  }),
);
```

| Option              |     Type |     Default | Description                                       |
| ------------------- | -------: | ----------: | ------------------------------------------------- |
| `size`              | `number` |         `5` | Pixel size of each QR module.                     |
| `margin`            | `number` |         `4` | Quiet-zone margin around the QR code, in modules. |
| `colors.colorDark`  | `string` | `'#000000'` | Color used for dark QR modules.                   |
| `colors.colorLight` | `string` | `'#ffffff'` | Background color.                                 |

Colors must be 6-digit hex values such as `'#000000'`, `'#ffffff'`, or `'#111827'`.

Canvas output requires `size` to be a positive integer and `margin` to be a non-negative integer.

## Common recipes

### Insert into the DOM

```ts
import {CanvasQRCodeRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const canvas = qrcode('https://qrcodesdk.dev').render(
  CanvasQRCodeRenderer({
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
import {CanvasQRCodeRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const qrCanvas = qrcode('https://qrcodesdk.dev').render(CanvasQRCodeRenderer());
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
import {CanvasQRCodeRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const canvas = qrcode('https://qrcodesdk.dev').render(CanvasQRCodeRenderer());

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
- One pixel block per scaled QR module
- A solid background using `colors.colorLight`
- Dark modules using `colors.colorDark`
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

## Related pages

- [Render to an Image Element](/renderers/browser/image/)
- [Customize QR Codes](/guides/customize/)
- [@qrcodesdk/browser](/libs/browser/)
