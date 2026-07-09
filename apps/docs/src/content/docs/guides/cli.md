---
title: '@qrcodesdk/cli'
description: Generate QR codes from the terminal as text output, SVG files, or PNG files.
---

`@qrcodesdk/cli` installs the `qrc` command. Use it when you want to generate QR codes from a shell script, local terminal, CI job, or one-off file generation workflow.

The CLI uses the same QR builder and renderers as `@qrcodesdk/core` and `@qrcodesdk/node`.

## Install

Install it globally when you want `qrc` available as a command.

```sh
vp install -g @qrcodesdk/cli
pnpm add -g @qrcodesdk/cli
npm install -g @qrcodesdk/cli
yarn global add @qrcodesdk/cli
bun add -g @qrcodesdk/cli
```

You can also run it from a project dependency.

```sh
pnpm add -D @qrcodesdk/cli
pnpm exec qrc "https://qrcodesdk.dev"
```

Or use it without installing it.

```sh
npx @qrcodesdk/cli "https://qrcodesdk.dev"
```

## Print terminal text

Without an output file, `qrc` prints compact terminal text to stdout.

```sh
qrc "https://qrcodesdk.dev"
```

Use terminal text for local checks, scripts, logs, and copyable command output.

## Write SVG output

Pass an `.svg` output path to infer SVG output.

```sh
qrc "https://qrcodesdk.dev" --output qrcode.svg
```

You can also set the format explicitly.

```sh
qrc "https://qrcodesdk.dev" --format svg --output qrcode.svg
```

## Write PNG output

Pass an `.png` output path or set `--format png`.

```sh
qrc "https://qrcodesdk.dev" --output qrcode.png
```

```sh
qrc "https://qrcodesdk.dev" --format png --output qrcode.png
```

## Customize output

The CLI exposes the same builder and styling concepts as the packages.

```sh
qrc "https://qrcodesdk.dev" \
  --output qrcode.svg \
  --error-correction H \
  --size 1 \
  --margin 1 \
  --color-dark '#111827' \
  --color-light '#ffffff' \
  --aria-label 'Scan to open qrcodesdk.dev'
```

## Options

| Option                                  | Description                                            | Default     |
| --------------------------------------- | ------------------------------------------------------ | :---------- |
| `[data]`                                | QR input data.                                         | -           |
| `--input <value>`                       | QR input data, equivalent to positional `[data]`.      | -           |
| `--format <text\|svg\|png>`             | Output format. Inferred from `.svg` or `.png` outputs. | -           |
| `-o, --output <path>`                   | Required for SVG and PNG output.                       | -           |
| `--mode <numeric\|alphanumeric\|octet>` | QR data mode.                                          | `Auto`      |
| `--error-correction <L\|M\|Q\|H>`       | Error correction level.                                | `M`         |
| `--version <1-40>`                      | Pin a QR version.                                      | `Auto`      |
| `--mask <0-7>`                          | Pin a QR mask.                                         | `Auto`      |
| `--size <number>`                       | Module size as a positive integer.                     | `1`         |
| `--margin <number>`                     | Margin as a non-negative integer.                      | `2`         |
| `--color-dark <#rrggbb>`                | Dark module color.                                     | `#000000`   |
| `--color-light <#rrggbb>`               | Light module color.                                    | `#ffffff`   |
| `--alt <text>`                          | SVG alt text.                                          | `undefined` |
| `--aria-label <text>`                   | SVG aria-label.                                        | `undefined` |
| `--title <text>`                        | SVG title.                                             | `undefined` |

## Prompt behavior

When `qrc` runs in an interactive terminal, it prompts only for missing required values such as QR input, an ambiguous file format, or an SVG/PNG output path.

In non-interactive mode, missing required values fail with a clear error instead of opening a prompt.

## Related pages

- [Installation](/guides/installation/)
- [Builder API](/libs/core/)
- [Render SVG](/renderers/core/svg/)
- [Render PNG in Node.js](/renderers/node/png/)
- [Render Terminal Text](/renderers/core/text/)
- [Customize QR Codes](/guides/customize/)
