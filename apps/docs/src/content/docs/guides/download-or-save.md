---
title: Download or save a QR code as SVG, PNG, WebP, GIF, or JPEG
description: Choose SVG, PNG, WebP, GIF, or JPEG, trigger browser and framework downloads, export Canvas, or write files in Node.js.
docType: guide

related:
  - ../reference/renderers/index.mdx
  - ../reference/renderers/browser-downloads.mdx
  - ../reference/renderers/image.md
  - ../packages/react.mdx
  - ../packages/vue.mdx
  - ../packages/svelte.mdx
  - ../packages/angular.mdx
  - ../packages/cli.mdx
---

Pick a file format, then follow the section for your runtime or framework.

## Before you start

- Install the package for your runtime:
  - SVG: `@qrcodesdk/core` is enough.
  - Browser downloads: `@qrcodesdk/browser`, or your framework package.
  - Raster files in Node.js: `@qrcodesdk/node`.
- Trigger browser downloads from a user action, such as a button click. If a download does nothing,
  see [A download does nothing](/guides/troubleshooting/#a-download-does-nothing).

## Choose a file format

| Format | Pick it when                                                      | Available from                        |
| ------ | ----------------------------------------------------------------- | ------------------------------------- |
| SVG    | It must scale cleanly, stay editable, or stay text                | `@qrcodesdk/core` (`string`)          |
| PNG    | You need raster bytes with the widest support                     | Browser Image or Canvas, Node.js, CLI |
| WebP   | The destination accepts WebP and file size matters                | Browser Image, Node.js, CLI           |
| GIF    | The destination only accepts GIF                                  | Browser Image, Node.js, CLI           |
| JPEG   | The destination only accepts JPEG, or the center image is a photo | Browser Image, Node.js, CLI           |

All formats take the same styling options. The differences:

- **WebP** is lossless and usually much smaller than PNG.
- **GIF** has 256 colors and on/off transparency. Prefer PNG or WebP for transparent backgrounds
  and photo center images.
- **JPEG** is lossy and has no transparency. Transparent pixels blend onto a matte color, white by
  default. Plain QR codes are much larger as JPEG than as PNG or WebP.

Raster formats have a fixed pixel size: `moduleSize × (matrix width + 2 × quietZone)`. Set
`style.moduleSize` high enough for your largest display or print size. See
[Size a file for print](#size-a-file-for-print).

## Download in the browser

Wrap the renderer whose output you want to download. For SVG:

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

For a raster file, wrap an Image renderer with `QRCodeDownloadImageRenderer()`:

```ts
import {QRCodeDownloadImageRenderer} from '@qrcodesdk/browser/image';
import {QRCodePNGImageRenderer} from '@qrcodesdk/browser/png';
import {qrcode} from '@qrcodesdk/core';

qrcode('https://qrcodesdk.dev').render(
  QRCodeDownloadImageRenderer({
    renderer: QRCodePNGImageRenderer(),
    filename: 'qrcodesdk',
  }),
);
```

- For WebP, GIF, or JPEG, pass `QRCodeWebPImageRenderer()`, `QRCodeGIFImageRenderer()`, or
  `QRCodeJPEGImageRenderer()` instead.
- The helper adds the file extension when it is missing.
- It clicks a temporary link and returns `void`.

See the [browser download reference](/reference/renderers/browser-downloads/) for all options and
filename rules.

## Download from React

`QRCodeSVG`, `QRCodePNG`, `QRCodeWebP`, `QRCodeGIF`, and `QRCodeJPEG` expose `download(filename?)`
through a ref:

```tsx
import {useRef} from 'react';

import {type QRCodeDownloadHandle, QRCodePNG} from '@qrcodesdk/react';

export function DownloadQRCode() {
  const qrcode = useRef<QRCodeDownloadHandle>(null);

  return (
    <>
      <button type="button" onClick={() => qrcode.current?.download('qrcodesdk')}>
        Download PNG
      </button>
      <QRCodePNG ref={qrcode} payload="https://qrcodesdk.dev" />
    </>
  );
}
```

## Download from Vue

Call `download(filename?)` through a template ref on an SVG, PNG, WebP, GIF, or JPEG component:

```vue
<script setup lang="ts">
import {ref} from 'vue';

import {type QRCodeDownloadHandle, QRCodePNG} from '@qrcodesdk/vue';

const qrcode = ref<QRCodeDownloadHandle | null>(null);
</script>

<template>
  <button type="button" @click="qrcode?.download('qrcodesdk')">Download PNG</button>
  <QRCodePNG ref="qrcode" payload="https://qrcodesdk.dev" />
</template>
```

## Download from Svelte

Call `download(filename?)` on an SVG, PNG, WebP, GIF, or JPEG component bound with `bind:this`:

```svelte
<script lang="ts">
  import {type QRCodeDownloadHandle, QRCodePNG} from '@qrcodesdk/svelte';

  let qrcode: QRCodeDownloadHandle | undefined;
</script>

<button type="button" onclick={() => qrcode?.download('qrcodesdk')}>Download PNG</button>
<QRCodePNG bind:this={qrcode} payload="https://qrcodesdk.dev" />
```

## Download from Angular

Call `download(filename?)` through a template reference on an SVG, PNG, WebP, GIF, or JPEG
component:

```angular-html
<qrcode-svg #qrcodeSvg payload="https://qrcodesdk.dev" />
<button (click)="qrcodeSvg.download('qrcodesdk')" type="button">Download SVG</button>

<qrcode-png #qrcodePng payload="https://qrcodesdk.dev" />
<button (click)="qrcodePng.download('qrcodesdk')" type="button">Download PNG</button>

<qrcode-webp #qrcodeWebp payload="https://qrcodesdk.dev" />
<button (click)="qrcodeWebp.download('qrcodesdk')" type="button">Download WebP</button>
```

## Export a Canvas manually

Already using Canvas for drawing? Export it with `toBlob()`:

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
  // Some browsers start the download asynchronously; revoking at once can cancel it.
  setTimeout(() => URL.revokeObjectURL(url), 40_000);
}, 'image/png');
```

The 40-second delay matches the SDK's own SVG download helper.

If a cross-origin center image tainted the Canvas, `toBlob()` throws a `SecurityError`. See
[The canvas is tainted](/guides/troubleshooting/#the-canvas-is-tainted).

## Save from Node.js

Write SVG as UTF-8 text. Write PNG, WebP, GIF, and JPEG `Buffer`s as they are:

```ts
import {writeFile} from 'node:fs/promises';

