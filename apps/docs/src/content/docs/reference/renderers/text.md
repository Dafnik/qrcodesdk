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
snapshot. It exposes only the dimensions a terminal can represent through `QRCodeTextStyle`.
Graphical colors, shapes, finder or alignment styles, and center images are not accepted. Finder and
alignment modules print like every other dark module.

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
The defaults match the graphical renderers, `moduleSize: 5` and `quietZone: 4`. A version 1 code
then prints 145 columns wide and 73 lines high in the compact layout, wider than most terminal
windows. Pass `style: {moduleSize: 1, quietZone: 2}`, as above and as the CLI does, for 25 columns
and 13 lines.
:::

## Return value

The renderer returns a `string` with no trailing newline. Lines are separated by `\n`.

For `S = (matrix width + 2 × quietZone) × moduleSize`, compact output is `S` cells wide and
`ceil(S / 2)` lines high. Full and ANSI-background output are `2 × S` cells wide and `S` lines high.

The cell content depends on `layout` and `ansi`:

| Output                    | Dark modules                             | Light modules                            |
| ------------------------- | ---------------------------------------- | ---------------------------------------- |
| `'compact'` layout        | Half-block glyphs `▀`, `▄`, and `█`      | Spaces                                   |
| `'full'` layout           | `██` per module                          | Two spaces per module                    |
| `ansi: true`              | Glyphs drawn in `ansi.foreground`        | Cells filled with `ansi.background`      |
| `ansi.mode: 'background'` | Two spaces filled with `ansi.foreground` | Two spaces filled with `ansi.background` |

Without ANSI, the glyphs take the terminal's text color and the spaces show its background. On a
light terminal theme, that prints dark modules on a light background. On a dark theme, the code
appears inverted: light modules on a dark background. Many scanners cannot read inverted codes, so
enable `ansi` when you do not control the terminal theme. ANSI output wraps each line in 24-bit color
sequences and ends it with a reset, so the colors are the same on every theme.

## Renderer-specific options

| Option             | Type                               | Default     | Effect                                                                  |
| ------------------ | ---------------------------------- | ----------- | ----------------------------------------------------------------------- |
| `style.moduleSize` | `number`                           | `5`         | Positive safe integer module scale, in cells                            |
| `style.quietZone`  | `number`                           | `4`         | Non-negative safe integer border, in modules                            |
| `layout`           | `'compact' \| 'full'`              | `'compact'` | `'compact'` packs two rows per line; `'full'` uses two cells per module |
| `ansi`             | `boolean \| QRCodeTextANSIOptions` | `false`     | `true` or an ANSI options object enables 24-bit ANSI colors             |
| `ansi.mode`        | `'blocks' \| 'background'`         | `'blocks'`  | `'blocks'` colors glyphs; `'background'` uses colored spaces            |
| `ansi.foreground`  | `QRCodeColor`                      | `'#000000'` | RGB or RGBA hexadecimal dark color                                      |
| `ansi.background`  | `QRCodeColor`                      | `'#ffffff'` | RGB or RGBA hexadecimal light color                                     |

An ANSI object enables ANSI output. Background mode has fixed full-cell geometry, so its option type
(`QRCodeTextANSIBackgroundOptions`) does not accept `layout`.

Terminals have no alpha channel. RGBA background colors are composited over white, then RGBA
foreground colors are composited over that resolved background before the ANSI sequences are
written.

## Renderer-specific constraints

- The renderer does not inspect TTY state or `NO_COLOR`. Callers such as the CLI choose that policy
  before creating it. The CLI disables ANSI when standard output is not a terminal or `NO_COLOR` is
  set; see [Print terminal text](/packages/cli/#print-terminal-text).
- The output needs a font that draws `▀`, `▄`, and `█` as full-cell blocks, and a terminal line
  height without gaps between lines. Background mode uses only spaces, so it avoids both
  requirements.
- Options are validated and copied when `QRCodeTextRenderer()` is called. TypeScript rejects
  unknown keys and unsupported combinations; the renderer does not repeat those checks at runtime.
- The renderer supports the same [runtimes as Core](/packages/core/#runtime-compatibility).

## Errors

`QRCodeTextRenderer()` throws `QRCodeError` with code `INVALID_OPTIONS` when it is called with:

| `details.field`    | Constraint                  |
| ------------------ | --------------------------- |
| `style.moduleSize` | A positive safe integer     |
| `style.quietZone`  | A non-negative safe integer |
| `ansi.foreground`  | `#RRGGBB` or `#RRGGBBAA`    |
| `ansi.background`  | `#RRGGBB` or `#RRGGBBAA`    |

Rendering throws `INVALID_OPTIONS` with `details.field` set to `dimensions` when `S` is not a safe
integer. Matrix generation errors, such as `PAYLOAD_TOO_LARGE`, come from the builder. See
[Errors](/reference/errors/) for every code.

## Related guides

- [`@qrcodesdk/cli`](/packages/cli/) for printing terminal QR codes from a shell.
- [Troubleshooting](/guides/troubleshooting/#a-terminal-qr-code-does-not-scan) for terminal output
  that does not scan.
- [Builder and matrix](/reference/builder/) for payloads and matrix options.
