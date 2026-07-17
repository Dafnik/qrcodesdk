<!-- Generated from apps/docs/src/content/docs/libs/react.mdx. Run `pnpm --filter docs generate-readmes` to update. -->

# @qrcodesdk/react

[![npm version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/react?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/react) [![npm bundle size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/react?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/react) [![npm downloads per month](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/react?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/react)

**[Live Demo](https://qrcodesdk.dev/playground/?pkg=react)**

`@qrcodesdk/react` provides React components for rendering QR codes as inline SVG, PNG-backed Image elements, and Canvas elements.

## Install

```sh
npm install @qrcodesdk/react @qrcodesdk/core @qrcodesdk/browser
```

```sh
pnpm add @qrcodesdk/react @qrcodesdk/core @qrcodesdk/browser
```

<details>
<summary>Other package managers</summary>

**vp**

```sh
vp add @qrcodesdk/react @qrcodesdk/core @qrcodesdk/browser
```

**deno**

```sh
deno add @qrcodesdk/react @qrcodesdk/core @qrcodesdk/browser
```

**bun**

```sh
bun add @qrcodesdk/react @qrcodesdk/core @qrcodesdk/browser
```

**yarn**

```sh
yarn add @qrcodesdk/react @qrcodesdk/core @qrcodesdk/browser
```

</details>

## Quick start

Import the components directly where you need them:

```tsx
import {QRCodeCanvas, QRCodeImage, QRCodeSVG} from '@qrcodesdk/react';

export function App() {
  return (
    <>
      <QRCodeSVG data="https://qrcodesdk.dev" />
      <QRCodeImage data="https://qrcodesdk.dev" />
      <QRCodeCanvas data="https://qrcodesdk.dev" />
    </>
  );
}
```

## Components

| Component      | Output                                      | Download support |
| -------------- | ------------------------------------------- | ---------------- |
| `QRCodeSVG`    | Inline SVG inside a wrapper `<div>`         | SVG              |
| `QRCodeImage`  | PNG-backed `<img>` inside a wrapper `<div>` | PNG              |
| `QRCodeCanvas` | `<canvas>` inside a wrapper `<div>`         | None             |

All components accept:

| Prop        | Type                       | Description                                     |
| ----------- | -------------------------- | ----------------------------------------------- |
| `data`      | `string \| number`         | Required QR code payload.                       |
| `options`   | Component-specific options | Optional matrix and renderer configuration.     |
| `className` | `string`                   | CSS class applied to the component wrapper div. |

`options` supports shared matrix options such as `version`, `mode`, `errorCorrectionLevel`, and `mask`. Renderer options match the corresponding QRCodeSDK renderer:

- `QRCodeSVG` uses `QRCodeSVGOptions`.
- `QRCodeImage` uses `QRCodeImageOptions`.
- `QRCodeCanvas` uses `QRCodeCanvasOptions`.

Import `QRCodeSVGOptions` from `@qrcodesdk/core`. Import `QRCodeImageOptions` and `QRCodeCanvasOptions` from `@qrcodesdk/browser`.

## Matrix options

The `options` prop combines the component's renderer options with the shared QR matrix options:

| Option                 | Type                                     | Default   | Description             |
| ---------------------- | ---------------------------------------- | --------- | ----------------------- |
| `mode`                 | `'numeric' \| 'alphanumeric' \| 'octet'` | Automatic | Encoding mode.          |
| `errorCorrectionLevel` | `'L' \| 'M' \| 'Q' \| 'H'`               | `'M'`     | Error correction level. |
| `version`              | `1` through `40`                         | Automatic | Pins the QR version.    |
| `mask`                 | `0` through `7`                          | Automatic | Pins the QR mask.       |

Most applications should let the builder select the mode, version, and mask automatically.

## Live examples

### SVG component

```tsx
import {QRCodeSVG} from '@qrcodesdk/react';

export default function QRCodeSVGExample() {
  return (
    <QRCodeSVG
      data="https://qrcodesdk.dev"
      options={{
        title: 'QR code for qrcodesdk.dev',
        ariaLabel: 'Scan to open qrcodesdk.dev',
      }}
    />
  );
}
```

### Image component

```tsx
import type {QRCodeImageOptions} from '@qrcodesdk/browser';
import {QRCodeImage} from '@qrcodesdk/react';

export default function QRCodeImageExample() {
  const options: QRCodeImageOptions = {
    size: 8,
    margin: 4,
    alt: 'QR code for qrcodesdk.dev',
    ariaLabel: 'Scan to open qrcodesdk.dev',
  };

  return <QRCodeImage data="https://qrcodesdk.dev" options={options} />;
}
```

### Canvas component

```tsx
import type {QRCodeCanvasOptions} from '@qrcodesdk/browser';
import {QRCodeCanvas} from '@qrcodesdk/react';

export default function QRCodeCanvasExample() {
  const options: QRCodeCanvasOptions = {
    size: 8,
    margin: 4,
    colors: {
      colorDark: '#111827',
      colorLight: '#ffffff',
    },
  };

  return <QRCodeCanvas data="https://qrcodesdk.dev" options={options} />;
}
```

### PNG download

```tsx
import {useRef} from 'react';

import {QRCodeImage, type QRCodeDownloadHandle} from '@qrcodesdk/react';

export default function QRCodeDownloadImageExample() {
  const qrcode = useRef<QRCodeDownloadHandle>(null);

  return (
    <div className="flex flex-col items-center">
      <QRCodeImage
        data="https://qrcodesdk.dev"
        options={{
          alt: 'QR code for qrcodesdk.dev',
        }}
        ref={qrcode}
      />
      <button
        className="btn-primary"
        onClick={() => qrcode.current?.download('qrcodesdk')}
        type="button">
        Download PNG
      </button>
    </div>
  );
}
```

## Renderer options

| Option              | Components | Type     |     Default |
| ------------------- | ---------- | -------- | ----------: |
| `size`              | All        | `number` |         `5` |
| `margin`            | All        | `number` |         `4` |
| `colors.colorDark`  | All        | `string` | `'#000000'` |
| `colors.colorLight` | All        | `string` | `'#ffffff'` |
| `alt`               | SVG, Image | `string` | `undefined` |
| `ariaLabel`         | SVG, Image | `string` | `undefined` |
| `title`             | SVG, Image | `string` | `undefined` |

Color options use hash-prefixed values such as `#111827`. Image and Canvas output require a positive integer `size` and a non-negative integer `margin`.

## Download files

- `QRCodeSVG` exposes `download(filename?)` and writes an SVG file through a React ref.
- `QRCodeImage` exposes `download(filename?)` and writes a PNG file through a React ref.

```tsx
import {useRef} from 'react';

import {QRCodeImage, type QRCodeDownloadHandle} from '@qrcodesdk/react';

export function QRCodeDownload() {
  const qrcode = useRef<QRCodeDownloadHandle>(null);

  return (
    <>
      <button type="button" onClick={() => qrcode.current?.download('qrcodesdk')}>
        Download PNG
      </button>
      <QRCodeImage ref={qrcode} data="https://qrcodesdk.dev" />
    </>
  );
}
```

The appropriate `.svg` or `.png` extension is appended when necessary.

`QRCodeCanvas` does not include a download method. Use `QRCodeImage` when you want built-in PNG download support.

## Server-side rendering

`QRCodeSVG` produces runtime-neutral SVG and can render on the server.

`QRCodeImage` and `QRCodeCanvas` rely on browser DOM and Canvas APIs, so they skip element creation and downloads outside the browser and populate their host after hydration.

## Documentation

- [@qrcodesdk/react](https://qrcodesdk.dev/libs/react/)
- [Customize QR Codes](https://qrcodesdk.dev/guides/customize/)
- [Render SVG](https://qrcodesdk.dev/renderers/core/svg/)
- [Render to an Image Element](https://qrcodesdk.dev/renderers/browser/image/)
- [Render to Canvas](https://qrcodesdk.dev/renderers/browser/canvas/)
