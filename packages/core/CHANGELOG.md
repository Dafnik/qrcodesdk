# @qrcodesdk/core

## 0.0.6

### Patch Changes

- 61b4d56: Add opt-in QR code Kanji mode, which packs each double-byte Shift JIS character into 13 bits instead of UTF-8 bytes, so Japanese text fits smaller symbols. Import the Shift JIS table from the new `@qrcodesdk/core/kanji` entry point and pass it as the `kanji` matrix option or with `.kanji(kanji)`. The table adds about 13 kB gzipped and stays out of bundles that don't import it.

  With the table, `mode: 'kanji'` forces Kanji mode, `auto` mode picks Kanji mode when every character fits, and `automaticSegmenter` combines Kanji segments with numeric, alphanumeric, and octet segments. Custom segmenters receive the table as `kanji` in their options and can return `{mode: 'kanji'}` segments. Kanji mode only accepts characters that decode back unchanged, and Kanji segments never get an ECI header.

  Kanji mode or Kanji segments without the table throw `QRCodeError` with code `INVALID_OPTIONS`; characters outside the table throw `INVALID_PAYLOAD`. `QRCodeEncodingMode` and `QRCodeMode` now include `'kanji'`, so exhaustive `switch` statements over them need a new case. The new `QRCodeKanji` type describes the table.

- 0d39229: Add Micro QR codes (M1 to M4) through the new `@qrcodesdk/core/micro` entry point. Pass `microQR()` as the `symbol` matrix option, such as `qrcode('12345').options({symbol: microQR()})`, to generate the smallest Micro QR code that holds the payload. `microQR()` accepts `version` (`'M1'` to `'M4'`), `mask` (`0` to `3`), and `fallback`, which generates a standard QR code when no Micro QR code can hold the payload. Applications that do not import `@qrcodesdk/core/micro` do not bundle the Micro QR encoder.

  Micro QR codes support numeric, alphanumeric, octet, and, with the `kanji` table from `@qrcodesdk/core/kanji`, Kanji mode in M3 and M4. They support levels `L` and `M`, and `Q` in M4. M1 only detects errors, so it is used only when requested with `version: 'M1'`. Setting `version`, `mask`, `eci`, or `segmenter` next to a Micro QR symbol throws `QRCodeError` with code `INVALID_OPTIONS`.

  `QRCodeMatrixOptions` is now the union of `QRCodeStandardMatrixOptions` and `QRCodeSymbolMatrixOptions`. Interfaces can no longer extend `QRCodeMatrixOptions`; extend `QRCodeStandardMatrixOptions` instead, and use it when deriving types with `Omit` or `Pick`. Add the `QRCodeSymbol`, `QRCodeMicroVersion`, `QRCodeMicroMask`, and `QRCodeMicroOptions` types.

  The default `style.quietZone` of the built-in renderers is now 2 modules for Micro QR codes and stays 4 modules for standard QR codes. `finder()` styles only the finder patterns that a symbol contains.

- cb8c78a: Add the `vcardPayload()` and `calendarPayload()` payload helpers to `@qrcodesdk/core/payload`. `vcardPayload()` serializes a contact as a vCard 3.0 payload with a formatted name and optional structured name, organization, title, phones, emails, addresses, URL, and note. `calendarPayload()` serializes an event as an iCalendar 2.0 `VEVENT` with a UID, timestamp, summary, start, end, and optional location, description, and URL. Set `allDay: true` to pass `YYYY-MM-DD` dates instead of date-times; the end is exclusive.

  Both helpers escape text values, fold long lines, and throw `QRCodeError` with code `INVALID_PAYLOAD` for invalid fields, such as line breaks in single-line fields, unsupported control characters, non-HTTP(S) URLs, date-times without seconds or an explicit offset, or an end that is not later than the start. Errors for nested fields use paths such as `addresses[0].postalCode` in `details.field`. URL fields require the standard `URL` API. Add the `QRCodeVCardPayload`, `QRCodeVCardName`, `QRCodeVCardPhone`, `QRCodeVCardEmail`, `QRCodeVCardAddress`, and `QRCodeCalendarPayload` types.

- 526d0e6: Breaking: `QRCodeMatrix` describes its dimensions with `width` (modules per row) and `height` (rows) instead of `size`. Standard and Micro QR matrices are square, so both values are equal, and the module at column `x` and row `y` is at index `y * width + x`. Replace `matrix.size` with `matrix.width`, and loop over `height` for rows in custom renderers so they also draw rectangular symbols.

  The SVG and text renderers draw rectangular matrices, the default `style.quietZone` is 2 modules for every symbol shorter than 21 modules, and a center image is a square sized from the shorter side of the symbol and centered on both axes. The `dimensions` check of the built-in renderers applies to the output width and height separately.

- 526d0e6: Add rectangular Micro QR (rMQR) codes (ISO/IEC 23941) through the new `@qrcodesdk/core/rmqr` entry point. Pass `rMQR()` as the `symbol` matrix option, such as `qrcode('LOT-2026-0042').options({symbol: rMQR()})`, to generate the rMQR code with the fewest modules that holds the payload. `rMQR({version: 'R7'})` selects the narrowest code of a height, from `'R7'` to `'R17'`, and `rMQR({version: 'R7x59'})` selects an exact version, from `'R7x43'` to `'R17x139'`. Applications that do not import `@qrcodesdk/core/rmqr` do not bundle the rMQR encoder.

  rMQR codes are 7 to 17 modules high and 27 to 139 modules wide and hold up to 361 digits, 219 alphanumeric characters, 150 bytes, or 92 Kanji characters. They encode one numeric, alphanumeric, octet, or, with the `kanji` table, Kanji segment at the error-correction levels `M` and `H`. Levels `L` and `Q`, and `version`, `mask`, `eci`, or `segmenter` next to an rMQR symbol, throw `QRCodeError` with code `INVALID_OPTIONS`. Add the `QRCodeRMQRVersion`, `QRCodeRMQRHeight`, and `QRCodeRMQROptions` types.

  rMQR codes reuse the standard module roles: the finder sub-pattern has the alignment roles, so `alignment()` styles it, and it stays square when `modules` has a shape, because scanners locate the code with it.

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
