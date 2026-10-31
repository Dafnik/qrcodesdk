---
title: Add a center image
description: Prepare image sources and configure their size, padding, and background clearing.
docType: guide

related:
  - ./customize.md
  - ../reference/renderers/svg.md
  - ../reference/renderers/canvas.md
  - ../reference/renderers/image.md
  - ../reference/renderers/png.mdx
---

A center image covers encoded modules. Use high error correction with `.errorCorrection('H')` or
`errorCorrectionLevel: 'H'`, start with a small image, and test the result with scanners.

## Configure the center image

Create the center image with the factory for your output:

```ts
import {QRCodeSVGRenderer, svgCenterImage} from '@qrcodesdk/core';

QRCodeSVGRenderer({
  centerImage: svgCenterImage(preparedSource, {size: 0.3, padding: 1, clearBackground: true}),
});
```

The factories share these layout options:

| Option            | Default | Accepted value                                 | Meaning                                                      |
| ----------------- | ------: | ---------------------------------------------- | ------------------------------------------------------------ |
| `size`            |   `0.4` | finite number greater than `0` and at most `1` | Image box relative to matrix width, excluding the quiet zone |
| `padding`         |     `1` | non-negative finite number                     | Cleared space around the image, in modules                   |
| `clearBackground` |  `true` | `boolean`                                      | Removes every module the image or its padding touches        |

The image fits inside the centered square without cropping. Clearing removes whole modules, so the
cleared area can be slightly larger than the image box plus padding. When clearing is enabled,
`finder()` and `alignment()` omit any whole pattern that overlaps the cleared area. Without clearing,
the image is drawn over the modules and patterns. Start with `size: 0.2` to `0.3` and increase it
only after testing.

Factories validate the layout when they are called and throw `INVALID_OPTIONS` for invalid values.
Renderers also throw `INVALID_OPTIONS` for a plain option object such as `{source, size}`; pass the
factory's result instead.

## Choose and prepare a source

| Output                             | Factory                                         | Source type                | Preparation                                                          |
| ---------------------------------- | ----------------------------------------------- | -------------------------- | -------------------------------------------------------------------- |
| Core SVG                           | `svgCenterImage()` from `@qrcodesdk/core`       | `QRCodeDataImageURL`       | Convert bytes or a Blob to an embedded `data:image/...` URL          |
| Browser Canvas or PNG-backed Image | `canvasCenterImage()` from `@qrcodesdk/browser` | loaded `CanvasImageSource` | Decode an Image element, canvas, video frame, or `ImageBitmap` first |
| Node.js PNG                        | `pngCenterImage()` from `@qrcodesdk/node`       | PNG `Buffer`               | Read or download valid PNG bytes before rendering                    |

Load files and URLs in your application before calling a factory.

### Embedded data URL for SVG

In Node.js, read the file and convert its bytes to a data URL:

```ts
import {readFile} from 'node:fs/promises';

import {type QRCodeDataImageURL, QRCodeSVGRenderer, qrcode, svgCenterImage} from '@qrcodesdk/core';

const bytes = await readFile('./logo.png');
const source = `data:image/png;base64,${bytes.toString('base64')}` as QRCodeDataImageURL;

const svg = qrcode('https://qrcodesdk.dev')
  .errorCorrection('H')
  .render(QRCodeSVGRenderer({centerImage: svgCenterImage(source, {size: 0.3})}));
```

In a browser, `FileReader.readAsDataURL()` prepares the same source type from a `Blob` or uploaded
`File`. `svgCenterImage()` throws `INVALID_IMAGE_SOURCE` immediately when the source is not an
embedded `data:image/...` URL.

### Loaded browser image source

Decode the image before calling the synchronous Canvas or Image renderer:

```ts
import {QRCodeCanvasRenderer, canvasCenterImage} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const source = new Image();
source.src = '/logo.png';
await source.decode();

const canvas = qrcode('https://qrcodesdk.dev')
  .errorCorrection('H')
  .render(QRCodeCanvasRenderer({centerImage: canvasCenterImage(source, {size: 0.3})}));
```

The source is checked when rendering: unloaded or zero-sized sources throw synchronously. When you
render an Image element, export a Canvas, or create a PNG data URL, the browser must also keep the
Canvas origin-clean. Use a same-origin image or a cross-origin image served with CORS permission and
loaded with the matching `crossOrigin` setting.

### PNG Buffer for Node.js

