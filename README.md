# QRCodeSDK

A modular TypeScript package family for generating QR codes and rendering them in the format your runtime needs.

**[Live Demo](https://qrcodesdk.dev/playground/)**

QRCodeSDK separates QR code generation from rendering. `@qrcodesdk/core` creates a standards-compliant QR matrix, then a renderer turns that matrix into SVG, terminal text, Canvas, an Image element, a PNG buffer, or framework-native output.

## Choose a package

| Package                                                     | Use it for                                          | Output                                                          | Package status                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`@qrcodesdk/core`](https://qrcodesdk.dev/libs/core/)       | Runtime-neutral generation and common renderers.    | SVG and terminal text strings, raw matrices.                    | [![npm version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/core?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/core)<br>[![npm bundle size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/core?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/core)<br>[![npm download per month](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/core?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/core)                   |
| [`@qrcodesdk/browser`](https://qrcodesdk.dev/libs/browser/) | Browser DOM output and client-side downloads.       | `HTMLCanvasElement`, `HTMLImageElement`, SVG and PNG downloads. | [![npm version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/browser?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/browser)<br>[![npm bundle size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/browser?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/browser)<br>[![npm download per month](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/browser?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/browser) |
| [`@qrcodesdk/node`](https://qrcodesdk.dev/libs/node/)       | Server-side raster image generation.                | PNG `Buffer`.                                                   | [![npm version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/node?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/node)<br>[![npm bundle size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/node?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/node)<br>[![npm download per month](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/node?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/node)                   |
| [`@qrcodesdk/angular`](https://qrcodesdk.dev/libs/angular/) | Standalone Angular components and download helpers. | SVG, Image, and Canvas components.                              | [![npm version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/angular?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/angular)<br>[![npm bundle size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/angular?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/angular)<br>[![npm download per month](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/angular?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/angular) |
| [`@qrcodesdk/react`](https://qrcodesdk.dev/libs/react/)     | React components and download helpers.              | SVG, Image, and Canvas components.                              | [![npm version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/react?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/react)<br>[![npm bundle size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/react?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/react)<br>[![npm download per month](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/react?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/react)             |
| [`@qrcodesdk/cli`](https://qrcodesdk.dev/guides/cli/)       | Terminal, shell script, and CI workflows.           | Terminal text, SVG files, PNG files.                            | [![npm version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/cli?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/cli)<br>[![npm bundle size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/cli?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/cli)<br>[![npm download per month](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/cli?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/cli)                         |

## Install

Start with Core for runtime-neutral SVG, terminal text, or matrix output.

```sh
npm install @qrcodesdk/core
```

```sh
pnpm add @qrcodesdk/core
```

Add the renderer package for your runtime:

```sh
npm install @qrcodesdk/core @qrcodesdk/browser
npm install @qrcodesdk/core @qrcodesdk/node
```

```sh
pnpm add @qrcodesdk/core @qrcodesdk/browser
pnpm add @qrcodesdk/core @qrcodesdk/node
```

Framework packages use the same Core and Browser renderers:

```sh
npm install @qrcodesdk/angular @qrcodesdk/core @qrcodesdk/browser
npm install @qrcodesdk/react @qrcodesdk/core @qrcodesdk/browser
```

```sh
pnpm add @qrcodesdk/angular @qrcodesdk/core @qrcodesdk/browser
pnpm add @qrcodesdk/react @qrcodesdk/core @qrcodesdk/browser
```

## Quick starts

### SVG in any JavaScript runtime

```ts
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev').render(
  QRCodeSVGRenderer({
    ariaLabel: 'Scan to open qrcodesdk.dev',
  }),
);
```

### Browser Image element

```ts
import {QRCodeImageRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const image = qrcode('https://qrcodesdk.dev').render(
  QRCodeImageRenderer({alt: 'QR code for qrcodesdk.dev'}),
);

document.body.append(image);
```

### PNG in Node.js

```ts
import {writeFile} from 'node:fs/promises';

import {qrcode} from '@qrcodesdk/core';
import {QRCodePNGRenderer} from '@qrcodesdk/node';

const png = qrcode('https://qrcodesdk.dev').render(QRCodePNGRenderer());

await writeFile('qrcode.png', png);
```

### Angular

```ts
import {Component} from '@angular/core';

import {QRCodeSVG} from '@qrcodesdk/angular';

@Component({
  selector: 'app-root',
  imports: [QRCodeSVG],
  template: `
    <qrcode-svg data="https://qrcodesdk.dev" />
  `,
})
export class App {}
```

### React

```tsx
import {QRCodeSVG} from '@qrcodesdk/react';

export function App() {
  return <QRCodeSVG data="https://qrcodesdk.dev" />;
}
```

### CLI

```sh
npm install --global @qrcodesdk/cli
qrc "https://qrcodesdk.dev" --output qrcode.svg
```

```sh
pnpm add --global @qrcodesdk/cli
qrc "https://qrcodesdk.dev" --output qrcode.png
```

## Core concepts

The immutable builder controls the QR matrix. Renderers control its presentation and output type.

```ts
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('HELLO WORLD')
  .mode('alphanumeric')
  .errorCorrection('H')
  .render(
    QRCodeSVGRenderer({
      size: 8,
      margin: 4,
      colors: {
        colorDark: '#111827',
        colorLight: '#ffffff',
      },
    }),
  );
```

Shared visual defaults:

| Option              |     Default | Meaning                                     |
| ------------------- | ----------: | ------------------------------------------- |
| `size`              |         `5` | Pixel size or text scale of each QR module. |
| `margin`            |         `4` | Quiet-zone width in modules.                |
| `colors.colorDark`  | `'#000000'` | Dark module color.                          |
| `colors.colorLight` | `'#ffffff'` | Background color.                           |

The builder defaults to error correction level `M` and automatically selects the data mode, version, and mask unless you pin them.

## Which output should I use?

| Output                      | Best for                                                           |
| --------------------------- | ------------------------------------------------------------------ |
| SVG                         | Crisp user-facing QR codes, emails, HTML, SSR, and static assets.  |
| Terminal text               | CLIs, logs, local checks, and snapshots.                           |
| Canvas                      | Browser drawing and pixel-based workflows.                         |
| Image element               | Browser DOM, CSS styling, accessibility, and PNG downloads.        |
| PNG `Buffer`                | Node.js files, API responses, email attachments, and integrations. |
| Angular or React components | Reactive framework rendering and component-level downloads.        |

## Documentation

- [Installation](https://qrcodesdk.dev/guides/installation/)
- [Customize QR codes](https://qrcodesdk.dev/guides/customize/)
- [Builder API](https://qrcodesdk.dev/libs/core/)
- [Renderers](https://qrcodesdk.dev/renderers/)
- [API reference](https://qrcodesdk.dev/reference/api/)
- [CLI](https://qrcodesdk.dev/guides/cli/)

## Workspace development

```sh
pnpm install
pnpm build
pnpm test
pnpm check-types
```

Run the documentation site locally:

```sh
pnpm --filter docs start
```
