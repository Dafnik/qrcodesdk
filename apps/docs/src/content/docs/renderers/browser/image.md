---
title: Browser Image Renderer
description: The Browser Image renderer outputs a QR code as an HTMLImageElement. Use it when you need an image element that can be inserted into a browser page, styled with CSS, labeled for accessibility, or downloaded as a PNG.
---

The Browser Image renderer outputs a QR code as an `HTMLImageElement`.

Use it when you need an image element that can be inserted into a browser page, styled with CSS, labeled for accessibility, or downloaded as a PNG.

## Minimal example

```ts
import {ImageQRCodeRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const image = qrcode('https://qrcodesdk.dev').render(ImageQRCodeRenderer());
```

The returned value is an `HTMLImageElement` whose `src` is a PNG data URL.

## Styling options

You can customize the image output by passing styling options to `ImageQRCodeRenderer`.

```ts
import {ImageQRCodeRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const image = qrcode('https://qrcodesdk.dev').render(
  ImageQRCodeRenderer({
    size: 8,
    margin: 4,
    colors: {
      colorDark: '#111827',
      colorLight: '#ffffff',
    },
    alt: 'QR code for qrcodesdk.dev',
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
| `alt`               | `string` | `undefined` | Adds an `alt` attribute to the image.             |
| `ariaLabel`         | `string` | `undefined` | Adds an `aria-label` attribute to the image.      |
| `title`             | `string` | `undefined` | Adds a `title` attribute to the image.            |

Colors must be 6-digit hex values such as `'#000000'`, `'#ffffff'`, or `'#111827'`.

Image output requires `size` to be a positive integer and `margin` to be a non-negative integer.

## Accessibility

For user-facing QR codes, provide a meaningful label so assistive technologies can describe what the code points to.

```ts
import {ImageQRCodeRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const image = qrcode('https://qrcodesdk.dev').render(
  ImageQRCodeRenderer({
    alt: 'QR code for qrcodesdk.dev',
    ariaLabel: 'Scan to open qrcodesdk.dev',
    title: 'QR code for qrcodesdk.dev',
  }),
);
```

## Browser examples

Because the image renderer returns an `HTMLImageElement`, you can append it directly to the DOM or use its PNG data URL as a download URL.

### Insert into the DOM

```ts
import {ImageQRCodeRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const image = qrcode('https://qrcodesdk.dev').render(
  ImageQRCodeRenderer({
    alt: 'QR code for qrcodesdk.dev',
  }),
);

const container = document.querySelector('#qrcode');

if (container) {
  container.append(image);
}
```

```html
<div id="qrcode"></div>
```

### Download as PNG

```ts
import {ImageQRCodeRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const image = qrcode('https://qrcodesdk.dev').render(
  ImageQRCodeRenderer({
    alt: 'QR code for qrcodesdk.dev',
  }),
);

const link = document.createElement('a');

link.href = image.src;
link.download = 'qrcode.png';
link.click();
```

## Output details

The Image renderer generates:

- A square `HTMLImageElement`
- A PNG data URL assigned to `image.src`
- `width` and `height` values matching the rendered QR code size
- One pixel block per scaled QR module
- A solid background using `colors.colorLight`
- Dark modules using `colors.colorDark`
- Optional `alt`, `aria-label`, and `title` attributes

The image renderer uses the Canvas renderer internally, then converts the canvas to a PNG data URL with `canvas.toDataURL('image/png')`.

The final image size is calculated as:

```ts
const imageSize = size * (moduleCount + 2 * margin);
```

For example, a QR matrix with `21` modules, `size: 8`, and `margin: 4` produces:

```txt
8 * (21 + 2 * 4) = 232
```

So the output image is `232 x 232` pixels.
