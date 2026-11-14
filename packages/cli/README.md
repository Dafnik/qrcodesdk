<!-- Generated from apps/docs/src/content/docs/packages/cli.mdx. Run `pnpm turbo run generate-readmes --filter=docs` to update. -->

<div align="center"><img src="https://qrcodesdk.dev/favicon.svg" alt="QRCodeSDK logo" width="240"></div>

# @qrcodesdk/cli

[![Open @qrcodesdk/cli on npmx.dev](https://npmx.dev/api/registry/badge/name/@qrcodesdk/cli?color=24272c&style=shieldsio)](https://npmx.dev/@qrcodesdk/cli) ![@qrcodesdk/cli version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/cli?color=24272c&label=version&style=shieldsio) ![@qrcodesdk/cli install size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/cli?color=24272c&label=install%20size&style=shieldsio) ![@qrcodesdk/cli download/mo](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/cli?color=24272c&label=download%2Fmo&style=shieldsio) [![@qrcodesdk/cli source code](https://npmx.dev/api/registry/badge/name/@qrcodesdk/cli?color=24272c&label=source%20code&value=GitHub%20%E2%86%97&style=shieldsio)](https://github.com/Dafnik/qrcodesdk/tree/main/packages/cli)

**[Documentation](https://qrcodesdk.dev) | [Live Demo](https://qrcodesdk.dev/playground)**

`@qrcodesdk/cli` generates QR codes from a terminal, shell script, or CI job. The `qrc` command prints compact UTF-8 terminal text or writes SVG, PNG, WebP, GIF, and JPEG files.

Build a command and preview it in the [CLI playground](https://qrcodesdk.dev/playground/?package=cli). The playground
previews SVG and terminal text only. PNG, WebP, GIF, and JPEG need Node.js APIs.

## Runtime requirements

`@qrcodesdk/cli` requires Node.js 22.12.0 or newer.

## Install

Install it globally to use `qrc` anywhere:

```sh
npm install -g @qrcodesdk/cli
```

```sh
pnpm add -g @qrcodesdk/cli
```

<details>
<summary>Other package managers</summary>

**vp**

```sh
vp install -g @qrcodesdk/cli
```

**deno**

```sh
deno install --global --allow-read --allow-write --allow-env --name qrc npm:@qrcodesdk/cli
```

**bun**

```sh
bun add -g @qrcodesdk/cli
```

</details>

- **Deno** grants no permissions by default. Its commands allow reading, writing output files, and
  reading environment variables such as `NO_COLOR`. The global install also names the command `qrc`.
- **Yarn 2 and newer** have no global install. Use a project dependency or `yarn dlx` instead.

Or add it to a project and run it from there:

```sh
npm install -D @qrcodesdk/cli
```

```sh
pnpm add -D @qrcodesdk/cli
```

<details>
<summary>Other package managers</summary>

**vp**

```sh
vp add -D @qrcodesdk/cli
```

**deno**

```sh
deno add --dev npm:@qrcodesdk/cli
```

**bun**

```sh
bun add -D @qrcodesdk/cli
```

**yarn**

```sh
yarn add -D @qrcodesdk/cli
```

</details>

```sh
npx qrc "https://qrcodesdk.dev"
```

```sh
pnpm exec qrc "https://qrcodesdk.dev"
```

<details>
<summary>Other package managers</summary>

**vp**

```sh
vp exec qrc "https://qrcodesdk.dev"
```

**deno**

```sh
deno x --allow-read --allow-write --allow-env npm:@qrcodesdk/cli/qrc "https://qrcodesdk.dev"
```

**bun**

```sh
bunx qrc "https://qrcodesdk.dev"
```

**yarn**

```sh
yarn qrc "https://qrcodesdk.dev"
```

</details>

Or run it without installing:

```sh
npx @qrcodesdk/cli "https://qrcodesdk.dev"
```

```sh
pnpm dlx @qrcodesdk/cli "https://qrcodesdk.dev"
```

<details>
<summary>Other package managers</summary>

**vp**

```sh
vp dlx @qrcodesdk/cli "https://qrcodesdk.dev"
```

**deno**

```sh
deno x --allow-read --allow-write --allow-env npm:@qrcodesdk/cli/qrc "https://qrcodesdk.dev"
```

**bun**

```sh
bunx @qrcodesdk/cli "https://qrcodesdk.dev"
```

**yarn**

```sh
yarn dlx @qrcodesdk/cli "https://qrcodesdk.dev"
```

</details>

## Print terminal text

Without `--output`, `qrc` prints the code to the terminal. It packs two QR rows into each line and
adds ANSI colors:

```sh
qrc "https://qrcodesdk.dev"
```

For full-height, double-width `██` modules, use the `full` layout:

```sh
qrc "https://qrcodesdk.dev" --layout full
```

### ANSI colors

`--ansi` controls color output:

| Mode         | Output                                                         |
| ------------ | -------------------------------------------------------------- |
| `blocks`     | UTF-8 block glyphs with ANSI colors                            |
| `background` | ANSI-colored spaces, without block glyphs                      |
| `off`        | Plain block glyphs in the terminal's own text color, no colors |

Without `--ansi`, `qrc` uses `blocks`. It switches to `off` when standard output is redirected or
`NO_COLOR` is set. An explicit `--ansi` mode overrides both.

```sh
qrc "https://qrcodesdk.dev" --ansi off
qrc "https://qrcodesdk.dev" --ansi background
```

- `--layout` works only with block output. `--ansi background` has a fixed full-cell layout and
  cannot be combined with `--layout`, even when writing a file.
- File formats validate `--layout` and `--ansi`, then ignore them.

**Dark terminal themes:** without ANSI, dark modules use the terminal's text color. On a dark theme
that draws light modules on a dark background. The code looks inverted and many scanners reject it.
Keep ANSI on, or pass `--ansi blocks`. ANSI output always paints dark modules with `--foreground`
and light modules with `--background`.

## CLI defaults differ from the library

|             | CLI | Library renderers |
| ----------- | --- | ----------------- |
| Module size | `1` | `5`               |
| Quiet zone  | `2` | `4`               |

The small CLI defaults keep terminal text inside a normal window. They apply to files too: without
options, a version 1 code becomes a 25 × 25 pixel PNG.

For files, pass `--module-size 8 --quiet-zone 4`. That gives a 232 × 232 pixel image with the
standard four-module quiet zone. The examples below use these values.

The output width is `module size × (matrix width + 2 × quiet zone)`.

## Write image files

Pass `--output`. The file extension selects the format, ignoring case:

| Extension       | Format | Notes                                                         |
| --------------- | ------ | ------------------------------------------------------------- |
| `.svg`          | SVG    | Scales without losing sharpness                               |
| `.png`          | PNG    | Lossless                                                      |
| `.webp`         | WebP   | Lossless, usually much smaller than PNG                       |
| `.gif`          | GIF    | At most 256 colors; each pixel is fully transparent or opaque |
| `.jpg`, `.jpeg` | JPEG   | Lossy, no transparency                                        |

```sh
qrc "https://qrcodesdk.dev" --module-size 8 --quiet-zone 4 --output qrcode.svg
qrc "https://qrcodesdk.dev" --module-size 8 --quiet-zone 4 --output qrcode.png
qrc "https://qrcodesdk.dev" --module-size 8 --quiet-zone 4 --output qrcode.webp
qrc "https://qrcodesdk.dev" --module-size 8 --quiet-zone 4 --output qrcode.gif
qrc "https://qrcodesdk.dev" --module-size 8 --quiet-zone 4 --output qrcode.jpg --quality 85
```

For any other extension, set the format with `--format`:

```sh
qrc "https://qrcodesdk.dev" --format webp --module-size 8 --quiet-zone 4 --output qrcode.image
```

- SVG output is scalable, but `--module-size` still sets its `width` and `height` attributes.
- For a semi-transparent `--background`, prefer PNG or WebP. GIF keeps only full transparency.
- JPEG has two extra options, accepted only with JPEG output:
  - `--quality` sets the quality from 1 to 100. Default: `92`.
  - `--matte` sets the opaque color that transparent pixels blend onto. Default: `#ffffff`.

## Configure generated files

```sh
qrc "https://qrcodesdk.dev" \
  --output qrcode.svg \
  --error-correction H \
  --module-size 8 \
  --quiet-zone 4 \
  --foreground '#111827' \
  --background '#ffffff' \
  --aria-label 'Scan to open qrcodesdk.dev'
```

For colors, module size, quiet zones, and scan reliability, see
[Customize appearance](https://qrcodesdk.dev/guides/customize/). For how the encoding flags below work, see the
[builder reference](https://qrcodesdk.dev/reference/builder/).

### Encoding mode

- `--mode auto`, the default, picks one encoding mode for the whole payload.
- `--optimize-segments` combines modes when that makes the symbol smaller.
- `--no-optimize-segments` restores single-mode detection.
- A concrete mode, such as `--mode alphanumeric`, skips optimization.

### Version and mask

Leave mode, version, and mask automatic. Pin them only when a compatibility target or a layout
needs a specific mode, symbol size, or mask:

```sh
qrc "HELLO WORLD" \
  --mode alphanumeric \
  --version 1 \
  --mask 2 \
  --module-size 8 \
  --quiet-zone 4 \
  --output hello.svg
```

These flags fix encoding choices, not the implementation. Output files may still change between CLI
releases, as the [release policy](https://qrcodesdk.dev/project/release-policy/#generated-artifacts) describes. To
reproduce exact files, install an exact `@qrcodesdk/cli` version and keep your generated files as
fixtures.

### UTF-8 ECI

ECI is off by default. Pass `--eci` to declare UTF-8 explicitly:

```sh
qrc "Grüße" --eci
```

`--no-eci` states the default. It helps when a script builds its flags from variables.

## Payloads that start with a hyphen

`qrc` reads a positional value that starts with `-` as an option. Pass such a payload in one of two
ways:

```sh
qrc --output negative.png -- "-42"
qrc --payload "-42" --output negative.png
```

- **After `--`:** put every option first, then `--`, then the payload. Everything after `--` counts
  as a payload, so an option placed there fails with `Expected at most one payload argument`.
- **With `--payload`:** it accepts values that start with `-`. Like every option, it must come
  before a `--`.

## Options

| Option                                        | Description                                                                 | Default     |
| --------------------------------------------- | --------------------------------------------------------------------------- | :---------- |
| `[payload]`                                   | Positional QR code payload. If it starts with `-`, end with `-- <payload>`. | -           |
| `--payload <value>`                           | QR code payload, equivalent to positional `[payload]`.                      | -           |
| `-h, --help`                                  | Print usage and every option, then exit with status 0.                      | -           |
| `-V`                                          | Print the installed CLI package version.                                    | -           |
| `--format <text\|svg\|png\|webp\|gif\|jpeg>`  | Output format, in lowercase. Inferred from the output path.                 | `text`      |
| `-o, --output <path>`                         | Required output path for SVG, PNG, WebP, GIF, and JPEG.                     | -           |
| `--mode <auto\|numeric\|alphanumeric\|octet>` | QR code mode, in lowercase.                                                 | `auto`      |
| `--error-correction <L\|M\|Q\|H>`             | Error correction level. Lowercase letters are accepted.                     | `M`         |
| `--version <1-40>`                            | Pin a QR code version.                                                      | Automatic   |
| `--mask <0-7>`                                | Pin a QR code mask.                                                         | Automatic   |
| `--optimize-segments`                         | Optimize mixed-mode segments in auto mode.                                  | off         |
| `--no-optimize-segments`                      | Use single-mode detection in auto mode.                                     | -           |
| `--eci`                                       | Emit UTF-8 ECI assignment 26 for octet segments.                            | off         |
| `--no-eci`                                    | Do not emit UTF-8 ECI assignment 26.                                        | -           |
| `--module-size <number>`                      | Module size as a positive integer.                                          | `1`         |
| `--quiet-zone <number>`                       | Quiet zone as a non-negative integer.                                       | `2`         |
| `--layout <compact\|full>`                    | Text block layout. Validated, then ignored by file formats.                 | `compact`   |
| `--ansi <off\|blocks\|background>`            | Explicit ANSI output mode. Validated, then ignored by file formats.         | Environment |
| `--foreground <#rrggbb[aa]>`                  | Color of every dark module.                                                 | `#000000`   |
| `--background <#rrggbb[aa]>`                  | Color behind the code, including the quiet zone.                            | `#ffffff`   |
| `--quality <1-100>`                           | JPEG quality. Other formats reject it.                                      | `92`        |
| `--matte <#rrggbb>`                           | Opaque color for transparent pixels. Other formats reject it.               | `#ffffff`   |
| `--aria-label <text>`                         | SVG `aria-label` accessible name. Ignored by other formats.                 | -           |
| `--title <text>`                              | SVG child `<title>` text. Ignored by other formats.                         | -           |

Colors must be RGB or RGBA hex values. In terminal text:

- Block glyphs use `--foreground` as the ANSI foreground and `--background` as the ANSI background.
- `--ansi background` uses both as cell background colors.
- Without ANSI, both colors are ignored.

## Interactive and automated use

### Interactive prompts

`qrc` is interactive only when both standard input and standard output are terminals. It then asks
for missing values:

- the payload;
- the output format, if the path does not reveal it;
- the output path, for file formats.

In the format menu, choose with the arrow keys, `j`/`k`, or a number key, then press Enter. Press
Ctrl+C to cancel any prompt. Escape also cancels the format menu.

### Scripts and CI

Scripts and CI jobs can rely on this behavior:

- `qrc` never reads the payload from standard input. Pass it as `[payload]` or `--payload`.
  `echo "text" | qrc` fails with a missing-payload error.
- Missing required values fail instead of opening a prompt.
- Success, `--help`, and `-V` exit with status `0`.
- Every failure prints `Error: <message>` to standard error and exits with status `1`. This includes
  invalid options, a payload that does not fit, a write error, and a cancelled prompt.
- File output overwrites existing files without asking. The parent directory must already exist.
- After writing a file, `qrc` prints `Wrote <path>` to standard error. Standard output stays free for
  terminal QR code text and pipelines.

This CI step creates the directory first and stops with a clear message on failure:

```sh
set -eu

mkdir -p artifacts

if ! qrc \
  --payload "https://qrcodesdk.dev" \
  --format png \
  --module-size 8 \
  --quiet-zone 4 \
  --output artifacts/qrcode.png; then
  echo "QR code generation failed" >&2
  exit 1
fi
```

See [Troubleshooting](https://qrcodesdk.dev/guides/troubleshooting/#cli-commands-fail) for common CLI errors.

## Documentation

- [@qrcodesdk/cli](https://qrcodesdk.dev/packages/cli/)
- [Choose your setup](https://qrcodesdk.dev/getting-started/choose-your-setup/)
- [Troubleshooting](https://qrcodesdk.dev/guides/troubleshooting/)
- [Customize appearance](https://qrcodesdk.dev/guides/customize/)
- [Terminal text renderer](https://qrcodesdk.dev/reference/renderers/text/)
- [SVG string renderer](https://qrcodesdk.dev/reference/renderers/svg/)
- [@qrcodesdk/node](https://qrcodesdk.dev/packages/node/)
