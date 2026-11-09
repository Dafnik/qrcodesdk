<!-- Generated from apps/docs/src/content/docs/packages/react.mdx. Run `pnpm turbo run generate-readmes --filter=docs` to update. -->

<div align="center"><img src="https://qrcodesdk.dev/favicon.svg" alt="QRCodeSDK logo" width="240"></div>

# @qrcodesdk/react

[![Open @qrcodesdk/react on npmx.dev](https://npmx.dev/api/registry/badge/name/@qrcodesdk/react?color=24272c&style=shieldsio)](https://npmx.dev/@qrcodesdk/react) ![@qrcodesdk/react version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/react?color=24272c&label=version&style=shieldsio) ![@qrcodesdk/react install size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/react?color=24272c&label=install%20size&style=shieldsio) ![@qrcodesdk/react download/mo](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/react?color=24272c&label=download%2Fmo&style=shieldsio) [![@qrcodesdk/react source code](https://npmx.dev/api/registry/badge/name/@qrcodesdk/react?color=24272c&label=source%20code&value=GitHub%20%E2%86%97&style=shieldsio)](https://github.com/Dafnik/qrcodesdk/tree/main/packages/react)

**[Documentation](https://qrcodesdk.dev) | [Live Demo](https://qrcodesdk.dev/playground/?package=react)**

React components for rendering QR codes as inline SVG, PNG, WebP, GIF, and JPEG Image elements, and Canvas elements.

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
deno add npm:@qrcodesdk/react
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
import {QRCodeSVG, type QRCodeSVGOptions} from '@qrcodesdk/react';

const options: QRCodeSVGOptions = {
  accessibility: {ariaLabel: 'Scan to open qrcodesdk.dev'},
};

export function App() {
  return (
    <figure>
      <QRCodeSVG payload="https://qrcodesdk.dev" options={options} />
      <figcaption>
        Scan the code or open <a href="https://qrcodesdk.dev">qrcodesdk.dev</a>
      </figcaption>
    </figure>
  );
}
```

The label names the QR code for screen readers, and the link gives everyone another way to reach the
destination. Without `accessibility` options, the output is decorative and hidden from assistive
technology. Leave a QR code unlabeled only when nearby content, such as this link, already gives its
meaning.

`QRCodePNG`, `QRCodeWebP`, `QRCodeGIF`, `QRCodeJPEG`, and `QRCodeCanvas` take the same `payload` and
`options` props. Image components also accept `accessibility.alt`.

## Version compatibility

| @qrcodesdk/react | React               |
| ---------------- | ------------------- |
| `0.x.x`          | `^18.0.0` `^19.0.0` |

## Components

| Component      | Output               | Download support |
| -------------- | -------------------- | ---------------- |
| `QRCodeSVG`    | `Inline SVG element` | SVG              |
| `QRCodePNG`    | `PNG-backed <img>`   | PNG              |
| `QRCodeWebP`   | `WebP-backed <img>`  | WebP             |
| `QRCodeGIF`    | `GIF-backed <img>`   | GIF              |
| `QRCodeJPEG`   | `JPEG-backed <img>`  | JPEG             |
| `QRCodeCanvas` | `<canvas> element`   | None             |

### Component props

| Prop                                      | Type                              | Description                                                                                                                |
| ----------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `payload`                                 | `string \| number`                | Required QR code payload.                                                                                                  |
| `options`                                 | Component-specific options        | Optional `matrix` options and renderer options, such as `QRCodeSVGOptions` for `QRCodeSVG`.                                |
| `className`, `style`, other `<div>` props | `ComponentPropsWithoutRef<'div'>` | Passed to the wrapper `<div>` that contains the output element. `children` and `dangerouslySetInnerHTML` are not accepted. |
| `ref`                                     | `Ref<QRCodeDownloadHandle>`       | Receives `download(filename?)`, not the wrapper element. `QRCodeCanvas` does not accept a `ref`.                           |

Each image format has its own component, so your bundle only includes the encoders of the components
you import. `QRCodePNG` uses the browser's native PNG encoder. `QRCodeWebP` uses a lossless encoder
bundled in the SDK, which also works in Safari, and usually produces the smallest file.

`QRCodeGIF` is limited to 256 colors and binary transparency. Prefer PNG or WebP for transparent
backgrounds and photographic center images.

`QRCodeJPEG` is lossy and has no transparency. It blends transparent pixels onto a white matte by
default. Its `quality` option ranges from 1 to 100, defaults to 92, and trades file size for detail.
Use it when a destination requires JPEG. See the
[Image element renderers](https://qrcodesdk.dev/reference/renderers/image/) reference for details.

The components pass `className`, `style`, and other `<div>` props to their wrapper `<div>`.
Use a React ref when you need a download handle; the rendered SVG, Image, or Canvas element remains inside that wrapper.

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

### PNG component

```tsx
import {useMemo} from 'react';

import {QRCodePNG, type QRCodePNGImageOptions} from '@qrcodesdk/react';

export default function QRCodePNGExample() {
  const options = useMemo<QRCodePNGImageOptions>(
    () => ({
      style: {moduleSize: 8, quietZone: 4},
      accessibility: {
        alt: 'QR code: scan to open qrcodesdk.dev',
      },
    }),
    [],
  );

  return <QRCodePNG payload="https://qrcodesdk.dev" options={options} />;
}
```

### WebP component

```tsx
import {useMemo} from 'react';

import {QRCodeWebP, type QRCodeWebPImageOptions} from '@qrcodesdk/react';

export default function QRCodeWebPExample() {
  const options = useMemo<QRCodeWebPImageOptions>(
    () => ({
      style: {moduleSize: 8, quietZone: 4},
      accessibility: {
        alt: 'QR code: scan to open qrcodesdk.dev',
      },
    }),
    [],
  );

  return <QRCodeWebP payload="https://qrcodesdk.dev" options={options} />;
}
```

### GIF component

```tsx
import {useMemo} from 'react';

import {QRCodeGIF, type QRCodeGIFImageOptions} from '@qrcodesdk/react';

export default function QRCodeGIFExample() {
  const options = useMemo<QRCodeGIFImageOptions>(
    () => ({
      style: {moduleSize: 8, quietZone: 4},
      accessibility: {
        alt: 'QR code: scan to open qrcodesdk.dev',
      },
    }),
    [],
  );

  return <QRCodeGIF payload="https://qrcodesdk.dev" options={options} />;
}
```

### JPEG component

```tsx
import {useMemo} from 'react';

import {QRCodeJPEG, type QRCodeJPEGImageOptions} from '@qrcodesdk/react';

export default function QRCodeJPEGExample() {
  const options = useMemo<QRCodeJPEGImageOptions>(
    () => ({
      style: {moduleSize: 8, quietZone: 4},
      quality: 90,
      accessibility: {
        alt: 'QR code: scan to open qrcodesdk.dev',
      },
    }),
    [],
  );

  return <QRCodeJPEG payload="https://qrcodesdk.dev" options={options} />;
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
      accessibility: {ariaLabel: 'Scan to open qrcodesdk.dev'},
    }),
    [],
  );

  return <QRCodeCanvas payload="https://qrcodesdk.dev" options={options} />;
}
```

### PNG download

```tsx
import {useMemo, useRef} from 'react';

