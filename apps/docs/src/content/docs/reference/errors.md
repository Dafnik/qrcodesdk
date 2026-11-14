---
title: Errors
description: Reference for QRCodeError codes, when each one is thrown, its details and cause, and how to handle it in plain code and framework components.
docType: reference

related:
  - ../guides/troubleshooting.md
  - ./builder.mdx
  - ./payloads.md
  - ../guides/center-images.md
  - ../guides/server-output.md
---

QRCodeSDK reports invalid input and failed output with `QRCodeError`.

Branch on its `code`, never on its `message`. Messages are written for people and can change in any
release.

## QRCodeError

`QRCodeError` extends `Error`. Import it from `@qrcodesdk/core` or `@qrcodesdk/core/error`:

```ts
import {QRCodeError, type QRCodeErrorCode, QR_CODE_ERROR_CODES} from '@qrcodesdk/core';
```

| Property  | Type                                | Meaning                                                      |
| --------- | ----------------------------------- | ------------------------------------------------------------ |
| `name`    | `string`                            | Set to `'QRCodeError'` at runtime                            |
| `code`    | `QRCodeErrorCode`                   | One of the six codes below                                   |
| `message` | `string`                            | Human-readable description; do not parse it                  |
| `details` | `Readonly<Record<string, unknown>>` | Values that explain the failure; `{}` when there are none    |
| `cause`   | `unknown`                           | The underlying error, when one exists; otherwise `undefined` |

- `QR_CODE_ERROR_CODES` lists every code as a readonly array.
- `name` is typed as `string`, as inherited from `Error`, so it does not narrow the error type.
- `details` holds plain values for diagnostics. Each code below lists its keys. Treat any other key
  as informal.
- Some keys, such as `payload` and `value`, can hold user input. Check them before you write them to
  logs.

## Error codes

| Code                   | Thrown when                                                                                                   | `details`                                                                           | `cause`                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------- |
| `INVALID_PAYLOAD`      | The payload cannot be encoded as configured, or a payload helper rejects a field                              | `payload` and optional `mode`; from payload helpers, `field`, `value`, and `reason` | `undefined`               |
| `PAYLOAD_TOO_LARGE`    | No version from 1 to 40 fits the payload, or the pinned version is too small                                  | `version` for a pinned version; otherwise usually `{}`                              | `undefined`               |
| `INVALID_OPTIONS`      | A renderer, shape, pattern, or center-image option is outside its range, or the `segmenter` is not a function | `field` and `value`                                                                 | `undefined`               |
| `RENDERER_MISSING`     | `.render()` runs without a stored or supplied renderer                                                        | `{}`                                                                                | `undefined`               |
| `INVALID_IMAGE_SOURCE` | A center-image source is not usable                                                                           | `source` for `svgCenterImage()`; otherwise `{}`                                     | PNG decoder error, if any |
| `RENDER_FAILED`        | The runtime cannot produce the output                                                                         | `{}`                                                                                | Browser error, if any     |

### INVALID_PAYLOAD

The payload cannot be encoded as configured.

**Thrown by:** `.matrix()` and `.render()` when they generate the matrix, and
[payload helpers](/reference/payloads/) such as `wifiPayload()` when you call them.

**Common causes:**

- A numeric payload is negative, fractional, or not a safe integer.
- A concrete `mode` does not accept the payload, such as `mode: 'numeric'` with letters.
- A `mode` from untyped input is not one of the four documented values.
- A custom segmenter returns invalid segments. See the table below.
- A payload helper rejects one of its fields.

**Details:** `details.payload` holds the rejected payload or segment text. `details.mode` is set only
when a mode was involved:

| Failure                                                                                                       | `details`                                       |
| ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Negative, fractional, or unsafe numeric payload                                                               | `payload`                                       |
| A concrete `mode` does not accept the payload                                                                 | `payload` and the requested `mode`              |
| A segmenter returns no array or an empty array                                                                | `payload`, the original payload                 |
| A segment is empty (one segment may encode an empty payload), has an unknown mode, or splits a surrogate pair | `payload` with the segment text, and its `mode` |
| A segment's text does not fit its mode                                                                        | `payload` with the segment text, and its `mode` |
| The segment texts do not join to the original payload                                                         | `payload`, the original payload                 |

