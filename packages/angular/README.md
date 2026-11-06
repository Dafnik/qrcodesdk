<!-- Generated from apps/docs/src/content/docs/packages/angular.mdx. Run `pnpm turbo run generate-readmes --filter=docs` to update. -->

<div align="center"><img src="https://qrcodesdk.dev/favicon.svg" alt="QRCodeSDK logo" width="240"></div>

# @qrcodesdk/angular

[![Open @qrcodesdk/angular on npmx.dev](https://npmx.dev/api/registry/badge/name/@qrcodesdk/angular?color=24272c&style=shieldsio)](https://npmx.dev/@qrcodesdk/angular) ![@qrcodesdk/angular version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/angular?color=24272c&label=version&style=shieldsio) ![@qrcodesdk/angular install size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/angular?color=24272c&label=install%20size&style=shieldsio) ![@qrcodesdk/angular download/mo](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/angular?color=24272c&label=download%2Fmo&style=shieldsio) [![@qrcodesdk/angular source code](https://npmx.dev/api/registry/badge/name/@qrcodesdk/angular?color=24272c&label=source%20code&value=GitHub%20%E2%86%97&style=shieldsio)](https://github.com/Dafnik/qrcodesdk/tree/main/packages/angular)

**[Documentation](https://qrcodesdk.dev) | [Live Demo](https://qrcodesdk.dev/playground/?package=angular)**

Angular components for rendering QR codes as inline SVG, PNG, WebP, GIF, and JPEG Image elements, and Canvas elements.

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

import {QRCodeCanvas, QRCodePNG, QRCodeSVG} from '@qrcodesdk/angular';

@Component({
  selector: 'app-root',
  imports: [QRCodeSVG, QRCodePNG, QRCodeCanvas],
  template: `
    <qrcode-svg payload="https://qrcodesdk.dev" />
    <qrcode-png payload="https://qrcodesdk.dev" />
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
| `QRCodePNG`    | `qrcode-png`    | `PNG-backed <img>`   | PNG              |
| `QRCodeWebP`   | `qrcode-webp`   | `WebP-backed <img>`  | WebP             |
| `QRCodeGIF`    | `qrcode-gif`    | `GIF-backed <img>`   | GIF              |
| `QRCodeJPEG`   | `qrcode-jpeg`   | `JPEG-backed <img>`  | JPEG             |
| `QRCodeCanvas` | `qrcode-canvas` | `<canvas> element`   | None             |

### Options

| Prop      | Type                         | Description                                 |
| --------- | ---------------------------- | ------------------------------------------- |
| `payload` | `string \| number`           | Required QR code payload.                   |
| `options` | `Component-specific options` | Optional matrix and renderer configuration. |

Each image format has its own component, so your bundle only includes the encoders of the components
you import. `QRCodePNG` uses the browser's native PNG encoder. `QRCodeWebP` renders lossless WebP,
usually the smallest file, with an encoder bundled in the SDK that also works in Safari. `QRCodeGIF`
is limited to 256 colors and binary transparency, so prefer PNG or WebP for transparent backgrounds
and photographic center images. `QRCodeJPEG` is lossy and has no transparency: it blends
transparent pixels onto a white matte by default, and `quality` (1 to 100, default 92) trades file
size for detail. Use it when a destination requires JPEG. See the
[Image element renderers](https://qrcodesdk.dev/reference/renderers/image/) reference for details.

All components are standalone. Add the components you use to the host component's
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

### PNG component

```ts
import {Component} from '@angular/core';

import {QRCodePNG, type QRCodePNGImageOptions} from '@qrcodesdk/angular';

@Component({
  selector: 'qrcode-angular-png-example',
  imports: [QRCodePNG],
  template: `
    <qrcode-png [options]="options" payload="https://qrcodesdk.dev" />
  `,
})
export class QRCodePNGExample {
  protected readonly options: QRCodePNGImageOptions = {
    style: {moduleSize: 8, quietZone: 4},
    accessibility: {
      alt: 'QR code for qrcodesdk.dev',
      ariaLabel: 'Scan to open qrcodesdk.dev',
    },
  };
}
```

### WebP component

```ts
import {Component} from '@angular/core';

import {QRCodeWebP, type QRCodeWebPImageOptions} from '@qrcodesdk/angular';

@Component({
  selector: 'qrcode-angular-webp-example',
  imports: [QRCodeWebP],
  template: `
    <qrcode-webp [options]="options" payload="https://qrcodesdk.dev" />
  `,
})
export class QRCodeWebPExample {
  protected readonly options: QRCodeWebPImageOptions = {
    style: {moduleSize: 8, quietZone: 4},
    accessibility: {
      alt: 'QR code for qrcodesdk.dev',
      ariaLabel: 'Scan to open qrcodesdk.dev',
    },
  };
}
```

### GIF component

```ts
import {Component} from '@angular/core';

import {QRCodeGIF, type QRCodeGIFImageOptions} from '@qrcodesdk/angular';

@Component({
  selector: 'qrcode-angular-gif-example',
  imports: [QRCodeGIF],
  template: `
    <qrcode-gif [options]="options" payload="https://qrcodesdk.dev" />
  `,
})
export class QRCodeGIFExample {
  protected readonly options: QRCodeGIFImageOptions = {
    style: {moduleSize: 8, quietZone: 4},
    accessibility: {
      alt: 'QR code for qrcodesdk.dev',
      ariaLabel: 'Scan to open qrcodesdk.dev',
    },
  };
}
```

### JPEG component

```ts
import {Component} from '@angular/core';

import {QRCodeJPEG, type QRCodeJPEGImageOptions} from '@qrcodesdk/angular';

@Component({
  selector: 'qrcode-angular-jpeg-example',
  imports: [QRCodeJPEG],
  template: `
    <qrcode-jpeg [options]="options" payload="https://qrcodesdk.dev" />
  `,
})
export class QRCodeJPEGExample {
  protected readonly options: QRCodeJPEGImageOptions = {
    style: {moduleSize: 8, quietZone: 4},
    quality: 90,
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

import {QRCodePNG} from '@qrcodesdk/angular';

@Component({
  selector: 'qrcode-angular-download-png-example',
  imports: [QRCodePNG],
  template: `
    <div class="flex flex-col items-center gap-2">
      <qrcode-png
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
export class QRCodeDownloadPNGExample {
  private readonly qrCode = viewChild.required(QRCodePNG);

  protected download() {
    this.qrCode().download('qrcode.png');
  }
}
```

## Center images

Load and decode a browser image first, then store options with
`centerImage: canvasCenterImage(image)` in a signal. Instantiate the component inside an `@if` block
once the signal has a value. `QRCodeSVG` takes `svgCenterImage()` with an embedded data URL instead.
See
[Add a center image](https://qrcodesdk.dev/guides/center-images/#angular) for the complete
component and template.

## Download files

`QRCodeSVG`, `QRCodePNG`, `QRCodeWebP`, `QRCodeGIF`, and `QRCodeJPEG` expose `download(filename?)`
for SVG, PNG, WebP, GIF, and JPEG files respectively. The method appends the matching file extension when needed.
`QRCodeCanvas` has no download method.

See [Download or save](https://qrcodesdk.dev/guides/download-or-save/#download-from-angular) for the complete
Angular example, or its [Canvas export section](https://qrcodesdk.dev/guides/download-or-save/#export-a-canvas-manually)
for manual downloads.

## Server-side rendering

`QRCodeSVG` produces runtime-neutral SVG and can render on the server.

`QRCodePNG`, `QRCodeWebP`, `QRCodeGIF`, `QRCodeJPEG`, and `QRCodeCanvas` rely on browser DOM and Canvas APIs, so they skip element creation and downloads outside the browser and populate their host after hydration.

## Shared options

The `options` input groups encoding settings under `matrix`. Renderer settings such as
`style`, `accessibility`, and `centerImage` go alongside it:

```ts
import {type QRCodeSVGOptions, circle, finder, rounded} from '@qrcodesdk/angular';

const options: QRCodeSVGOptions = {
  matrix: {errorCorrectionLevel: 'H'},
  style: {moduleSize: 8, quietZone: 4, modules: rounded(), finder: finder({center: circle()})},
  accessibility: {ariaLabel: 'Scan to open qrcodesdk.dev'},
};
```

Pass this object through the component's `options` input. Use `QRCodePNGImageOptions`,
`QRCodeWebPImageOptions`, `QRCodeGIFImageOptions`, `QRCodeJPEGImageOptions`, or `QRCodeCanvasOptions`
for the corresponding component. `QRCodeGIFImageOptions` also accepts `transparency.threshold`, and
`QRCodeJPEGImageOptions` accepts `quality` and `transparency.matte`.

Import shape and pattern factories, and center-image factories from `@qrcodesdk/angular` alongside the components.

Mixed-mode segmentation is opt-in. Import `automaticSegmenter` from `@qrcodesdk/angular` and pass it
as `matrix.segmenter`, without installing `@qrcodesdk/core` separately:

```ts
import {type QRCodeSVGOptions, automaticSegmenter} from '@qrcodesdk/angular';

const options: QRCodeSVGOptions = {matrix: {mode: 'auto', segmenter: automaticSegmenter}};
```

See [Builder and matrix](https://qrcodesdk.dev/reference/builder/) for the fields inside `matrix`,
[Customize appearance](https://qrcodesdk.dev/guides/customize/) for `style`, and
[Renderer outputs](https://qrcodesdk.dev/reference/renderers/) for output-specific options.

## Public API

```ts
import {
  type QRCodeAlignmentCenterShape,
  type QRCodeAlignmentOptions,
  type QRCodeAlignmentRingShape,
  type QRCodeAlignmentStyle,
  QRCodeCanvas,
  type QRCodeCanvasAccessibilityOptions,
  type QRCodeCanvasCenterImage,
  type QRCodeCanvasOptions,
  type QRCodeCenterImageLayout,
  type QRCodeCircleShapeOptions,
  type QRCodeColor,
  type QRCodeDataImageURL,
  type QRCodeDownloadHandle,
  type QRCodeEncodingMode,
  type QRCodeErrorCorrectionLevel,
  type QRCodeFinderCenterShape,
  type QRCodeFinderOptions,
  type QRCodeFinderRingShape,
  type QRCodeFinderStyle,
  QRCodeGIF,
  type QRCodeGIFImageOptions,
  type QRCodeImageAccessibilityOptions,
  QRCodeJPEG,
  type QRCodeJPEGImageOptions,
  type QRCodeMask,
  type QRCodeMatrixOptions,
  type QRCodeMode,
  type QRCodeModulePattern,
  type QRCodeModuleShape,
  QRCodePNG,
  type QRCodePNGImageOptions,
  type QRCodePayload,
  type QRCodeRoundedShapeOptions,
  QRCodeSVG,
  type QRCodeSVGAccessibilityOptions,
  type QRCodeSVGCenterImage,
  type QRCodeSVGOptions,
  type QRCodeSegment,
  type QRCodeSegmenter,
  type QRCodeSegmenterOptions,
  type QRCodeShape,
  type QRCodeShapePath,
  type QRCodeShapePiece,
  type QRCodeVersion,
  type QRCodeVisualStyle,
  QRCodeWebP,
  type QRCodeWebPImageOptions,
  alignment,
  automaticSegmenter,
  canvasCenterImage,
  circle,
  customShape,
  diagonal,
  finder,
  rounded,
  svgCenterImage,
} from '@qrcodesdk/angular';
```

## Documentation

- [@qrcodesdk/angular](https://qrcodesdk.dev/packages/angular/)
- [Customize appearance](https://qrcodesdk.dev/guides/customize/)
- [Add a center image](https://qrcodesdk.dev/guides/center-images/)
- [Download or save a QR code as SVG, PNG, WebP, GIF, or JPEG](https://qrcodesdk.dev/guides/download-or-save/)
- [SVG string renderer](https://qrcodesdk.dev/reference/renderers/svg/)
- [Image element renderers](https://qrcodesdk.dev/reference/renderers/image/)
- [Canvas element renderer](https://qrcodesdk.dev/reference/renderers/canvas/)
