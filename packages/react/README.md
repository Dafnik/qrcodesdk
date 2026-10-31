<!-- Generated from apps/docs/src/content/docs/packages/react.mdx. Run `pnpm turbo run generate-readmes --filter=docs` to update. -->

<div align="center"><img src="https://qrcodesdk.dev/favicon.svg" alt="QRCodeSDK logo" width="240"></div>

# @qrcodesdk/react

[![Open @qrcodesdk/react on npmx.dev](https://npmx.dev/api/registry/badge/name/@qrcodesdk/react?color=24272c&style=shieldsio)](https://npmx.dev/@qrcodesdk/react) ![@qrcodesdk/react version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/react?color=24272c&label=version&style=shieldsio) ![@qrcodesdk/react install size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/react?color=24272c&label=install%20size&style=shieldsio) ![@qrcodesdk/react download/mo](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/react?color=24272c&label=download%2Fmo&style=shieldsio) [![@qrcodesdk/react source code](https://npmx.dev/api/registry/badge/name/@qrcodesdk/react?color=24272c&label=source%20code&value=GitHub%20%E2%86%97&style=shieldsio)](https://github.com/Dafnik/qrcodesdk/tree/main/packages/react)

**[Documentation](https://qrcodesdk.dev) | [Live Demo](https://qrcodesdk.dev/playground/?package=react)**

React components for rendering QR codes as inline SVG, PNG-backed Image elements, and Canvas elements.

## Install

```sh
npm install @qrcodesdk/react
```

```sh
pnpm add @qrcodesdk/react
```

<details>
<summary>Other package managers</summary>

**vp**

```sh
vp add @qrcodesdk/react
```

**deno**

```sh
deno add @qrcodesdk/react
```

**bun**

```sh
bun add @qrcodesdk/react
```

**yarn**

```sh
yarn add @qrcodesdk/react
```

</details>

## Quick start

Import the components directly where you need them:

```tsx
import {QRCodeCanvas, QRCodeImage, QRCodeSVG} from '@qrcodesdk/react';

export function App() {
  return (
    <>
      <QRCodeSVG payload="https://qrcodesdk.dev" />
      <QRCodeImage payload="https://qrcodesdk.dev" />
      <QRCodeCanvas payload="https://qrcodesdk.dev" />
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
| `payload`   | `string \| number`           | Required QR code payload.                       |
| `options`   | `Component-specific options` | Optional matrix and renderer configuration.     |
| `className` | `string`                     | CSS class applied to the component wrapper div. |

React passes `className`, `style`, and other fallthrough attributes to the component's wrapper `<div>`.
Use a React ref when you need a download handle; the rendered SVG, Image, or Canvas remains inside that wrapper.

## Live examples

### SVG component

```tsx
import {useMemo} from 'react';

import {QRCodeSVG, type QRCodeSVGOptions} from '@qrcodesdk/react';

export default function QRCodeSVGExample() {
  const options = useMemo<QRCodeSVGOptions>(
    () => ({
      accessibility: {
        title: 'QR code for qrcodesdk.dev',
        ariaLabel: 'Scan to open qrcodesdk.dev',
      },
    }),
    [],
  );

  return <QRCodeSVG payload="https://qrcodesdk.dev" options={options} />;
}
```

### Image component

```tsx
import {useMemo} from 'react';

import {QRCodeImage, type QRCodeImageOptions} from '@qrcodesdk/react';

export default function QRCodeImageExample() {
  const options = useMemo<QRCodeImageOptions>(
    () => ({
      style: {moduleSize: 8, quietZone: 4},
      accessibility: {
        alt: 'QR code for qrcodesdk.dev',
        ariaLabel: 'Scan to open qrcodesdk.dev',
      },
    }),
    [],
  );

  return <QRCodeImage payload="https://qrcodesdk.dev" options={options} />;
}
```

### Canvas component

```tsx
import {useMemo} from 'react';

import {QRCodeCanvas, type QRCodeCanvasOptions} from '@qrcodesdk/react';

export default function QRCodeCanvasExample() {
  const options = useMemo<QRCodeCanvasOptions>(
    () => ({
      style: {
        moduleSize: 8,
        quietZone: 4,
        foreground: '#111827',
        background: '#ffffff',
      },
    }),
    [],
  );

  return <QRCodeCanvas payload="https://qrcodesdk.dev" options={options} />;
}
```

### PNG download

```tsx
import {useMemo, useRef} from 'react';

import {QRCodeImage, type QRCodeDownloadHandle, type QRCodeImageOptions} from '@qrcodesdk/react';

export default function QRCodeDownloadImageExample() {
  const qrcode = useRef<QRCodeDownloadHandle>(null);
  const options = useMemo<QRCodeImageOptions>(
    () => ({accessibility: {alt: 'QR code for qrcodesdk.dev'}}),
    [],
  );

  return (
    <div className="flex flex-col items-center gap-2">
      <QRCodeImage payload="https://qrcodesdk.dev" options={options} ref={qrcode} />
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

Load and decode a browser image first, then store options with
`centerImage: canvasCenterImage(image)` in state. Updating that state rerenders the component with
the prepared image. `QRCodeSVG` takes `svgCenterImage()` with an embedded data URL instead. See
[Add a center image](https://qrcodesdk.dev/guides/center-images/#react) for the complete
React lifecycle.

## Download files

`QRCodeSVG` and `QRCodeImage` expose `download(filename?)` for SVG and PNG files respectively.
The method appends the file extension when needed. `QRCodeCanvas` has no download method.

See [Download or save](https://qrcodesdk.dev/guides/download-or-save/#download-from-react) for the complete
React example, or its [Canvas export section](https://qrcodesdk.dev/guides/download-or-save/#export-a-canvas-manually)
for manual downloads.

## Server-side rendering

`QRCodeSVG` produces runtime-neutral SVG and can render on the server.

`QRCodeImage` and `QRCodeCanvas` rely on browser DOM and Canvas APIs, so they skip element creation and downloads outside the browser and populate their host after hydration.

## Shared options

The `options` prop groups encoding settings under `matrix`. Renderer settings such as
`style`, `accessibility`, and `centerImage` go alongside it:

```ts
import {type QRCodeSVGOptions, circle, finder, rounded} from '@qrcodesdk/react';

const options: QRCodeSVGOptions = {
  matrix: {errorCorrectionLevel: 'H'},
  style: {moduleSize: 8, quietZone: 4, modules: rounded(), finder: finder({center: circle()})},
  accessibility: {ariaLabel: 'Scan to open qrcodesdk.dev'},
};
```

Pass this object through the component's `options` prop. Use `QRCodeImageOptions` or
`QRCodeCanvasOptions` for the corresponding component.

Import shapes, pattern parts, and center-image factories from `@qrcodesdk/react` alongside the components.

See [Builder and matrix](https://qrcodesdk.dev/reference/builder/) for the fields inside `matrix`,
[Customize appearance](https://qrcodesdk.dev/guides/customize/) for `style`, and
[Renderer outputs](https://qrcodesdk.dev/reference/renderers/) for output-specific options.

## Public API

```ts
import {
  type QRCodeBaseProps,
  QRCodeCanvas,
  type QRCodeCanvasCenterImage,
  type QRCodeCanvasOptions,
  type QRCodeCanvasProps,
  type QRCodeCenterImageLayout,
  type QRCodeDataImageURL,
  type QRCodeDownloadHandle,
  QRCodeImage,
  type QRCodeImageOptions,
  type QRCodeImageProps,
  QRCodeSVG,
  type QRCodeSVGCenterImage,
  type QRCodeSVGOptions,
  type QRCodeSVGProps,
  type QRCodeShape,
  type QRCodeStylePart,
  alignment,
  canvasCenterImage,
  circle,
  diagonal,
  finder,
  rounded,
  svgCenterImage,
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
