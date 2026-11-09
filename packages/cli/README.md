<!-- Generated from apps/docs/src/content/docs/packages/cli.mdx. Run `pnpm turbo run generate-readmes --filter=docs` to update. -->

<div align="center"><img src="https://qrcodesdk.dev/favicon.svg" alt="QRCodeSDK logo" width="240"></div>

# @qrcodesdk/cli

[![Open @qrcodesdk/cli on npmx.dev](https://npmx.dev/api/registry/badge/name/@qrcodesdk/cli?color=24272c&style=shieldsio)](https://npmx.dev/@qrcodesdk/cli) ![@qrcodesdk/cli version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/cli?color=24272c&label=version&style=shieldsio) ![@qrcodesdk/cli install size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/cli?color=24272c&label=install%20size&style=shieldsio) ![@qrcodesdk/cli download/mo](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/cli?color=24272c&label=download%2Fmo&style=shieldsio) [![@qrcodesdk/cli source code](https://npmx.dev/api/registry/badge/name/@qrcodesdk/cli?color=24272c&label=source%20code&value=GitHub%20%E2%86%97&style=shieldsio)](https://github.com/Dafnik/qrcodesdk/tree/main/packages/cli)

**[Documentation](https://qrcodesdk.dev) | [Live Demo](https://qrcodesdk.dev/playground)**

`@qrcodesdk/cli` generates QR codes from a terminal, shell script, or CI job. The `qrc` command prints compact UTF-8 terminal text or writes SVG, PNG, WebP, GIF, and JPEG files.

Build a command and preview SVG or terminal text in the [CLI playground](https://qrcodesdk.dev/playground/?package=cli).
The playground does not preview PNG, WebP, GIF, or JPEG output, which requires Node.js APIs.

## Runtime requirements

`@qrcodesdk/cli` requires Node.js 22.12.0 or newer.

## Install

Install it globally when you want `qrc` available as a command anywhere:

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

Deno grants no permissions by default, so its commands allow reading, writing output files, and
reading environment variables such as `NO_COLOR`. Its global install also sets the command name to
`qrc` explicitly.

Yarn 2 and newer have no global install command. With Yarn, use the project dependency or
`yarn dlx` commands below.

You can also run it from a project dependency:

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

Or use it without installing it:

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

Without an output file, `qrc` packs two QR rows into each terminal line and applies ANSI colors:

```sh
qrc "https://qrcodesdk.dev"
```

For full-height, double-width `██` modules, use the `full` layout:

```sh
qrc "https://qrcodesdk.dev" --layout full
```

`qrc` disables ANSI styling automatically when standard output is redirected or `NO_COLOR` is
present. To disable it explicitly:

```sh
qrc "https://qrcodesdk.dev" --ansi off
```

Render modules entirely as ANSI-colored spaces, without UTF-8 block glyphs:

```sh
qrc "https://qrcodesdk.dev" --ansi background
```

Use `--layout compact` or `--layout full` with block output. `--ansi background` has fixed full-cell
geometry and cannot be combined with `--layout`, even when the output is a file. An explicit ANSI
mode takes precedence over `NO_COLOR` and TTY detection. File formats ignore `--layout` and `--ansi`
after validating them.

Without ANSI, a dark module is a `█` glyph in the terminal's own text color. A dark terminal theme
draws light glyphs on a dark background, so the code appears inverted and many scanners reject it.
On a dark theme, keep ANSI enabled or pass `--ansi blocks` explicitly. ANSI output paints dark
modules with `--foreground` and light modules with `--background`, whatever the theme.

## CLI defaults differ from the library

The CLI defaults to `--module-size 1` and `--quiet-zone 2` for every format, so terminal text fits in
a normal terminal window. The library renderers default to `moduleSize: 5` and `quietZone: 4`.

The same defaults apply to files. Without options, a version 1 QR code becomes a 25 × 25 pixel PNG
with a two-module quiet zone. Pass `--module-size 8 --quiet-zone 4` for a 232 × 232 pixel image with
the standard four-module quiet zone, as the file examples below do. The output width is
`module size × (matrix width + 2 × quiet zone)`.

## Write SVG files

An `.svg` output path selects SVG automatically:

```sh
qrc "https://qrcodesdk.dev" --module-size 8 --quiet-zone 4 --output qrcode.svg
```

You can also set the format explicitly:

```sh
qrc "https://qrcodesdk.dev" --format svg --module-size 8 --quiet-zone 4 --output qrcode.svg
```

SVG scales without losing sharpness, but `--module-size` still sets its `width` and `height`
attributes.

## Write PNG files

A `.png` output path selects PNG automatically:

```sh
qrc "https://qrcodesdk.dev" --module-size 8 --quiet-zone 4 --output qrcode.png
```

Or pass the format explicitly:

```sh
qrc "https://qrcodesdk.dev" --format png --module-size 8 --quiet-zone 4 --output qrcode.png
```

## Write WebP, GIF, and JPEG files

`.webp`, `.gif`, `.jpg`, and `.jpeg` output paths select WebP, GIF, and JPEG automatically. The
extension check ignores case:

```sh
qrc "https://qrcodesdk.dev" --module-size 8 --quiet-zone 4 --output qrcode.webp
qrc "https://qrcodesdk.dev" --module-size 8 --quiet-zone 4 --output qrcode.gif
qrc "https://qrcodesdk.dev" --module-size 8 --quiet-zone 4 --output qrcode.jpg --quality 85
```

WebP output is lossless and usually much smaller than PNG. GIF output has at most 256 colors and
binary transparency, so prefer PNG or WebP with a semi-transparent `--background`.

JPEG output is lossy and has no transparency. `--quality` sets the JPEG quality from 1 to 100 and
defaults to 92. Transparent pixels are blended onto `--matte`, an opaque color that defaults to
`#ffffff`. Both options are only accepted with JPEG output.

SVG, PNG, WebP, GIF, and JPEG output require `--output`. If the extension is not `.svg`, `.png`,
`.webp`, `.gif`, `.jpg`, or `.jpeg`, pass `--format` explicitly:

```sh
qrc "https://qrcodesdk.dev" --format webp --module-size 8 --quiet-zone 4 --output qrcode.image
```

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

`--mode auto`, the default, detects one encoding mode. Pass `--optimize-segments` to combine modes
when that reduces the symbol size. Concrete modes bypass optimization, and `--no-optimize-segments`
restores the default single-mode detection.

Leave mode, version, and mask on automatic selection unless a compatibility target or a layout
requires a specific encoding mode, symbol size, or mask pattern:

```sh
qrc "HELLO WORLD" \
  --mode alphanumeric \
  --version 1 \
  --mask 2 \
  --module-size 8 \
  --quiet-zone 4 \
  --output hello.svg
```

These flags fix encoding choices, not the implementation. The matrix and the output files may still
change between CLI releases, as the [release policy](https://qrcodesdk.dev/project/release-policy/#generated-artifacts)
describes. To reproduce exact files, install an exact `@qrcodesdk/cli` version and keep the files
you generated as fixtures.

Enable the UTF-8 ECI declaration:

```sh
qrc "Grüße" --eci
```

The CLI does not emit ECI by default. `--no-eci` states that default explicitly, which is useful when
a script builds its flags from variables. For the behavior and tradeoffs behind these flags, see the
[builder reference](https://qrcodesdk.dev/reference/builder/). For colors, module size, quiet zones, and scan-reliability
guidance, see [Customize appearance](https://qrcodesdk.dev/guides/customize/).

## Payloads that start with a hyphen

`qrc` reads a positional value that starts with `-` as an option. Pass such a payload in one of two
ways:

- Put every option first, then `--`, then the payload as the last argument. `qrc` reads every
  argument after `--` as a payload, so an option placed there fails with
  `Expected at most one payload argument`.
- Pass it with `--payload`, which accepts a value that starts with `-`. Like every option, it must
  come before a `--` terminator.

```sh
qrc --output negative.png -- "-42"
qrc --payload "-42" --output negative.png
```

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
| `--version <1-40>`                            | Pin a QR code version.                                                      | `auto`      |
| `--mask <0-7>`                                | Pin a QR code mask.                                                         | `auto`      |
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

Colors must be RGB or RGBA hex values. For block-glyph text output, the dark color is the ANSI
foreground and the background color is the ANSI background. With `--ansi background`, both become
cell background colors. Text output without ANSI ignores both colors.

## Interactive and automated use

`qrc` is interactive only when both standard input and standard output are terminals. Then it
prompts for missing required values: the payload, an output format that the path does not reveal, or
a file output path. Choose the output format with the arrow keys, `j`/`k`, or a number key, then
press Enter. Press Ctrl+C to cancel any prompt. In the format menu, Escape also cancels.

Scripts and CI jobs can rely on this contract:

- `qrc` never reads the payload from standard input. Pass it as `[payload]` or `--payload`;
  `echo "text" | qrc` fails with a missing-payload error.
- Missing required values fail instead of opening a prompt.
- The exit status is `0` after successful output, `--help`, or `-V`. Every failure, including invalid
  options, a payload that does not fit, a write error, or a cancelled prompt, prints
  `Error: <message>` to standard error and exits with status `1`.
- File output overwrites an existing file without asking. The parent directory must already exist.
- Successful file output writes `Wrote <path>` to standard error, so standard output stays free for
  terminal QR code text and pipelines.

A complete CI step creates the directory first and stops with a clear message on failure:

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
