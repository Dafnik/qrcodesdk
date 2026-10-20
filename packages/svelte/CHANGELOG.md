# @qrcodesdk/svelte

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
- 210c615: Add Svelte 5 components for rendering QR codes as canvas, image, and SVG elements.
- Updated dependencies [358292a]
  - @qrcodesdk/browser@0.0.2
  - @qrcodesdk/core@0.0.2

## 0.0.1

### Patch Changes

- Initial release with `QRCodeSVG`, `QRCodeImage`, and `QRCodeCanvas` components.
