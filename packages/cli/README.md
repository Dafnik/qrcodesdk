# @qrcodesdk/cli

[![npm version](https://npmx.dev/api/registry/badge/version/@qrcodesdk/cli?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/cli)
[![npm bundle size](https://npmx.dev/api/registry/badge/size/@qrcodesdk/cli?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/cli)
[![npm download per month](https://npmx.dev/api/registry/badge/downloads-month/@qrcodesdk/cli?color=7469B6&style=shieldsio)](https://npmx.dev/package/@qrcodesdk/cli)

`@qrcodesdk/cli` generates QR codes from a terminal, shell script, or CI job. The `qrc` command prints compact terminal text or writes SVG and PNG files.

## Install

Install it globally when you want `qrc` available as a command anywhere:

```sh
npm install --global @qrcodesdk/cli
```

```sh
pnpm add --global @qrcodesdk/cli
```

You can also run it from a project dependency.

```sh
npm install --save-dev @qrcodesdk/cli
npx qrc "https://qrcodesdk.dev"
```

```sh
pnpm add --save-dev @qrcodesdk/cli
pnpm exec qrc "https://qrcodesdk.dev"
```

Or use it without installing it.

```sh
npx --package @qrcodesdk/cli qrc "https://qrcodesdk.dev"
```

```sh
pnpm dlx @qrcodesdk/cli "https://qrcodesdk.dev"
```

## Print terminal text

Without an output file, `qrc` prints compact Unicode text to standard output:

```sh
qrc "https://qrcodesdk.dev"
```

Terminal output is useful for local checks, scripts, logs, and copyable command output.

## Write SVG's

An `.svg` output path selects SVG automatically:

```sh
qrc "https://qrcodesdk.dev" --output qrcode.svg
```

You can also set the format explicitly:

```sh
qrc "https://qrcodesdk.dev" --format svg --output qrcode.svg
```

## Write PNG

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
| `--color-dark <#rrggbb>`                | Dark module color.                                          | `#000000`   |
| `--color-light <#rrggbb>`               | Light module color.                                         | `#ffffff`   |
| `--alt <text>`                          | SVG `alt` text.                                             | `undefined` |
| `--aria-label <text>`                   | SVG `aria-label`.                                           | `undefined` |
| `--title <text>`                        | SVG `title`.                                                | `undefined` |

Colors must be six-digit hex values. `--size` must be positive and `--margin` must be non-negative.

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

- [CLI guide](https://qrcodesdk.dev/guides/cli/)
- [Installation](https://qrcodesdk.dev/guides/installation/)
- [Customize QR codes](https://qrcodesdk.dev/guides/customize/)
- [Terminal text renderer](https://qrcodesdk.dev/renderers/core/text/)
- [SVG renderer](https://qrcodesdk.dev/renderers/core/svg/)
- [PNG renderer](https://qrcodesdk.dev/renderers/node/png/)
