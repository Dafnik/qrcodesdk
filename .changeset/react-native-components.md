---
'@qrcodesdk/react-native': patch
---

Add `@qrcodesdk/react-native`, which renders QR codes in Expo and bare React Native apps on iOS and Android without native code of its own. It needs React 19, React Native 0.79 or newer, and react-native-svg 15 or newer.

`QRCodeSVG` draws the QR code as react-native-svg paths. `QRCodePNG`, `QRCodeWebP`, `QRCodeGIF`, and `QRCodeJPEG` encode the image in JavaScript and show it in an `Image` as a `data:` URL. Every component takes a `payload` and an `options` prop and renders inside a `View` that receives the other `View` props. With `accessibility.ariaLabel`, the wrapper gets `role="img"` and the label; without it, the QR code is hidden from screen readers. The image components expose `toDataURL()` through a `ref` of type `QRCodeImageHandle` to save or share the image. `QRCodeGIF` takes `transparency.threshold`, and `QRCodeJPEG` takes `quality` and `transparency.matte`.

`QRCodeSVG` takes `svgCenterImage()` with a bundled asset, a `{uri}` object, or an embedded raster data URL; an embedded SVG data URL throws `QRCodeError` with code `INVALID_IMAGE_SOURCE`. The image components take `rasterCenterImage()` with PNG bytes in a `Uint8Array`. Components throw `QRCodeError` during rendering for invalid payloads and options.

The package re-exports the style helpers, `kanji`, `automaticSegmenter`, `microQR`, `rMQR`, and the payload helpers, together with their types, from `@qrcodesdk/core`.
