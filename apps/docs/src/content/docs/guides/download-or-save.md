---
title: Download or save a QR code as SVG, PNG, WebP, or GIF
description: Choose SVG, PNG, WebP, or GIF, trigger browser and framework downloads, export Canvas, or write files in Node.js.
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

## Choose a file format

| Choose | When                                                                     | Source output                                             |
| ------ | ------------------------------------------------------------------------ | --------------------------------------------------------- |
| SVG    | The QR code must scale cleanly, stay editable, or remain text-based      | SVG `string` from `@qrcodesdk/core`                       |
| PNG    | The destination requires raster bytes or the most widely supported image | Browser Image/Canvas, Node.js `Buffer`, or CLI PNG output |
| WebP   | The destination accepts WebP and a small lossless raster file matters    | Browser Image, Node.js `Buffer`, or CLI WebP output       |
| GIF    | The destination only accepts GIF                                         | Browser Image, Node.js `Buffer`, or CLI GIF output        |

All formats support the same styling options. WebP is lossless and usually much smaller than PNG.
GIF is limited to 256 colors and binary transparency, so prefer PNG or WebP for transparent
backgrounds and photographic center images.

Raster formats have a fixed pixel size. Set `style.moduleSize` to provide enough pixels for the
largest display or print size you need. The image width and height are
`moduleSize × (matrix width + 2 × quietZone)`.

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

Pass `QRCodeWebPImageRenderer()` or `QRCodeGIFImageRenderer()` instead for WebP or GIF files. Each
helper appends `.svg`, `.png`, `.webp`, or `.gif` when needed, triggers a temporary link click, and
returns `void`. Call it from a user action when required by the browser. See the
[browser download reference](/reference/renderers/browser-downloads/) for options and filename handling.

## Download from React

`QRCodeSVG`, `QRCodePNG`, `QRCodeWebP`, and `QRCodeGIF` expose `download(filename?)` through a ref:

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

Call `download(filename?)` through an SVG, PNG, WebP, or GIF component template ref:

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

Call `download(filename?)` through an SVG, PNG, WebP, or GIF component bound with `bind:this`:

```svelte
<script lang="ts">
  import {type QRCodeDownloadHandle, QRCodePNG} from '@qrcodesdk/svelte';

  let qrcode: QRCodeDownloadHandle | undefined;
</script>

<button type="button" onclick={() => qrcode?.download('qrcodesdk')}>Download PNG</button>
<QRCodePNG bind:this={qrcode} payload="https://qrcodesdk.dev" />
```

## Download from Angular

Call `download(filename?)` on an SVG, PNG, WebP, or GIF component template reference:

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
  URL.revokeObjectURL(url);
}, 'image/png');
```

## Save from Node.js

Write SVG text as UTF-8 or write a PNG, WebP, or GIF `Buffer` directly:

```ts
import {writeFile} from 'node:fs/promises';

import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';
import {QRCodeGIFRenderer, QRCodePNGRenderer, QRCodeWebPRenderer} from '@qrcodesdk/node';

await writeFile('qrcode.svg', qrcode('SVG').render(QRCodeSVGRenderer()), 'utf8');
await writeFile('qrcode.png', qrcode('PNG').render(QRCodePNGRenderer()));
await writeFile('qrcode.webp', qrcode('WebP').render(QRCodeWebPRenderer()));
await writeFile('qrcode.gif', qrcode('GIF').render(QRCodeGIFRenderer()));
```

For shell scripts or CI, the [CLI](/packages/cli/) writes any of these formats from `--output`
without application code.

## Next step

If the file is produced for an HTTP request rather than local storage, follow
[Serve a QR code](/guides/server-output/).
