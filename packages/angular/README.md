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
deno add npm:@qrcodesdk/angular
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

import {QRCodeSVG, type QRCodeSVGOptions} from '@qrcodesdk/angular';

@Component({
  selector: 'app-root',
  imports: [QRCodeSVG],
  template: `
    <figure>
      <qrcode-svg [options]="options" payload="https://qrcodesdk.dev" />
      <figcaption>
        Scan the code or open
        <a href="https://qrcodesdk.dev">qrcodesdk.dev</a>
      </figcaption>
    </figure>
  `,
})
export class App {
  protected readonly options: QRCodeSVGOptions = {
    accessibility: {ariaLabel: 'Scan to open qrcodesdk.dev'},
  };
}
```

The label names the QR code for screen readers, and the link gives everyone another way to reach the
destination. Without `accessibility` options, the output is decorative and hidden from assistive
technology. Leave a QR code unlabeled only when nearby content, such as this link, already gives its
meaning.

`QRCodePNG`, `QRCodeWebP`, `QRCodeGIF`, `QRCodeJPEG`, and `QRCodeCanvas` take the same `payload` and
`options` inputs. Image components also accept `accessibility.alt`.

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

### Component props

| Prop                                         | Type                       | Description                                                                                                                                        |
| -------------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `payload` input                              | `string \| number`         | Required QR code payload.                                                                                                                          |
| `options` input                              | Component-specific options | Optional `matrix` options and renderer options, such as `QRCodeSVGOptions` for `QRCodeSVG`.                                                        |
| `class`, `style`, other host attributes      | Host element attributes    | Apply to the `<qrcode-*>` host element. There is no wrapper `<div>`. The output element is a direct child of the host, which is inline by default. |
| Template reference variable or `viewChild()` | Component instance         | Every component except `QRCodeCanvas` implements `QRCodeDownloadHandle` and has `download(filename?)`.                                             |

Each image format has its own component, so your bundle only includes the encoders of the components
you import. `QRCodePNG` uses the browser's native PNG encoder. `QRCodeWebP` uses a lossless encoder
bundled in the SDK, which also works in Safari, and usually produces the smallest file.

`QRCodeGIF` is limited to 256 colors and binary transparency. Prefer PNG or WebP for transparent
backgrounds and photographic center images.

`QRCodeJPEG` is lossy and has no transparency. It blends transparent pixels onto a white matte by
default. Its `quality` option ranges from 1 to 100, defaults to 92, and trades file size for detail.
Use it when a destination requires JPEG. See the
[Image element renderers](https://qrcodesdk.dev/reference/renderers/image/) reference for details.

All components are standalone. Add the ones you use to the host component's `imports` array, then
bind their `payload` and `options` inputs.

Unlike the React, Vue, and Svelte components, the Angular components render no wrapper `<div>`. Set
`display: block` on the host element, such as `<qrcode-svg>`, to size the QR code with CSS.

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
      alt: 'QR code: scan to open qrcodesdk.dev',
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
      alt: 'QR code: scan to open qrcodesdk.dev',
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
      alt: 'QR code: scan to open qrcodesdk.dev',
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
      alt: 'QR code: scan to open qrcodesdk.dev',
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
    accessibility: {ariaLabel: 'Scan to open qrcodesdk.dev'},
  };
}
```

### PNG download

```ts
import {Component} from '@angular/core';

import {QRCodePNG} from '@qrcodesdk/angular';

@Component({
  selector: 'qrcode-angular-download-png-example',
  imports: [QRCodePNG],
  template: `
    <qrcode-png
      #qrcode
      [options]="{
        accessibility: {alt: 'QR code: scan to open qrcodesdk.dev'},
      }"
      payload="https://qrcodesdk.dev" />
    <button (click)="qrcode.download('qrcodesdk')" type="button">Download PNG</button>
  `,
})
export class QRCodeDownloadPNGExample {}
```

## Center images

Load and decode a browser image first, then store options with
`centerImage: canvasCenterImage(image)` in a signal. Instantiate the component inside an `@if` block
once the signal has a value. `QRCodeSVG` takes `svgCenterImage()` with an embedded data URL instead.
See
[Add a center image](https://qrcodesdk.dev/guides/center-images/#angular) for the complete
component and template.

## Download files

All components except `QRCodeCanvas` expose `download(filename?)`. The method appends the
component's file extension when needed.

See [Download or save](https://qrcodesdk.dev/guides/download-or-save/#download-from-angular) for the complete
Angular example, or its [Canvas export section](https://qrcodesdk.dev/guides/download-or-save/#export-a-canvas-manually)
for manual downloads.

## Server-side rendering

`QRCodeSVG` produces runtime-neutral SVG and can render on the server.

`QRCodePNG`, `QRCodeWebP`, `QRCodeGIF`, `QRCodeJPEG`, and `QRCodeCanvas` rely on browser DOM and
Canvas APIs. Outside the browser, they skip element creation and downloads. They populate their host
after hydration.

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

Mixed-mode segmentation is opt-in. Import `automaticSegmenter` from `@qrcodesdk/angular` and pass it
as `matrix.segmenter`:

```ts
import {type QRCodeSVGOptions, automaticSegmenter} from '@qrcodesdk/angular';

const options: QRCodeSVGOptions = {matrix: {mode: 'auto', segmenter: automaticSegmenter}};
```

To build payloads with [payload helpers](https://qrcodesdk.dev/reference/payloads/) or check `instanceof QRCodeError`,
import them from `@qrcodesdk/core` after you
[add Core to the project](https://qrcodesdk.dev/getting-started/choose-your-setup/#add-core-to-a-framework-project).

See [Builder and matrix](https://qrcodesdk.dev/reference/builder/) for the fields inside `matrix`,
[Customize appearance](https://qrcodesdk.dev/guides/customize/) for `style`, and
[Renderer outputs](https://qrcodesdk.dev/reference/renderers/) for output-specific options.

### Keep options stable

`options` is a signal input compared by identity. The component renders the QR code again when the
bound object is replaced, not when a property of the same object changes. Create a new object, for
example with `signal.set()`, `signal.update()`, or `computed()`. Angular caches object literals
written in a template and recreates them only when a value bound inside them changes.

## Errors

Components throw `QRCodeError` for invalid payloads and options. Angular reports them to its `ErrorHandler`, because the components render in `effect()`. Downloads called from an
event handler need their own `try`/`catch`. See
[Check errors from framework packages](https://qrcodesdk.dev/reference/errors/#check-errors-from-framework-packages).

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
- [Errors](https://qrcodesdk.dev/reference/errors/)
- [Add a center image](https://qrcodesdk.dev/guides/center-images/)
- [Download or save a QR code as SVG, PNG, WebP, GIF, or JPEG](https://qrcodesdk.dev/guides/download-or-save/)
- [SVG string renderer](https://qrcodesdk.dev/reference/renderers/svg/)
- [Image element renderers](https://qrcodesdk.dev/reference/renderers/image/)
- [Canvas element renderer](https://qrcodesdk.dev/reference/renderers/canvas/)