```ts
import {readFile} from 'node:fs/promises';

import {qrcode} from '@qrcodesdk/core';
import {QRCodePNGRenderer, pngCenterImage} from '@qrcodesdk/node';

const centerImage = pngCenterImage(await readFile('./logo.png'), {size: 0.3});
const png = qrcode('https://qrcodesdk.dev')
  .errorCorrection('H')
  .render(QRCodePNGRenderer({centerImage}));
```

`pngCenterImage()` accepts PNG bytes and decodes them once. Reuse its result across renders.

## Use prepared sources in framework components

React, Vue, Svelte, and Angular do not load image sources inside their QR components. Prepare
browser sources in application state, then pass stable options after decoding. Image and Canvas
components take `canvasCenterImage()`, and SVG components take `svgCenterImage()`. Every framework
package exports both factories, so import them from the same package as the component.

### React

```tsx
import {useState} from 'react';

import {QRCodeImage, type QRCodeImageOptions, canvasCenterImage} from '@qrcodesdk/react';

export function QRCodeWithLogo() {
  const [options, setOptions] = useState<QRCodeImageOptions>();

  async function loadLogo(url: string) {
    const image = new Image();
    image.src = url;
    await image.decode();
    setOptions({
      matrix: {errorCorrectionLevel: 'H'},
      centerImage: canvasCenterImage(image, {size: 0.3}),
    });
  }

  return options ? (
    <QRCodeImage payload="https://qrcodesdk.dev" options={options} />
  ) : (
    <button type="button" onClick={() => void loadLogo('/logo.png')}>
      Load logo
    </button>
  );
}
```

### Vue

```vue
<script setup lang="ts">
import {computed, shallowRef} from 'vue';

import {QRCodeImage, type QRCodeImageOptions, canvasCenterImage} from '@qrcodesdk/vue';

const source = shallowRef<HTMLImageElement>();
const options = computed<QRCodeImageOptions | undefined>(() =>
  source.value
    ? {
        matrix: {errorCorrectionLevel: 'H'},
        centerImage: canvasCenterImage(source.value, {size: 0.3}),
      }
    : undefined,
);

async function loadLogo(url: string) {
  const image = new Image();
  image.src = url;
  await image.decode();
  source.value = image;
}
</script>

<template>
  <QRCodeImage v-if="options" payload="https://qrcodesdk.dev" :options="options" />
  <button v-else type="button" @click="loadLogo('/logo.png')">Load logo</button>
</template>
```

### Svelte

```svelte
<script lang="ts">
  import {QRCodeImage, type QRCodeImageOptions, canvasCenterImage} from '@qrcodesdk/svelte';

  let source = $state<HTMLImageElement>();
  const options: QRCodeImageOptions | undefined = $derived(
    source
      ? {matrix: {errorCorrectionLevel: 'H'}, centerImage: canvasCenterImage(source, {size: 0.3})}
      : undefined,
  );

  async function loadLogo(url: string) {
    const image = new Image();
    image.src = url;
    await image.decode();
    source = image;
  }
</script>

{#if options}
  <QRCodeImage payload="https://qrcodesdk.dev" {options} />
{:else}
  <button type="button" onclick={() => loadLogo('/logo.png')}>Load logo</button>
{/if}
```

### Angular

```angular-ts
import {Component, signal} from '@angular/core';

import {QRCodeImage, type QRCodeImageOptions, canvasCenterImage} from '@qrcodesdk/angular';

@Component({
  selector: 'app-qrcode-with-logo',
  imports: [QRCodeImage],
  template: `
    @if (options(); as options) {
      <qrcode-image [options]="options" payload="https://qrcodesdk.dev" />
    } @else {
      <button (click)="loadLogo('/logo.png')" type="button">Load logo</button>
    }
  `,
})
export class QRCodeWithLogo {
  readonly options = signal<QRCodeImageOptions | undefined>(undefined);

  async loadLogo(url: string) {
    const image = new Image();
    image.src = url;
    await image.decode();
    this.options.set({
      matrix: {errorCorrectionLevel: 'H'},
      centerImage: canvasCenterImage(image, {size: 0.3}),
    });
  }
}
```

## Verify the result

Test the rendered or downloaded QR code at the smallest expected size. Test it again
after taking screenshots, optimizing images, printing, or compressing. Use several scanner apps
and representative devices. If scanning is unreliable, reduce the image, restore padding and the
four-module quiet zone, increase module size, simplify curved styling, or shorten the payload.

For exact source constraints, see the [SVG](/reference/renderers/svg/),
[Canvas](/reference/renderers/canvas/), [PNG-backed Image](/reference/renderers/image/), or
[PNG Buffer](/reference/renderers/png/) reference.
