# @qrcodesdk/react

React components for rendering QRCodeSDK QR codes.

## Components

- `QRCodeSVG` renders a scalable SVG and supports SVG download.
- `QRCodeImage` renders a PNG-backed image element and supports PNG download.
- `QRCodeCanvas` renders a canvas element.

```tsx
import {QRCodeCanvas, QRCodeImage, QRCodeSVG} from '@qrcodesdk/react';

export function App() {
  return (
    <>
      <QRCodeSVG data="https://qrcodesdk.dev" />
      <QRCodeImage data="https://qrcodesdk.dev" />
      <QRCodeCanvas data="https://qrcodesdk.dev" />
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