import {QRCodePNG, type QRCodeDownloadHandle, type QRCodePNGImageOptions} from '@qrcodesdk/react';

export default function QRCodeDownloadPNGExample() {
  const qrcode = useRef<QRCodeDownloadHandle>(null);
  const options = useMemo<QRCodePNGImageOptions>(
    () => ({accessibility: {alt: 'QR code: scan to open qrcodesdk.dev'}}),
    [],
  );

  return (
    <>
      <QRCodePNG payload="https://qrcodesdk.dev" options={options} ref={qrcode} />
      <button onClick={() => qrcode.current?.download('qrcodesdk')} type="button">
        Download PNG
      </button>
    </>
  );
}
```

## Center images

Load and decode a browser image first, then store options with
`centerImage: canvasCenterImage(image)` in state. `QRCodeSVG` takes `svgCenterImage()` with an
embedded data URL instead. See [Add a center image](https://qrcodesdk.dev/guides/center-images/#react) for the complete
React example.

## Download files

All components except `QRCodeCanvas` expose `download(filename?)`. The method appends the
component's file extension when needed.

See [Download or save](https://qrcodesdk.dev/guides/download-or-save/#download-from-react) for the complete
React example, or its [Canvas export section](https://qrcodesdk.dev/guides/download-or-save/#export-a-canvas-manually)
for manual downloads.

## Server-side rendering

`QRCodeSVG` produces runtime-neutral SVG and can render on the server.

`QRCodePNG`, `QRCodeWebP`, `QRCodeGIF`, `QRCodeJPEG`, and `QRCodeCanvas` rely on browser DOM and
Canvas APIs. Outside the browser, they skip element creation and downloads. They populate their host
after hydration.

### Next.js client boundary

The package entry declares `'use client'`, so Server Components can import its components directly.
Props crossing that boundary must be serializable. Shape path objects from `@qrcodesdk/core/style`
can cross it, but these values cannot:

- `finder()` and `alignment()` results, which are functions;
- center images from `svgCenterImage()` and `canvasCenterImage()`;
- `matrix.segmenter`, including `automaticSegmenter`, which is a function.

Create those values inside a client component.

On the server, every export of a `'use client'` module is a client reference that cannot be called.
A Server Component must therefore import shape factories such as `rounded()` from
`@qrcodesdk/core/style`, not from `@qrcodesdk/react`.

Add `@qrcodesdk/core` as a direct dependency at the exact version that `@qrcodesdk/react` depends
on, as [Add Core to a framework project](https://qrcodesdk.dev/getting-started/choose-your-setup/#add-core-to-a-framework-project)
describes. Mismatched copies can draw shapes incorrectly, ignore center images, and break
`instanceof QRCodeError`.

```tsx
import {rounded} from '@qrcodesdk/core/style';
import {QRCodeSVG} from '@qrcodesdk/react';

