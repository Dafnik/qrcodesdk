# @qrcodesdk/angular

Angular components for rendering QRCodeSDK QR codes.

## Components

- `SVGQRCode` renders a scalable SVG and supports SVG download.
- `ImageQRCode` renders a PNG-backed image element and supports PNG download.
- `CanvasQRCode` renders a canvas element.

```ts
import {Component} from '@angular/core';

import {CanvasQRCode, ImageQRCode, SVGQRCode} from '@qrcodesdk/angular';

@Component({
  selector: 'app-root',
  imports: [SVGQRCode, ImageQRCode, CanvasQRCode],
  template: `
    <svg-qrcode data="https://qrcodesdk.dev" />
    <image-qrcode data="https://qrcodesdk.dev" />
    <canvas-qrcode data="https://qrcodesdk.dev" />
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
