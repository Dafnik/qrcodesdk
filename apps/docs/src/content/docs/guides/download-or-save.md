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

Choose the file format first, then follow the instructions for your runtime or framework.

## Before you start

- Install the package for your runtime: `@qrcodesdk/browser` for browser downloads,
  `@qrcodesdk/node` for raster files in Node.js, or your framework package. SVG needs only
  `@qrcodesdk/core`.
- Browser downloads must run from a user action, such as a button click, when the browser requires
  one. If a download does nothing, see
  [A download does nothing](/guides/troubleshooting/#a-download-does-nothing).

## Choose a file format

| Choose | When                                                                     | Source output                                             |
| ------ | ------------------------------------------------------------------------ | --------------------------------------------------------- |
| SVG    | The QR code must scale cleanly, stay editable, or remain text-based      | SVG `string` from `@qrcodesdk/core`                       |
| PNG    | The destination requires raster bytes or the most widely supported image | Browser Image/Canvas, Node.js `Buffer`, or CLI PNG output |
| WebP   | The destination accepts WebP and a small lossless raster file matters    | Browser Image, Node.js `Buffer`, or CLI WebP output       |
| GIF    | The destination only accepts GIF                                         | Browser Image, Node.js `Buffer`, or CLI GIF output        |
| JPEG   | The destination only accepts JPEG, or the center image is a photo        | Browser Image, Node.js `Buffer`, or CLI JPEG output       |

All formats support the same styling options. WebP is lossless and usually much smaller than PNG.
GIF is limited to 256 colors and binary transparency, so prefer PNG or WebP for transparent
backgrounds and photographic center images. JPEG is lossy and has no transparency. It blends
transparent pixels onto a matte color, white by default. Plain QR codes are much larger as JPEG than
as PNG or WebP.

Raster formats have a fixed pixel size. Set `style.moduleSize` to provide enough pixels for the
largest display or print size you need. The image width and height are
`moduleSize × (matrix width + 2 × quietZone)`. See [Size a file for print](#size-a-file-for-print).

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

For a raster file, wrap an Image element renderer with `QRCodeDownloadImageRenderer()`:

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

Pass `QRCodeWebPImageRenderer()`, `QRCodeGIFImageRenderer()`, or `QRCodeJPEGImageRenderer()` instead
for WebP, GIF, or JPEG files. Each helper appends `.svg`, `.png`, `.webp`, `.gif`, or `.jpg` when
needed. A JPEG filename that already ends with `.jpeg` keeps that extension. The helper triggers a
temporary link click and returns `void`. Call it from a user action when the browser requires one.
See the
[browser download reference](/reference/renderers/browser-downloads/) for options and filename handling.

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

Call `download(filename?)` through an SVG, PNG, WebP, GIF, or JPEG component template ref:

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

Call `download(filename?)` through an SVG, PNG, WebP, GIF, or JPEG component bound with
`bind:this`:

```svelte
<script lang="ts">
  import {type QRCodeDownloadHandle, QRCodePNG} from '@qrcodesdk/svelte';

  let qrcode: QRCodeDownloadHandle | undefined;
</script>

<button type="button" onclick={() => qrcode?.download('qrcodesdk')}>Download PNG</button>
<QRCodePNG bind:this={qrcode} payload="https://qrcodesdk.dev" />
```

## Download from Angular

Call `download(filename?)` on an SVG, PNG, WebP, GIF, or JPEG component template reference:

```angular-html
<qrcode-svg #qrcodeSvg payload="https://qrcodesdk.dev" />
<button (click)="qrcodeSvg.download('qrcodesdk')" type="button">Download SVG</button>

<qrcode-png #qrcodePng payload="https://qrcodesdk.dev" />
<button (click)="qrcodePng.download('qrcodesdk')" type="button">Download PNG</button>

<qrcode-webp #qrcodeWebp payload="https://qrcodesdk.dev" />
<button (click)="qrcodeWebp.download('qrcodesdk')" type="button">Download WebP</button>
```

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
  // Some browsers start the download asynchronously; revoking at once can cancel it.
  setTimeout(() => URL.revokeObjectURL(url), 40_000);
}, 'image/png');
```

The 40-second delay matches the SDK's own SVG download helper. `toBlob()` throws a `SecurityError`
when a cross-origin center image tainted the Canvas; see
[The canvas is tainted](/guides/troubleshooting/#the-canvas-is-tainted).

## Save from Node.js

Write SVG text as UTF-8 or write a PNG, WebP, GIF, or JPEG `Buffer` directly:

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

`writeFile()` overwrites an existing file and fails when the parent directory does not exist.

For shell scripts or CI, the [CLI](/packages/cli/) writes any of these formats from `--output`
without application code. Pass `--module-size 8 --quiet-zone 4` for raster files, because the CLI
defaults to one pixel per module.

## Size a file for print

Prefer SVG for print. It has no pixel size, so set the printed width in your layout tool. For a
raster file, calculate `style.moduleSize` from the printed width and the printer's resolution:

1. Generate the matrix with the same payload and matrix options, and read its width:
   `qrcode('https://qrcodesdk.dev').matrix().size` is `25` modules.
2. Add the quiet zone on both sides: `25 + 2 × 4 = 33` modules across.
3. Convert the printed width, including the quiet zone, to pixels: 30 mm at 300 DPI is
   `30 ÷ 25.4 × 300 ≈ 354` pixels.
4. Divide and round up, so every module covers whole pixels: `354 ÷ 33 ≈ 10.7`, so use
   `moduleSize: 11`.

```ts
import {qrcode} from '@qrcodesdk/core';
import {QRCodePNGRenderer} from '@qrcodesdk/node';

const png = qrcode('https://qrcodesdk.dev').render(
  QRCodePNGRenderer({style: {moduleSize: 11, quietZone: 4}}),
);
```

The file is `11 × 33 = 363` pixels wide. Place it at 30 mm in the layout, which prints it at about
307 DPI, and each module is about 0.9 mm wide. Rounding down instead would print below 300 DPI.

Longer payloads have more modules, so the same printed width gives smaller modules. Print a test copy
at the final size and scan it with several phones from the distance your readers will use. If it
scans slowly, print it larger, shorten the payload, or remove a center image.

## Verify the result

Open the saved file in an image viewer and scan it at the size you will display or print it. Check
that the file extension matches the format.

## Next step

If the file is produced for an HTTP request rather than local storage, follow
[Serve a QR code](/guides/server-output/).