Read `details.mode` as optional. A segment with a missing or unknown mode reports that value, which
can be `undefined`.

Payload helpers set `field`, `value`, and `reason` instead. A rejected Wi-Fi `password` is replaced
with `'[REDACTED]'`.

**Fix:** Omit `mode` to let `auto` choose, or pick a mode that accepts the whole payload. Check
payloads from untyped sources before you pass them in, as shown below.

#### Payload types are not validated at runtime

`QRCodePayload` is `string | number`. TypeScript rejects other types, but at runtime the builder
checks only numbers. Any other value goes through `String()` and is encoded as text, without an
error:

| Call from JavaScript or untyped code                            | Encoded text      |
| --------------------------------------------------------------- | ----------------- |
| `qrcode().matrix()`, `qrcode(undefined)`, `.payload(undefined)` | `undefined`       |
| `qrcode(null)`                                                  | `null`            |
| `qrcode(true)`                                                  | `true`            |
| `qrcode({})`                                                    | `[object Object]` |
| `qrcode([1, 2])`                                                | `1,2`             |

The code still scans, so the mistake shows up only in the decoded text. Typical sources are a value
that has not loaded yet, a missing JSON field, or a framework binding that receives `undefined`.

Check payloads from untyped sources first:

```ts
export function isQRCodePayload(value: unknown): value is string | number {
  return (
    typeof value === 'string' ||
    (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0)
  );
}
```

- Do not use a truthiness test such as `if (payload)` instead. It drops `0` and the empty string,
  which are both valid payloads.
