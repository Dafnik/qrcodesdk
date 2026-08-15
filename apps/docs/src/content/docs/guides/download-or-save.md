---
title: Download or save a QR code as SVG or PNG
description: Choose SVG or PNG, trigger browser and framework downloads, export Canvas, or write files in Node.js.
docType: guide

related:
  - ../reference/renderers/index.mdx
  - ../reference/renderers/browser-downloads.mdx
  - ../packages/react.mdx
  - ../packages/angular.mdx
  - ../packages/cli.mdx
---

Choose the file format first, then use the workflow for the runtime that owns the output.

## Choose whether to download SVG or PNG

| Choose | When                                                                | Source output                                             |
| ------ | ------------------------------------------------------------------- | --------------------------------------------------------- |
| SVG    | The QR code must scale cleanly, stay editable, or remain text-based | SVG `string` from `@qrcodesdk/core`                       |
| PNG    | The destination requires raster bytes or a conventional image file  | Browser Image/Canvas, Node.js `Buffer`, or CLI PNG output |

Both formats support the same shared appearance. PNG has a fixed pixel size; choose `size` for the
smallest display or print resolution you need.

## Download in the browser

Wrap the renderer whose output you want to download:

```ts
import {QRCodeDownloadSVGRenderer} from '@qrcodesdk/browser';
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

qrcode('https://qrcodesdk.dev').render(
  QRCodeDownloadSVGRenderer({
    renderer: QRCodeSVGRenderer(),
    filename: 'qrcodesdk',
  }),
);
```

For PNG, use `QRCodeDownloadImageRenderer({renderer: QRCodeImageRenderer(), filename})`. Each helper
appends `.svg` or `.png` when needed, triggers a temporary link click, and returns `void`. Call it
from a user action when required by the browser. See the
[browser download reference](/reference/renderers/browser-downloads/) for the exact wrapper contract.

## Download from React

`QRCodeSVG` and `QRCodeImage` expose `download(filename?)` through a ref:

```tsx
import {useRef} from 'react';

import {QRCodeImage, type QRCodeDownloadHandle} from '@qrcodesdk/react';

export function DownloadQRCode() {
  const qrcode = useRef<QRCodeDownloadHandle>(null);

  return (
    <>
      <button type="button" onClick={() => qrcode.current?.download('qrcodesdk')}>
        Download PNG
      </button>
      <QRCodeImage ref={qrcode} data="https://qrcodesdk.dev" />
    </>
  );
}
```

`QRCodeCanvas` has no download handle; export its Canvas output manually or render `QRCodeImage` for
built-in PNG downloads.

## Download from Angular

Call `download(filename?)` on an SVG or Image component template reference:

```angular-html
<qrcode-svg #qrcodeSvg data="https://qrcodesdk.dev" />
<button (click)="qrcodeSvg.download('qrcodesdk')" type="button">Download SVG</button>

<qrcode-image #qrcodeImage data="https://qrcodesdk.dev" />
<button (click)="qrcodeImage.download('qrcodesdk')" type="button">Download PNG</button>
```

Angular's Canvas component also has no download method.

## Export a Canvas manually

Use `toBlob()` when you already need Canvas for drawing or compositing:

```ts
import {QRCodeCanvasRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const canvas = qrcode('https://qrcodesdk.dev').render(QRCodeCanvasRenderer());

canvas.toBlob((blob) => {
  if (!blob) return;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'qrcodesdk.png';
  link.click();
  URL.revokeObjectURL(url);
}, 'image/png');
```

## Save from Node.js

Write SVG text as UTF-8 or write the PNG `Buffer` directly:

```ts
import {writeFile} from 'node:fs/promises';

import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';
import {QRCodePNGRenderer} from '@qrcodesdk/node';

await writeFile('qrcode.svg', qrcode('SVG').render(QRCodeSVGRenderer()), 'utf8');
await writeFile('qrcode.png', qrcode('PNG').render(QRCodePNGRenderer()));
```

For shell scripts or CI, the [CLI](/packages/cli/) writes either format from `--output` without
application code.

## Next step

If the file is produced for an HTTP request rather than local storage, follow
[Serve a QR code](/guides/server-output/).
