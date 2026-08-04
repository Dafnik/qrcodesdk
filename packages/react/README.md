<!-- Generated from apps/docs/src/content/docs/packages/react.mdx. Run `pnpm turbo run generate-readmes --filter=docs` to update. -->

<p align="center"><img src="https://qrcodesdk.dev/favicon.svg" alt="QRCodeSDK logo" width="240"></p>

# @qrcodesdk/react

[![Open @qrcodesdk/react on npmx.dev](https://npmx.dev/api/registry/badge/name/@qrcodesdk/react?color=7469B6&style=shieldsio)](https://npmx.dev/@qrcodesdk/react) ![@qrcodesdk/react version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/react?color=7469B6&label=version&style=shieldsio) ![@qrcodesdk/react install size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/react?color=7469B6&label=install%20size&style=shieldsio) ![@qrcodesdk/react download/mo](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/react?color=7469B6&label=download%2Fmo&style=shieldsio) [![@qrcodesdk/react source code](https://npmx.dev/api/registry/badge/name/@qrcodesdk/react?color=7469B6&label=source%20code&value=GitHub%20%E2%86%97&style=shieldsio)](https://github.com/Dafnik/qrcodesdk/tree/main/packages/react)

**[Live Demo](https://qrcodesdk.dev/playground/?package=react)**

`@qrcodesdk/react` provides React components for rendering QR codes as inline SVG, PNG-backed Image elements, and Canvas elements.

It supports React and React DOM 18 and 19.

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

The components treat `options` as immutable configuration and use its object identity to decide
when to rebuild a renderer. Memoize options created inside a component with `useMemo`, especially
for Canvas and Image output, to avoid repeating rasterization after unrelated parent renders.

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
import type {QRCodeSVGOptions} from '@qrcodesdk/core';
import {useMemo} from 'react';

import {QRCodeSVG} from '@qrcodesdk/react';

export default function QRCodeSVGExample() {
  const options = useMemo<QRCodeSVGOptions>(
    () => ({
      title: 'QR code for qrcodesdk.dev',
      ariaLabel: 'Scan to open qrcodesdk.dev',
    }),
    [],
  );

  return <QRCodeSVG data="https://qrcodesdk.dev" options={options} />;
}
```

### Image component

```tsx
import type {QRCodeImageOptions} from '@qrcodesdk/browser';
import {useMemo} from 'react';

import {QRCodeImage} from '@qrcodesdk/react';

export default function QRCodeImageExample() {
  const options = useMemo<QRCodeImageOptions>(
    () => ({
      size: 8,
      margin: 4,
      alt: 'QR code for qrcodesdk.dev',
      ariaLabel: 'Scan to open qrcodesdk.dev',
    }),
    [],
  );

  return <QRCodeImage data="https://qrcodesdk.dev" options={options} />;
}
```

### Canvas component

```tsx
import type {QRCodeCanvasOptions} from '@qrcodesdk/browser';
import {useMemo} from 'react';

import {QRCodeCanvas} from '@qrcodesdk/react';

export default function QRCodeCanvasExample() {
  const options = useMemo<QRCodeCanvasOptions>(
    () => ({
      size: 8,
      margin: 4,
      colors: {
        colorDark: '#111827',
        colorLight: '#ffffff',
      },
    }),
    [],
  );

  return <QRCodeCanvas data="https://qrcodesdk.dev" options={options} />;
}
```

### PNG download

```tsx
import type {QRCodeImageOptions} from '@qrcodesdk/browser';
import {useMemo, useRef} from 'react';

import {QRCodeImage, type QRCodeDownloadHandle} from '@qrcodesdk/react';

export default function QRCodeDownloadImageExample() {
  const qrcode = useRef<QRCodeDownloadHandle>(null);
  const options = useMemo<QRCodeImageOptions>(() => ({alt: 'QR code for qrcodesdk.dev'}), []);

  return (
    <div className="flex flex-col items-center">
      <QRCodeImage data="https://qrcodesdk.dev" options={options} ref={qrcode} />
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

| Option                  | Components | Type                         |            Default |
| ----------------------- | ---------- | ---------------------------- | -----------------: |
| `size`                  | All        | `number`                     |                `5` |
| `margin`                | All        | `number`                     |                `4` |
| `colors.colorDark`      | All        | `string`                     |        `'#000000'` |
| `colors.colorLight`     | All        | `string`                     |        `'#ffffff'` |
| `dotsOptions`           | All        | `QRCodeDotsOptions`          | `{type: 'square'}` |
| `cornersSquareOptions`  | All        | `QRCodeCornersSquareOptions` | `{type: 'square'}` |
| `cornersDotOptions`     | All        | `QRCodeCornersDotOptions`    | `{type: 'square'}` |
| `alt`                   | SVG, Image | `string`                     |        `undefined` |
| `ariaLabel`             | SVG, Image | `string`                     |        `undefined` |
| `title`                 | SVG, Image | `string`                     |        `undefined` |
| `image.source`          | All        | Renderer-specific source     |        `undefined` |
| `image.size`            | All        | `number`                     |              `0.4` |
| `image.padding`         | All        | `number`                     |                `1` |
| `image.clearBackground` | All        | `boolean`                    |             `true` |

Color options use hash-prefixed values such as `#111827`. All built-in renderers require a positive safe integer `size` and a non-negative safe integer `margin`.

Module, finder-ring, and finder-center options pass through to every component. Their optional
colors independently inherit `colors.colorDark`.

### Prepared center images

Prepare browser image sources before rendering:

```tsx
import type {QRCodeImageOptions} from '@qrcodesdk/browser';
import {useMemo, useState} from 'react';

import {QRCodeImage} from '@qrcodesdk/react';

export function QRCodeWithLogo() {
  const [logo, setLogo] = useState<HTMLImageElement>();
  const options = useMemo<QRCodeImageOptions>(
    () => ({
      errorCorrectionLevel: 'H',
      image: logo ? {source: logo, size: 0.3} : undefined,
    }),
    [logo],
  );

  async function selectLogo(file: File) {
    const source = new Image();
    const localUrl = URL.createObjectURL(file);
    source.src = localUrl;

    try {
      await source.decode();
      setLogo(source);
    } finally {
      URL.revokeObjectURL(localUrl);
    }
  }

  return (
    <>
      <input
        accept="image/*"
        type="file"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file) void selectLogo(file);
        }}
      />
      {logo ? (
        <QRCodeImage data="https://qrcodesdk.dev" options={options} />
      ) : null}
    </>
  );
}
```

Use an embedded `data:image/...` URL for `QRCodeSVG`. Components never load paths or URLs
themselves, and SVG/PNG downloads include the overlay.

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

## Public API

```ts
import {
  type QRCodeBaseProps,
  QRCodeCanvas,
  type QRCodeCanvasProps,
  type QRCodeDownloadHandle,
  QRCodeImage,
  type QRCodeImageProps,
  QRCodeSVG,
  type QRCodeSVGProps,
} from '@qrcodesdk/react';
```

## Documentation

- [@qrcodesdk/react](https://qrcodesdk.dev/packages/react/)
- [Customize QR Codes](https://qrcodesdk.dev/advanced/customize/)
- [Render SVG](https://qrcodesdk.dev/renderers/core/svg/)
- [Render to an Image Element](https://qrcodesdk.dev/renderers/browser/image/)
- [Render to Canvas](https://qrcodesdk.dev/renderers/browser/canvas/)
