# @qrcodesdk/core

## 0.0.5

### Patch Changes

- 15fe5c3: Reduce the default center image `size` from `0.4` to `0.3` of the matrix width. Pass `size: 0.4` in the center image layout to keep the previous size.
- 2fd183e: Replace the nested-array matrix with an immutable `QRCodeMatrix` object containing `size`, flat row-major `modules`, and `roles`. Custom renderers must read a module at `modules[y * size + x]`. Use `QR_CODE_MODULE_ROLES` to distinguish data, finder, alignment, timing, and information modules.

  Replace string-based module and finder shapes with reusable `rounded()`, `diagonal()`, `circle()`, `finder()`, `alignment()`, and `customShape()` factories from `@qrcodesdk/core/style`. Finder options now use `ring` instead of `outer`. Add independent alignment styling and custom relative SVG paths. Remove the public `@qrcodesdk/core/drawing` entry point and drawing protocol; custom renderers consume the matrix directly.

  Create SVG center images with `svgCenterImage(source, layout)` and pass the result as `centerImage`, replacing inline source and layout objects. Replace `QRCodeSVGCenterImageOptions` with `QRCodeSVGCenterImage` and use `QRCodeCenterImageLayout` for shared layout options.

  Speed up matrix encoding, error correction, masking, and scoring. Reduce repeated shape preparation and drawing allocations, group output by color, and compact SVG paths. Keep the matrix entry point independent of styling code so unused styling stays out of consumer bundles.

  Rely on the declared TypeScript types for option object shapes and payload helper input types. Unknown option keys and incorrectly typed values no longer consistently produce `QRCodeError`; numeric bounds, colors, image sources, and custom paths still receive runtime validation.

- 21107ab: Add bundled lossless WebP, single-frame GIF, and baseline JPEG encoders for the `@qrcodesdk/browser` and `@qrcodesdk/node` image renderers. The encoders run without platform image APIs, so output is identical in every browser and in Node.

## 0.0.4

### Patch Changes

- Refreshed the package READMEs with clearer option examples and consolidated links to the documentation guides.
- `createQRCodeStyler` is no longer exported from the `@qrcodesdk/core` root entrypoint. Import it from `@qrcodesdk/core/drawing` instead:

  ```ts
  import {createQRCodeStyler} from '@qrcodesdk/core/drawing';
  ```

- Fixed the `extra-rounded` finder styling. The finder ring now keeps straight edges and a consistent one-module thickness around its corners in SVG, canvas, image, and PNG output.

## 0.0.3

### Patch Changes

- Added subpath entrypoints for direct runtime imports without a bundler: `@qrcodesdk/core/matrix`, `@qrcodesdk/core/svg`, `@qrcodesdk/core/text`, and `@qrcodesdk/core/error` as well as `@qrcodesdk/browser/canvas`, `@qrcodesdk/browser/image`, and `@qrcodesdk/browser/svg`. `@qrcodesdk/core/drawing` now also exports `createQRCodeStyler`. The root entrypoints keep exporting the same APIs and the runtime bundles are smaller.
- Removed `cubicTo` from `QRCodeStyledDrawingTarget`. The styler no longer emits cubic curves, so custom drawing targets no longer need to implement it.
- Hardened input validation:

  - `qrcode(...).matrix()` now returns a frozen matrix.
  - Payloads that are neither a string nor a number are rejected with `INVALID_PAYLOAD`.
  - The payload helpers (`emailPayload`, `phonePayload`, `smsPayload`, `geoPayload`, `wifiPayload`) reject non-object input, non-list recipients, non-string phone extensions and SMS bodies, and phone numbers without digits.
  - The SVG renderer rejects `accessibility.ariaLabel`, `accessibility.title`, and center image sources that contain characters that are invalid in XML.
  - The text renderer validates the `ansi` option and its `mode`, `foreground`, and `background` fields, and matrix option errors report the rejected field and value.

## 0.0.2

### Patch Changes

- 210c615: Replace the renderer and styling APIs with the new `matrix`, `style`, `accessibility`, and `image` option groups. Rename visual styling types, renderer image options, and CLI flags to match the new vocabulary. Add `@qrcodesdk/core/payload` for payload helpers, expose them from the core entry point, and improve rendering performance across SVG, canvas, and PNG output.
- 358292a: Generate smaller QR codes for mixed input by automatically splitting data into optimized numeric, alphanumeric, and byte segments. Add optional UTF-8 ECI encoding through the core options, builder API, and the CLI's `--eci` flag.
- 358292a: Improve rendered output accessibility and browser reliability. SVG output now uses valid title and ARIA markup, canvases can receive accessible labels, images default to an empty alt attribute, SVG download URLs remain alive until the download starts, and Angular SVG downloads safely no-op during server rendering.
- 358292a: Tighten package export surfaces by marking cross-package implementation types as internal, using explicit Angular component exports, and emitting React's shared interfaces as type-only exports. React components now also use the platform's native child replacement API.
- 358292a: Refresh generated package READMEs with clearer setup, renderer, customization, download, and runtime guidance. Expand the Angular peer range to support Angular 20 through 22.
- 358292a: Improve SVG, canvas, image, and PNG rendering performance by reusing resolved styling, grouping drawing work into color layers, compacting square modules, and reducing repeated allocation and encoding work.

## 0.0.1

### Patch Changes

- Initial release
