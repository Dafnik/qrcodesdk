<!-- Generated from apps/docs/src/content/docs/packages/angular.mdx. Run `pnpm turbo run generate-readmes --filter=docs` to update. -->

<div align="center"><img src="https://qrcodesdk.dev/favicon.svg" alt="QRCodeSDK logo" width="240"></div>

# @qrcodesdk/angular

[![Open @qrcodesdk/angular on npmx.dev](https://npmx.dev/api/registry/badge/name/@qrcodesdk/angular?color=24272c&style=shieldsio)](https://npmx.dev/@qrcodesdk/angular) ![@qrcodesdk/angular version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/angular?color=24272c&label=version&style=shieldsio) ![@qrcodesdk/angular install size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/angular?color=24272c&label=install%20size&style=shieldsio) ![@qrcodesdk/angular download/mo](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/angular?color=24272c&label=download%2Fmo&style=shieldsio) [![@qrcodesdk/angular source code](https://npmx.dev/api/registry/badge/name/@qrcodesdk/angular?color=24272c&label=source%20code&value=GitHub%20%E2%86%97&style=shieldsio)](https://github.com/Dafnik/qrcodesdk/tree/main/packages/angular)

**[Documentation](https://qrcodesdk.dev) | [Live Demo](https://qrcodesdk.dev/playground/?package=angular)**

Angular components that render QR codes as inline SVG, as PNG, WebP, GIF, or JPEG Image elements, or
as Canvas elements.

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

Import a component and add it to your component's `imports`:

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

- `ariaLabel` names the QR code for screen readers. The link gives everyone another way to reach the
  destination.
- Without `accessibility` options, the QR code is decorative and hidden from assistive technology.
  Leave it unlabeled only when nearby content, such as this link, already explains it.
- `QRCodePNG`, `QRCodeWebP`, `QRCodeGIF`, `QRCodeJPEG`, and `QRCodeCanvas` take the same `payload`
  and `options` inputs. Image components also accept `accessibility.alt`.

## Version compatibility

| @qrcodesdk/angular | Angular                       |
| ------------------ | ----------------------------- |
| `0.x.x`            | `^20.0.0` `^21.0.0` `^22.0.0` |

## Components

Each output format has its own standalone component. Your bundle only includes the encoders of the
components you import.

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

Unlike the React, Vue, and Svelte components, the Angular components render no wrapper `<div>`. Set
`display: block` on the host element, such as `<qrcode-svg>`, to size the QR code with CSS.

## Choose an image format

- `QRCodePNG` uses the browser's native PNG encoder.
- `QRCodeWebP` uses a lossless encoder bundled in the SDK. It also works in Safari and usually
  produces the smallest file.
- `QRCodeGIF` is limited to 256 colors and on-or-off transparency. Prefer PNG or WebP for
  transparent backgrounds and photographic center images.
- `QRCodeJPEG` is lossy and has no transparency. It blends transparent pixels onto a white matte by
  default. Its `quality` option ranges from 1 to 100 and defaults to 92. Use it only when a
  destination requires JPEG.

See [Image element renderers](https://qrcodesdk.dev/reference/renderers/image/) for details.

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

For PNG, WebP, GIF, JPEG, and Canvas components:

1. Load and decode a browser image.
2. Store the options with `centerImage: canvasCenterImage(image)` in a signal.
3. Render the component inside an `@if` block once the signal has a value.

`QRCodeSVG` takes `svgCenterImage()` with an embedded data URL instead. See
[Add a center image](https://qrcodesdk.dev/guides/center-images/#angular) for the complete component and template.

## Download files

Every component except `QRCodeCanvas` exposes `download(filename?)`. Get it through a template
reference variable or `viewChild()`. The method appends the file extension when needed.

See [Download or save](https://qrcodesdk.dev/guides/download-or-save/#download-from-angular) for a complete Angular
example. For manual downloads, see
[Export a canvas manually](https://qrcodesdk.dev/guides/download-or-save/#export-a-canvas-manually).

## Server-side rendering

- `QRCodeSVG` produces runtime-neutral SVG and renders on the server.
- `QRCodePNG`, `QRCodeWebP`, `QRCodeGIF`, `QRCodeJPEG`, and `QRCodeCanvas` need browser DOM and
  Canvas APIs. On the server, they render an empty host element and skip downloads. They fill the
  host after hydration.

## Shared options

The `options` input groups encoding settings under `matrix`. Renderer settings, such as `style`,
`accessibility`, and `centerImage`, sit next to it:

```ts
import {type QRCodeSVGOptions, circle, finder, rounded} from '@qrcodesdk/angular';

const options: QRCodeSVGOptions = {
  matrix: {errorCorrectionLevel: 'H'},
  style: {moduleSize: 8, quietZone: 4, modules: rounded(), finder: finder({center: circle()})},
  accessibility: {ariaLabel: 'Scan to open qrcodesdk.dev'},
};
```

Each component has its own options type:

| Component      | Options type             | Extra options                   |
| -------------- | ------------------------ | ------------------------------- |
| `QRCodeSVG`    | `QRCodeSVGOptions`       | None                            |
| `QRCodePNG`    | `QRCodePNGImageOptions`  | None                            |
| `QRCodeWebP`   | `QRCodeWebPImageOptions` | None                            |
| `QRCodeGIF`    | `QRCodeGIFImageOptions`  | `transparency.threshold`        |
| `QRCodeJPEG`   | `QRCodeJPEGImageOptions` | `quality`, `transparency.matte` |
| `QRCodeCanvas` | `QRCodeCanvasOptions`    | None                            |

Learn more about each group:

- [Builder and matrix](https://qrcodesdk.dev/reference/builder/) covers the fields inside `matrix`.
- [Customize appearance](https://qrcodesdk.dev/guides/customize/) covers `style`.
- [Renderer outputs](https://qrcodesdk.dev/reference/renderers/) covers output-specific options.

[Payload helpers](https://qrcodesdk.dev/reference/payloads/) and `QRCodeError` come from `@qrcodesdk/core`. To use them,
[add Core to the project](https://qrcodesdk.dev/getting-started/choose-your-setup/#add-core-to-a-framework-project).

### Mixed-mode segmentation

Mixed-mode segmentation is opt-in. Import `automaticSegmenter` from `@qrcodesdk/angular` and pass it
as `matrix.segmenter`:

```ts
import {type QRCodeSVGOptions, automaticSegmenter} from '@qrcodesdk/angular';

const options: QRCodeSVGOptions = {matrix: {mode: 'auto', segmenter: automaticSegmenter}};
```

### Keep options stable

`options` is a signal input compared by identity.

- Replacing the bound object renders the QR code again.
- Changing a property of the same object does not.

Create a new object instead, for example with `signal.set()`, `signal.update()`, or `computed()`.
Object literals in a template are fine: Angular caches them and recreates them only when a value
bound inside them changes.

## Errors

Components throw `QRCodeError` for invalid payloads and options. They render in `effect()`, so
Angular reports these errors to its `ErrorHandler`.

Wrap downloads called from an event handler in your own `try`/`catch`. See
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
