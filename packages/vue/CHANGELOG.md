# @qrcodesdk/vue

## 0.0.5

### Patch Changes

- 2fd183e: Expose `rounded`, `diagonal`, `circle`, `finder`, `alignment`, `customShape`, `svgCenterImage`, and `canvasCenterImage`, together with their public option and shape types, directly from each framework package.

  Update component options to use composable styles and prepared center image values. Replace string-based shapes and inline center image objects with the exported factories. Add the `QRCodeDownloadHandle` type to the Angular exports.

- 21107ab: Add `QRCodeWebP`, `QRCodeGIF`, and `QRCodeJPEG` components, which render WebP, GIF, and JPEG images, together with the `QRCodeWebPImageOptions`, `QRCodeGIFImageOptions`, and `QRCodeJPEGImageOptions` types. React, Svelte, and Vue also export `QRCodeWebPProps`, `QRCodeGIFProps`, and `QRCodeJPEGProps`.

  Rename the `QRCodeImage` component to `QRCodePNG` and `QRCodeImageOptions` to `QRCodePNGImageOptions`. React, Svelte, and Vue rename `QRCodeImageProps` to `QRCodePNGProps`. The `download()` method is available on every image component and saves the file with the matching extension.

- Updated dependencies [2fd183e]
- Updated dependencies [21107ab]
- Updated dependencies [21107ab]
- Updated dependencies [15fe5c3]
- Updated dependencies [2fd183e]
- Updated dependencies [21107ab]
  - @qrcodesdk/browser@0.0.5
  - @qrcodesdk/core@0.0.5

## 0.0.4

### Patch Changes

- Refreshed the package READMEs with clearer option examples and consolidated links to the documentation guides.
- Updated dependencies
- Updated dependencies
- Updated dependencies
  - @qrcodesdk/browser@0.0.4
  - @qrcodesdk/core@0.0.4

## 0.0.3

### Patch Changes

- Tightened the framework adapter component APIs:

  - Angular: the `payload` and `options` inputs are `readonly`, and the internal computed signals are private.
  - React: the component props no longer accept `dangerouslySetInnerHTML`. Components are annotated as pure so bundlers can tree-shake unused ones.
  - Vue: components forward wrapper attributes to the container `div` and ignore `innerHTML`, `innerText`, `textContent`, and `children`. The props type now includes HTML attributes. Components are annotated as pure so bundlers can tree-shake unused ones.
  - The README prop tables now name the `payload` prop correctly.

- 7501582: Updated docs to use the rexported types and utilities of the framework adapters instead of importing them from core and browser. (which are now direct dependencies)
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
  - @qrcodesdk/core@0.0.3
  - @qrcodesdk/browser@0.0.3

## 0.0.2

### Patch Changes

- 210c615: Replace the renderer and styling APIs with the new `matrix`, `style`, `accessibility`, and `image` option groups. Rename visual styling types, renderer image options, and CLI flags to match the new vocabulary. Add `@qrcodesdk/core/payload` for payload helpers, expose them from the core entry point, and improve rendering performance across SVG, canvas, and PNG output.
- 210c615: Add Vue 3 components for rendering QR codes as canvas, image, and SVG elements.
- Updated dependencies [358292a]
  - @qrcodesdk/browser@0.0.2
  - @qrcodesdk/core@0.0.2

## 0.0.1

### Patch Changes

- Initial release
- Updated dependencies
  - @qrcodesdk/browser@0.0.1
  - @qrcodesdk/core@0.0.1
