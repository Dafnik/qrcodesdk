<!-- Generated from apps/docs/src/content/docs/libs/browser.mdx. Run `pnpm --filter docs generate-readmes` to update. -->

# @qrcodesdk/browser

[![npm version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/browser?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/browser) [![npm bundle size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/browser?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/browser) [![npm downloads per month](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/browser?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/browser)

`@qrcodesdk/browser` adds renderers that depend on browser DOM APIs. Use it with `@qrcodesdk/core` when your output should be an element created in the browser or a browser-triggered download.

## Install

```sh
npm install @qrcodesdk/core @qrcodesdk/browser
```

```sh
pnpm add @qrcodesdk/core @qrcodesdk/browser
```

<details>
<summary>Other package managers</summary>

**vp**

```sh
vp add @qrcodesdk/core @qrcodesdk/browser
```

**deno**

```sh
deno add @qrcodesdk/core @qrcodesdk/browser
```

**bun**

```sh
bun add @qrcodesdk/core @qrcodesdk/browser
```

**yarn**

```sh
yarn add @qrcodesdk/core @qrcodesdk/browser
```

</details>

## Render an Image element

```ts
import {QRCodeImageRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const image = qrcode('https://qrcodesdk.dev').render(
  QRCodeImageRenderer({
    size: 8,
    margin: 4,
    colors: {
      colorDark: '#111827',
      colorLight: '#ffffff',
    },
    dotsOptions: {type: 'rounded'},
    cornersSquareOptions: {type: 'extra-rounded', color: '#7c3aed'},
    cornersDotOptions: {type: 'dot'},
    alt: 'QR code for qrcodesdk.dev',
    ariaLabel: 'Scan to open qrcodesdk.dev',
  }),
);

document.body.append(image);
```

`QRCodeImageRenderer()` returns an `HTMLImageElement`. Its `src` is a PNG data URL, and its `width` and `height` match the rendered QR code size.

## Render a Canvas element

```ts
import {QRCodeCanvasRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

const canvas = qrcode('https://qrcodesdk.dev').render(
  QRCodeCanvasRenderer({
    size: 8,
    margin: 4,
    colors: {
      colorDark: '#111827',
      colorLight: '#ffffff',
    },
  }),
);

document.querySelector('#qrcode')?.append(canvas);
```

`QRCodeCanvasRenderer()` returns an `HTMLCanvasElement` that you can insert into the DOM, draw into another canvas, or export with `toBlob()` or `toDataURL()`.

## Renderer options

| Option                 | Type                         |            Default | Description                                   |
| ---------------------- | ---------------------------- | -----------------: | --------------------------------------------- |
| `size`                 | `number`                     |                `5` | Pixel size of each QR module.                 |
| `margin`               | `number`                     |                `4` | Quiet-zone width in modules.                  |
| `colors.colorDark`     | `string`                     |        `'#000000'` | Dark module color.                            |
| `colors.colorLight`    | `string`                     |        `'#ffffff'` | Background color.                             |
| `dotsOptions`          | `QRCodeDotsOptions`          | `{type: 'square'}` | Ordinary module shape and optional color.     |
| `cornersSquareOptions` | `QRCodeCornersSquareOptions` | `{type: 'square'}` | Finder-ring shape and optional color.         |
| `cornersDotOptions`    | `QRCodeCornersDotOptions`    | `{type: 'square'}` | Finder-center shape and optional color.       |
| `alt`                  | `string`                     |        `undefined` | Image `alt` attribute; Image renderer only.   |
| `ariaLabel`            | `string`                     |        `undefined` | Image `aria-label`; Image renderer only.      |
| `title`                | `string`                     |        `undefined` | Image `title` attribute; Image renderer only. |

Color options use hash-prefixed values such as `#111827`. Browser pixel output requires a positive integer `size` and a non-negative integer `margin`.

All feature colors inherit `colors.colorDark` when omitted. Shapes are shared by Canvas and Image
output, including PNG downloads.

## Download PNG

Wrap an Image renderer with `QRCodeDownloadImageRenderer` to trigger a browser download:

```ts
import {QRCodeDownloadImageRenderer, QRCodeImageRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';

qrcode('https://qrcodesdk.dev').render(
  QRCodeDownloadImageRenderer({
    renderer: QRCodeImageRenderer({
      alt: 'QR code for qrcodesdk.dev',
    }),
    filename: 'qrcode',
  }),
);
```

The renderer appends `.png` when necessary, clicks a temporary download link, and returns `void`.

## Download SVG

SVG strings come from `@qrcodesdk/core`. Wrap its renderer to download the result in the browser:

```ts
import {QRCodeDownloadSVGRenderer} from '@qrcodesdk/browser';
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

qrcode('https://qrcodesdk.dev').render(
  QRCodeDownloadSVGRenderer({
    renderer: QRCodeSVGRenderer({
      size: 4,
      margin: 2,
      ariaLabel: 'Scan to open qrcodesdk.dev',
    }),
    filename: 'qrcode',
  }),
);
```

The renderer appends `.svg` when necessary, downloads an SVG `Blob`, revokes its temporary object URL, and returns `void`.

## Package boundary

`@qrcodesdk/browser` depends on browser DOM APIs and does not replace `@qrcodesdk/core`. The core package still provides `qrcode()`, matrix generation, builder options, and shared styling normalization.

## Public API

```ts
import {
  QRCodeCanvasRenderer,
  type QRCodeCanvasRendererOptions,
  QRCodeDownloadImageRenderer,
  type QRCodeDownloadImageRendererOptions,
  QRCodeDownloadSVGRenderer,
  type QRCodeDownloadSVGRendererOptions,
  QRCodeImageRenderer,
  type QRCodeImageRendererOptions,
} from '@qrcodesdk/browser';
```

## Documentation

- [@qrcodesdk/browser](https://qrcodesdk.dev/libs/browser/)
- [Installation](https://qrcodesdk.dev/guides/installation/)
- [Render to Canvas](https://qrcodesdk.dev/renderers/browser/canvas/)
- [Render to an Image Element](https://qrcodesdk.dev/renderers/browser/image/)
- [Render SVG](https://qrcodesdk.dev/renderers/core/svg/)
- [Customize QR Codes](https://qrcodesdk.dev/guides/customize/)
