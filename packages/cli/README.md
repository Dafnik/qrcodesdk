<!-- Generated from apps/docs/src/content/docs/packages/cli.mdx. Run `pnpm --filter docs generate-readmes` to update. -->

<p align="center"><img src="https://qrcodesdk.dev/favicon.svg" alt="QRCodeSDK logo" width="240"></p>

# @qrcodesdk/cli

[![Open @qrcodesdk/cli on npmx.dev](https://npmx.dev/api/registry/badge/name/@qrcodesdk/cli?color=7469B6&style=shieldsio)](https://npmx.dev/@qrcodesdk/cli) ![@qrcodesdk/cli version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/cli?color=7469B6&label=version&style=shieldsio) ![@qrcodesdk/cli install size](<https://npmx.dev/api/registry/badge/size/@qrcodesdk/cli?color=7469B6&label=install size&style=shieldsio>) ![@qrcodesdk/cli download/mo](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/cli?color=7469B6&label=download/mo&style=shieldsio) [![@qrcodesdk/cli Source code](<https://npmx.dev/api/registry/badge/name/@qrcodesdk/cli?color=7469B6&label=Source code&value=GitHub ↗&style=shieldsio>)](https://github.com/Dafnik/qrcodesdk/tree/main/packages/cli)

`@qrcodesdk/cli` generates QR codes from a terminal, shell script, or CI job. The `qrc` command prints compact UTF-8 terminal text or writes SVG and PNG files.

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

Use full-height, double-width `██` modules when preferred:

```sh
qrc "https://qrcodesdk.dev" --no-small
```

Disable ANSI styling explicitly for logs, files, and redirected output:

```sh
qrc "https://qrcodesdk.dev" --no-ansi-colors
```

Render modules entirely as ANSI-colored spaces, without UTF-8 block glyphs:

```sh
qrc "https://qrcodesdk.dev" --only-ansi-colors
```

The equivalent explicit boolean forms are `--small false` and `--ansi-colors false`. Both options also accept `true`. Layout and ANSI styling are independent and affect text output only. Compact and full block layouts require UTF-8; ANSI-background-only output contains spaces and escape sequences instead. ANSI remains enabled by default when standard output is redirected; the CLI does not inspect TTY state or `NO_COLOR`.

`--only-ansi-colors` ignores the `small` setting and implies ANSI output. It cannot be combined with `--no-ansi-colors` or `--ansi-colors false`.

## Write SVG's

An `.svg` output path selects SVG automatically:

```sh
qrc "https://qrcodesdk.dev" --output qrcode.svg
```

You can also set the format explicitly:

```sh
qrc "https://qrcodesdk.dev" --format svg --output qrcode.svg
```

## Write PNGs

An `.png` output path selects PNG automatically:

```sh
qrc "https://qrcodesdk.dev" --output qrcode.png
```

Or pass the format explicitly:

```sh
qrc "https://qrcodesdk.dev" --format png --output qrcode.png
```

SVG and PNG output require `--output`. If the extension is not `.svg` or `.png`, pass `--format` explicitly.

## Customize output

```sh
qrc "https://qrcodesdk.dev" \
  --output qrcode.svg \
  --error-correction H \
  --size 2 \
  --margin 3 \
  --color-dark '#111827' \
  --color-light '#ffffff' \
  --aria-label 'Scan to open qrcodesdk.dev'
```

Most applications can leave the data mode, version, and mask on automatic selection. Pin them when you need a compatibility target or deterministic fixture:

```sh
qrc "HELLO WORLD" \
  --mode alphanumeric \
  --version 1 \
  --mask 2 \
  --output hello.svg
```

## Options

| Option                                  | Description                                                 | Default     |
| --------------------------------------- | ----------------------------------------------------------- | :---------- |
| `[data]`                                | Positional QR code input data.                              | -           |
| `--input <value>`                       | QR code input data, equivalent to positional `[data]`.      | -           |
| `-V`                                    | Print the installed CLI package version.                    | -           |
| `--format <text\|svg\|png>`             | Output format. Inferred from `.svg` or `.png` output paths. | -           |
| `-o, --output <path>`                   | Required output path for SVG and PNG.                       | -           |
| `--mode <numeric\|alphanumeric\|octet>` | QR code data mode.                                          | `Auto`      |
| `--error-correction <L\|M\|Q\|H>`       | Error correction level.                                     | `M`         |
| `--version <1-40>`                      | Pin a QR code version.                                      | `Auto`      |
| `--mask <0-7>`                          | Pin a QR code mask.                                         | `Auto`      |
| `--size <number>`                       | Module size as a positive integer.                          | `1`         |
| `--margin <number>`                     | Margin as a non-negative integer.                           | `2`         |
| `--small <true\|false>`                 | Pack two QR rows into each terminal line.                   | `true`      |
| `--no-small`                            | Alias for `--small false`.                                  | -           |
| `--ansi-colors <true\|false>`           | Style terminal text with ANSI colors.                       | `true`      |
| `--no-ansi-colors`                      | Alias for `--ansi-colors false`.                            | -           |
| `--only-ansi-colors`                    | Use ANSI background cells without UTF-8 block glyphs.       | `false`     |
| `--color-dark <#rrggbb>`                | Dark module color.                                          | `#000000`   |
| `--color-light <#rrggbb>`               | Light module color.                                         | `#ffffff`   |
| `--alt <text>`                          | SVG `alt` text.                                             | `undefined` |
| `--aria-label <text>`                   | SVG `aria-label`.                                           | `undefined` |
| `--title <text>`                        | SVG `title`.                                                | `undefined` |

Colors must be six-digit hex values. `--size` must be positive and `--margin` must be non-negative. For block-glyph text output, the dark color is the ANSI foreground and the light color is the ANSI background. With `--only-ansi-colors`, both become module background colors.

## Interactive and automated use

In an interactive terminal, `qrc` prompts only for missing required values such as input, an ambiguous format, or a file output path.

In a non-interactive shell or CI job, missing required values fail with a clear error instead of opening a prompt. Pass every required value explicitly:

```sh
qrc \
  --input "https://qrcodesdk.dev" \
  --format png \
  --output artifacts/qrcode.png
```

Successful file output writes a confirmation to standard error, leaving standard output available for terminal QR code content and pipeline use.

## Documentation

- [@qrcodesdk/cli](https://qrcodesdk.dev/packages/cli/)
- [Installation](https://qrcodesdk.dev/getting-started/installation/)
- [Customize QR Codes](https://qrcodesdk.dev/advanced/customize/)
- [Render Terminal Text](https://qrcodesdk.dev/renderers/core/text/)
- [Render SVG](https://qrcodesdk.dev/renderers/core/svg/)
- [Render PNG in Node.js](https://qrcodesdk.dev/renderers/node/png/)