export default function Page() {
  return (
    <QRCodeSVG
      payload="https://qrcodesdk.dev"
      options={{
        style: {modules: rounded()},
        accessibility: {ariaLabel: 'Scan to open qrcodesdk.dev'},
      }}
    />
  );
}
```

Client components can import every factory from `@qrcodesdk/react`:

```tsx
'use client';

import {QRCodeSVG, type QRCodeSVGOptions, circle, finder} from '@qrcodesdk/react';

const options: QRCodeSVGOptions = {style: {finder: finder({center: circle()})}};

export function StyledQRCode() {
  return <QRCodeSVG payload="https://qrcodesdk.dev" options={options} />;
}
```

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

Pass this object through the component's `options` prop. Use `QRCodePNGImageOptions`,
`QRCodeWebPImageOptions`, `QRCodeGIFImageOptions`, `QRCodeJPEGImageOptions`, or `QRCodeCanvasOptions`
for the corresponding component. `QRCodeGIFImageOptions` also accepts `transparency.threshold`, and
`QRCodeJPEGImageOptions` accepts `quality` and `transparency.matte`.

Mixed-mode segmentation is opt-in. Import `automaticSegmenter` from `@qrcodesdk/react` and pass it
as `matrix.segmenter`. The segmenter is a function, so in Next.js create these options in a client
component:

```tsx
'use client';

import {QRCodeSVG, type QRCodeSVGOptions, automaticSegmenter} from '@qrcodesdk/react';

const options: QRCodeSVGOptions = {matrix: {mode: 'auto', segmenter: automaticSegmenter}};

