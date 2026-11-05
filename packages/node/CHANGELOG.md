# @qrcodesdk/node

## 0.0.5

### Patch Changes

- 21107ab: Add `QRCodeWebPRenderer`, `QRCodeGIFRenderer`, and `QRCodeJPEGRenderer`, which render lossless WebP, single-frame GIF, and baseline JPEG bytes as a `Buffer`. They accept the same style and `rasterCenterImage()` options as `QRCodePNGRenderer`, exported as `QRCodeRasterRendererOptions`, and share its 67,108,864-pixel output limit.

  GIF output supports 256 colors and binary transparency. Pixels with an alpha value below `transparency.threshold` (default `128`) become transparent. JPEG output takes a `quality` from 1 to 100 (default `92`) and blends transparent pixels onto `transparency.matte` (default `#ffffff`).

- 2fd183e: Update PNG rendering for the flat role-aware matrix and composable styles, including custom paths and independent alignment patterns. Cache rasterized shape paths across renders and combine coverage by color layer to reduce repeated work and avoid seams between adjacent pieces.

  Create center images with `rasterCenterImage(source, layout)` and pass the result as `centerImage`, replacing inline source and layout objects. The factory accepts PNG bytes as a `Uint8Array` and validates and decodes the image once for reuse by every raster renderer. Replace `QRCodePNGCenterImageOptions` with `QRCodeRasterCenterImage`.

  Reject PNG output larger than 67,108,864 pixels before allocating its pixel buffers. Rely on declared option types instead of rejecting unknown option keys at runtime.

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

- Replaced the `pngjs` dependency with a built-in PNG encoder and decoder, so `@qrcodesdk/node` no longer has runtime dependencies. PNG center image sources are limited to 16 MiB and 16,777,216 pixels.
- Updated dependencies
- Updated dependencies
- Updated dependencies
  - @qrcodesdk/core@0.0.3

## 0.0.2

### Patch Changes

- 210c615: Replace the renderer and styling APIs with the new `matrix`, `style`, `accessibility`, and `image` option groups. Rename visual styling types, renderer image options, and CLI flags to match the new vocabulary. Add `@qrcodesdk/core/payload` for payload helpers, expose them from the core entry point, and improve rendering performance across SVG, canvas, and PNG output.
- 358292a: Refresh generated package READMEs with clearer setup, renderer, customization, download, and runtime guidance. Expand the Angular peer range to support Angular 20 through 22.
- 358292a: Improve SVG, canvas, image, and PNG rendering performance by reusing resolved styling, grouping drawing work into color layers, compacting square modules, and reducing repeated allocation and encoding work.
- Updated dependencies [358292a]
  - @qrcodesdk/core@0.0.2

## 0.0.1

### Patch Changes

- Initial release
- Updated dependencies
  - @qrcodesdk/core@0.0.1
