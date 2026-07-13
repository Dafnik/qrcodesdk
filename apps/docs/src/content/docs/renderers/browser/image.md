---
title: Render to an Image Element
description: Render a QR code as an HTMLImageElement with @qrcodesdk/browser.

related:
  - ./canvas.md
  - ../../guides/customize.md
  - ../../libs/browser.mdx
---

Use this when you need an `HTMLImageElement` that can be inserted into a browser page, styled with CSS, labeled for accessibility, or downloaded as a PNG.

## Minimal example

```ts
import {QRCodeImageRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const image = qrcode('https://qrcodesdk.dev').render(QRCodeImageRenderer());
```

The returned value is an `HTMLImageElement` whose `src` is a PNG data URL.

## Common options

You can customize the image output by passing styling options to `QRCodeImageRenderer`.

```ts
import {QRCodeImageRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const image = qrcode('https://qrcodesdk.dev').render(
  QRCodeImageRenderer({
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

## Common recipes

### Add accessibility labels

For user-facing QR codes, provide a meaningful label so assistive technologies can describe what the code points to.

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

### Insert into the DOM

```ts
import {QRCodeImageRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const image = qrcode('https://qrcodesdk.dev').render(
  QRCodeImageRenderer({
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

Use `QRCodeDownloadImageRenderer` when a browser action should download the rendered image as a PNG.

```ts
import {QRCodeDownloadImageRenderer, QRCodeImageRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

qrcode('https://qrcodesdk.dev').render(
  QRCodeDownloadImageRenderer({
    renderer: QRCodeImageRenderer({
      alt: 'QR code for qrcodesdk.dev',
    }),
    filename: 'qrcode',
  }),
);
```

The download renderer appends `.png` when the filename does not already end with `.png`. It uses the wrapped image renderer's `image.src`, clicks a temporary download link, and returns `void`.

Use the returned image element directly when you need to control the download link yourself.

```ts
import {QRCodeImageRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const image = qrcode('https://qrcodesdk.dev').render(
  QRCodeImageRenderer({
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
