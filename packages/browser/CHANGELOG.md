# @qrcodesdk/browser

## 0.0.5

### Patch Changes

- 2fd183e: Update Canvas, Image, and download renderers for the flat role-aware matrix and composable styles from `@qrcodesdk/core/style`. Reuse prepared paths and group drawing by color to reduce repeated rendering work.

  Create Canvas and Image center images with `canvasCenterImage(source, layout)` and pass the result as `centerImage`, replacing inline source and layout objects. Replace `QRCodeCanvasCenterImageOptions` with `QRCodeCanvasCenterImage`.

  Keep SVG download URLs alive for 40 seconds so browsers can start asynchronous downloads. Snapshot download options when creating the renderer, trim filenames, and use `qrcode` when the filename is empty or whitespace.

  Rely on declared option types instead of rejecting unknown keys and incorrectly typed accessibility values at runtime.

- 21107ab: Create Canvas contexts with `willReadFrequently` so they are software-backed. Canvas output and the PNG, WebP, GIF, and JPEG images read back from it now have the same pixels with or without GPU acceleration.
- 21107ab: Add `QRCodeWebPImageRenderer`, `QRCodeGIFImageRenderer`, and `QRCodeJPEGImageRenderer`, which render an image element backed by a lossless WebP, single-frame GIF, or baseline JPEG data URL. Each renderer is also available from its own `@qrcodesdk/browser/webp`, `@qrcodesdk/browser/gif`, and `@qrcodesdk/browser/jpeg` entry point.

  GIF output supports 256 colors and binary transparency. Pixels with an alpha value below `transparency.threshold` (default `128`) become transparent. JPEG output takes a `quality` from 1 to 100 (default `92`) and blends transparent pixels onto `transparency.matte` (default `#ffffff`).

  Rename `QRCodeImageRenderer` to `QRCodePNGImageRenderer` and `QRCodeImageOptions` to `QRCodePNGImageOptions`, and add the `@qrcodesdk/browser/png` entry point. `QRCodeDownloadImageRenderer` now downloads the output of any image renderer and picks the `.png`, `.webp`, `.gif`, or `.jpg` extension from the image's data URL.

- Updated dependencies [15fe5c3]
- Updated dependencies [2fd183e]
- Updated dependencies [21107ab]
  - @qrcodesdk/core@0.0.5

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
