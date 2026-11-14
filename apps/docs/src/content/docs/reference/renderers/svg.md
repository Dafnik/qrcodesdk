---
title: SVG string renderer
description: Reference for rendering a scalable SVG string with QRCodeSVGRenderer from @qrcodesdk/core.
docType: reference

related:
  - ../../packages/core.mdx
  - ./browser-downloads.mdx
---

## When to use

Use `QRCodeSVGRenderer` for scalable output in web pages, print, generated assets, or HTTP
responses. It is the recommended default whenever the destination accepts SVG.

- Output stays sharp at every size.
- It needs no browser or Node.js APIs.

For email, render a PNG with the [PNG Buffer renderer](/reference/renderers/png/) instead. SVG
support varies between email clients.

## Minimal example

```ts
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev').render(QRCodeSVGRenderer());
```

To insert the SVG into a page, see
[Render QR codes in the browser](/guides/browser-usage/#svg-string).

## Styled example

```ts
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';
import {circle, finder, rounded} from '@qrcodesdk/core/style';

const svg = qrcode('https://qrcodesdk.dev').render(
  QRCodeSVGRenderer({
    style: {
      moduleSize: 8,
      foreground: '#0f172a',
      modules: rounded(),
      finder: finder({ring: rounded({radius: 1}), center: circle(), color: '#e11d48'}),
    },
  }),
);
```

See [Customize appearance](/guides/customize/) for every color, shape, and finder option.

## Return value

The renderer returns a complete SVG `string`:

- It has an explicit `width`, `height`, and `viewBox`.
- It draws the background and one even-odd `<path>` per color. RGBA colors set `fill-opacity`.
- With only square modules and patterns, it sets `shape-rendering="crispEdges"`. Shaped styles,
  including custom shapes, omit that hint.
- A center image is an `<image>` element drawn after the modules. Cleared modules are left out of
  the paths.

Accessibility depends on the labels you pass:

- A non-blank `ariaLabel` or `title` adds `role="img"`.
- Without either, the SVG is decorative. It gets `aria-hidden="true"`, so assistive technology
  skips it.

Label every QR code unless nearby content already explains it.

## Options

| Option                    | Type                   | Default         | Effect                                           |
| ------------------------- | ---------------------- | --------------- | ------------------------------------------------ |
| `style`                   | `QRCodeVisualStyle`    | shared defaults | Applies graphical dimensions, colors, and shapes |
| `accessibility.ariaLabel` | `string`               | `undefined`     | Sets `aria-label` and `role="img"`               |
| `accessibility.title`     | `string`               | `undefined`     | Adds a child `<title>` and `role="img"`          |
| `centerImage`             | `QRCodeSVGCenterImage` | `undefined`     | Embeds a center image from `svgCenterImage()`    |

`QRCodeSVGRendererOptions` accepts only these keys.

## Center image

Create the `centerImage` value with `svgCenterImage(source, layout?)` from `@qrcodesdk/core`:

```ts
import {QRCodeSVGRenderer, qrcode, svgCenterImage} from '@qrcodesdk/core';

// A red circle with a viewBox, so it scales to the image box.
const logo =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMCAxMCI+PGNpcmNsZSBjeD0iNSIgY3k9IjUiIHI9IjUiIGZpbGw9IiNlMTFkNDgiLz48L3N2Zz4=';
const svg = qrcode('https://qrcodesdk.dev')
  .errorCorrection('H')
  .render(QRCodeSVGRenderer({centerImage: svgCenterImage(logo, {size: 0.3})}));
```

| Parameter                | Type                 | Default  | Effect                                                |
| ------------------------ | -------------------- | -------- | ----------------------------------------------------- |
| `source`                 | `QRCodeDataImageURL` | required | Embeds a prepared `data:image/...` URL                |
| `layout.size`            | `number`             | `0.3`    | Image box as a fraction of matrix width               |
| `layout.padding`         | `number`             | `1`      | Cleared border around the image, in modules           |
| `layout.clearBackground` | `boolean`            | `true`   | Removes every module the image or its padding touches |

## Constraints

- **Escaping.** The renderer escapes label text and image URL attributes. The payload becomes QR
  modules, never HTML. Still, never concatenate unescaped user input into the returned SVG.
- **Center image source.** `svgCenterImage()` requires a non-empty embedded image data URL. It
  throws `INVALID_IMAGE_SOURCE` otherwise, and never reads paths or fetches remote URLs.
- **Uploaded images.** `svgCenterImage()` checks the URL format, not the embedded image. Validate
  uploads before you create the data URL.
- **Center image layout.** `size` must be finite, greater than `0`, and at most `1`. `padding` must
  be finite and non-negative. `svgCenterImage()` validates both when it is called.
- **Labels.** `ariaLabel` and `title` must contain only characters that XML allows. Control
  characters other than tab, line feed, and carriage return throw `QRCodeError` with code
  `INVALID_OPTIONS` when `QRCodeSVGRenderer()` is called. `details.field` is
  `accessibility.ariaLabel` or `accessibility.title`.
- **No `alt`.** SVG does not accept `accessibility.alt`. Use `ariaLabel` and, optionally, `title`.
- **Option checks.** TypeScript rejects unknown keys and checks that `centerImage` comes from
  `svgCenterImage()`. The renderer does not repeat these checks at runtime.
- **Option copies.** `QRCodeSVGRenderer()` copies option values when it is called.
- **Runtimes.** The renderer supports the same [runtimes as Core](/packages/core/#runtime-compatibility).

## Related guides

- [Customize appearance](/guides/customize/) for colors, module shapes, quiet zones, labels, and
  scan reliability.
- [Add a center image](/guides/center-images/) for preparing an SVG center image source.
- [Render QR codes in the browser](/guides/browser-usage/) for DOM insertion and layout.
- [Download or save](/guides/download-or-save/) for files and browser downloads.
- [Serve a QR code](/guides/server-output/) for HTTP responses.
- [Errors](/reference/errors/) for every `QRCodeError` code.
