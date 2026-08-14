---
title: PNG-backed Image element renderer
description: Reference for rendering an HTMLImageElement backed by a PNG data URL with @qrcodesdk/browser.
docType: reference

related:
  - ../../packages/browser.mdx
  - ./canvas.md
  - ./browser-downloads.mdx
---

## When to use

Use `QRCodeImageRenderer` when browser code needs a CSS-customizable, accessible `HTMLImageElement`
rather than a drawing surface.

## Minimal example

```ts
import {QRCodeImageRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const image = qrcode('https://qrcodesdk.dev').render(
  QRCodeImageRenderer({alt: 'Scan to open qrcodesdk.dev'}),
);
```

## Return value

The renderer synchronously returns a new `HTMLImageElement`. Its `src` is a PNG data URL generated
from an intermediate Canvas element, and its width and height match that Canvas backing size.
`alt` is always set and defaults to an empty string.

## Renderer-specific options

The renderer accepts the [shared visual options](/guides/customize/#shared-visual-options), the same
prepared `image` overlay as the
[Canvas renderer](/reference/renderers/canvas/#renderer-specific-options), and these DOM attributes:

| Option      | Type     | Default     | Effect                                    |
| ----------- | -------- | ----------- | ----------------------------------------- |
| `alt`       | `string` | `''`        | Sets the Image element's `alt` property   |
| `ariaLabel` | `string` | `undefined` | Sets an `aria-label` attribute            |
| `title`     | `string` | `undefined` | Sets the Image element's `title` property |

## Renderer-specific constraints

:::caution[Browser-only output]
Create this renderer only where the DOM, Canvas 2D, and PNG `canvas.toDataURL()` APIs are available.
For server output, choose SVG or the Node.js PNG renderer.
:::

- Rendering is synchronous; center-image sources must already be loaded and have positive intrinsic
  dimensions.
- The PNG is encoded into the element's data URL. Use the
  [Canvas renderer](/reference/renderers/canvas/) when the next step needs direct drawing or
  `toBlob()` rather than an Image element.

## Use the Image element in a browser

### Insert and style it

The returned value is already an `HTMLImageElement`, so it can be appended and styled like any
other image:

```ts
import {QRCodeImageRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const image = qrcode('https://qrcodesdk.dev').render(
  QRCodeImageRenderer({
    alt: 'QR code for qrcodesdk.dev',
    ariaLabel: 'Scan to open qrcodesdk.dev',
    title: 'QR code for qrcodesdk.dev',
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

### Use the PNG data URL

Read `src` when another browser API needs the encoded PNG rather than the element:

```ts
import {QRCodeImageRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const image = qrcode('https://qrcodesdk.dev').render(QRCodeImageRenderer());
const response = await fetch(image.src);
const png = await response.blob();

await navigator.clipboard.write([
  new ClipboardItem({
    'image/png': png,
  }),
]);
```

The Clipboard API requires a secure context and may require a user gesture or permission.

## Related guides

- [Customize appearance](/guides/customize/) for shared styling, labels, and scan safety.
- [Add a center image](/guides/center-images/) for preparing a `CanvasImageSource`.
- [Download or save](/guides/download-or-save/) for PNG downloads.
