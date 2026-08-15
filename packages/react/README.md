<!-- Generated from apps/docs/src/content/docs/packages/react.mdx. Run `pnpm turbo run generate-readmes --filter=docs` to update. -->

<div align="center"><img src="https://qrcodesdk.dev/favicon.svg" alt="QRCodeSDK logo" width="240"></div>

# @qrcodesdk/react

[![Open @qrcodesdk/react on npmx.dev](https://npmx.dev/api/registry/badge/name/@qrcodesdk/react?color=7469B6&style=shieldsio)](https://npmx.dev/@qrcodesdk/react) ![@qrcodesdk/react version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/react?color=7469B6&label=version&style=shieldsio) ![@qrcodesdk/react install size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/react?color=7469B6&label=install%20size&style=shieldsio) ![@qrcodesdk/react download/mo](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/react?color=7469B6&label=download%2Fmo&style=shieldsio) [![@qrcodesdk/react source code](https://npmx.dev/api/registry/badge/name/@qrcodesdk/react?color=7469B6&label=source%20code&value=GitHub%20%E2%86%97&style=shieldsio)](https://github.com/Dafnik/qrcodesdk/tree/main/packages/react)

**[Documentation](https://qrcodesdk.dev) | [Live Demo](https://qrcodesdk.dev/playground/?package=react)**

React components for rendering QR codes as inline SVG, PNG-backed Image elements, and Canvas elements.

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

## Version compatibility

| @qrcodesdk/react | React               |
| ---------------- | ------------------- |
| `0.x.x`          | `^18.0.0` `^19.0.0` |

## Components

| Component      | Output               | Download support |
| -------------- | -------------------- | ---------------- |
| `QRCodeSVG`    | `Inline SVG element` | SVG              |
| `QRCodeImage`  | `PNG-backed <img>`   | PNG              |
| `QRCodeCanvas` | `<canvas> element`   | None             |

### Options

| Prop        | Type                         | Description                                     |
| ----------- | ---------------------------- | ----------------------------------------------- |
| `data`      | `string \| number`           | Required QR code payload.                       |
| `options`   | `Component-specific options` | Optional matrix and renderer configuration.     |
| `className` | `string`                     | CSS class applied to the component wrapper div. |

React passes `className` to the component's wrapper `<div>`. Use a React ref when you need a
download handle; the rendered SVG, Image, or Canvas remains inside that wrapper.

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

## Center images

Load and decode a browser image first, store the resulting `HTMLImageElement` in state, and pass
it through `options.image.source`. Updating that state rerenders the component with the prepared
source. See
[Add a center image](https://qrcodesdk.dev/guides/center-images/#wire-prepared-sources-into-frameworks) for the complete
React lifecycle.

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

See [Download or save](https://qrcodesdk.dev/guides/download-or-save/#download-from-react) for SVG, PNG, and manual
Canvas downloads.

## Server-side rendering

`QRCodeSVG` produces runtime-neutral SVG and can render on the server.

`QRCodeImage` and `QRCodeCanvas` rely on browser DOM and Canvas APIs, so they skip element creation and downloads outside the browser and populate their host after hydration.

## Shared configuration

The `options` prop combines matrix settings with the selected renderer's settings. Use the
[builder reference](https://qrcodesdk.dev/reference/builder/) for encoding, version, mask, and error correction;
[Customize output](https://qrcodesdk.dev/guides/customize/) for shared visual options; and the dedicated
[renderer references](https://qrcodesdk.dev/reference/renderers/) for output-specific options and constraints.

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
- [Customize appearance](https://qrcodesdk.dev/guides/customize/)
- [Add a center image](https://qrcodesdk.dev/guides/center-images/)
- [Download or save a QR code as SVG or PNG](https://qrcodesdk.dev/guides/download-or-save/)
- [SVG string renderer](https://qrcodesdk.dev/reference/renderers/svg/)
- [PNG-backed Image element renderer](https://qrcodesdk.dev/reference/renderers/image/)
- [Canvas element renderer](https://qrcodesdk.dev/reference/renderers/canvas/)
