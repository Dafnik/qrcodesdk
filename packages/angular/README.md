# @qrcodesdk/angular

[![npm version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/angular?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/angular)
[![npm bundle size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/angular?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/angular)
[![npm download per month](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/angular?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/angular)

**[Live Demo](http://localhost:4321/playground/?pkg=angular)**

`@qrcodesdk/angular` provides Angular components for rendering QR codes as inline SVG, PNG-backed Image elements, and Canvas elements.

## Install

Install the Angular package with its Core and Browser peer dependencies:

```sh
npm install @qrcodesdk/angular @qrcodesdk/core @qrcodesdk/browser
```

```sh
pnpm add @qrcodesdk/angular @qrcodesdk/core @qrcodesdk/browser
```

## Quick start

Import the components directly where you need them:

```ts
import {Component} from '@angular/core';

import {QRCodeCanvas, QRCodeImage, QRCodeSVG} from '@qrcodesdk/angular';

@Component({
  selector: 'app-root',
  imports: [QRCodeSVG, QRCodeImage, QRCodeCanvas],
  template: `
    <qrcode-svg data="https://qrcodesdk.dev" />
    <qrcode-image data="https://qrcodesdk.dev" />
    <qrcode-canvas data="https://qrcodesdk.dev" />
  `,
})
export class App {}
```

## Components

| Component      | Selector        | Output             | Download support |
| -------------- | --------------- | ------------------ | ---------------- |
| `QRCodeSVG`    | `qrcode-svg`    | Inline SVG         | SVG              |
| `QRCodeImage`  | `qrcode-image`  | PNG-backed `<img>` | PNG              |
| `QRCodeCanvas` | `qrcode-canvas` | `<canvas>`         | None             |

All components accept:

| Input     | Type                       | Description                                 |
| --------- | -------------------------- | ------------------------------------------- |
| `data`    | `string`                   | Required QR code payload.                   |
| `options` | Component-specific options | Optional matrix and renderer configuration. |

`options` supports shared matrix options such as `version`, `mode`, `errorCorrectionLevel`, and `mask`. Renderer options match the corresponding QRCodeSDK renderer:

- `QRCodeSVG` uses `QRCodeSVGOptions`.
- `QRCodeImage` uses `QRCodeImageOptions`.
- `QRCodeCanvas` uses `QRCodeCanvasOptions`.

## Matrix options

The `options` input combines the component's renderer options with the shared QR matrix options:

| Option                 | Type                                     | Default   | Description             |
| ---------------------- | ---------------------------------------- | --------- | ----------------------- |
| `mode`                 | `'numeric' \| 'alphanumeric' \| 'octet'` | Automatic | Encoding mode.          |
| `errorCorrectionLevel` | `'L' \| 'M' \| 'Q' \| 'H'`               | `'M'`     | Error correction level. |
| `version`              | `1` through `40`                         | Automatic | Pins the QR version.    |
| `mask`                 | `0` through `7`                          | Automatic | Pins the QR mask.       |

Most applications should let the builder select the mode, version, and mask automatically.

## SVG component

Use `QRCodeSVG` for crisp, scalable output and server-side rendering.

```ts
import {Component} from '@angular/core';

import {QRCodeSVG, type QRCodeSVGOptions} from '@qrcodesdk/angular';

@Component({
  selector: 'app-qrcode',
  imports: [QRCodeSVG],
  template: `
    <qrcode-svg [options]="options" data="https://qrcodesdk.dev" />
  `,
})
export class QRCodeExample {
  protected readonly options: QRCodeSVGOptions = {
    size: 8,
    margin: 4,
    colors: {
      colorDark: '#111827',
      colorLight: '#ffffff',
    },
    title: 'QR code for qrcodesdk.dev',
    ariaLabel: 'Scan to open qrcodesdk.dev',
  };
}
```

## Image component

`QRCodeImage` creates a PNG-backed `<img>` in the browser. Add meaningful accessibility text for user-facing QR codes.

```ts
import {Component} from '@angular/core';

import {QRCodeImage, type QRCodeImageOptions} from '@qrcodesdk/angular';

@Component({
  selector: 'app-qrcode',
  imports: [QRCodeImage],
  template: `
    <qrcode-image [options]="options" data="https://qrcodesdk.dev" />
  `,
})
export class QRCodeExample {
  protected readonly options: QRCodeImageOptions = {
    size: 8,
    margin: 4,
    alt: 'QR code for qrcodesdk.dev',
    ariaLabel: 'Scan to open qrcodesdk.dev',
  };
}
```

## Canvas component

```ts
import {Component} from '@angular/core';

import {QRCodeCanvas, type QRCodeCanvasOptions} from '@qrcodesdk/angular';

@Component({
  selector: 'app-qrcode',
  imports: [QRCodeCanvas],
  template: `
    <qrcode-canvas [options]="options" data="https://qrcodesdk.dev" />
  `,
})
export class QRCodeExample {
  protected readonly options: QRCodeCanvasOptions = {
    size: 8,
    margin: 4,
    colors: {
      colorDark: '#111827',
      colorLight: '#ffffff',
    },
  };
}
```

## Renderer options

| Option              | Components | Type     |     Default |
| ------------------- | ---------- | -------- | ----------: |
| `size`              | All        | `number` |         `5` |
| `margin`            | All        | `number` |         `4` |
| `colors.colorDark`  | All        | `string` | `'#000000'` |
| `colors.colorLight` | All        | `string` | `'#ffffff'` |
| `alt`               | SVG, Image | `string` | `undefined` |
| `ariaLabel`         | SVG, Image | `string` | `undefined` |
| `title`             | SVG, Image | `string` | `undefined` |

Color options use hash-prefixed values such as `#111827`. Image and Canvas output require a positive integer `size` and a non-negative integer `margin`.

## Download SVG and PNG files

`QRCodeSVG` and `QRCodeImage` expose `download(filename?)`. Call the component through an Angular template reference:

```ts
import {Component} from '@angular/core';

import {QRCodeImage, QRCodeSVG} from '@qrcodesdk/angular';

@Component({
  selector: 'app-download-qr-codes',
  imports: [QRCodeSVG, QRCodeImage],
  template: `
    <qrcode-svg #svg data="https://qrcodesdk.dev" />
    <button (click)="svg.download('qrcodesdk')" type="button">Download SVG</button>

    <qrcode-image
      #image
      [options]="{alt: 'QR code for qrcodesdk.dev'}"
      data="https://qrcodesdk.dev" />
    <button (click)="image.download('qrcodesdk')" type="button">Download PNG</button>
  `,
})
export class DownloadQRCodes {}
```

The appropriate `.svg` or `.png` extension is appended when necessary. `QRCodeCanvas` does not expose a download method; use `QRCodeImage` for built-in PNG downloads.

## Server-side rendering

`QRCodeSVG` produces runtime-neutral SVG and can render on the server.

`QRCodeImage` and `QRCodeCanvas` rely on browser DOM and Canvas APIs, so they skip element creation and downloads outside the browser and populate their host after hydration.

## Public API

```ts
import {
  QRCodeCanvas,
  type QRCodeCanvasOptions,
  QRCodeImage,
  type QRCodeImageOptions,
  QRCodeSVG,
  type QRCodeSVGOptions,
} from '@qrcodesdk/angular';
```

## Documentation

- [Angular library](https://qrcodesdk.dev/libs/angular/)
- [Customize QR codes](https://qrcodesdk.dev/guides/customize/)
- [SVG renderer](https://qrcodesdk.dev/renderers/core/svg/)
- [Image renderer](https://qrcodesdk.dev/renderers/browser/image/)
- [Canvas renderer](https://qrcodesdk.dev/renderers/browser/canvas/)
