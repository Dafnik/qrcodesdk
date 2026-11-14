<!-- Generated from apps/docs/src/content/docs/packages/react.mdx. Run `pnpm turbo run generate-readmes --filter=docs` to update. -->

<div align="center"><img src="https://qrcodesdk.dev/favicon.svg" alt="QRCodeSDK logo" width="240"></div>

# @qrcodesdk/react

[![Open @qrcodesdk/react on npmx.dev](https://npmx.dev/api/registry/badge/name/@qrcodesdk/react?color=24272c&style=shieldsio)](https://npmx.dev/@qrcodesdk/react) ![@qrcodesdk/react version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/react?color=24272c&label=version&style=shieldsio) ![@qrcodesdk/react install size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/react?color=24272c&label=install%20size&style=shieldsio) ![@qrcodesdk/react download/mo](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/react?color=24272c&label=download%2Fmo&style=shieldsio) [![@qrcodesdk/react source code](https://npmx.dev/api/registry/badge/name/@qrcodesdk/react?color=24272c&label=source%20code&value=GitHub%20%E2%86%97&style=shieldsio)](https://github.com/Dafnik/qrcodesdk/tree/main/packages/react)

**[Documentation](https://qrcodesdk.dev) | [Live Demo](https://qrcodesdk.dev/playground/?package=react)**

React components that render QR codes as inline SVG, as PNG, WebP, GIF, or JPEG Image elements, or
as Canvas elements.

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

Import a component where you need it:

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

- `ariaLabel` names the QR code for screen readers. The link gives everyone another way to reach the
  destination.
- Without `accessibility` options, the QR code is decorative and hidden from assistive technology.
  Leave it unlabeled only when nearby content, such as this link, already explains it.
- `QRCodePNG`, `QRCodeWebP`, `QRCodeGIF`, `QRCodeJPEG`, and `QRCodeCanvas` take the same `payload`
  and `options` props. Image components also accept `accessibility.alt`.

## Version compatibility

| @qrcodesdk/react | React               |
| ---------------- | ------------------- |
| `0.x.x`          | `^18.0.0` `^19.0.0` |

## Components

Each output format has its own component. Your bundle only includes the encoders of the components
you import.

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

## Choose an image format

- `QRCodePNG` uses the browser's native PNG encoder.
- `QRCodeWebP` uses a lossless encoder bundled in the SDK. It also works in Safari and usually
  produces the smallest file.
- `QRCodeGIF` is limited to 256 colors and on-or-off transparency. Prefer PNG or WebP for
  transparent backgrounds and photographic center images.
- `QRCodeJPEG` is lossy and has no transparency. It blends transparent pixels onto a white matte by
  default. Its `quality` option ranges from 1 to 100 and defaults to 92. Use it only when a
  destination requires JPEG.

See [Image element renderers](https://qrcodesdk.dev/reference/renderers/image/) for details.

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

For PNG, WebP, GIF, JPEG, and Canvas components:

1. Load and decode a browser image.
2. Store the options with `centerImage: canvasCenterImage(image)` in state.

`QRCodeSVG` takes `svgCenterImage()` with an embedded data URL instead. See
[Add a center image](https://qrcodesdk.dev/guides/center-images/#react) for the complete React example.

## Download files

Every component except `QRCodeCanvas` exposes `download(filename?)`. Get it through a React `ref`.
The method appends the file extension when needed.

See [Download or save](https://qrcodesdk.dev/guides/download-or-save/#download-from-react) for a complete React example.
For manual downloads, see [Export a canvas manually](https://qrcodesdk.dev/guides/download-or-save/#export-a-canvas-manually).

## Server-side rendering

- `QRCodeSVG` produces runtime-neutral SVG and renders on the server.
- `QRCodePNG`, `QRCodeWebP`, `QRCodeGIF`, `QRCodeJPEG`, and `QRCodeCanvas` need browser DOM and
  Canvas APIs. On the server, they render an empty wrapper and skip downloads. They fill the wrapper
  after hydration.

### Next.js client boundary

The package entry declares `'use client'`, so Server Components can import its components directly.
Props that cross this boundary must be serializable.

Shape path objects from `@qrcodesdk/core/style`, such as `rounded()`, can cross it. Create these
values inside a client component instead:

- `finder()` and `alignment()` results, which are functions;
- center images from `svgCenterImage()` and `canvasCenterImage()`;
- `matrix.segmenter`, including `automaticSegmenter`, which is a function.

In a Server Component, import shape factories from `@qrcodesdk/core/style`, not from
`@qrcodesdk/react`. On the server, every export of a `'use client'` module is a client reference
that cannot be called.

This needs `@qrcodesdk/core` as a direct dependency, at the exact version that `@qrcodesdk/react`
depends on. Follow
[Add Core to a framework project](https://qrcodesdk.dev/getting-started/choose-your-setup/#add-core-to-a-framework-project).
Mismatched copies can draw shapes incorrectly, ignore center images, and break
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

The `options` prop groups encoding settings under `matrix`. Renderer settings, such as `style`,
`accessibility`, and `centerImage`, sit next to it:

```ts
import {type QRCodeSVGOptions, circle, finder, rounded} from '@qrcodesdk/react';

const options: QRCodeSVGOptions = {
  matrix: {errorCorrectionLevel: 'H'},
  style: {moduleSize: 8, quietZone: 4, modules: rounded(), finder: finder({center: circle()})},
  accessibility: {ariaLabel: 'Scan to open qrcodesdk.dev'},
};
```

Each component has its own options type:

| Component      | Options type             | Extra options                   |
| -------------- | ------------------------ | ------------------------------- |
| `QRCodeSVG`    | `QRCodeSVGOptions`       | None                            |
| `QRCodePNG`    | `QRCodePNGImageOptions`  | None                            |
| `QRCodeWebP`   | `QRCodeWebPImageOptions` | None                            |
| `QRCodeGIF`    | `QRCodeGIFImageOptions`  | `transparency.threshold`        |
| `QRCodeJPEG`   | `QRCodeJPEGImageOptions` | `quality`, `transparency.matte` |
| `QRCodeCanvas` | `QRCodeCanvasOptions`    | None                            |

Learn more about each group:

- [Builder and matrix](https://qrcodesdk.dev/reference/builder/) covers the fields inside `matrix`.
- [Customize appearance](https://qrcodesdk.dev/guides/customize/) covers `style`.
- [Renderer outputs](https://qrcodesdk.dev/reference/renderers/) covers output-specific options.

[Payload helpers](https://qrcodesdk.dev/reference/payloads/) and `QRCodeError` come from `@qrcodesdk/core`. To use them,
[add Core to the project](https://qrcodesdk.dev/getting-started/choose-your-setup/#add-core-to-a-framework-project).

### Mixed-mode segmentation

Mixed-mode segmentation is opt-in. Import `automaticSegmenter` from `@qrcodesdk/react` and pass it as
`matrix.segmenter`. The segmenter is a function, so in Next.js, create these options in a client
component:

```tsx
'use client';

import {QRCodeSVG, type QRCodeSVGOptions, automaticSegmenter} from '@qrcodesdk/react';

const options: QRCodeSVGOptions = {matrix: {mode: 'auto', segmenter: automaticSegmenter}};

export function OptimizedQRCode({payload}: {payload: string}) {
  return <QRCodeSVG payload={payload} options={options} />;
}
```

### Keep options stable

Components memoize their renderer on the identity of the `options` object.

- An object literal written inline in JSX is a new object on every render. The component then
  recreates the renderer and renders the QR code again. Image and Canvas components also re-encode
  and replace their element.
- Changing a property of the same object does not update the QR code. Pass a new object instead.

Define constant options outside the component. Wrap options that depend on props or state in
`useMemo`.

## Errors

Components throw `QRCodeError` for invalid payloads and options.

| Component                   | Where it throws                                     |
| --------------------------- | --------------------------------------------------- |
| `QRCodeSVG`                 | During rendering                                    |
| Image and Canvas components | Options during rendering, payloads in a `useEffect` |

To handle them:

- In the browser, place an error boundary above the component. It catches both cases.
- Error boundaries do not catch errors during server-side rendering. Validate user-controlled
  payloads before rendering.
- Wrap downloads called from an event handler in your own `try`/`catch`.

See [Check errors from framework packages](https://qrcodesdk.dev/reference/errors/#check-errors-from-framework-packages).

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
