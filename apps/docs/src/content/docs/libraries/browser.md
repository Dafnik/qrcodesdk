---
title: '@qrcodesdk/browser'
description: Add Canvas and Image element output for browser apps.
---

`@qrcodesdk/browser` adds renderers that depend on browser DOM APIs. Use it with `@qrcodesdk/core` when your output should be an element created in the browser.

## Install

```sh
pnpm add @qrcodesdk/core @qrcodesdk/browser
```

## Render an image element

```ts
import {ImageQRCodeRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const image = qrcode('https://qrcodesdk.dev').render(
  ImageQRCodeRenderer({
    alt: 'QR code for qrcodesdk.dev',
  }),
);

document.body.append(image);
```

## Render a canvas element

```ts
import {CanvasQRCodeRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const canvas = qrcode('https://qrcodesdk.dev').render(CanvasQRCodeRenderer());

document.body.append(canvas);
```

## Use it for

- appending QR codes directly to a browser page
- styling image elements with CSS
- drawing QR codes into canvas workflows
- creating client-side PNG downloads

## Package boundary

`@qrcodesdk/browser` does not replace `@qrcodesdk/core`. The core package still provides `qrcode()`, matrix generation, builder options, and shared styling normalization.

## Related pages

- [Installation](/guides/installation/)
- [Render to Canvas](/renderers/browser/canvas/)
- [Render to an Image Element](/renderers/browser/image/)
- [Customize QR Codes](/guides/customize/)
