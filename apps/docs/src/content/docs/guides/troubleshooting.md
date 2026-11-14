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

Find your symptom, apply the fix, and check the result.

Most failures throw a `QRCodeError` with a `code`. Some problems, such as a missing center image,
produce output without any error.

| Symptom                                      | Go to                                                                                                   |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `PAYLOAD_TOO_LARGE`                          | [The payload does not fit](#the-payload-does-not-fit)                                                   |
| `INVALID_PAYLOAD`                            | [The payload is rejected](#the-payload-is-rejected)                                                     |
| Scans as `undefined` or `[object Object]`    | [The QR code scans as undefined](#the-qr-code-scans-as-undefined)                                       |
| Unreadable after setting `version` or `mask` | [Output does not scan after setting matrix options](#output-does-not-scan-after-setting-matrix-options) |
| No center image, no error                    | [The center image is missing](#the-center-image-is-missing)                                             |
| `RENDER_FAILED` with a `SecurityError`       | [The canvas is tainted](#the-canvas-is-tainted)                                                         |
| `image.decode()` rejects                     | [The center image fails to load](#the-center-image-fails-to-load)                                       |
| Clicking download does nothing               | [A download does nothing](#a-download-does-nothing)                                                     |
| Terminal output is huge or wraps             | [Terminal text is too large](#terminal-text-is-too-large)                                               |
| Terminal output doesn't scan                 | [A terminal QR code does not scan](#a-terminal-qr-code-does-not-scan)                                   |
| `ERR_REQUIRE_ESM`                            | [`ERR_REQUIRE_ESM` in CommonJS](#err_require_esm-in-commonjs)                                           |
| `qrc` prints `Error:`                        | [CLI commands fail](#cli-commands-fail)                                                                 |
| Styled code doesn't scan                     | [The QR code does not scan](#the-qr-code-does-not-scan)                                                 |

## Before you start

- Check which QRCodeSDK packages and versions you have installed: `npm ls @qrcodesdk/core` or
  `pnpm why @qrcodesdk/core`.
- Read `error.code` from the thrown error. The [errors reference](/reference/errors/) lists every
  code, when it is thrown, and its `details`.

## Find the error code

Log the code, not the message or the whole error:

```ts
try {
  // Render the QR code.
} catch (error) {
  if (error instanceof Error && error.name === 'QRCodeError') {
    console.error('QR code error:', (error as Error & {code: string}).code);
  }
  throw error;
}
```

`details` can contain user input. For example, `INVALID_PAYLOAD` puts the rejected payload in
`details.payload`. Only log a `details` key after you check that it holds nothing sensitive.

React, Vue, Svelte, and Angular components report errors through the framework. See
[Check errors from framework packages](/reference/errors/#check-errors-from-framework-packages).

## The payload does not fit

**Error:** `PAYLOAD_TOO_LARGE`

**Cause:** The payload is larger than every version from 1 to 40 can hold, or larger than the
version you pinned. Version 40 holds at most 2,953 bytes at error correction level `L`, and 1,273
bytes at level `H`.

**Fix:** Try these in order:

1. Remove a pinned `version`, so the builder can choose a larger one.
2. Shorten the payload. For URLs, drop tracking parameters or use a shorter path.
3. Lower the error correction level, unless a center image covers modules.
4. Enable [mixed-mode segmentation](/reference/builder/#optional-mixed-mode-optimization) for text
   that mixes digits, uppercase letters, and other characters.

Even when a large payload fits, its modules are small and harder to scan. Prefer short payloads.

## The payload is rejected

**Error:** `INVALID_PAYLOAD`

| Cause                                                                                       | Fix                                                                                                            |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| A concrete `mode`, such as `'numeric'`, doesn't accept the whole payload                    | Remove `mode`, or use `'auto'`                                                                                 |
| A numeric payload is negative, fractional, or above `Number.MAX_SAFE_INTEGER`               | Pass it as a string. Do the same for identifiers with leading zeroes                                           |
| A custom segmenter returns segments that don't join to the original payload                 | Fix the segmenter                                                                                              |
| `mode` from JavaScript or JSON is not `'auto'`, `'numeric'`, `'alphanumeric'`, or `'octet'` | Use one of those values. `details.mode` shows the rejected value                                               |
| A payload helper such as `wifiPayload()` rejects a field                                    | Fix the field named in `details.field`. Text fields, including email and SMS `body`, can't contain line breaks |

Payload helpers throw when you call them, not when you render.

## The QR code scans as undefined

**Symptom:** The code decodes to `undefined`, `null`, `true`, or `[object Object]`. No error is
thrown.

**Cause:** The builder received something that isn't a payload. TypeScript requires a `string` or
`number`, but the builder doesn't check the type at runtime. It converts any value with `String()`
and encodes that text. Calling `qrcode().matrix()` from JavaScript with no payload encodes the text
`undefined`. See
[Payload types are not validated at runtime](/reference/errors/#payload-types-are-not-validated-at-runtime).

**Fix:**

1. Render the QR code only once the payload exists. For data that loads asynchronously, show a
   placeholder until the request completes.
2. Check values from JavaScript, JSON, or other untyped sources with the
   [`isQRCodePayload()` guard](/reference/errors/#payload-types-are-not-validated-at-runtime). A
   truthiness check such as `if (payload)` would also drop `0` and the empty string.
3. Scan the result and compare the decoded text with what you expect.

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

**Symptom:** The code renders without an error, but scanners can't read it.

**Cause:** The builder doesn't validate `mode`, `eci`, `errorCorrectionLevel`, `version`, or `mask`
at runtime. TypeScript rejects invalid values, but values from JavaScript, JSON, or a type assertion
reach the encoder unchecked:

- A `mask` of `9` or `2.5`, or a `version` of `2.5` or `41`, produces an unreadable matrix.
- A `version` of `0` throws `PAYLOAD_TOO_LARGE`, even for a short payload.

**Fix:** Check the values, or remove the option to use automatic selection:

| Option                 | Valid values                  |
| ---------------------- | ----------------------------- |
| `version`              | Integer from 1 to 40          |
| `mask`                 | Integer from 0 to 7           |
| `errorCorrectionLevel` | `'L'`, `'M'`, `'Q'`, or `'H'` |
| `eci`                  | Boolean                       |

For a validation function, see
[Matrix options are not validated at runtime](/reference/errors/#matrix-options-are-not-validated-at-runtime).

## The center image is missing

**Symptom:** The QR code renders without its center image. No error is thrown.

**Cause:** Usually, the center image comes from a different copy of the package than the renderer.
Each renderer only recognizes values from its own copy of `svgCenterImage()`, `canvasCenterImage()`,
or `rasterCenterImage()`. It silently ignores anything else.

**Fix:**

1. Import the factory from the same package as the renderer or component. Framework users import
   `svgCenterImage` and `canvasCenterImage` from their framework package.
2. List installed copies with `npm ls @qrcodesdk/core @qrcodesdk/browser` or
   `pnpm why @qrcodesdk/core`. If more than one version appears, install your direct
   `@qrcodesdk/core` or `@qrcodesdk/browser` dependency at the version your framework package uses.
   Then reinstall, so the package manager keeps a single copy.
3. Pass the original value. Object spread, `JSON.parse(JSON.stringify())`, and `structuredClone()`
   create a new value that renderers don't recognize.

Two copies also break `instanceof QRCodeError`, because each copy defines its own class.

## The canvas is tainted

**Error:** `RENDER_FAILED` from a PNG, WebP, GIF, or JPEG Image element renderer, with a
`SecurityError` as `cause`. With the Canvas renderer, your later `toBlob()`, `toDataURL()`, or
`getImageData()` call throws instead.

**Cause:** A cross-origin center image tainted the Canvas.

**Fix:** Serve the image from your own origin, or serve it with an `Access-Control-Allow-Origin`
header and request it with CORS. Set `crossOrigin` before `src`:

```ts
const image = new Image();
image.crossOrigin = 'anonymous';
image.src = 'https://cdn.example.com/logo.png';
await image.decode();
```

## The center image fails to load

**Symptom:** `image.decode()` rejects because the image cannot be fetched or decoded.

**Fix:** Render the QR code without the image, tell the user, and offer a retry. The status element
announces changes to screen readers:

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

The same pattern works in framework components:

- Keep a loading, ready, or failed state.
- Render the QR code without `centerImage` until the image is ready.
- Show the status next to the QR code.

## A download does nothing

**Cause:** `download()` and the browser download renderers click a temporary link with a `download`
attribute. Browsers and embedding apps can block or ignore that click.

**Fix:** Check each of these:

- **No user action.** Some browsers block downloads that don't follow a click or key press. Call
  `download()` directly in the click handler, not after an `await`, a timer, or on page load. Some
  browsers also ask for permission before several downloads in a row.
- **Iframe sandbox.** An iframe with a `sandbox` attribute needs `allow-downloads` in it.
  Embedded previews and some site builders omit it. Open the page in a top-level tab to confirm.
- **In-app browsers.** Browsers inside some social and messaging apps on iOS and Android ignore
  `download`, or open the image instead of saving it. Also show the code as an Image element, so
  users can save it with a long press. Or offer to open the page in the system browser.
- **Rendering failed.** `download()` throws `QRCodeError` like any render, for example
  `RENDER_FAILED` for a tainted Canvas. Wrap the call in `try`/`catch` and check the console.

## Terminal text is too large

**Cause:** `QRCodeTextRenderer` uses the same defaults as the graphical renderers: `moduleSize: 5`
and `quietZone: 4`. A version 1 code then prints `(21 + 2 × 4) × 5 = 145` columns.

**Fix:** Use one character cell per module and a smaller quiet zone, as the CLI does:

```ts
import {QRCodeTextRenderer, qrcode} from '@qrcodesdk/core';

const text = qrcode('https://qrcodesdk.dev').render(
  QRCodeTextRenderer({style: {moduleSize: 1, quietZone: 2}}),
);
```

A version 1 code is then 25 columns wide and 13 lines high in the compact layout. If it still wraps,
shorten the payload or widen the terminal.

## A terminal QR code does not scan

**Cause:** Without ANSI colors, dark modules print as `█` in the terminal's text color, and light
modules as spaces on the terminal's background. On a dark theme, that gives an inverted code, which
many scanners reject.

**Fix:**

- **In code:** pass `ansi: true` to `QRCodeTextRenderer`. Dark modules become black and light
  modules white on every theme. If the font shows gaps between block glyphs, use
  `ansi: {mode: 'background'}`.
- **With the CLI:** keep ANSI enabled. `qrc` turns it off when standard output is not a terminal or
  `NO_COLOR` is set. Pass `--ansi blocks` or `--ansi background` to force it on.
- **Either way:** keep the quiet zone. With `quietZone: 0`, the terminal background touches the
  code.

See the [terminal text renderer reference](/reference/renderers/text/#return-value) for the output
of each layout and ANSI mode.

## `ERR_REQUIRE_ESM` in CommonJS

**Cause:** QRCodeSDK packages are ES modules only. Before Node.js 22.12, `require()` of an ES module
throws `ERR_REQUIRE_ESM`.

**Fix:** Pick one:

1. Upgrade to Node.js 22.12 or newer, where `require()` loads ES modules.
2. Load the package with `await import('@qrcodesdk/core')` inside an `async` function.
3. Convert the file to an ES module, for example by renaming it to `.mjs` or setting
   `"type": "module"` in `package.json`.

With `module: 'commonjs'`, TypeScript compiles `import()` to `require()`. Set `module` to `node16`
or `nodenext` to keep the dynamic import. See
[Module format](/getting-started/choose-your-setup/#module-format).

## CLI commands fail

On any failure, `qrc` prints `Error: <message>` to standard error and exits with status `1`.

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

Valid options can still produce a code that scanners can't read. Try these:

- Restore the four-module quiet zone.
- Increase contrast and module size.
- Make the center image smaller.
- Simplify shapes.

See [Scan reliability](/guides/customize/#scan-reliability).

## Next step

If none of these fixes apply, search the [GitHub issues](https://github.com/Dafnik/qrcodesdk/issues).
Open a new issue with the error code, `details`, package versions, and a minimal payload.
