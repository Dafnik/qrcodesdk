---
title: SVG string renderer
description: Reference for rendering a scalable SVG string with QRCodeSVGRenderer from @qrcodesdk/core.
docType: reference

related:
  - ../../packages/core.mdx
  - ./browser-downloads.mdx
---

## When to use

Use `QRCodeSVGRenderer` for scalable output in web pages, email, print, generated assets, or HTTP
responses. It is the recommended default when the consumer accepts SVG text.

:::tip[Recommended default]
Choose SVG when the consumer accepts it: output stays sharp at every size and the renderer has no
browser or Node.js dependency.
:::

## Minimal example

```ts
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev').render(QRCodeSVGRenderer());
```

[Learn here](/guides/browser-usage/#svg-string) more about using the SVG string in the browser.

## Return value

The renderer returns a complete SVG `string` with an explicit width, height, and `viewBox`. A
non-empty accessible name adds `role="img"`; decorative output has no image role. Output with only
square shapes uses `shape-rendering="crispEdges"`; curved styles omit that hint.

## Renderer-specific options

`QRCodeSVGRendererOptions` accepts `style`, `accessibility`, and `image`. It rejects every other key.

| Option                    | Type                 | Default               | Effect                                           |
| ------------------------- | -------------------- | --------------------- | ------------------------------------------------ |
| `style`                   | `QRCodeVisualStyle`  | shared defaults       | Applies graphical dimensions, colors, and shapes |
| `accessibility.ariaLabel` | `string`             | `undefined`           | Sets `aria-label` and meaningful image semantics |
| `accessibility.title`     | `string`             | `undefined`           | Adds a child `<title>` element                   |
| `image.source`            | `QRCodeDataImageURL` | required with `image` | Embeds a prepared `data:image/...` URL           |
| `image.size`              | `number`             | `0.4`                 | Image box as a fraction of matrix width          |
| `image.padding`           | `number`             | `1`                   | Clear padding measured in modules                |
| `image.clearBackground`   | `boolean`            | `true`                | Clears modules behind the image and padding      |

## Renderer-specific constraints

:::caution[Keep the application's trust boundary]
Renderer-generated text is escaped, but inserting any HTML string into a document still requires
the normal trust decision for that application.
:::

- `image.source` must be a non-empty embedded image data URL. The renderer does not read paths or
  fetch remote URLs.
- SVG does not accept `accessibility.alt`; use `ariaLabel` and optionally `title`.
- Image `size` must be finite, greater than `0`, and at most `1`; padding must be finite and
  non-negative.
- Options are validated and copied when `QRCodeSVGRenderer()` is called.
- The renderer is runtime-neutral under the [Core compatibility contract](/packages/core/#runtime-compatibility).

## Related guides

- [Customize appearance](/guides/customize/) for shared colors, module shapes, quiet zones, labels,
  and scan safety.
- [Add a center image](/guides/center-images/) for preparing an SVG center image source.
- [Browser Usage](/guides/browser-usage/) for rendering in the browser.
- [Download or save](/guides/download-or-save/) for files and browser downloads.
- [Serve a QR code](/guides/server-output/) for HTTP responses.
