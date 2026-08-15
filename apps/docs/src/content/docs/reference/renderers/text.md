---
title: Terminal text renderer
description: Reference for compact, full-height, and ANSI terminal strings from QRCodeTextRenderer.
docType: reference

related:
  - ../../packages/core.mdx
  - ../../packages/cli.mdx
  - ./svg.md
---

## When to use

Use `QRCodeTextRenderer` for developer-facing QR codes in terminals, CLIs, logs, text files, and
deterministic snapshots.

## Minimal example

```ts
import {QRCodeTextRenderer, qrcode} from '@qrcodesdk/core';

const text = qrcode('HELLO WORLD').render(QRCodeTextRenderer());

console.log(text);
```

## Return value

The renderer returns a `string` joined with `\n` and no trailing newline. Compact output uses `▀`,
`▄`, `█`, and spaces to represent two scaled QR rows per terminal line.

For `S = (matrix width + 2 × margin) × size`:

| Layout                 | Visible width |    Line count | Representation                                |
| ---------------------- | ------------: | ------------: | --------------------------------------------- |
| `small: true`          |           `S` | `ceil(S / 2)` | UTF-8 half/full block characters              |
| `small: false`         |       `2 × S` |           `S` | `██` or two spaces                            |
| `onlyAnsiColors: true` |       `2 × S` |           `S` | Two ANSI-background-colored spaces per module |

## Renderer-specific options

| Option              | Type                | Default     | Effect                                            |
| ------------------- | ------------------- | ----------- | ------------------------------------------------- |
| `size`              | `number`            | `5`         | Positive integer module scale                     |
| `margin`            | `number`            | `4`         | Non-negative integer quiet zone in modules        |
| `small`             | `boolean`           | `true`      | Packs two scaled rows into each terminal line     |
| `ansiColors`        | `boolean`           | `false`     | Adds 24-bit ANSI foreground/background colors     |
| `onlyAnsiColors`    | `boolean`           | `false`     | Uses colored space cells without block glyphs     |
| `colors.colorDark`  | six-digit hex color | `'#000000'` | Dark foreground or background when ANSI is active |
| `colors.colorLight` | six-digit hex color | `'#ffffff'` | Light background when ANSI is active              |

`onlyAnsiColors: true` requires `ansiColors: true` and ignores `small`.

## Renderer-specific constraints

- Compact and full layouts require a UTF-8 output environment for their block glyphs.
- `onlyAnsiColors: true` with `ansiColors: false` throws an error.
- The renderer does not inspect TTY state, `NO_COLOR`, or related environment variables.
- ANSI sequences add invisible bytes but do not change the visible dimensions above. Every styled
  line ends with an ANSI reset.
- The Core API defaults ANSI colors to off. The CLI intentionally enables them by default.

## Related guides

- [Customize appearance](/guides/customize/) for the shared quiet-zone and color rules.
- [CLI package](/packages/cli/) for terminal commands, flags, stdout, and file behavior.
- [Download or save](/guides/download-or-save/) for choosing text, SVG, or PNG files.
