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
  - ../reference/errors.md
  - ./troubleshooting.md
---

A center image covers some of the encoded modules. To keep the code readable:

- Use high error correction: `.errorCorrection('H')` or `errorCorrectionLevel: 'H'`.
- Start with a small image, around `size: 0.2` to `0.3`.
- Test the result with real scanners.

## Before you start

- Install the package for your output. See [Choose your setup](/getting-started/choose-your-setup/).
- Load the image yourself. QRCodeSDK does not fetch URLs or read files.
  - SVG and Node.js output take a file or bytes.
  - Browser output takes a same-origin or CORS-enabled image.
- Prefer a simple logo with a transparent or solid background. Photos and fine detail are hard to
  recognize at this size.

## Configure the center image

Create the center image with the factory for your output. This example embeds a small SVG logo as a
data URL:

```ts
import {type QRCodeDataImageURL, QRCodeSVGRenderer, qrcode, svgCenterImage} from '@qrcodesdk/core';

const logo: QRCodeDataImageURL = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="#e11d48"/></svg>',
)}`;

const svg = qrcode('https://qrcodesdk.dev')
  .errorCorrection('H')
  .render(
    QRCodeSVGRenderer({
      centerImage: svgCenterImage(logo, {size: 0.3, padding: 1, clearBackground: true}),
    }),
  );
```

All factories share these layout options:

| Option            | Default | Accepted value                                 | Meaning                                                      |
| ----------------- | ------: | ---------------------------------------------- | ------------------------------------------------------------ |
| `size`            |   `0.3` | finite number greater than `0` and at most `1` | Image box relative to matrix width, excluding the quiet zone |
| `padding`         |     `1` | non-negative finite number                     | Cleared space around the image, in modules                   |
| `clearBackground` |  `true` | `boolean`                                      | Removes every module the image or its padding touches        |

Factories validate these values when you call them. Invalid values throw `INVALID_OPTIONS`.

The image is scaled to fit the centered square. It is never cropped.

### How clearing works

- Clearing removes whole modules. The cleared area can be slightly larger than the image box plus
  padding.
- Finder and alignment patterns styled with `finder()` or `alignment()` are cleared as a unit. A
  pattern is only left out when every one of its modules is covered. A partly covered pattern is
  drawn in full, with the image on top.
- Alignment patterns without an `alignment()` style are ordinary modules. Covered modules are
  removed one by one.
- With `clearBackground: false`, the image is drawn on top of the modules and patterns.

### Pass the original value

Center-image values are opaque. Each one only works with the renderer from the same package as its
factory.

- Pass the value you got from the factory. Object spread, JSON, and `structuredClone()` copies don't
  work.
- Custom objects with rendering callbacks are not supported.
- A renderer silently ignores a value it doesn't recognize. See
  [The center image is missing](/guides/troubleshooting/#the-center-image-is-missing).

## Choose and prepare a source

| Output                                            | Factory                                         | Source type                 | Preparation                                                          |
| ------------------------------------------------- | ----------------------------------------------- | --------------------------- | -------------------------------------------------------------------- |
| Core SVG                                          | `svgCenterImage()` from `@qrcodesdk/core`       | `QRCodeDataImageURL`        | Convert bytes or a Blob to an embedded `data:image/...` URL          |
| Browser Canvas or PNG, WebP, GIF, and JPEG Images | `canvasCenterImage()` from `@qrcodesdk/browser` | loaded `CanvasImageSource`  | Decode an Image element, canvas, video frame, or `ImageBitmap` first |
| Node.js PNG, WebP, GIF, and JPEG Buffers          | `rasterCenterImage()` from `@qrcodesdk/node`    | PNG bytes in a `Uint8Array` | Read or download valid PNG bytes before rendering                    |

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

- In a browser, use `FileReader.readAsDataURL()` on a `Blob` or uploaded `File`.
- `svgCenterImage()` throws `INVALID_IMAGE_SOURCE` right away if the source is not an embedded
  `data:image/...` URL.

### Loaded browser image source

Browser renderers are synchronous, so decode the image first:

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

What can go wrong:

- **The image fails to load.** `image.decode()` rejects. Show the failure and offer a retry, as in
  [The center image fails to load](/guides/troubleshooting/#the-center-image-fails-to-load).
- **The image is not ready.** Unloaded or zero-sized sources throw `INVALID_IMAGE_SOURCE` when you
  render.
- **The image is cross-origin.** Rendering an Image element, exporting a Canvas, or creating a data
  URL needs an origin-clean Canvas. Use a same-origin image, or a CORS-enabled image loaded with the
  matching `crossOrigin` setting. Otherwise Image element rendering throws `RENDER_FAILED`. See
  [The canvas is tainted](/guides/troubleshooting/#the-canvas-is-tainted).

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

`rasterCenterImage()` accepts PNG bytes and decodes them once. Reuse the result across renders and
across the PNG, WebP, GIF, and JPEG renderers.

The output format affects the image:

- **PNG and WebP** keep soft transparent edges. Prefer them for logos.
- **GIF** reduces the image to at most 256 colors and binary transparency.
- **JPEG** suits photographic center images, because its lossy compression keeps photos small. The
  default quality is 92.

In JPEG output, transparent image pixels show the QR background, because the image is drawn on that
background before encoding. With the default opaque white background they stay white, whatever
`transparency.matte` is. The matte, white by default, only fills transparency that remains after
that, such as a transparent background color.

## Use prepared sources in framework components

Framework components don't load images for you. Load and decode the image in your application
state, then pass the options once it is ready.

- PNG, WebP, GIF, JPEG, and Canvas components take `canvasCenterImage()`.
- SVG components take `svgCenterImage()`.
- Import the factory from the same framework package as the component, so the component recognizes
  the value.

The examples render after a button press. They skip error handling to stay short. In production,
catch a failed `image.decode()`, keep showing the QR code without the image, and tell the user.

### React

In Next.js, create center images inside a Client Component. They cannot be passed from a Server
Component.

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

Test the QR code at the smallest size it will be shown. Test again after any screenshot, image
optimization, printing, or compression. Use several scanner apps and representative devices.

If scanning is unreliable, try these:

- Make the image smaller.
- Restore the padding and the four-module quiet zone.
- Increase the module size.
- Simplify curved styling.
- Shorten the payload.

## Caveats

- `rasterCenterImage()` accepts only PNG bytes, up to 16 MiB and 16,777,216 pixels.
- `svgCenterImage()` checks the data URL format, not the embedded image. Validate uploaded images
  before embedding them.
- GIF and JPEG change how the image looks. See
  [PNG bytes for Node.js raster output](#png-bytes-for-nodejs-raster-output).
- Next.js cannot pass center-image values from a Server Component to a Client Component.

For exact source constraints, see the [SVG](/reference/renderers/svg/),
[Canvas](/reference/renderers/canvas/), [Image element](/reference/renderers/image/), or
[PNG Buffer](/reference/renderers/png/#center-image) reference.

## Next step

Offer the result as a file with [Download or save](/guides/download-or-save/), or return it from a
server with [Serve a QR code](/guides/server-output/).
