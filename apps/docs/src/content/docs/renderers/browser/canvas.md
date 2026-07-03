---
title: Browser Canvas Renderer
description: The Browser Canvas renderer outputs a QR code as an HTMLCanvasElement. Use it when you need a DOM canvas that can be inserted into a browser page, drawn into another canvas, converted to image bytes, or downloaded as a PNG.
---

The Browser Canvas renderer outputs a QR code as an `HTMLCanvasElement`.

Use it when you need a DOM canvas that can be inserted into a browser page, drawn into another canvas, converted to image bytes, or downloaded as a PNG.

## Minimal example

```ts
import {CanvasQRCodeRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const canvas = qrcode('https://qrcodesdk.dev').render(CanvasQRCodeRenderer());
```

The returned value is an `HTMLCanvasElement` containing rasterized QR code pixels.

## Styling options

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

### Options

| Option              |     Type |     Default | Description                                       |
| ------------------- | -------: | ----------: | ------------------------------------------------- |
| `size`              | `number` |         `5` | Pixel size of each QR module.                     |
| `margin`            | `number` |         `4` | Quiet-zone margin around the QR code, in modules. |
| `colors.colorDark`  | `string` | `'#000000'` | Color used for dark QR modules.                   |
| `colors.colorLight` | `string` | `'#ffffff'` | Background color.                                 |

Colors must be 6-digit hex values such as `'#000000'`, `'#ffffff'`, or `'#111827'`.

Canvas output requires `size` to be a positive integer and `margin` to be a non-negative integer.

## Browser examples

Because the canvas renderer returns an `HTMLCanvasElement`, you can append it directly to the DOM or convert it to a PNG download.

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
