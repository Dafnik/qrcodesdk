# @qrcodesdk/core

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
