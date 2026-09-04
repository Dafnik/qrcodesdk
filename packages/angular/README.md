<!-- Generated from apps/docs/src/content/docs/packages/angular.mdx. Run `pnpm turbo run generate-readmes --filter=docs` to update. -->

<div align="center"><img src="https://qrcodesdk.dev/favicon.svg" alt="QRCodeSDK logo" width="240"></div>

# @qrcodesdk/angular

[![Open @qrcodesdk/angular on npmx.dev](https://npmx.dev/api/registry/badge/name/@qrcodesdk/angular?color=7469B6&style=shieldsio)](https://npmx.dev/@qrcodesdk/angular) ![@qrcodesdk/angular version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/angular?color=7469B6&label=version&style=shieldsio) ![@qrcodesdk/angular install size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/angular?color=7469B6&label=install%20size&style=shieldsio) ![@qrcodesdk/angular download/mo](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/angular?color=7469B6&label=download%2Fmo&style=shieldsio) [![@qrcodesdk/angular source code](https://npmx.dev/api/registry/badge/name/@qrcodesdk/angular?color=7469B6&label=source%20code&value=GitHub%20%E2%86%97&style=shieldsio)](https://github.com/Dafnik/qrcodesdk/tree/main/packages/angular)

**[Documentation](https://qrcodesdk.dev) | [Live Demo](https://qrcodesdk.dev/playground/?package=angular)**

Angular components for rendering QR codes as inline SVG, PNG-backed Image elements, and Canvas elements.

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
| `data`    | `string \| number`           | Required QR code payload.                   |
| `options` | `Component-specific options` | Optional matrix and renderer configuration. |

All three components are standalone. Add the components you use to the host component's
`imports` array, then bind `data` and `options` with normal Angular template syntax.

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

## Center images

Load and decode a browser image first, store the resulting `HTMLImageElement` in a signal, and
instantiate the component inside an `@if` block once the signal has a value. See
[Add a center image](https://qrcodesdk.dev/guides/center-images/#angular) for the complete
component and template.

## Download files

- `QRCodeSVG` exposes `download(filename?)` and writes an SVG file.
- `QRCodeImage` exposes `download(filename?)` and writes a PNG file.

```angular-html
<qrcode-svg #qrcodeSvg data="https://qrcodesdk.dev" />
<button (click)="qrcodeSvg.download('qrcodesdk')" type="button">Download SVG</button>

<qrcode-image #qrcodeImage data="https://qrcodesdk.dev" />
<button (click)="qrcodeImage.download('qrcodesdk')" type="button">Download PNG</button>
```

The appropriate `.svg` or `.png` extension is appended when necessary.

`QRCodeCanvas` does not include a download method. Use `QRCodeImage` when you want built-in PNG download support.

See [Download or save](https://qrcodesdk.dev/guides/download-or-save/#download-from-angular) for template-reference
downloads and manual Canvas export.

## Server-side rendering

`QRCodeSVG` produces runtime-neutral SVG and can render on the server.

`QRCodeImage` and `QRCodeCanvas` rely on browser DOM and Canvas APIs, so they skip element creation and downloads outside the browser and populate their host after hydration.

## Shared configuration

The `options` input combines matrix settings with the selected renderer's settings. Use the
[builder reference](https://qrcodesdk.dev/reference/builder/) for encoding, version, mask, and error correction;
[Customize output](https://qrcodesdk.dev/guides/customize/) for shared visual options; and the dedicated
[renderer references](https://qrcodesdk.dev/reference/renderers/) for output-specific options and constraints.

## Public API

```ts
import {QRCodeCanvas, QRCodeImage, QRCodeSVG} from '@qrcodesdk/angular';
import type {QRCodeCanvasOptions, QRCodeImageOptions} from '@qrcodesdk/browser';
import type {QRCodeSVGOptions} from '@qrcodesdk/core';
```

## Documentation

- [@qrcodesdk/angular](https://qrcodesdk.dev/packages/angular/)
- [Customize appearance](https://qrcodesdk.dev/guides/customize/)
- [Add a center image](https://qrcodesdk.dev/guides/center-images/)
- [Download or save a QR code as SVG or PNG](https://qrcodesdk.dev/guides/download-or-save/)
- [SVG string renderer](https://qrcodesdk.dev/reference/renderers/svg/)
- [PNG-backed Image element renderer](https://qrcodesdk.dev/reference/renderers/image/)
- [Canvas element renderer](https://qrcodesdk.dev/reference/renderers/canvas/)
