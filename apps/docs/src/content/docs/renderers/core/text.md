---
title: Render Terminal Text
description: Render a QR code as compact UTF-8 text with optional ANSI colors.

related:
  - ../../guides/customize.md
  - ./svg.md
  - ../index.md
---

Use this renderer for developer-facing QR output in terminals, CLIs, logs, text files, and deterministic snapshots. Compact and full block-glyph layouts require UTF-8 output; the ANSI-background-only layout does not emit block glyphs.

## Minimal example

```ts
import {QRCodeTextRenderer, qrcode} from '@qrcodesdk/core';

const text = qrcode('HELLO WORLD').render(QRCodeTextRenderer());

console.log(text);
```

The core renderer returns plain compact text by default. It uses `▀`, `▄`, `█`, and spaces to encode two scaled QR rows in each terminal line.

## Options

```ts
const text = qrcode('HELLO WORLD').render(
  QRCodeTextRenderer({
    size: 2,
    margin: 2,
    small: true,
    ansiColors: false,
    onlyAnsiColors: false,
  }),
);
```

| Option              | Type      | Default     | Description                                          |
| ------------------- | --------- | ----------- | ---------------------------------------------------- |
| `size`              | `number`  | `5`         | Integer scale factor for each QR module.             |
| `margin`            | `number`  | `4`         | Quiet-zone margin around the QR code, in modules.    |
| `small`             | `boolean` | `true`      | Pack two scaled QR rows into each terminal line.     |
| `ansiColors`        | `boolean` | `false`     | Apply 24-bit ANSI foreground and background colors.  |
| `onlyAnsiColors`    | `boolean` | `false`     | Render modules entirely with ANSI background colors. |
| `colors.colorDark`  | `string`  | `'#000000'` | Dark block foreground when ANSI colors are enabled.  |
| `colors.colorLight` | `string`  | `'#ffffff'` | Blank-cell background when ANSI colors are enabled.  |

Text geometry requires a positive integer `size` and a non-negative integer `margin`. ANSI colors must be six-digit hexadecimal values.

## Layouts

### Compact layout

Compact layout is the default. Each character describes two vertically adjacent scaled modules:

| Character | Upper module | Lower module |
| --------- | ------------ | ------------ |
| `█`       | Dark         | Dark         |
| `▀`       | Dark         | Light        |
| `▄`       | Light        | Dark         |
| space     | Light        | Light        |

If the last upper row has no matching lower row, the missing row is treated as light.

### Full layout

Use `small: false` when terminal cells need a full-height, double-width representation:

```ts
const text = qrcode('HELLO WORLD').render(QRCodeTextRenderer({size: 1, margin: 2, small: false}));
```

Each dark scaled module becomes `██`; each light scaled module becomes two spaces.

### ANSI-background-only layout

Use `onlyAnsiColors: true` to render no UTF-8 block glyphs at all:

```ts
const text = qrcode('HELLO WORLD').render(QRCodeTextRenderer({onlyAnsiColors: true}));
```

Each scaled module becomes two spaces with either the dark or light ANSI background color. This layout implies ANSI styling, ignores `small`, has a visible width of `2 × S`, and uses `S` terminal lines. Passing `ansiColors: false` at the same time is invalid.

## ANSI colors

ANSI styling is independent from layout:

```ts
const text = qrcode('HELLO WORLD').render(
  QRCodeTextRenderer({
    ansiColors: true,
    colors: {
      colorDark: '#111827',
      colorLight: '#ffffff',
    },
  }),
);
```

For compact and full block-glyph layouts, every line starts with a 24-bit dark foreground and light background sequence and ends with `\x1b[0m`. The ANSI-background-only layout selects a dark or light background for every scaled module and also resets each line. The renderer does not inspect TTY state, `NO_COLOR`, or other environment variables. With `ansiColors: false`, the returned string contains no ANSI escape sequences.

The CLI intentionally differs from the core API: CLI text output enables ANSI colors by default and provides `--no-ansi-colors` to disable them.

## Write plain text to a file

```ts
import {writeFileSync} from 'node:fs';

const text = qrcode('HELLO WORLD').render(QRCodeTextRenderer({ansiColors: false}));

writeFileSync('qrcode.txt', text, 'utf8');
```

## Output dimensions

Let `S = (matrix width + 2 × margin) × size`:

| Layout                 | Visible width |    Line count | Module representation                         |
| ---------------------- | ------------: | ------------: | --------------------------------------------- |
| `small: true`          |           `S` | `ceil(S / 2)` | UTF-8 half and full block characters          |
| `small: false`         |       `2 × S` |           `S` | `██` or two spaces                            |
| `onlyAnsiColors: true` |       `2 × S` |           `S` | Two ANSI-background-colored spaces per module |

ANSI styling adds invisible escape sequences but does not change these visible dimensions. The renderer joins lines with `\n` and does not append a trailing newline.