- Decide separately whether your application allows an empty payload.
- For data that loads asynchronously, render the QR code only after the value arrives and passes the
  check. See [The QR code scans as undefined](/guides/troubleshooting/#the-qr-code-scans-as-undefined)
  for framework examples.

### PAYLOAD_TOO_LARGE

The encoded payload does not fit any version at the chosen error correction level, or does not fit
the pinned `version`.

**Thrown by:** `.matrix()` and `.render()` when they generate the matrix.

**Details:** `details.version` when a version is pinned; otherwise usually `{}`.

**Fix:** Any of these can make the payload fit:

- Remove the `version` pin.
- Lower the error correction level.
- Enable mixed-mode segmentation.
- Shorten the payload.

See [Version and mask](/reference/builder/#version-and-mask).

### INVALID_OPTIONS

An option is outside its accepted range.

**Thrown by:** renderer, shape, pattern, and center-image factories when you call them. `.matrix()`
and `.render()` throw it for `segmenter`, and `.render()` for `dimensions`.

**Details:** `details.field` names the option and `details.value` holds the rejected value. Built-in
factories and renderers report these fields:

| `details.field`                                     | Thrown by                                                         | Accepted values                                                                                        |
| --------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `style.moduleSize`                                  | Every built-in renderer factory                                   | A positive safe integer                                                                                |
| `style.quietZone`                                   | Every built-in renderer factory                                   | A non-negative safe integer                                                                            |
| `style.foreground`, `style.background`              | SVG, Canvas, Image element, and Node.js raster renderer factories | `#RRGGBB` or `#RRGGBBAA`                                                                               |
| `ansi.foreground`, `ansi.background`                | `QRCodeTextRenderer()`                                            | `#RRGGBB` or `#RRGGBBAA`                                                                               |
| `accessibility.ariaLabel`, `accessibility.title`    | `QRCodeSVGRenderer()`                                             | Characters that XML allows; no control characters other than tab, line feed, and carriage return       |
| `quality`                                           | `QRCodeJPEGRenderer()`, `QRCodeJPEGImageRenderer()`               | An integer from 1 to 100                                                                               |
| `transparency.matte`                                | `QRCodeJPEGRenderer()`, `QRCodeJPEGImageRenderer()`               | An opaque `#RRGGBB` or `#RRGGBBFF` color                                                               |
| `transparency.threshold`                            | `QRCodeGIFRenderer()`, `QRCodeGIFImageRenderer()`                 | An integer from 0 to 256                                                                               |
| `compression.level`                                 | `QRCodePNGRenderer()` from `@qrcodesdk/node`                      | An integer from 0 to 9                                                                                 |
| `centerImage.size`                                  | `svgCenterImage()`, `canvasCenterImage()`, `rasterCenterImage()`  | A finite number greater than 0 and at most 1                                                           |
| `centerImage.padding`                               | `svgCenterImage()`, `canvasCenterImage()`, `rasterCenterImage()`  | A finite number of at least 0                                                                          |
| `circle.size`                                       | `circle()`                                                        | A number from 0.001 to 1                                                                               |
| `rounded.radius`                                    | `rounded()`                                                       | A number from 0 to 1                                                                                   |
| `diagonal.radius`                                   | `diagonal()`                                                      | A number from 0 to 1                                                                                   |
| `customShape.<piece>`, such as `customShape.module` | `customShape()`                                                   | Closed relative path data with `m`, `l`, `h`, `v`, `c`, `a`, and `z` that stays within the piece's box |
| `finder.color`, `alignment.color`                   | `finder()`, `alignment()`                                         | `#RRGGBB` or `#RRGGBBAA`                                                                               |
| `segmenter`                                         | `.matrix()` or `.render()`                                        | A function                                                                                             |
| `dimensions`                                        | `.render()` with any built-in renderer                            | See below                                                                                              |

`dimensions` is the output side length: `moduleSize × (matrix width + 2 × quietZone)`.

- It must be a positive safe integer.
- Node.js raster renderers also reject output above 67,108,864 pixels, such as 8,192 × 8,192,
  before allocating it.

**Fix:** Change the option named in `details.field` to a value from the table.

#### Matrix options are not validated at runtime

TypeScript restricts `mode`, `eci`, `errorCorrectionLevel`, `version`, and `mask` to valid values.
The builder does not check them again at runtime.

Values that bypass the types, for example from JavaScript, JSON configuration, or a type assertion,
do not throw `INVALID_OPTIONS`:

| Invalid value                                                                          | Result                                                            |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `mask` that is not an integer from `0` to `7`                                          | A matrix without a valid mask pattern, which scanners cannot read |
| `version` that is fractional or above `40`                                             | A matrix with an invalid size, which scanners cannot read         |
| `version` below `1`, or `NaN`                                                          | `PAYLOAD_TOO_LARGE`, although the payload may be small            |
| `mode` other than the four documented values                                           | `INVALID_PAYLOAD` with that `mode` in `details`                   |
| Other types, such as a string `version` or `eci`, or an unknown `errorCorrectionLevel` | Unspecified output and no error                                   |

Validate matrix options from untyped sources before you pass them to the builder:

```ts
import type {QRCodeMatrixOptions} from '@qrcodesdk/core';

export function isValidMatrixOptions(options: Record<string, unknown>): boolean {
  const {mode, eci, errorCorrectionLevel, version, mask} = options;
  return (
    (mode === undefined || ['auto', 'numeric', 'alphanumeric', 'octet'].includes(mode as string)) &&
    (eci === undefined || typeof eci === 'boolean') &&
    (errorCorrectionLevel === undefined ||
      ['L', 'M', 'Q', 'H'].includes(errorCorrectionLevel as string)) &&
    (version === undefined ||
      (Number.isInteger(version) && (version as number) >= 1 && (version as number) <= 40)) &&
    (mask === undefined ||
      (Number.isInteger(mask) && (mask as number) >= 0 && (mask as number) <= 7))
  );
}

const fromConfig: Record<string, unknown> = JSON.parse('{"version": 4, "mask": 2}');
const matrixOptions = isValidMatrixOptions(fromConfig)
  ? (fromConfig as QRCodeMatrixOptions)
  : undefined;
```

The CLI validates `--mode`, `--error-correction`, `--version`, and `--mask` itself.

### RENDERER_MISSING

`.render()` ran without a renderer.

**Thrown by:** `.render()` when no renderer was passed and none was stored with `.renderer()`.

**Details:** `{}`.

**Common causes:** Builders from `qrcode()` track the stored renderer in their type, so TypeScript
normally rejects this call. The check is lost when:

- you annotate the builder with the broad `QRCodeBuilder` type, which accepts builders with or
  without a stored renderer;
- you call the builder from JavaScript.

**Fix:** Pass the renderer directly: `.render(renderer)`.

### INVALID_IMAGE_SOURCE

A center-image source cannot be used.

| Thrown by                                      | When                                                                                       | `details` / `cause`                         |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------- |
| `svgCenterImage()`                             | The source is not an embedded `data:image/...` URL                                         | `details.source` holds the rejected value   |
| `rasterCenterImage()`                          | The bytes are not a valid PNG, exceed 16 MiB, or exceed 16,777,216 pixels (width × height) | `cause` holds the decoder error for bad PNG |
| Canvas and Image renderers, during `.render()` | The `canvasCenterImage()` source is not loaded yet or has no positive intrinsic size       | `{}`                                        |

**Fix:** Embed SVG center images as data URLs, pass valid PNG bytes to `rasterCenterImage()`, and
wait for browser images to load before rendering. See
[Add a center image](/guides/center-images/).

### RENDER_FAILED

The runtime cannot produce the output.

**Thrown by:** browser renderers during `.render()`.

**Common causes:**

- The Canvas renderer cannot get a 2D context.
- An Image element renderer cannot encode a Canvas tainted by a cross-origin center image. `cause`
  holds the browser's error, usually a `SecurityError` `DOMException`.
- The output is too large for the browser encoder: wider or higher than 16,384 pixels for WebP, or
  65,535 pixels for GIF and JPEG Image elements.

Node.js renderers never reach these size limits. They reject output above 8,192 × 8,192 pixels with
`INVALID_OPTIONS` first.

## Factory failures and render failures

Builders are lazy. `qrcode(payload)` and its option methods never throw. Errors appear at these
points:

| When it throws                                           | Codes                                                                                         |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| When you call a renderer, shape, or center-image factory | `INVALID_OPTIONS`, `INVALID_IMAGE_SOURCE` from `svgCenterImage()` or `rasterCenterImage()`    |
| When you call a payload helper                           | `INVALID_PAYLOAD`                                                                             |
| When `.matrix()` or `.render()` generates the matrix     | `INVALID_PAYLOAD`, `PAYLOAD_TOO_LARGE`, `INVALID_OPTIONS` for `segmenter`                     |
| When `.render()` runs the renderer                       | `RENDERER_MISSING`, `INVALID_OPTIONS` for dimensions, `INVALID_IMAGE_SOURCE`, `RENDER_FAILED` |

- Create renderers and center images once, at module level or when options change, so invalid
  options fail early.
- Call `.matrix()` or `.render()` in the code path that can report a payload problem to the user.

Errors that do not come from QRCodeSDK pass through unchanged. Examples: a custom segmenter or
renderer that throws, a browser renderer called where `document` does not exist, or a failed file
write.

## Handle errors by code

```ts
import {QRCodeError, QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

const renderer = QRCodeSVGRenderer();

export function renderQRCode(payload: string): {svg: string} | {error: string} {
  try {
    return {svg: qrcode(payload).render(renderer)};
  } catch (error) {
    if (!(error instanceof QRCodeError)) throw error;

    switch (error.code) {
      case 'PAYLOAD_TOO_LARGE':
        return {error: 'This text is too long for a QR code.'};
      case 'INVALID_PAYLOAD':
        return {error: 'This text cannot be encoded with the selected mode.'};
      default:
        throw error;
    }
  }
}
```

## Check errors from framework packages

The React, Vue, Svelte, and Angular packages do not re-export `QRCodeError`. You have two options.

**Use `instanceof`:** add `@qrcodesdk/core` as a direct dependency, at the same version your
framework package uses. See
[Add Core to a framework project](/getting-started/choose-your-setup/#add-core-to-a-framework-project).
With two copies of Core installed, there are two `QRCodeError` classes and `instanceof` fails.

**Check the shape:** without a direct Core dependency, test the error structurally:

```ts
type QRCodeErrorLike = Error & {readonly code: string; readonly details: Record<string, unknown>};

export function isQRCodeError(error: unknown): error is QRCodeErrorLike {
  return error instanceof Error && error.name === 'QRCodeError' && 'code' in error;
}
```

### Where components throw

| Framework | SVG component throws during | Image and Canvas components throw during                                                | Catch it in the browser with                                  |
| --------- | --------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| React     | Rendering                   | Rendering for invalid renderer options; a `useEffect` after commit for payload problems | An error boundary above the component                         |
| Vue       | Rendering, in a `computed`  | A watcher after mounting                                                                | `onErrorCaptured()` in a parent or `app.config.errorHandler`  |
| Svelte    | Rendering, in a `$derived`  | An `$effect`                                                                            | `<svelte:boundary>` around the component, Svelte 5.3 or newer |
| Angular   | An `effect()`               | An `effect()`                                                                           | Angular's `ErrorHandler`; there is no component boundary      |

- **React:** components create their renderer with `useMemo()`. Invalid renderer options, such as
  `style.moduleSize: 0`, throw during render. Payload problems throw later, in the effect that
  generates the image. Error boundaries catch both in the browser.
- **Svelte:** `@qrcodesdk/svelte` supports Svelte 5.0 and newer, but `<svelte:boundary>` needs
  5.3.0. On 5.0 to 5.2, [validate before rendering](#validate-before-rendering).
- **All frameworks:** these mechanisms catch only errors from the component's own rendering and
  effects. Wrap `download()` calls in event handlers and your own async code, such as loading a
  center image, in `try`/`catch`.

### Server-side rendering

The table above covers the browser. On the server, only SVG components generate a QR code. Image and
Canvas components render an empty wrapper and generate the code after mounting in the browser.

A server-rendered SVG component that throws behaves differently:

- React error boundaries do not catch errors during server-side rendering.
- `<svelte:boundary>` has no effect on the server by default, so the whole render fails.

Validate payloads before server-side rendering. If an error still reaches the server render, handle
it with your server framework's error page or error hook.

### Validate before rendering

For user-controlled payloads, validate before you render the component instead of relying on a
boundary. This works in the browser, on the server, and in every supported Svelte version.

[Add Core to the project](/getting-started/choose-your-setup/#add-core-to-a-framework-project), then
generate the matrix with the same matrix options the component receives:

```tsx
import {useMemo} from 'react';

import {QRCodeError, type QRCodeMatrixOptions, qrcode} from '@qrcodesdk/core';
import {QRCodeSVG, type QRCodeSVGOptions} from '@qrcodesdk/react';

const matrix: QRCodeMatrixOptions = {errorCorrectionLevel: 'Q'};
const options: QRCodeSVGOptions = {matrix, accessibility: {ariaLabel: 'Scan the entered text'}};

/** Returns a message for payloads that cannot become a QR code, or `undefined`. */
export function getPayloadError(payload: string): string | undefined {
  try {
    qrcode(payload).options(matrix).matrix();
    return undefined;
  } catch (error) {
    if (!(error instanceof QRCodeError)) throw error;

    switch (error.code) {
      case 'PAYLOAD_TOO_LARGE':
        return 'This text is too long for a QR code.';
      case 'INVALID_PAYLOAD':
        return 'This text cannot be encoded with the selected mode.';
      default:
        throw error;
    }
  }
}

export function UserQRCode({payload}: {payload: string}) {
  const payloadError = useMemo(() => getPayloadError(payload), [payload]);

  if (payloadError) return <p role="alert">{payloadError}</p>;
  return <QRCodeSVG payload={payload} options={options} />;
}
```

- `getPayloadError()` has no React dependency. Call it from a Vue `computed()`, a Svelte `$derived`,
  or an Angular `computed()`. Render the QR code only when it returns `undefined`.
- The component builds its matrix again, so the check costs one extra matrix generation.
- Renderer options such as `style` usually come from your own code, not from users. Cover them with
  tests instead.

For problems that do not throw, such as a missing center image, see
[Troubleshooting](/guides/troubleshooting/).
