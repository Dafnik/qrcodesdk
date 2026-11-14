---
title: Render QR codes in the browser
description: Choose SVG, Image, or Canvas output, insert it into the DOM, and keep browser-rendered QR codes accessible and responsive.
docType: guide

related:
  - ../packages/browser.mdx
  - ../reference/renderers/index.mdx
  - ../reference/renderers/svg.md
  - ../reference/renderers/canvas.md
  - ../reference/renderers/image.md
  - ./customize.md
  - ./download-or-save.md
  - ./troubleshooting.md
---

Render a QR code in the browser, add it to the page, and keep it accessible and sharp.

## Before you start

- Install `@qrcodesdk/core`. Image and Canvas output also need `@qrcodesdk/browser`. See
  [Choose your setup](/getting-started/choose-your-setup/).
- Run the code in the browser, after the DOM exists.
- Using React, Vue, Svelte, or Angular? Their
  [framework components](/getting-started/choose-your-setup/#choose-a-package) do this for you.
- Write a short label for the QR code, such as "Scan to open qrcodesdk.dev".

## Choose a browser output

| Output | Package              | Returns             | Best for                                                 |
| ------ | -------------------- | ------------------- | -------------------------------------------------------- |
| SVG    | `@qrcodesdk/core`    | `string`            | Inline markup that scales cleanly. The default choice.   |
| Image  | `@qrcodesdk/browser` | `HTMLImageElement`  | A regular `<img>` with `alt` text (PNG, WebP, GIF, JPEG) |
| Canvas | `@qrcodesdk/browser` | `HTMLCanvasElement` | Drawing, compositing, pixel access, or manual export     |

Start with SVG. It stays sharp at any size and needs no Canvas support. Pick Image or Canvas only
when the next browser API needs that element.

:::note[Client-side rendering]
Image and Canvas renderers need browser DOM APIs. In a server-rendered app, create them after
hydration, or render SVG on the server instead.
:::

## SVG string

`QRCodeSVGRenderer` returns complete SVG markup as a string, not a DOM node.

### Insert it into the DOM

```ts
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev').render(
  QRCodeSVGRenderer({
    accessibility: {ariaLabel: 'Scan to open qrcodesdk.dev'},
  }),
);

const container = document.querySelector('#qrcode');

if (container) {
  container.innerHTML = svg;
}
```

```html
<div id="qrcode"></div>
```

:::caution[Untrusted input]

- The renderer escapes label text and image URL attributes. The payload becomes modules, never
  text in the markup.
- Don't concatenate unescaped user input into the SVG or the HTML around it.
- `svgCenterImage()` checks the URL format, not the image inside it. Validate uploaded images
  before you turn them into data URLs.

:::

### Include it in browser-generated markup

You can also interpolate the string into HTML from a browser-side template:

```ts
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev').render(
  QRCodeSVGRenderer({
    accessibility: {ariaLabel: 'Scan to open qrcodesdk.dev'},
  }),
);

const html = `
  <section>
    <h2>Scan this QR code</h2>
    ${svg}
  </section>
`;
```

Style the inserted `<svg>` through its container:

```css
#qrcode > svg {
  display: block;
  width: min(100%, 20rem);
  height: auto;
}
```

## Image element

The Image renderers return a new `HTMLImageElement`. Its `src` holds the image as a data URL. Use
them when the QR code should behave like any other image.

Pick a renderer by file format:

| Renderer                  | Entry point               | Format                                          |
| ------------------------- | ------------------------- | ----------------------------------------------- |
| `QRCodePNGImageRenderer`  | `@qrcodesdk/browser/png`  | PNG, encoded by the browser                     |
| `QRCodeWebPImageRenderer` | `@qrcodesdk/browser/webp` | Lossless WebP, usually the smallest file        |
| `QRCodeGIFImageRenderer`  | `@qrcodesdk/browser/gif`  | GIF, 256 colors, on/off transparency            |
| `QRCodeJPEGImageRenderer` | `@qrcodesdk/browser/jpeg` | Lossy JPEG on a solid matte, for JPEG-only uses |

All four share the base options, such as `style`, `centerImage`, and `accessibility`. GIF adds
`transparency.threshold`, and JPEG adds `quality` and `transparency.matte`. Each format has its own
entry point, so your bundle only includes
the encoder you import. WebP, GIF, and JPEG use encoders bundled in the SDK, so they work in Safari
too. See the [Image element renderers reference](/reference/renderers/image/) for format details.

### Insert and style it

```ts
import {QRCodePNGImageRenderer} from '@qrcodesdk/browser/png';
import {qrcode} from '@qrcodesdk/core';

const image = qrcode('https://qrcodesdk.dev').render(
  QRCodePNGImageRenderer({
    accessibility: {
      alt: 'QR code: scan to open qrcodesdk.dev',
      title: 'Scan to open qrcodesdk.dev',
    },
  }),
);

image.className = 'qrcode';
document.querySelector('#qrcode')?.append(image);
```

```html
<div id="qrcode"></div>
```

```css
.qrcode {
  display: block;
  width: min(100%, 20rem);
  height: auto;
}
```

### Use the data URL

Read `src` when another browser API needs the encoded image. This example copies the QR code to
the clipboard:

```html
<button id="copy-qrcode" type="button">Copy QR code</button>
<p id="copy-status" role="status"></p>
```

```ts
import {QRCodePNGImageRenderer} from '@qrcodesdk/browser/png';
import {qrcode} from '@qrcodesdk/core';

const renderer = QRCodePNGImageRenderer();
const status = document.querySelector('#copy-status');

document.querySelector('#copy-qrcode')?.addEventListener('click', async () => {
  const image = qrcode('https://qrcodesdk.dev').render(renderer);

  try {
    // Call write() synchronously in the click handler and pass the Blob as a promise.
    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': fetch(image.src).then((response) => response.blob()),
      }),
    ]);
    if (status) status.textContent = 'QR code copied.';
  } catch {
    if (status) status.textContent = 'Copying failed. Download the QR code instead.';
  }
});
```

Clipboard rules to keep in mind:

- The Clipboard API needs a secure context and a user action, such as a click.
- Call `write()` right away. Safari rejects it if the handler awaits something first, so pass the
  Blob to `ClipboardItem` as a promise.
- Use PNG. It is the only image type browsers reliably accept on the clipboard.

## Canvas element

`QRCodeCanvasRenderer` returns a new `HTMLCanvasElement`. Use it to draw on the output, combine it
with other graphics, read pixels, or export it yourself.

### Insert it into the DOM

```ts
import {QRCodeCanvasRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const canvas = qrcode('https://qrcodesdk.dev').render(
  QRCodeCanvasRenderer({
    style: {moduleSize: 8, quietZone: 4},
    accessibility: {ariaLabel: 'Scan to open qrcodesdk.dev'},
  }),
);
document.querySelector('#qrcode')?.append(canvas);
```

```html
<div id="qrcode"></div>
```

### Draw it into another Canvas

Use the QR code Canvas as a source for a larger drawing:

```ts
import {QRCodeCanvasRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const qrCanvas = qrcode('https://qrcodesdk.dev').render(QRCodeCanvasRenderer());
const target = document.querySelector<HTMLCanvasElement>('#target');
const context = target?.getContext('2d');

if (target && context) {
  target.width = qrCanvas.width;
  target.height = qrCanvas.height;
  context.drawImage(qrCanvas, 0, 0);
}
```

## Replace a rendered QR code

Every render creates a new string or element. When the payload changes, render again and replace
the old output:

```ts
import {QRCodePNGImageRenderer} from '@qrcodesdk/browser/png';
import {qrcode} from '@qrcodesdk/core';

const container = document.querySelector('#qrcode');

export function updateQRCode(payload: string) {
  const image = qrcode(payload).render(
    QRCodePNGImageRenderer({accessibility: {alt: `QR code: scan to open ${payload}`}}),
  );

  container?.replaceChildren(image);
}
```

Render again only when the payload or options change, not on every state update.

## Label it

Give every meaningful QR code an accessible name:

- **SVG and Canvas:** set `accessibility.ariaLabel`. Without a label, they get
  `aria-hidden="true"`.
- **Image:** set `accessibility.alt`. Without it, the image gets an empty `alt` and counts as
  decorative.

Leave it unlabeled only when nearby content already explains it, such as a visible link to the same
URL. Don't combine an empty `alt` with `ariaLabel`.

## Size it responsively

Renderers set a fixed `width` and `height`. Let CSS shrink the output and keep it square:

```css
.qrcode-container {
  display: block;
  width: min(100%, 20rem);
}

.qrcode-container > :is(svg, img, canvas) {
  display: block;
  width: 100%;
  height: auto;
}
```

This CSS also works with framework components:

- **React:** pass `className="qrcode-container"`. It lands on the wrapper `<div>`.
- **Vue and Svelte:** pass `class="qrcode-container"`. It lands on the wrapper `<div>`.
- **Angular:** pass `class="qrcode-container"`. It lands on the host element, such as
  `<qrcode-svg>`.

See the component props on each package page, for example [React](/packages/react/#components) or
[Angular](/packages/angular/#components).

SVG stays sharp at any size. Image and Canvas output stays sharp only up to its pixel size. Set
`style.moduleSize` so the output is at least as wide as the largest CSS width × the device pixel
ratio (2 or 3 on most phones).

## Verify the result

1. Open the page and check that exactly one QR code appears in the container.
2. Scan it.
3. Check its accessible name in your browser's accessibility inspector or with a screen reader.

## Caveats

- Keep the default four-module quiet zone clear of text, borders, and other UI.
- Don't scale Image or Canvas output above its pixel size. Increase `style.moduleSize` instead.
- Renderers throw `QRCodeError` for payloads that don't fit and for invalid options. See the
  [errors reference](/reference/errors/).
- Shaped modules and center images can anti-alias slightly differently in each browser.
- Scan-test the final page at its smallest viewport, and after any CSS transforms, zoom,
  screenshots, or image compression.

## Next step

Let users save the QR code with [Download or save](/guides/download-or-save/), or style it with
[Customize appearance](/guides/customize/).