import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';
import {
  QRCodeGIFRenderer,
  QRCodeJPEGRenderer,
  QRCodePNGRenderer,
  QRCodeWebPRenderer,
} from '@qrcodesdk/node';

await writeFile('qrcode.svg', qrcode('SVG').render(QRCodeSVGRenderer()), 'utf8');
await writeFile('qrcode.png', qrcode('PNG').render(QRCodePNGRenderer()));
await writeFile('qrcode.webp', qrcode('WebP').render(QRCodeWebPRenderer()));
await writeFile('qrcode.gif', qrcode('GIF').render(QRCodeGIFRenderer()));
await writeFile('qrcode.jpg', qrcode('JPEG').render(QRCodeJPEGRenderer()));
```

`writeFile()` overwrites existing files. It fails if the parent directory doesn't exist.

### From the command line

In shell scripts or CI, the [CLI](/packages/cli/) writes all these formats with `--output`, no code
needed. For raster files, pass `--module-size 8 --quiet-zone 4`, because the CLI defaults to one
pixel per module.

## Size a file for print

Prefer SVG for print. It has no pixel size, so you set the printed width in your layout tool.

For a raster file, work out `style.moduleSize` from the printed width and the printer resolution.
Example: 30 mm wide at 300 DPI.

1. Read the matrix width for your payload and matrix options:
   `qrcode('https://qrcodesdk.dev').matrix().size` is `25` modules.
2. Add the quiet zone on both sides: `25 + 2 × 4 = 33` modules.
3. Convert the printed width to pixels: `30 ÷ 25.4 × 300 ≈ 354` pixels.
4. Divide and round **up**: `354 ÷ 33 ≈ 10.7`, so use `moduleSize: 11`.

```ts
import {qrcode} from '@qrcodesdk/core';
import {QRCodePNGRenderer} from '@qrcodesdk/node';

const png = qrcode('https://qrcodesdk.dev').render(
  QRCodePNGRenderer({style: {moduleSize: 11, quietZone: 4}}),
);
```

The file is `11 × 33 = 363` pixels wide. Placed at 30 mm, it prints at about 307 DPI, with modules
about 0.9 mm wide. Rounding down would drop below 300 DPI.

Longer payloads have more modules, so each module gets smaller at the same width. Print a test copy
at final size and scan it with several phones, from your readers' distance. If it scans slowly:

- print it larger,
- shorten the payload, or
- remove the center image.

## Verify the result

1. Open the saved file in an image viewer.
2. Check that the file extension matches the format.
3. Scan it at the size you will display or print it.

## Next step

Producing the file for an HTTP request instead? Follow [Serve a QR code](/guides/server-output/).
