# @qrcodesdk/browser

Browser renderers for QRCodeSDK.

`@qrcodesdk/browser` extends `@qrcodesdk/core` with renderers that create DOM elements for browser applications.

## Install

```sh
pnpm add @qrcodesdk/core @qrcodesdk/browser
```

## Render a Canvas

```ts
import {CanvasQRCodeRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const canvas = qrcode('https://qrcodesdk.dev')
  .renderer(
    CanvasQRCodeRenderer({
      size: 8,
      margin: 4,
      colors: {
        colorLight: '#ffffff',
        colorDark: '#111111',
      },
    }),
  )
  .render();

document.body.append(canvas);
```

## Render an Image

```ts
import {ImageQRCodeRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const image: HTMLImageElement = qrcode('image output').render(
  ImageQRCodeRenderer({
    alt: 'Open QRCodeSDK',
  }),
);
```

`ImageQRCodeRenderer()` returns an `HTMLImageElement` whose `src` is a PNG data URL.

## Options

All browser renderers use the shared QRCodeSDK styling shape.

| Option              | Default     | Description                                                              |
| ------------------- | ----------- | ------------------------------------------------------------------------ |
| `size`              | `5`         | Pixel size for each QR module. Canvas and image require an integer.      |
| `margin`            | `4`         | Light modules around the QR matrix. Canvas and image require an integer. |
| `colors.colorLight` | `'#ffffff'` | Background color.                                                        |
| `colors.colorDark`  | `'#000000'` | Foreground module color.                                                 |

Image and SVG element renderers also accept `alt`, `ariaLabel`, and `title`.

## Public API

```ts
import {
  CanvasQRCodeRenderer,
  ImageQRCodeRenderer,
  type QRCodeCanvasRendererOptions,
  type QRCodeImageRendererOptions,
} from '@qrcodesdk/browser';
```
