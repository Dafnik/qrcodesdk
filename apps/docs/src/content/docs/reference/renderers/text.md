---
title: Terminal text renderer
description: Reference for compact, full, and ANSI terminal strings from QRCodeTextRenderer.
docType: reference

related:
  - ../../packages/core.mdx
  - ../../packages/cli.mdx
  - ./svg.md
  - ../errors.md
---

## When to use

Use `QRCodeTextRenderer` from `@qrcodesdk/core` to print a QR code in a terminal, log, CLI, or text
snapshot.

Its `QRCodeTextStyle` only has the dimensions a terminal can show. It does not accept colors,
shapes, finder or alignment styles, or center images. Finder and alignment modules print like every
other dark module.

## Minimal example

```ts
import {QRCodeTextRenderer, qrcode} from '@qrcodesdk/core';

const text = qrcode('HELLO WORLD').render(
  QRCodeTextRenderer({
    style: {moduleSize: 1, quietZone: 2},
    layout: 'compact',
    ansi: true,
  }),
);

console.log(text);
```

:::tip[Use one cell per module in terminals]
The defaults match the graphical renderers: `moduleSize: 5` and a quiet zone of 4 modules for
standard QR codes or 2 for Micro QR and rMQR codes. A version 1 code then prints 145 columns wide
and 73 lines high in the compact layout, wider than most terminals.

Pass `style: {moduleSize: 1, quietZone: 2}`, as above and as the CLI does, for 25 columns and 13
lines.
:::

## Return value

The renderer returns a `string`. Lines are separated by `\n`, with no trailing newline.

Let `W = (matrix.width + 2 × quietZone) × moduleSize` and
`H = (matrix.height + 2 × quietZone) × moduleSize`. Then:

| Output                         | Width         | Height              |
| ------------------------------ | ------------- | ------------------- |
| Compact layout                 | `W` cells     | `ceil(H / 2)` lines |
| Full layout or ANSI background | `2 × W` cells | `H` lines           |

The cells depend on `layout` and `ansi`:

| Output                    | Dark modules                             | Light modules                            |
| ------------------------- | ---------------------------------------- | ---------------------------------------- |
| `'compact'` layout        | Half-block glyphs `▀`, `▄`, and `█`      | Spaces                                   |
| `'full'` layout           | `██` per module                          | Two spaces per module                    |
| `ansi: true`              | Glyphs drawn in `ansi.foreground`        | Cells filled with `ansi.background`      |
| `ansi.mode: 'background'` | Two spaces filled with `ansi.foreground` | Two spaces filled with `ansi.background` |

### Without ANSI

The glyphs take the terminal's text color, and the spaces show its background:

- On a light theme, dark modules print on a light background.
- On a dark theme, the code appears inverted. Many scanners cannot read inverted codes.

Enable `ansi` when you do not control the terminal theme. ANSI output wraps each line in 24-bit
color sequences and ends it with a reset, so it looks the same on every theme.

## Options

| Option             | Type                               | Default        | Effect                                                                  |
| ------------------ | ---------------------------------- | -------------- | ----------------------------------------------------------------------- |
| `style.moduleSize` | `number`                           | `5`            | Positive safe integer module scale, in cells                            |
| `style.quietZone`  | `number`                           | Symbol minimum | Non-negative safe integer border, in modules                            |
| `layout`           | `'compact' \| 'full'`              | `'compact'`    | `'compact'` packs two rows per line; `'full'` uses two cells per module |
| `ansi`             | `boolean \| QRCodeTextANSIOptions` | `false`        | `true` or an ANSI options object enables 24-bit ANSI colors             |
| `ansi.mode`        | `'blocks' \| 'background'`         | `'blocks'`     | `'blocks'` colors glyphs; `'background'` uses colored spaces            |
| `ansi.foreground`  | `QRCodeColor`                      | `'#000000'`    | RGB or RGBA hexadecimal dark color                                      |
| `ansi.background`  | `QRCodeColor`                      | `'#ffffff'`    | RGB or RGBA hexadecimal light color                                     |

- The quiet zone defaults to 4 modules for standard QR codes and 2 for Micro QR and rMQR codes.
- Passing an ANSI object enables ANSI output.
- Background mode always uses full cells, so its option type (`QRCodeTextANSIBackgroundOptions`)
  does not accept `layout`.
- Terminals have no alpha channel. RGBA background colors are composited over white. RGBA
  foreground colors are then composited over that background.

## Constraints

- **No TTY detection.** The renderer does not check TTY state or `NO_COLOR`. The caller decides.
  The CLI, for example, disables ANSI when standard output is not a terminal or `NO_COLOR` is set.
  See [Print terminal text](/packages/cli/#print-terminal-text).
- **Fonts.** The font must draw `▀`, `▄`, and `█` as full-cell blocks, and the line height must
  leave no gaps. Background mode uses only spaces, so it avoids both requirements.
- **Option checks.** `QRCodeTextRenderer()` validates and copies options when it is called.
  TypeScript rejects unknown keys and unsupported combinations. The renderer does not repeat those
  checks at runtime.
- **Runtimes.** The renderer supports the same [runtimes as Core](/packages/core/#runtime-compatibility).

## Errors

`QRCodeTextRenderer()` throws `QRCodeError` with code `INVALID_OPTIONS` for these values:

| `details.field`    | Must be                     |
| ------------------ | --------------------------- |
| `style.moduleSize` | A positive safe integer     |
| `style.quietZone`  | A non-negative safe integer |
| `ansi.foreground`  | `#RRGGBB` or `#RRGGBBAA`    |
| `ansi.background`  | `#RRGGBB` or `#RRGGBBAA`    |

Rendering throws `INVALID_OPTIONS` with `details.field` set to `dimensions` when either `W` or `H` is
not a safe integer.

Matrix errors, such as `PAYLOAD_TOO_LARGE`, come from the builder. See [Errors](/reference/errors/)
for every code.

## Related guides

- [`@qrcodesdk/cli`](/packages/cli/) for printing terminal QR codes from a shell.
- [Troubleshooting](/guides/troubleshooting/#a-terminal-qr-code-does-not-scan) for terminal output
  that does not scan.
- [Builder and matrix](/reference/builder/) for payloads and matrix options.
