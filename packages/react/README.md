# @qrcodesdk/react

React components for rendering QRCodeSDK QR codes.

## Components

- `SVGQRCode` renders a scalable SVG and supports SVG download.
- `ImageQRCode` renders a PNG-backed image element and supports PNG download.
- `CanvasQRCode` renders a canvas element.

```tsx
import {CanvasQRCode, ImageQRCode, SVGQRCode} from '@qrcodesdk/react';

export function App() {
  return (
    <>
      <SVGQRCode data="https://qrcodesdk.dev" />
      <ImageQRCode data="https://qrcodesdk.dev" />
      <CanvasQRCode data="https://qrcodesdk.dev" />
    </>
  );
}
```

## Build

```bash
pnpm build
```

## Test

```bash
pnpm test
```
