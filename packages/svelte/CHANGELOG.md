# @qrcodesdk/svelte

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
