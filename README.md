# QRCodeSDK

QRCodeSDK keeps QR code generation separate from presentation. Start with `qrcode()`, then output SVG, PNG, Canvas, image elements, terminal text, matrix data, or your own custom renderer.

## Package guide

| Package                                                     | Install when you need                                 | Outputs                                                |
| ----------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------ |
| [`@qrcodesdk/core`](https://qrcodesdk.dev/libs/core/)       | Runtime-neutral generation and common output formats. | SVG strings, terminal text strings, raw matrices.      |
| [`@qrcodesdk/cli`](https://qrcodesdk.dev/guides/cli/)       | Command line generation from terminals and scripts.   | Terminal text, SVG files, PNG files.                   |
| [`@qrcodesdk/browser`](https://qrcodesdk.dev/libs/browser/) | DOM elements and client-side browser workflows.       | `HTMLCanvasElement`, `HTMLImageElement`, downloads.    |
| [`@qrcodesdk/node`](https://qrcodesdk.dev/libs/node/)       | Server-side PNG generation in Node.js.                | PNG `Buffer`.                                          |
| [`@qrcodesdk/angular`](https://qrcodesdk.dev/libs/angular/) | Angular components & download helpers.                | `QRCodeSVG`, `QRCodeImage`, `QRCodeCanvas`, downloads. |
| [`@qrcodesdk/react`](https://qrcodesdk.dev/libs/react/)     | React components & download helpers.                  | `QRCodeSVG`, `QRCodeImage`, `QRCodeCanvas`, downloads. |

## Install

Start with Core for runtime-neutral SVG, terminal text, or matrix output.

```sh
npm install @qrcodesdk/core
```

Add the renderer package for your runtime:

```sh
npm install @qrcodesdk/core @qrcodesdk/browser
npm install @qrcodesdk/core @qrcodesdk/node
```

Framework packages use the same Core and Browser renderers:

```sh
npm install @qrcodesdk/angular @qrcodesdk/core @qrcodesdk/browser
npm install @qrcodesdk/react @qrcodesdk/core @qrcodesdk/browser
```

## Quick starts

### SVG in any JavaScript runtime

```ts
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev').render(QRCodeSVGRenderer());
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

## Documentation

- [Installation](https://qrcodesdk.dev/guides/installation/)
- [Customize QR codes](https://qrcodesdk.dev/guides/customize/)
- [Builder API](https://qrcodesdk.dev/libs/core/)
- [CLI](https://qrcodesdk.dev/guides/cli/)

## Workspace development

```sh
pnpm install
pnpm check
pnpm build
pnpm test
pnpm check-types
pnpm lint
pnpm format
pnpm cspell
```

Run the documentation site locally:

```sh
pnpm turbo run start --filter=docs
```
