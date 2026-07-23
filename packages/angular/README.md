<!-- Generated from apps/docs/src/content/docs/libs/angular.mdx. Run `pnpm --filter docs generate-readmes` to update. -->

# @qrcodesdk/angular

[![npm version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/angular?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/angular) [![npm bundle size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/angular?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/angular) [![npm downloads per month](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/angular?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/angular)

**[Live Demo](https://qrcodesdk.dev/playground/?pkg=angular)**

`@qrcodesdk/angular` provides Angular components for rendering QR codes as inline SVG, PNG-backed Image elements, and Canvas elements.

## Install

```sh
npm install @qrcodesdk/angular @qrcodesdk/core @qrcodesdk/browser
```

```sh
pnpm add @qrcodesdk/angular @qrcodesdk/core @qrcodesdk/browser
```

<details>
<summary>Other package managers</summary>

**vp**

```sh
vp add @qrcodesdk/angular @qrcodesdk/core @qrcodesdk/browser
```

**deno**

```sh
deno add @qrcodesdk/angular @qrcodesdk/core @qrcodesdk/browser
```

**bun**

```sh
bun add @qrcodesdk/angular @qrcodesdk/core @qrcodesdk/browser
```

**yarn**

```sh
yarn add @qrcodesdk/angular @qrcodesdk/core @qrcodesdk/browser
```

</details>

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
| `QRCodeSVG`    | `qrcode-svg`    | Inline SVG element | SVG              |
| `QRCodeImage`  | `qrcode-image`  | PNG-backed `<img>` | PNG              |
| `QRCodeCanvas` | `qrcode-canvas` | `<canvas>` element | None             |

All components accept:

| Input     | Type                       | Description                                 |
| --------- | -------------------------- | ------------------------------------------- |
| `data`    | `string \| number`         | Required QR code payload.                   |
| `options` | Component-specific options | Optional matrix and renderer configuration. |

`options` supports shared matrix options such as `version`, `mode`, `errorCorrectionLevel`, and `mask`. Renderer options match the corresponding QRCodeSDK renderer:

- `QRCodeSVG` uses `QRCodeSVGOptions`.
- `QRCodeImage` uses `QRCodeImageOptions`.
- `QRCodeCanvas` uses `QRCodeCanvasOptions`.

Import `QRCodeSVGOptions` from `@qrcodesdk/core`. Import `QRCodeImageOptions` and `QRCodeCanvasOptions` from `@qrcodesdk/browser`.

## Matrix options

The `options` input combines the component's renderer options with the shared QR matrix options:

| Option                 | Type                                     | Default   | Description             |
| ---------------------- | ---------------------------------------- | --------- | ----------------------- |
| `mode`                 | `'numeric' \| 'alphanumeric' \| 'octet'` | Automatic | Encoding mode.          |
| `errorCorrectionLevel` | `'L' \| 'M' \| 'Q' \| 'H'`               | `'M'`     | Error correction level. |
| `version`              | `1` through `40`                         | Automatic | Pins the QR version.    |
| `mask`                 | `0` through `7`                          | Automatic | Pins the QR mask.       |

Most applications should let the builder select the mode, version, and mask automatically.

## Live examples

### SVG component

```ts
import {Component} from '@angular/core';

import {QRCodeSVG} from '@qrcodesdk/angular';

@Component({
  selector: 'qrcode-angular-svg-example',
  imports: [QRCodeSVG],
  template: `
    <qrcode-svg
      [options]="{
        title: 'QR code for qrcodesdk.dev',
        ariaLabel: 'Scan to open qrcodesdk.dev',
      }"
      data="https://qrcodesdk.dev" />
  `,
})
export class QRCodeSVGExample {}
```

### Image component

```ts
import {Component} from '@angular/core';

import {QRCodeImage} from '@qrcodesdk/angular';
import type {QRCodeImageOptions} from '@qrcodesdk/browser';

@Component({
  selector: 'qrcode-angular-image-example',
  imports: [QRCodeImage],
  template: `
    <qrcode-image [options]="options" data="https://qrcodesdk.dev" />
  `,
})
export class QRCodeImageExample {
  protected readonly options: QRCodeImageOptions = {
    size: 8,
    margin: 4,
    alt: 'QR code for qrcodesdk.dev',
    ariaLabel: 'Scan to open qrcodesdk.dev',
  };
}
```

### Canvas component

```ts
import {Component} from '@angular/core';

import {QRCodeCanvas} from '@qrcodesdk/angular';
import type {QRCodeCanvasOptions} from '@qrcodesdk/browser';

@Component({
  selector: 'qrcode-angular-canvas-example',
  imports: [QRCodeCanvas],
  template: `
    <qrcode-canvas [options]="options" data="https://qrcodesdk.dev" />
  `,
})
export class QRCodeCanvasExample {
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

### PNG download

```ts
import {Component, viewChild} from '@angular/core';

import {QRCodeImage} from '@qrcodesdk/angular';

@Component({
  selector: 'qrcode-angular-download-image-example',
  imports: [QRCodeImage],
  template: `
    <div class="flex flex-col items-center">
      <qrcode-image
        #qrcode
        [options]="{
          alt: 'QR code for qrcodesdk.dev',
        }"
        data="https://qrcodesdk.dev" />
      <button class="btn-primary" (click)="qrcode.download('qrcodesdk')" type="button">
        Download PNG
      </button>
    </div>
  `,
})
export class QRCodeDownloadImageExample {
  private readonly qrCode = viewChild.required(QRCodeImage);

  protected download() {
    this.qrCode().download('qrcode.png');
  }
}
```

## Renderer options

| Option                 | Components | Type                         |            Default |
| ---------------------- | ---------- | ---------------------------- | -----------------: |
| `size`                 | All        | `number`                     |                `5` |
| `margin`               | All        | `number`                     |                `4` |
| `colors.colorDark`     | All        | `string`                     |        `'#000000'` |
| `colors.colorLight`    | All        | `string`                     |        `'#ffffff'` |
| `dotsOptions`          | All        | `QRCodeDotsOptions`          | `{type: 'square'}` |
| `cornersSquareOptions` | All        | `QRCodeCornersSquareOptions` | `{type: 'square'}` |
| `cornersDotOptions`    | All        | `QRCodeCornersDotOptions`    | `{type: 'square'}` |
| `alt`                  | SVG, Image | `string`                     |        `undefined` |
| `ariaLabel`            | SVG, Image | `string`                     |        `undefined` |
| `title`                | SVG, Image | `string`                     |        `undefined` |

Color options use hash-prefixed values such as `#111827`. Image and Canvas output require a positive integer `size` and a non-negative integer `margin`.

Module, finder-ring, and finder-center options pass through to every component. Their optional
colors independently inherit `colors.colorDark`.

## Download files

- `QRCodeSVG` exposes `download(filename?)` and writes an SVG file.
- `QRCodeImage` exposes `download(filename?)` and writes a PNG file.

```angular2html
<qrcode-svg #qrcodeSvg data="https://qrcodesdk.dev" />
<button type="button" (click)="qrcodeSvg.download('qrcodesdk')">Download SVG</button>

<qrcode-image #qrcodeImage data="https://qrcodesdk.dev" />
<button type="button" (click)="qrcodeImage.download('qrcodesdk')">Download PNG</button>
```

The appropriate `.svg` or `.png` extension is appended when necessary.

`QRCodeCanvas` does not include a download method. Use `QRCodeImage` when you want built-in PNG download support.

## Server-side rendering

`QRCodeSVG` produces runtime-neutral SVG and can render on the server.

`QRCodeImage` and `QRCodeCanvas` rely on browser DOM and Canvas APIs, so they skip element creation and downloads outside the browser and populate their host after hydration.

## Public API

```ts
import {QRCodeCanvas, QRCodeImage, QRCodeSVG} from '@qrcodesdk/angular';
import type {QRCodeCanvasOptions, QRCodeImageOptions} from '@qrcodesdk/browser';
import type {QRCodeSVGOptions} from '@qrcodesdk/core';
```

## Documentation

- [@qrcodesdk/angular](https://qrcodesdk.dev/libs/angular/)
- [Customize QR Codes](https://qrcodesdk.dev/guides/customize/)
- [Render SVG](https://qrcodesdk.dev/renderers/core/svg/)
- [Render to an Image Element](https://qrcodesdk.dev/renderers/browser/image/)
- [Render to Canvas](https://qrcodesdk.dev/renderers/browser/canvas/)
