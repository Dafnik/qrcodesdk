<!-- Generated from apps/docs/src/content/docs/packages/angular.mdx. Run `pnpm turbo run generate-readmes --filter=docs` to update. -->

<div align="center"><img src="https://qrcodesdk.dev/favicon.svg" alt="QRCodeSDK logo" width="240"></div>

# @qrcodesdk/angular

[![Open @qrcodesdk/angular on npmx.dev](https://npmx.dev/api/registry/badge/name/@qrcodesdk/angular?color=24272c&style=shieldsio)](https://npmx.dev/@qrcodesdk/angular) ![@qrcodesdk/angular version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/angular?color=24272c&label=version&style=shieldsio) ![@qrcodesdk/angular install size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/angular?color=24272c&label=install%20size&style=shieldsio) ![@qrcodesdk/angular download/mo](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/angular?color=24272c&label=download%2Fmo&style=shieldsio) [![@qrcodesdk/angular source code](https://npmx.dev/api/registry/badge/name/@qrcodesdk/angular?color=24272c&label=source%20code&value=GitHub%20%E2%86%97&style=shieldsio)](https://github.com/Dafnik/qrcodesdk/tree/main/packages/angular)

**[Documentation](https://qrcodesdk.dev) | [Live Demo](https://qrcodesdk.dev/playground/?package=angular)**

Angular components for rendering QR codes as inline SVG, PNG-backed Image elements, and Canvas elements.

## Install

```sh
npm install @qrcodesdk/angular
```

```sh
pnpm add @qrcodesdk/angular
```

<details>
<summary>Other package managers</summary>

**vp**

```sh
vp add @qrcodesdk/angular
```

**deno**

```sh
deno add @qrcodesdk/angular
```

**bun**

```sh
bun add @qrcodesdk/angular
```

**yarn**

```sh
yarn add @qrcodesdk/angular
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
    <qrcode-svg payload="https://qrcodesdk.dev" />
    <qrcode-image payload="https://qrcodesdk.dev" />
    <qrcode-canvas payload="https://qrcodesdk.dev" />
  `,
})
export class App {}
```

## Version compatibility

| @qrcodesdk/angular | Angular                       |
| ------------------ | ----------------------------- |
| `0.x.x`            | `^20.0.0` `^21.0.0` `^22.0.0` |

## Components

| Component      | Selector        | Output               | Download support |
| -------------- | --------------- | -------------------- | ---------------- |
| `QRCodeSVG`    | `qrcode-svg`    | `Inline SVG element` | SVG              |
| `QRCodeImage`  | `qrcode-image`  | `PNG-backed <img>`   | PNG              |
| `QRCodeCanvas` | `qrcode-canvas` | `<canvas> element`   | None             |

### Options

| Prop      | Type                         | Description                                 |
| --------- | ---------------------------- | ------------------------------------------- |
| `payload` | `string \| number`           | Required QR code payload.                   |
| `options` | `Component-specific options` | Optional matrix and renderer configuration. |

All three components are standalone. Add the components you use to the host component's
`imports` array, then bind `payload` and `options` with normal Angular template syntax.

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
        accessibility: {
          title: 'QR code for qrcodesdk.dev',
          ariaLabel: 'Scan to open qrcodesdk.dev',
        },
      }"
      payload="https://qrcodesdk.dev" />
  `,
})
export class QRCodeSVGExample {}
```

### Image component

```ts
import {Component} from '@angular/core';

import {QRCodeImage, type QRCodeImageOptions} from '@qrcodesdk/angular';

@Component({
  selector: 'qrcode-angular-image-example',
  imports: [QRCodeImage],
  template: `
    <qrcode-image [options]="options" payload="https://qrcodesdk.dev" />
  `,
})
export class QRCodeImageExample {
  protected readonly options: QRCodeImageOptions = {
    style: {moduleSize: 8, quietZone: 4},
    accessibility: {
      alt: 'QR code for qrcodesdk.dev',
      ariaLabel: 'Scan to open qrcodesdk.dev',
    },
  };
}
```

### Canvas component

```ts
import {Component} from '@angular/core';

import {QRCodeCanvas, type QRCodeCanvasOptions} from '@qrcodesdk/angular';

@Component({
  selector: 'qrcode-angular-canvas-example',
  imports: [QRCodeCanvas],
  template: `
    <qrcode-canvas [options]="options" payload="https://qrcodesdk.dev" />
  `,
})
export class QRCodeCanvasExample {
  protected readonly options: QRCodeCanvasOptions = {
    style: {
      moduleSize: 8,
      quietZone: 4,
      foreground: '#111827',
      background: '#ffffff',
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
    <div class="flex flex-col items-center gap-2">
      <qrcode-image
        #qrcode
        [options]="{
          accessibility: {alt: 'QR code for qrcodesdk.dev'},
        }"
        payload="https://qrcodesdk.dev" />
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

## Center images

Load and decode a browser image first, store the resulting `HTMLImageElement` in a signal, and
instantiate the component inside an `@if` block once the signal has a value. See
[Add a center image](https://qrcodesdk.dev/guides/center-images/#angular) for the complete
component and template.

## Download files

`QRCodeSVG` and `QRCodeImage` expose `download(filename?)` for SVG and PNG files respectively.
The method appends the file extension when needed. `QRCodeCanvas` has no download method.

See [Download or save](https://qrcodesdk.dev/guides/download-or-save/#download-from-angular) for the complete
Angular example, or its [Canvas export section](https://qrcodesdk.dev/guides/download-or-save/#export-a-canvas-manually)
for manual downloads.

## Server-side rendering

`QRCodeSVG` produces runtime-neutral SVG and can render on the server.

`QRCodeImage` and `QRCodeCanvas` rely on browser DOM and Canvas APIs, so they skip element creation and downloads outside the browser and populate their host after hydration.

## Shared options

The `options` input groups encoding settings under `matrix`. Renderer settings such as
`style`, `accessibility`, and `centerImage` go alongside it:

```ts
import type {QRCodeSVGOptions} from '@qrcodesdk/angular';

const options: QRCodeSVGOptions = {
  matrix: {errorCorrectionLevel: 'H'},
  style: {moduleSize: 8, quietZone: 4},
  accessibility: {ariaLabel: 'Scan to open qrcodesdk.dev'},
};
```

Pass this object through the component's `options` input. Use `QRCodeImageOptions` or
`QRCodeCanvasOptions` for the corresponding component.

See [Builder and matrix](https://qrcodesdk.dev/reference/builder/) for the fields inside `matrix`,
[Customize appearance](https://qrcodesdk.dev/guides/customize/) for `style`, and
[Renderer outputs](https://qrcodesdk.dev/reference/renderers/) for output-specific options.

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

- [@qrcodesdk/angular](https://qrcodesdk.dev/packages/angular/)
- [Customize appearance](https://qrcodesdk.dev/guides/customize/)
- [Add a center image](https://qrcodesdk.dev/guides/center-images/)
- [Download or save a QR code as SVG or PNG](https://qrcodesdk.dev/guides/download-or-save/)
- [SVG string renderer](https://qrcodesdk.dev/reference/renderers/svg/)
- [PNG-backed Image element renderer](https://qrcodesdk.dev/reference/renderers/image/)
- [Canvas element renderer](https://qrcodesdk.dev/reference/renderers/canvas/)
