# @qrcodesdk/cli

Command line QR code generation for QRCodeSDK.

`@qrcodesdk/cli` installs the `qrc` command. It can print terminal text QR codes or write SVG and PNG files using the same renderers exposed by `@qrcodesdk/core` and `@qrcodesdk/node`.

## Install

```sh
pnpm add -g @qrcodesdk/cli
```

## Print Terminal Text

```sh
qrc "https://qrcodesdk.dev"
```

## Write SVG

```sh
qrc "https://qrcodesdk.dev" --output qrcode.svg
```

## Write PNG

```sh
qrc "https://qrcodesdk.dev" --format png --output qrcode.png
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

When running in an interactive terminal, `qrc` prompts only for missing required values. In non-interactive mode, missing required values fail with a clear error message.