export function OptimizedQRCode({payload}: {payload: string}) {
  return <QRCodeSVG payload={payload} options={options} />;
}
```

To build payloads with [payload helpers](https://qrcodesdk.dev/reference/payloads/) or check `instanceof QRCodeError`,
import them from `@qrcodesdk/core` after you
[add Core to the project](https://qrcodesdk.dev/getting-started/choose-your-setup/#add-core-to-a-framework-project).

See [Builder and matrix](https://qrcodesdk.dev/reference/builder/) for the fields inside `matrix`,
[Customize appearance](https://qrcodesdk.dev/guides/customize/) for `style`, and
[Renderer outputs](https://qrcodesdk.dev/reference/renderers/) for output-specific options.

### Keep options stable

Components create their renderer from `options` and memoize it on the object's identity. An object
literal written inline in JSX is a new object on every render, so the component recreates the
renderer and renders the QR code again each time. Image and Canvas components also re-encode and
replace their element. Define constant options outside the component, or wrap options that depend on
props or state in `useMemo`. Changing a property of the same object does not update the QR code;
pass a new object instead.

## Errors

Components throw `QRCodeError` for invalid payloads and options. Every component creates its
renderer while rendering, so invalid renderer options throw during rendering. `QRCodeSVG` also
generates the QR code during rendering. The Image and Canvas components generate it in a
`useEffect`, so payload problems throw there.

In the browser, an error boundary above the component catches both. Error boundaries do not catch
errors during server-side rendering, so validate user-controlled payloads before rendering. Downloads
called from an event handler need their own `try`/`catch`. See
[Check errors from framework packages](https://qrcodesdk.dev/reference/errors/#check-errors-from-framework-packages).

## Public API

```ts
import {
  type QRCodeAlignmentCenterShape,
  type QRCodeAlignmentOptions,
  type QRCodeAlignmentRingShape,
  type QRCodeAlignmentStyle,
  type QRCodeBaseProps,
  QRCodeCanvas,
  type QRCodeCanvasAccessibilityOptions,
  type QRCodeCanvasCenterImage,
  type QRCodeCanvasOptions,
  type QRCodeCanvasProps,
  type QRCodeCenterImageLayout,
  type QRCodeCircleShapeOptions,
  type QRCodeColor,
  type QRCodeDataImageURL,
  type QRCodeDownloadHandle,
  type QRCodeEncodingMode,
  type QRCodeErrorCorrectionLevel,
  type QRCodeFinderCenterShape,
  type QRCodeFinderOptions,
  type QRCodeFinderRingShape,
  type QRCodeFinderStyle,
  QRCodeGIF,
  type QRCodeGIFImageOptions,
  type QRCodeGIFProps,
  type QRCodeImageAccessibilityOptions,
  QRCodeJPEG,
  type QRCodeJPEGImageOptions,
  type QRCodeJPEGProps,
  type QRCodeMask,
  type QRCodeMatrixOptions,
  type QRCodeMode,
  type QRCodeModulePattern,
  type QRCodeModuleShape,
  QRCodePNG,
  type QRCodePNGImageOptions,
  type QRCodePNGProps,
  type QRCodePayload,
  type QRCodeRoundedShapeOptions,
  QRCodeSVG,
  type QRCodeSVGAccessibilityOptions,
  type QRCodeSVGCenterImage,
  type QRCodeSVGOptions,
  type QRCodeSVGProps,
  type QRCodeSegment,
  type QRCodeSegmenter,
  type QRCodeSegmenterOptions,
  type QRCodeShape,
  type QRCodeShapePath,
  type QRCodeShapePiece,
  type QRCodeVersion,
  type QRCodeVisualStyle,
  QRCodeWebP,
  type QRCodeWebPImageOptions,
  type QRCodeWebPProps,
  alignment,
  automaticSegmenter,
  canvasCenterImage,
  circle,
  customShape,
  diagonal,
  finder,
  rounded,
  svgCenterImage,
} from '@qrcodesdk/react';
```

## Documentation

- [@qrcodesdk/react](https://qrcodesdk.dev/packages/react/)
- [Customize appearance](https://qrcodesdk.dev/guides/customize/)
- [Errors](https://qrcodesdk.dev/reference/errors/)
- [Add a center image](https://qrcodesdk.dev/guides/center-images/)
- [Download or save a QR code as SVG, PNG, WebP, GIF, or JPEG](https://qrcodesdk.dev/guides/download-or-save/)
- [SVG string renderer](https://qrcodesdk.dev/reference/renderers/svg/)
- [Image element renderers](https://qrcodesdk.dev/reference/renderers/image/)
- [Canvas element renderer](https://qrcodesdk.dev/reference/renderers/canvas/)
