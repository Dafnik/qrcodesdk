<!-- Generated from apps/docs/src/content/docs/packages/react-native.mdx. Run `pnpm turbo run generate-readmes --filter=docs` to update. -->

<div align="center"><img src="https://qrcodesdk.dev/favicon.svg" alt="QRCodeSDK logo" width="240"></div>

# @qrcodesdk/react-native

[![Open @qrcodesdk/react-native on npmx.dev](https://npmx.dev/api/registry/badge/name/@qrcodesdk/react-native?color=24272c&style=shieldsio)](https://npmx.dev/@qrcodesdk/react-native) ![@qrcodesdk/react-native version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/react-native?color=24272c&label=version&style=shieldsio) ![@qrcodesdk/react-native install size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/react-native?color=24272c&label=install%20size&style=shieldsio) ![@qrcodesdk/react-native download/mo](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/react-native?color=24272c&label=download%2Fmo&style=shieldsio) [![@qrcodesdk/react-native source code](https://npmx.dev/api/registry/badge/name/@qrcodesdk/react-native?color=24272c&label=source%20code&value=GitHub%20%E2%86%97&style=shieldsio)](https://github.com/Dafnik/qrcodesdk/tree/main/packages/react-native)

**[Documentation](https://qrcodesdk.dev) | [Live Demo](https://qrcodesdk.dev/playground)**

React Native components that render QR codes with
[react-native-svg](https://github.com/software-mansion/react-native-svg), or as PNG, WebP, GIF, or
JPEG images. They work in Expo and bare React Native apps on iOS and Android, without native code of
their own.

## Install

```sh
npm install @qrcodesdk/react-native react-native-svg
```

```sh
pnpm add @qrcodesdk/react-native react-native-svg
```

<details>
<summary>Other package managers</summary>

**vp**

```sh
vp add @qrcodesdk/react-native react-native-svg
```

**deno**

```sh
deno add npm:@qrcodesdk/react-native npm:react-native-svg
```

**bun**

```sh
bun add @qrcodesdk/react-native react-native-svg
```

**yarn**

```sh
yarn add @qrcodesdk/react-native react-native-svg
```

</details>

In an Expo app, install react-native-svg with `npx expo install react-native-svg` so that it matches
your SDK version.

## Quick start

```tsx
import {QRCodeSVG, type QRCodeSVGOptions} from '@qrcodesdk/react-native';

const options: QRCodeSVGOptions = {
  accessibility: {ariaLabel: 'Scan to open qrcodesdk.dev'},
};

export function App() {
  return <QRCodeSVG payload="https://qrcodesdk.dev" options={options} />;
}
```

- `ariaLabel` names the QR code for screen readers. The wrapper `View` gets `role="img"` and the
  label.
- Without `accessibility` options, the QR code is decorative and hidden from screen readers.
- `QRCodePNG`, `QRCodeWebP`, `QRCodeGIF`, and `QRCodeJPEG` take the same `payload` and `options`
  props.
- Other props, such as `style` and `testID`, apply to the wrapper `View`.

## Version compatibility

| @qrcodesdk/react-native | React Native | React     | react-native-svg |
| ----------------------- | ------------ | --------- | ---------------- |
| `0.x.x`                 | `>=0.79.0`   | `^19.0.0` | `>=15.0.0`       |

React Native 0.79 is the first release that resolves package `exports` by default, which QRCodeSDK
packages need. It corresponds to Expo SDK 53. Use the react-native-svg version that supports your
React Native release.

## Components

| Component    | Output                                   | Options type             | Extra options                   |
| ------------ | ---------------------------------------- | ------------------------ | ------------------------------- |
| `QRCodeSVG`  | react-native-svg `Svg` with `Path`s      | `QRCodeSVGOptions`       | None                            |
| `QRCodePNG`  | `Image` with a PNG `data:` URL           | `QRCodePNGImageOptions`  | None                            |
| `QRCodeWebP` | `Image` with a lossless WebP `data:` URL | `QRCodeWebPImageOptions` | None                            |
| `QRCodeGIF`  | `Image` with a GIF `data:` URL           | `QRCodeGIFImageOptions`  | `transparency.threshold`        |
| `QRCodeJPEG` | `Image` with a JPEG `data:` URL          | `QRCodeJPEGImageOptions` | `quality`, `transparency.matte` |

Every component renders its output inside a `View`. The output is `style.moduleSize` points per
module, so its size depends on the symbol version and quiet zone.

### Component props

| Prop      | Type                                       | Description                         |
| --------- | ------------------------------------------ | ----------------------------------- |
| `payload` | `QRCodePayload`                            | Text or a safe integer to encode    |
| `options` | The component's options type               | Matrix, style, and renderer options |
| `ref`     | `QRCodeImageHandle`, image components only | Reads the encoded `data:` URL       |
| Other     | `ViewProps`                                | Applied to the wrapper `View`       |

## Choose an output

- `QRCodeSVG` draws vector paths. It stays sharp at any size and is the fastest component, so prefer
  it.
- The image components draw and encode pixels in JavaScript, on the JavaScript thread. Use them when
  you need an image file, for example to save or share the QR code. Large module sizes take longer.
- `QRCodeWebP` usually produces the smallest file. Display support depends on the native image
  decoder in your app.
- `QRCodeGIF` is limited to 256 colors and on-or-off transparency. Prefer PNG or WebP for
  transparent backgrounds and photographic center images.
- `QRCodeJPEG` is lossy and has no transparency. It blends transparent pixels onto a white matte by
  default. Its `quality` option ranges from 1 to 100 and defaults to 92.

For Android apps that build their own native code, follow React Native's
[GIF and WebP setup instructions](https://reactnative.dev/docs/image#gif-and-webp-support-on-android).
They describe the optional Fresco modules to add in `android/app/build.gradle`; use versions that
match your React Native release. Check these formats in your native app before choosing them.
Use `QRCodeSVG` or `QRCodePNG` if you do not need GIF or WebP.

## Center images

`QRCodeSVG` takes `svgCenterImage()`. Its source can be a bundled asset, a `{uri}` object, or an
embedded `data:image` URL. react-native-svg loads it.

```tsx
import {QRCodeSVG, type QRCodeSVGOptions, svgCenterImage} from '@qrcodesdk/react-native';

const options: QRCodeSVGOptions = {
  matrix: {errorCorrectionLevel: 'H'},
  centerImage: svgCenterImage(require('./logo.png'), {size: 0.25}),
};

export function BrandedQRCode() {
  return <QRCodeSVG payload="https://qrcodesdk.dev" options={options} />;
}
```

The image components take `rasterCenterImage()` with the bytes of a PNG file in a `Uint8Array`. The
bytes are validated and decoded once, when you create the center image.

Layout options and error correction work as in the other packages. See
[Add a center image](https://qrcodesdk.dev/guides/center-images/).

## Save or share

The image components expose `toDataURL()` through a `ref`. It returns the encoded image as a base64
`data:` URL, which file system and sharing libraries can write to a file.

```tsx
import {useRef} from 'react';
import {Button, View} from 'react-native';

import {type QRCodeImageHandle, QRCodePNG} from '@qrcodesdk/react-native';

export function ShareableQRCode({onSave}: {onSave: (dataURL: string) => void}) {
  const qrcode = useRef<QRCodeImageHandle>(null);

  return (
    <View>
      <QRCodePNG payload="https://qrcodesdk.dev" ref={qrcode} />
      <Button title="Save" onPress={() => qrcode.current && onSave(qrcode.current.toDataURL())} />
    </View>
  );
}
```

The base64 data starts after the first comma.

## Shared options

The `options` prop groups encoding settings under `matrix`. Renderer settings, such as `style`,
`accessibility`, and `centerImage`, sit next to it:

```ts
import {type QRCodeSVGOptions, circle, finder, rounded} from '@qrcodesdk/react-native';

const options: QRCodeSVGOptions = {
  matrix: {errorCorrectionLevel: 'H'},
  style: {moduleSize: 8, quietZone: 4, modules: rounded(), finder: finder({center: circle()})},
  accessibility: {ariaLabel: 'Scan to open qrcodesdk.dev'},
};
```

- [Builder and matrix](https://qrcodesdk.dev/reference/builder/) covers the fields inside `matrix`.
- [Customize appearance](https://qrcodesdk.dev/guides/customize/) covers `style`.

Import [payload helpers](https://qrcodesdk.dev/reference/payloads/), such as `wifiPayload()`, from
`@qrcodesdk/react-native`. The `url` fields of `vcardPayload()` and `calendarPayload()` need the
`URL` API. React Native 0.79 does not implement `URL.protocol`, so those fields throw there. They
work from React Native 0.80.

Mixed-mode segmentation is opt-in. Pass `automaticSegmenter` from `@qrcodesdk/react-native` as
`matrix.segmenter`.

### Keep options stable

Components memoize their renderer on the identity of the `options` object.

- An object literal written inline in JSX is a new object on every render. The component then
  recreates the renderer and draws the QR code again. Image components also encode the image again.
- Changing a property of the same object does not update the QR code. Pass a new object instead.

Define constant options outside the component. Wrap options that depend on props or state in
`useMemo`.

## Errors

Components throw `QRCodeError` during rendering for invalid payloads and options. Place an error
boundary above the component to catch them. `QRCodeError` comes from `@qrcodesdk/core`. To use it,
[add Core to the project](https://qrcodesdk.dev/getting-started/choose-your-setup/#add-core-to-a-framework-project).

## Public API

```ts
import {
  type QRCodeAlignmentCenterShape,
  type QRCodeAlignmentOptions,
  type QRCodeAlignmentRingShape,
  type QRCodeAlignmentStyle,
  type QRCodeBaseProps,
  type QRCodeCenterImageLayout,
  type QRCodeCircleShapeOptions,
  type QRCodeColor,
  type QRCodeDataImageURL,
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
  type QRCodeImageHandle,
  type QRCodeImageOptions,
  QRCodeJPEG,
  type QRCodeJPEGImageOptions,
  type QRCodeJPEGProps,
  type QRCodeKanji,
  type QRCodeMask,
  type QRCodeMatrixOptions,
  type QRCodeMode,
  type QRCodeModulePattern,
  type QRCodeModuleShape,
  QRCodePNG,
  type QRCodePNGImageOptions,
  type QRCodePNGProps,
  type QRCodePayload,
  type QRCodeRasterCenterImage,
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
  circle,
  customShape,
  diagonal,
  finder,
  kanji,
  rasterCenterImage,
  rounded,
  svgCenterImage,
} from '@qrcodesdk/react-native';
```

## Documentation

- [@qrcodesdk/react-native](https://qrcodesdk.dev/packages/react-native/)
- [Customize appearance](https://qrcodesdk.dev/guides/customize/)
- [Errors](https://qrcodesdk.dev/reference/errors/)
- [Add a center image](https://qrcodesdk.dev/guides/center-images/)
- [Download or save a QR code as SVG, PNG, WebP, GIF, or JPEG](https://qrcodesdk.dev/guides/download-or-save/)
- [Payload helpers](https://qrcodesdk.dev/reference/payloads/)
