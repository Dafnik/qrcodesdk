# @qrcodesdk/browser

## 0.0.4

### Patch Changes

- Refreshed the package READMEs with clearer option examples and consolidated links to the documentation guides.
- Fixed the `extra-rounded` finder styling. The finder ring now keeps straight edges and a consistent one-module thickness around its corners in SVG, canvas, image, and PNG output.
- Updated dependencies
- Updated dependencies
- Updated dependencies
  - @qrcodesdk/core@0.0.4

## 0.0.3

### Patch Changes

- Added subpath entrypoints for direct runtime imports without a bundler: `@qrcodesdk/core/matrix`, `@qrcodesdk/core/svg`, `@qrcodesdk/core/text`, and `@qrcodesdk/core/error` as well as `@qrcodesdk/browser/canvas`, `@qrcodesdk/browser/image`, and `@qrcodesdk/browser/svg`. `@qrcodesdk/core/drawing` now also exports `createQRCodeStyler`. The root entrypoints keep exporting the same APIs and the runtime bundles are smaller.
- The canvas renderer throws `INVALID_IMAGE_SOURCE` when `centerImage` is configured without an image source. The image renderer throws `RENDER_FAILED` with a descriptive message when the canvas is tainted by a cross-origin center image.
- Updated dependencies
- Updated dependencies
- Updated dependencies
  - @qrcodesdk/core@0.0.3

## 0.0.2

### Patch Changes

- 210c615: Replace the renderer and styling APIs with the new `matrix`, `style`, `accessibility`, and `image` option groups. Rename visual styling types, renderer image options, and CLI flags to match the new vocabulary. Add `@qrcodesdk/core/payload` for payload helpers, expose them from the core entry point, and improve rendering performance across SVG, canvas, and PNG output.
- 358292a: Improve rendered output accessibility and browser reliability. SVG output now uses valid title and ARIA markup, canvases can receive accessible labels, images default to an empty alt attribute, SVG download URLs remain alive until the download starts, and Angular SVG downloads safely no-op during server rendering.
- 358292a: Refresh generated package READMEs with clearer setup, renderer, customization, download, and runtime guidance. Expand the Angular peer range to support Angular 20 through 22.
- 358292a: Improve SVG, canvas, image, and PNG rendering performance by reusing resolved styling, grouping drawing work into color layers, compacting square modules, and reducing repeated allocation and encoding work.
- Updated dependencies [358292a]
  - @qrcodesdk/core@0.0.2

## 0.0.1

### Patch Changes

- Initial release
- Updated dependencies
  - @qrcodesdk/core@0.0.1
