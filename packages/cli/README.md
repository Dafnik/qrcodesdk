<!-- Generated from apps/docs/src/content/docs/packages/cli.mdx. Run `pnpm turbo run generate-readmes --filter=docs` to update. -->

<div align="center"><img src="https://qrcodesdk.dev/favicon.svg" alt="QRCodeSDK logo" width="240"></div>

# @qrcodesdk/cli

[![Open @qrcodesdk/cli on npmx.dev](https://npmx.dev/api/registry/badge/name/@qrcodesdk/cli?color=24272c&style=shieldsio)](https://npmx.dev/@qrcodesdk/cli) ![@qrcodesdk/cli version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/cli?color=24272c&label=version&style=shieldsio) ![@qrcodesdk/cli install size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/cli?color=24272c&label=install%20size&style=shieldsio) ![@qrcodesdk/cli download/mo](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/cli?color=24272c&label=download%2Fmo&style=shieldsio) [![@qrcodesdk/cli source code](https://npmx.dev/api/registry/badge/name/@qrcodesdk/cli?color=24272c&label=source%20code&value=GitHub%20%E2%86%97&style=shieldsio)](https://github.com/Dafnik/qrcodesdk/tree/main/packages/cli)

**[Documentation](https://qrcodesdk.dev) | [Live Demo](https://qrcodesdk.dev/playground)**

`@qrcodesdk/cli` generates QR codes from a terminal, shell script, or CI job. The `qrc` command prints compact UTF-8 terminal text or writes SVG, PNG, WebP, GIF, and JPEG files.

Build a command and preview SVG or terminal text in the [CLI playground](https://qrcodesdk.dev/playground/?package=cli).
The playground does not preview PNG, WebP, GIF, or JPEG output, which requires Node.js APIs.

## Runtime requirements

`@qrcodesdk/cli` requires Node 22.12.0 or newer.

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
deno install --global @qrcodesdk/cli
```

**bun**

```sh
bun add -g @qrcodesdk/cli
```

**yarn**

```sh
yarn global add @qrcodesdk/cli
```

</details>

You can also run it from a project dependency.

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
deno add --dev @qrcodesdk/cli
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
deno x npm:@qrcodesdk/cli/qrc "https://qrcodesdk.dev"
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

Or use it without installing it.

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
deno x npm:@qrcodesdk/cli/qrc "https://qrcodesdk.dev"
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
geometry and cannot be combined with `--layout`. An explicit ANSI mode takes precedence over
`NO_COLOR` and TTY detection.

## Write SVG files

An `.svg` output path selects SVG automatically:

```sh
qrc "https://qrcodesdk.dev" --output qrcode.svg
```

You can also set the format explicitly:

```sh
qrc "https://qrcodesdk.dev" --format svg --output qrcode.svg
```

## Write PNG files

A `.png` output path selects PNG automatically:

```sh
qrc "https://qrcodesdk.dev" --output qrcode.png
```

Or pass the format explicitly:

```sh
qrc "https://qrcodesdk.dev" --format png --output qrcode.png
```

## Write WebP, GIF, and JPEG files

`.webp`, `.gif`, `.jpg`, and `.jpeg` output paths select WebP, GIF, and JPEG automatically:

```sh
qrc "https://qrcodesdk.dev" --output qrcode.webp
qrc "https://qrcodesdk.dev" --output qrcode.gif
qrc "https://qrcodesdk.dev" --output qrcode.jpg --quality 85
```

WebP output is lossless and usually much smaller than PNG. GIF output has at most 256 colors and
binary transparency, so prefer PNG or WebP with a semi-transparent `--background`.

JPEG output is lossy and has no transparency. `--quality` sets the JPEG quality from 1 to 100 and
defaults to 92. Transparent pixels are blended onto `--matte`, an opaque color that defaults to
`#ffffff`. Both options are only accepted with JPEG output.

SVG, PNG, WebP, GIF, and JPEG output require `--output`. If the extension is not `.svg`, `.png`,
`.webp`, `.gif`, `.jpg`, or `.jpeg`, pass `--format` explicitly:

```sh
qrc "https://qrcodesdk.dev" --format webp --output qrcode.image
```

## Configure generated files

```sh
qrc "https://qrcodesdk.dev" \
  --output qrcode.svg \
  --error-correction H \
  --module-size 2 \
  --quiet-zone 3 \
  --foreground '#111827' \
  --background '#ffffff' \
  --aria-label 'Scan to open qrcodesdk.dev'
```

`--mode auto`, the default, detects one encoding mode. Pass `--optimize-segments` to combine modes
when that reduces the symbol size. Concrete modes bypass optimization, and `--no-optimize-segments`
disables it again.

Leave mode, version, and mask on automatic selection unless you need a compatibility target or
deterministic fixture:

```sh
qrc "HELLO WORLD" \
  --mode alphanumeric \
  --version 1 \
  --mask 2 \
  --output hello.svg
```

Enable the UTF-8 ECI declaration:

```sh
qrc "Grüße" --eci
```

The CLI does not emit ECI by default. Use `--no-eci` to disable it explicitly. For the behavior and tradeoffs behind these flags, see
the [builder reference](https://qrcodesdk.dev/reference/builder/). For colors, module size, quiet zones, and scan-reliability guidance,
see [Customize appearance](https://qrcodesdk.dev/guides/customize/).

## Options

| Option                                        | Description                                             | Default     |
| --------------------------------------------- | ------------------------------------------------------- | :---------- |
| `[payload]`                                   | Positional QR code payload.                             | -           |
| `--payload <value>`                           | QR code payload, equivalent to positional `[payload]`.  | -           |
| `-V`                                          | Print the installed CLI package version.                | -           |
| `--format <text\|svg\|png\|webp\|gif\|jpeg>`  | Output format. Inferred from the output path extension. | -           |
| `-o, --output <path>`                         | Required output path for SVG, PNG, WebP, GIF, and JPEG. | -           |
| `--mode <auto\|numeric\|alphanumeric\|octet>` | QR code mode.                                           | `Auto`      |
| `--error-correction <L\|M\|Q\|H>`             | Error correction level.                                 | `M`         |
| `--version <1-40>`                            | Pin a QR code version.                                  | `Auto`      |
| `--mask <0-7>`                                | Pin a QR code mask.                                     | `Auto`      |
| `--optimize-segments`                         | Optimize mixed-mode segments in auto mode.              | `false`     |
| `--eci`                                       | Emit UTF-8 ECI assignment 26 for octet segments.        | `false`     |
| `--no-eci`                                    | Do not emit UTF-8 ECI assignment 26.                    | `false`     |
| `--module-size <number>`                      | Module size as a positive integer.                      | `1`         |
| `--quiet-zone <number>`                       | Quiet zone as a non-negative integer.                   | `2`         |
| `--layout <compact\|full>`                    | Text block layout.                                      | `compact`   |
| `--ansi <off\|blocks\|background>`            | Explicit ANSI output mode.                              | Environment |
| `--foreground <#rrggbb[aa]>`                  | Dark module color.                                      | `#000000`   |
| `--background <#rrggbb[aa]>`                  | Light module color.                                     | `#ffffff`   |
| `--quality <1-100>`                           | JPEG quality. JPEG output only.                         | `92`        |
| `--matte <#rrggbb>`                           | Opaque color for transparent pixels. JPEG output only.  | `#ffffff`   |
| `--aria-label <text>`                         | SVG `aria-label` accessible name.                       | `undefined` |
| `--title <text>`                              | SVG child `<title>` text.                               | `undefined` |

Colors must be RGB or RGBA hex values.
For block-glyph text output, the dark color is the ANSI foreground and the light color is the ANSI
background. With `--ansi background`, both become module background colors.

## Interactive and automated use

In an interactive terminal, `qrc` prompts only for missing required values such as payload, an ambiguous format, or a file output path.
Choose the output format with the arrow keys, `j`/`k`, or a number key, then press Enter. Press Escape or Ctrl+C to cancel a prompt.

In a non-interactive shell or CI job, missing required values fail with an error instead of opening a prompt. Pass every required value explicitly:

```sh
qrc \
  --payload "https://qrcodesdk.dev" \
  --format png \
  --output artifacts/qrcode.png
```

Successful file output writes a confirmation to standard error, so standard output stays free for terminal QR code text and pipelines.

## Documentation

- [@qrcodesdk/cli](https://qrcodesdk.dev/packages/cli/)
- [Choose your setup](https://qrcodesdk.dev/getting-started/choose-your-setup/)
- [Customize appearance](https://qrcodesdk.dev/guides/customize/)
- [Terminal text renderer](https://qrcodesdk.dev/reference/renderers/text/)
- [SVG string renderer](https://qrcodesdk.dev/reference/renderers/svg/)
- [@qrcodesdk/node](https://qrcodesdk.dev/packages/node/)
