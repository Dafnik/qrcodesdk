---
title: Add a center image
description: Prepare and add a scan-safe center image across SVG, browser, Node.js, React, Vue, and Angular output.
docType: guide

related:
  - ./customize.md
  - ../reference/renderers/svg.md
  - ../reference/renderers/canvas.md
  - ../reference/renderers/image.md
  - ../reference/renderers/png.mdx
---

A center image can brand a QR code, but it intentionally covers encoded modules. Prepare the source
before rendering, keep the overlay modest, and test the final artifact with real scanners.

## Prepare a logo or center image

- Start with a QR code that scans without an overlay.
- Choose the renderer and prepare the source type it accepts.
- Use high error correction for logo-style overlays: `.errorCorrection('H')` or
  `errorCorrectionLevel: 'H'`.

## Configure the overlay

Every visual renderer uses the same overlay geometry:

```ts
image: {
  source: preparedSource,
  size: 0.3,
  padding: 1,
  clearBackground: true,
}
```

| Option            | Default | Accepted value                                 | Meaning                                                      |
| ----------------- | ------: | ---------------------------------------------- | ------------------------------------------------------------ |
| `source`          |    none | renderer-specific prepared source              | Image content; required when `image` is set                  |
| `size`            |   `0.4` | finite number greater than `0` and at most `1` | Image box relative to matrix width, excluding the quiet zone |
| `padding`         |     `1` | non-negative finite number                     | Cleared space around the image, in modules                   |
| `clearBackground` |  `true` | `boolean`                                      | Replaces covered modules and padding with the light color    |

The source is centered and contained without cropping. `size: 1` is valid input, not a promise that
the result will scan. Start around `0.2`–`0.3`, preserve padding, and increase only after testing.

## Choose and prepare a source

| Output                             | Source type                                          | Preparation                                                          |
| ---------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| Core SVG                           | `QRCodeDataImageURL`                                 | Convert bytes or a Blob to an embedded `data:image/...` URL          |
| Browser Canvas or PNG-backed Image | loaded `CanvasImageSource`                           | Decode an Image element, canvas, video frame, or `ImageBitmap` first |
| Node.js PNG                        | PNG `Buffer`                                         | Read or download valid PNG bytes before rendering                    |
| React SVG                          | `QRCodeDataImageURL` in `options.image.source`       | Prepare outside render; memoize options when useful                  |
| React Image or Canvas              | loaded `CanvasImageSource` in `options.image.source` | Store the decoded source in state before mounting output             |
| Vue SVG                            | `QRCodeDataImageURL` in `options.image.source`       | Prepare before updating a ref or computed options                    |
| Vue Image or Canvas                | loaded `CanvasImageSource` in `options.image.source` | Store the decoded source in a `shallowRef` before mounting output    |
| Angular SVG                        | `QRCodeDataImageURL` in `[options]`                  | Prepare before updating the input                                    |
| Angular Image or Canvas            | loaded `CanvasImageSource` in `[options]`            | Store the decoded source in a signal before rendering output         |

QRCodeSDK never reads an image path or fetches a URL on your behalf.

### Embedded data URL for SVG

In Node.js, convert already-read bytes to an embedded image URL:

```ts
import {readFile} from 'node:fs/promises';

import {type QRCodeDataImageURL, QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

const bytes = await readFile('./logo.png');
const source = `data:image/png;base64,${bytes.toString('base64')}` as QRCodeDataImageURL;

const svg = qrcode('https://qrcodesdk.dev')
  .errorCorrection('H')
  .render(QRCodeSVGRenderer({image: {source, size: 0.3}}));
```

In a browser, `FileReader.readAsDataURL()` prepares the same source type from a `Blob` or uploaded
`File`.

### Loaded browser image source

Decode the image before calling the synchronous Canvas or Image renderer:

```ts
import {QRCodeCanvasRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const source = new Image();
source.src = '/logo.png';
await source.decode();

const canvas = qrcode('https://qrcodesdk.dev')
  .errorCorrection('H')
  .render(QRCodeCanvasRenderer({image: {source, size: 0.3}}));
```

Unloaded or zero-sized sources throw synchronously.

### PNG Buffer for Node.js

```ts
import {readFile} from 'node:fs/promises';

import {qrcode} from '@qrcodesdk/core';
import {QRCodePNGRenderer} from '@qrcodesdk/node';

const source = await readFile('./logo.png');
const png = qrcode('https://qrcodesdk.dev')
  .errorCorrection('H')
  .render(QRCodePNGRenderer({image: {source, size: 0.3}}));
```

The Node renderer accepts PNG bytes only. It decodes and alpha-composites the source in memory.

## Wire prepared sources into frameworks

React, Vue, and Angular do not load image sources inside their QR components. Prepare browser
sources in application state, then pass stable options after decoding.

```tsx
import {useState} from 'react';

import {QRCodeImage} from '@qrcodesdk/react';

export function QRCodeWithLogo() {
  const [source, setSource] = useState<HTMLImageElement>();

  async function loadLogo(url: string) {
    const image = new Image();
    image.src = url;
    await image.decode();
    setSource(image);
  }

  return source ? (
    <QRCodeImage
      data="https://qrcodesdk.dev"
      options={{errorCorrectionLevel: 'H', image: {source, size: 0.3}}}
    />
  ) : (
    <button type="button" onClick={() => void loadLogo('/logo.png')}>
      Load logo
    </button>
  );
}
```

```vue
<script setup lang="ts">
import {computed, shallowRef} from 'vue';

import type {QRCodeImageOptions} from '@qrcodesdk/browser';
import {QRCodeImage} from '@qrcodesdk/vue';

const source = shallowRef<HTMLImageElement>();
const options = computed<QRCodeImageOptions | undefined>(() =>
  source.value ? {errorCorrectionLevel: 'H', image: {source: source.value, size: 0.3}} : undefined,
);

async function loadLogo(url: string) {
  const image = new Image();
  image.src = url;
  await image.decode();
  source.value = image;
}
</script>

<template>
  <QRCodeImage v-if="options" data="https://qrcodesdk.dev" :options="options" />
  <button v-else type="button" @click="loadLogo('/logo.png')">Load logo</button>
</template>
```

```ts
import {Component, signal} from '@angular/core';

import {QRCodeImage} from '@qrcodesdk/angular';

@Component({
  selector: 'app-qrcode-with-logo',
  imports: [QRCodeImage],
  templateUrl: './qrcode-with-logo.html',
})
export class QRCodeWithLogo {
  readonly source = signal<HTMLImageElement | undefined>(undefined);

  async loadLogo(url: string) {
    const image = new Image();
    image.src = url;
    await image.decode();
    this.source.set(image);
  }
}
```

```angular-html
@if (source(); as image) {
  <qrcode-image
    [options]="{errorCorrectionLevel: 'H', image: {source: image, size: 0.3}}"
    data="https://qrcodesdk.dev" />
}
```

## Verify the result

Test the rendered or downloaded artifact—not only the preview—at the smallest expected size and
after taking screenshots, optimizing images, printing, or compressing. Test several scanner apps
and representative devices. If scanning is unreliable, reduce the image, restore padding and the
four-module quiet zone, increase module size, simplify curved styling, or shorten the payload.

For exact source constraints, see the [SVG](/reference/renderers/svg/),
[Canvas](/reference/renderers/canvas/), [PNG-backed Image](/reference/renderers/image/), or
[PNG Buffer](/reference/renderers/png/) reference.
