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
  - ../reference/renderers/webp.md
  - ../reference/renderers/gif.md
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
| `size`            |   `0.3` | finite number greater than `0` and at most `1` | Image box relative to matrix width, excluding the quiet zone |
| `padding`         |     `1` | non-negative finite number                     | Cleared space around the image, in modules                   |
| `clearBackground` |  `true` | `boolean`                                      | Removes every module the image or its padding touches        |

The image fits inside the centered square without cropping. Clearing removes whole modules, so the
cleared area can be slightly larger than the image box plus padding. When clearing is enabled,
`finder()` and `alignment()` omit any whole pattern that overlaps the cleared area. Without clearing,
the image is drawn over the modules and patterns. Start with `size: 0.2` to `0.3` and increase it
only after testing.

Factories check numeric layout constraints when they are called and throw `INVALID_OPTIONS` for
invalid values. TypeScript checks option types and requires the matching factory result.

Center-image values are opaque and belong to the factory that created them. Pass the original value
to the matching renderer. Copying it with object spread or JSON does not preserve it. Custom objects
with rendering callbacks are unsupported.

## Choose and prepare a source

| Output                                      | Factory                                         | Source type                 | Preparation                                                          |
| ------------------------------------------- | ----------------------------------------------- | --------------------------- | -------------------------------------------------------------------- |
| Core SVG                                    | `svgCenterImage()` from `@qrcodesdk/core`       | `QRCodeDataImageURL`        | Convert bytes or a Blob to an embedded `data:image/...` URL          |
| Browser Canvas or PNG, WebP, and GIF Images | `canvasCenterImage()` from `@qrcodesdk/browser` | loaded `CanvasImageSource`  | Decode an Image element, canvas, video frame, or `ImageBitmap` first |
| Node.js PNG, WebP, and GIF Buffers          | `rasterCenterImage()` from `@qrcodesdk/node`    | PNG bytes in a `Uint8Array` | Read or download valid PNG bytes before rendering                    |

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

Decode the image before calling the synchronous Canvas or Image element renderer:

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
render an Image element, export a Canvas, or create a data URL, the browser must also keep the
Canvas origin-clean. Use a same-origin image or a cross-origin image served with CORS permission and
loaded with the matching `crossOrigin` setting.

### PNG bytes for Node.js raster output

```ts
import {readFile} from 'node:fs/promises';

import {qrcode} from '@qrcodesdk/core';
import {QRCodePNGRenderer, QRCodeWebPRenderer, rasterCenterImage} from '@qrcodesdk/node';

const centerImage = rasterCenterImage(await readFile('./logo.png'), {size: 0.3});
const builder = qrcode('https://qrcodesdk.dev').errorCorrection('H');

const png = builder.render(QRCodePNGRenderer({centerImage}));
const webp = builder.render(QRCodeWebPRenderer({centerImage}));
```

`rasterCenterImage()` accepts PNG bytes and decodes them once. Reuse its result across renders and
across the PNG, WebP, and GIF renderers. GIF output reduces the image to at most 256 colors and
binary transparency, so prefer PNG or WebP for photographic logos or soft transparent edges.

## Use prepared sources in framework components

React, Vue, Svelte, and Angular do not load image sources inside their QR components. Prepare
browser sources in application state, then pass stable options after decoding. PNG, WebP, GIF, and
Canvas components take `canvasCenterImage()`, and SVG components take `svgCenterImage()`. Every framework
package exports both factories, so import them from the same package as the component.

### React

In Next.js, create center images inside a client component. They cannot be passed from a Server
Component to a Client Component.

```tsx
'use client';

import {useState} from 'react';

import {QRCodePNG, type QRCodePNGImageOptions, canvasCenterImage} from '@qrcodesdk/react';

export function QRCodeWithLogo() {
  const [options, setOptions] = useState<QRCodePNGImageOptions>();

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
    <QRCodePNG payload="https://qrcodesdk.dev" options={options} />
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

import {QRCodePNG, type QRCodePNGImageOptions, canvasCenterImage} from '@qrcodesdk/vue';

const source = shallowRef<HTMLImageElement>();
const options = computed<QRCodePNGImageOptions | undefined>(() =>
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
  <QRCodePNG v-if="options" payload="https://qrcodesdk.dev" :options="options" />
  <button v-else type="button" @click="loadLogo('/logo.png')">Load logo</button>
</template>
```

### Svelte

```svelte
<script lang="ts">
  import {QRCodePNG, type QRCodePNGImageOptions, canvasCenterImage} from '@qrcodesdk/svelte';

  let source = $state<HTMLImageElement>();
  const options: QRCodePNGImageOptions | undefined = $derived(
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
  <QRCodePNG payload="https://qrcodesdk.dev" {options} />
{:else}
  <button type="button" onclick={() => loadLogo('/logo.png')}>Load logo</button>
{/if}
```

### Angular

```angular-ts
import {Component, signal} from '@angular/core';

import {QRCodePNG, type QRCodePNGImageOptions, canvasCenterImage} from '@qrcodesdk/angular';

@Component({
  selector: 'app-qrcode-with-logo',
  imports: [QRCodePNG],
  template: `
    @if (options(); as options) {
      <qrcode-png [options]="options" payload="https://qrcodesdk.dev" />
    } @else {
      <button (click)="loadLogo('/logo.png')" type="button">Load logo</button>
    }
  `,
})
export class QRCodeWithLogo {
  readonly options = signal<QRCodePNGImageOptions | undefined>(undefined);

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
[Canvas](/reference/renderers/canvas/), [Image element](/reference/renderers/image/), or
[PNG Buffer](/reference/renderers/png/#center-image) reference.
