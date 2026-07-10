# @qrcodesdk/angular

Angular components for rendering QRCodeSDK QR codes.

## Components

- `QRCodeSVG` renders a scalable SVG and supports SVG download.
- `QRCodeImage` renders a PNG-backed image element and supports PNG download.
- `QRCodeCanvas` renders a canvas element.

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

## Build

```bash
ng build
```

## Test

```bash
ng test
```
