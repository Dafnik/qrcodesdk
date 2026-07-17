# @qrcodesdk/react

[![npm version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/react?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/react)
[![npm bundle size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/react?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/react)
[![npm download per month](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/react?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/react)

**[Live Demo](https://qrcodesdk.dev/playground/)**

`@qrcodesdk/react` provides React components for rendering QR codes as inline SVG, PNG-backed Image elements, and Canvas elements.

## Install

Install the React package with its Core and Browser peer dependencies:

```sh
npm install @qrcodesdk/react @qrcodesdk/core @qrcodesdk/browser
```

```sh
pnpm add @qrcodesdk/react @qrcodesdk/core @qrcodesdk/browser
```

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

## SVG component

Use `QRCodeSVG` for crisp, scalable output and server-side rendering:

```tsx
import type {QRCodeSVGOptions} from '@qrcodesdk/core';
import {QRCodeSVG} from '@qrcodesdk/react';

const options: QRCodeSVGOptions = {
  size: 8,
  margin: 4,
  colors: {
    colorDark: '#111827',
    colorLight: '#ffffff',
  },
  title: 'QR code for qrcodesdk.dev',
  ariaLabel: 'Scan to open qrcodesdk.dev',
};

export function QRCodeExample() {
  return <QRCodeSVG className="qrcode" data="https://qrcodesdk.dev" options={options} />;
}
```

## Image component

`QRCodeImage` creates a PNG-backed `<img>` in the browser. Add meaningful accessibility text for user-facing QR codes.

```tsx
import type {QRCodeImageOptions} from '@qrcodesdk/browser';
import {QRCodeImage} from '@qrcodesdk/react';

const options: QRCodeImageOptions = {
  size: 8,
  margin: 4,
  alt: 'QR code for qrcodesdk.dev',
  ariaLabel: 'Scan to open qrcodesdk.dev',
};

export function QRCodeExample() {
  return <QRCodeImage data="https://qrcodesdk.dev" options={options} />;
}
```

## Canvas component

```tsx
import type {QRCodeCanvasOptions} from '@qrcodesdk/browser';
import {QRCodeCanvas} from '@qrcodesdk/react';

const options: QRCodeCanvasOptions = {
  size: 8,
  margin: 4,
  colors: {
    colorDark: '#111827',
    colorLight: '#ffffff',
  },
};

export function QRCodeExample() {
  return <QRCodeCanvas data="https://qrcodesdk.dev" options={options} />;
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

## Download SVG and PNG files

`QRCodeSVG` and `QRCodeImage` expose `download(filename?)` through typed React refs:

```tsx
import {useRef} from 'react';

import {
  QRCodeImage,
  QRCodeSVG,
  type QRCodeDownloadHandle,
} from '@qrcodesdk/react';

export function DownloadQRCodes() {
  const svg = useRef<QRCodeDownloadHandle>(null);
  const image = useRef<QRCodeDownloadHandle>(null);

  return (
    <>
      <QRCodeSVG data="https://qrcodesdk.dev" ref={svg} />
      <button type="button" onClick={() => svg.current?.download('qrcodesdk')}>
        Download SVG
      </button>

      <QRCodeImage
        data="https://qrcodesdk.dev"
        options={{alt: 'QR code for qrcodesdk.dev'}}
        ref={image}
      />
      <button type="button" onClick={() => image.current?.download('qrcodesdk')}>
        Download PNG
      </button>
    </>
  );
}
```

The appropriate `.svg` or `.png` extension is appended when necessary. `QRCodeCanvas` does not expose a download handle; use `QRCodeImage` for built-in PNG downloads.

## Server-side rendering

`QRCodeSVG` produces runtime-neutral SVG and can render on the server.

`QRCodeImage` and `QRCodeCanvas` rely on browser DOM and Canvas APIs, so they skip element creation and downloads outside the browser and populate their host after hydration.

## Public API

```ts
import type {QRCodeCanvasOptions, QRCodeImageOptions} from '@qrcodesdk/browser';
import type {QRCodeSVGOptions} from '@qrcodesdk/core';
import {
  type QRCodeBaseProps,
  QRCodeCanvas,
  type QRCodeCanvasProps,
  type QRCodeDownloadHandle,
  QRCodeImage,
  type QRCodeImageProps,
  QRCodeSVG,
  QRCodeSVGContainer,
  type QRCodeSVGProps,
} from '@qrcodesdk/react';
```

`QRCodeSVGContainer` is an alias of `QRCodeSVG`.

## Documentation

- [React library](https://qrcodesdk.dev/libs/react/)
- [Customize QR codes](https://qrcodesdk.dev/guides/customize/)
- [SVG renderer](https://qrcodesdk.dev/renderers/core/svg/)
- [Image renderer](https://qrcodesdk.dev/renderers/browser/image/)
- [Canvas renderer](https://qrcodesdk.dev/renderers/browser/canvas/)
