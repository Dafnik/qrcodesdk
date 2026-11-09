---
title: Troubleshooting
description: Fix payloads that do not fit, invalid input, unreadable output, missing center images, tainted canvases, failed image loads, downloads, terminal output, CommonJS imports, and CLI failures.
docType: guide

related:
  - ../reference/errors.md
  - ./center-images.md
  - ./customize.md
  - ../packages/cli.mdx
---

Find the symptom below, apply the fix, and verify the result. Most failures throw a `QRCodeError`;
some problems, such as a missing center image, produce output without an error.

## Before you start

- Know which QRCodeSDK packages and versions your application installs. Run `npm ls @qrcodesdk/core`
  or `pnpm why @qrcodesdk/core` to list them.
- Read `error.code` from the thrown error. The [errors reference](/reference/errors/) lists every
  code, when it is thrown, and its `details`.

## Find the error code

Log the code and details instead of the message:

```ts
try {
  // Render the QR code.
} catch (error) {
  if (error instanceof Error && error.name === 'QRCodeError') {
    console.error((error as Error & {code: string}).code, error);
  }
  throw error;
}
```

React, Vue, Svelte, and Angular components report errors through the framework. See
[Check errors from framework packages](/reference/errors/#check-errors-from-framework-packages).

## The payload does not fit

`PAYLOAD_TOO_LARGE` means the encoded payload exceeds the capacity of every version from 1 to 40,
or of the version you pinned. Version 40 holds at most 2,953 bytes at error correction level `L`
and 1,273 bytes at level `H`. Fix it with one of these, in this order:

1. Remove a pinned `version`, so the builder can choose a larger one.
2. Shorten the payload. For URLs, drop tracking parameters or use a shorter path.
3. Lower the error correction level, unless a center image covers modules.
4. Enable [mixed-mode segmentation](/reference/builder/#optional-mixed-mode-optimization) for text
   that mixes digits, uppercase letters, and other characters.

Large symbols have small modules and are harder to scan, even when they fit. Prefer short payloads.

## The payload is rejected

`INVALID_PAYLOAD` means the payload cannot be encoded as configured:

- A concrete `mode` such as `'numeric'` or `'alphanumeric'` must accept the whole payload. Remove
  the mode, or use `'auto'`, to let the builder choose.
- Numeric payloads must be non-negative safe integers. Pass identifiers with leading zeroes, or
  values above `Number.MAX_SAFE_INTEGER`, as strings.
- A custom segmenter must return segments whose text joins to the original payload.
- A `mode` from JavaScript or JSON configuration must be `'auto'`, `'numeric'`, `'alphanumeric'`,
  or `'octet'`. Any other value throws `INVALID_PAYLOAD` with that `mode` in `details`.
- Payload helpers such as `wifiPayload()` throw when you call them. `details.field` names the field
  to fix. Their text fields, including the email and SMS `body`, reject line breaks.

## The QR code scans as undefined

A code that decodes to `undefined`, `null`, `true`, or `[object Object]` received a value that is
not a payload. TypeScript requires a `string` or `number`, but the builder does not check the type
at runtime. It converts other values to text with `String()` and encodes that text without an error.
A missing payload, as in `qrcode().matrix()` from JavaScript, encodes the text `undefined`. See
[Payload types are not validated at runtime](/reference/errors/#payload-types-are-not-validated-at-runtime).

1. Render the QR code only once the payload exists. For data that loads asynchronously, show a
   placeholder until the request completes.
2. Check values from JavaScript, JSON, or other untyped sources with the
   [`isQRCodePayload()` guard](/reference/errors/#payload-types-are-not-validated-at-runtime).
   A truthiness check such as `if (payload)` also drops `0` and the empty string.
3. Scan the result and compare the decoded text with the value you expect.

In a framework component, wrap the QR code in a conditional that uses the guard. Import
`isQRCodePayload()` into the component file. In Angular, also assign it to a class field so the
template can call it.

```tsx
// React
const url = data?.url;
return isQRCodePayload(url) ? <QRCodeSVG payload={url} /> : <p>Loading</p>;
```

```vue
<!-- Vue -->
<QRCodeSVG v-if="isQRCodePayload(url)" :payload="url" />
<p v-else>Loading</p>
```

```svelte
<!-- Svelte -->
{#if isQRCodePayload(url)}
  <QRCodeSVG payload={url} />
{:else}
  <p>Loading</p>
{/if}
```

```angular-html
<!-- Angular -->
@let payload = url();
@if (isQRCodePayload(payload)) {
  <qrcode-svg [payload]="payload" />
} @else {
  <p>Loading</p>
}
```

## Output does not scan after setting matrix options

The builder does not validate `mode`, `eci`, `errorCorrectionLevel`, `version`, or `mask` at
runtime. TypeScript rejects invalid values, but values from JavaScript, JSON, or a type assertion
reach the encoder unchecked. A `mask` of `9` or `2.5`, or a `version` of `2.5` or `41`, produces a
matrix that scanners cannot read, without an error. A `version` of `0` throws `PAYLOAD_TOO_LARGE`
even for a short payload.

Check that `version` is an integer from 1 to 40, `mask` an integer from 0 to 7,
`errorCorrectionLevel` one of `'L'`, `'M'`, `'Q'`, or `'H'`, and `eci` a boolean. Or remove the
option to use automatic selection. See
[Matrix options are not validated at runtime](/reference/errors/#matrix-options-are-not-validated-at-runtime)
for a validation function.

## The center image is missing

A center image that is silently left out usually comes from a different copy of the package that
renders it. Center-image values are opaque: each renderer only recognizes values created by its own
copy of `svgCenterImage()`, `canvasCenterImage()`, or `rasterCenterImage()`, and ignores any other
value without throwing.

1. Import the factory from the same package as the renderer or component. Framework users import
   `svgCenterImage` and `canvasCenterImage` from their framework package.
2. List the installed copies with `npm ls @qrcodesdk/core @qrcodesdk/browser` or
   `pnpm why @qrcodesdk/core`. If more than one version appears, install your direct
   `@qrcodesdk/core` or `@qrcodesdk/browser` dependency at the version your framework package depends
   on, then reinstall so the package manager keeps a single copy.
3. Pass the original value. Object spread, `JSON.parse(JSON.stringify())`, and `structuredClone()`
   create a different value that renderers do not recognize.

Two copies also break `instanceof QRCodeError`, because each copy defines its own class.

## The canvas is tainted

`RENDER_FAILED` from a PNG, WebP, GIF, or JPEG Image element renderer, with a `SecurityError` as
`cause`, means a cross-origin center image tainted the Canvas. The Canvas renderer itself does not
throw, but your later `toBlob()`, `toDataURL()`, or `getImageData()` call does.

Serve the image from your own origin, or serve it with an `Access-Control-Allow-Origin` header and
request it with CORS. Set `crossOrigin` before `src`:

```ts
const image = new Image();
image.crossOrigin = 'anonymous';
image.src = 'https://cdn.example.com/logo.png';
await image.decode();
```

## The center image fails to load

`image.decode()` rejects when the image cannot be fetched or decoded. Render the QR code without the
image, tell the user, and offer a retry. The status element announces changes to screen readers:

```html
<div id="qrcode"></div>
<p id="logo-status" role="status"></p>
<button id="logo-retry" type="button" hidden>Retry loading the logo</button>
```

```ts
import {canvasCenterImage} from '@qrcodesdk/browser';
import {QRCodePNGImageRenderer} from '@qrcodesdk/browser/png';
import {qrcode} from '@qrcodesdk/core';

const builder = qrcode('https://qrcodesdk.dev').errorCorrection('H');
const accessibility = {alt: 'QR code: scan to open qrcodesdk.dev'};
const container = document.querySelector('#qrcode');
const status = document.querySelector('#logo-status');
const retry = document.querySelector<HTMLButtonElement>('#logo-retry');

async function loadImage(url: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = url;
  await image.decode();
  return image;
}

async function renderWithLogo() {
  if (!container || !status || !retry) return;
  status.textContent = 'Loading the logo.';
  retry.hidden = true;

  try {
    const logo = await loadImage('/logo.png');
    const centerImage = canvasCenterImage(logo, {size: 0.3});
    container.replaceChildren(builder.render(QRCodePNGImageRenderer({accessibility, centerImage})));
    status.textContent = '';
  } catch {
    container.replaceChildren(builder.render(QRCodePNGImageRenderer({accessibility})));
    status.textContent = 'The logo could not be loaded. The QR code works without it.';
    retry.hidden = false;
  }
}

retry?.addEventListener('click', () => void renderWithLogo());
void renderWithLogo();
```

The same pattern works in framework components: keep a loading, ready, or failed state, render the
QR code without `centerImage` until the image is ready, and show the status next to it.

## A download does nothing

`download()` and the browser download renderers click a temporary link with a `download` attribute.
Browsers and embedding apps can block or ignore that click:

- **No user action.** Some browsers block downloads that do not follow a click or key press, and
  ask for permission before several downloads in a row. Call `download()` directly in the click
  handler, not after an `await`, a timer, or on page load.
- **Iframe sandbox.** An iframe with a `sandbox` attribute can only download files when the
  attribute includes `allow-downloads`. Embedded previews and some site builders omit it. Open the
  page in a top-level tab to confirm.
- **In-app browsers.** The browsers built into some social and messaging apps on iOS and Android
  ignore the `download` attribute, or open the image instead of saving it. Show the QR code as an
  Image element as well, so users can save it with a long press, or offer to open the page in the
  system browser.
- **Rendering failed.** `download()` throws `QRCodeError` like any render, for example
  `RENDER_FAILED` for a tainted Canvas. Wrap the call in `try`/`catch` and check the console.

## Terminal text is too large

`QRCodeTextRenderer` defaults to `moduleSize: 5` and `quietZone: 4`, the same dimensions as the
graphical renderers. A version 1 code then prints `(21 + 2 × 4) × 5 = 145` columns. For terminals,
use one character cell per module and a smaller quiet zone, as the CLI does:

```ts
import {QRCodeTextRenderer, qrcode} from '@qrcodesdk/core';

const text = qrcode('https://qrcodesdk.dev').render(
  QRCodeTextRenderer({style: {moduleSize: 1, quietZone: 2}}),
);
```

A version 1 code is then 25 columns wide and 13 lines high in the compact layout. If the code still
wraps, shorten the payload or widen the terminal.

## A terminal QR code does not scan

Without ANSI colors, `QRCodeTextRenderer` prints dark modules as `█` glyphs in the terminal's text
color, and light modules as spaces on the terminal's background. A dark terminal theme therefore
shows light modules on dark, an inverted code that many scanners reject.

- In code, pass `ansi: true` to `QRCodeTextRenderer` to paint dark modules black and light modules
  white on every theme. Use `ansi: {mode: 'background'}` when the font draws gaps between block
  glyphs.
- With the CLI, keep ANSI enabled. `qrc` turns ANSI off when standard output is not a terminal or
  `NO_COLOR` is set. Pass `--ansi blocks` or `--ansi background` to force it on.
- Keep the quiet zone. With `quietZone: 0`, the terminal background touches the code.

See the [terminal text renderer reference](/reference/renderers/text/#return-value) for the output
of each layout and ANSI mode.

## `ERR_REQUIRE_ESM` in CommonJS

QRCodeSDK packages are ES modules only. On Node.js versions older than 22.12, `require()` of an ES
module throws `ERR_REQUIRE_ESM`. Use one of these fixes:

1. Upgrade to Node.js 22.12 or newer, where `require()` loads ES modules.
2. Load the package with `await import('@qrcodesdk/core')` inside an `async` function.
3. Convert the file to an ES module, for example by renaming it to `.mjs` or setting
   `"type": "module"` in `package.json`.

TypeScript compiles `import()` to `require()` when `module` is `commonjs`. Set `module` to `node16`
or `nodenext` to keep the dynamic import. See
[Module format](/getting-started/choose-your-setup/#module-format).

## CLI commands fail

`qrc` prints `Error: <message>` to standard error and exits with status `1` on any failure:

| Message or symptom                                   | Fix                                                                                |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `Unknown option` for a payload that starts with `-`  | End the command with `-- "-42"` after all options, or pass `--payload "-42"`       |
| `Expected at most one payload argument`              | Quote a payload that contains spaces, and move every option in front of `--`       |
| `Missing QR payload` in a pipeline or CI job         | Pass the payload as an argument; `qrc` does not read standard input                |
| `ENOENT` when writing a file                         | Create the parent directory first, for example with `mkdir -p`                     |
| `Unable to infer output format from --output`        | Use a `.svg`, `.png`, `.webp`, `.gif`, `.jpg`, or `.jpeg` path, or pass `--format` |
| `--quality is only supported with jpeg output`       | Remove `--quality` and `--matte`, or write JPEG                                    |
| `--layout cannot be combined with --ansi background` | Remove `--layout`; background mode has a fixed layout                              |
| A tiny PNG, WebP, GIF, or JPEG file                  | Pass `--module-size 8 --quiet-zone 4`; the CLI defaults to `1` and `2`             |
| `QRCode: Payload too large`                          | See [The payload does not fit](#the-payload-does-not-fit)                          |

See the [CLI automation contract](/packages/cli/#interactive-and-automated-use) for exit statuses and
file behavior.

## The QR code does not scan

Valid options can still produce codes that scanners cannot read. Restore the four-module quiet zone,
increase contrast and module size, reduce the center image, and simplify shapes. See
[Scan reliability](/guides/customize/#scan-reliability).

## Next step

If none of these fixes apply, search the [GitHub issues](https://github.com/Dafnik/qrcodesdk/issues)
and open a new one with the error code, `details`, package versions, and a minimal payload.
