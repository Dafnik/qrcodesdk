---
title: Terminal text renderer
description: Reference for compact, full, and ANSI terminal strings from QRCodeTextRenderer.
docType: reference

related:
  - ../../packages/core.mdx
  - ../../packages/cli.mdx
  - ./svg.md
---

`QRCodeTextRenderer` returns a string with no trailing newline. It exposes only the dimensions a
terminal can represent through `QRCodeTextStyle`; graphical colors and shapes are not accepted.

```ts
import {QRCodeTextRenderer, qrcode} from '@qrcodesdk/core';

const text = qrcode('HELLO WORLD').render(
  QRCodeTextRenderer({
    style: {moduleSize: 1, quietZone: 2},
    layout: 'compact',
    ansi: true,
  }),
);
```

## Options

| Option             | Default     | Effect                                                                  |
| ------------------ | ----------- | ----------------------------------------------------------------------- |
| `style.moduleSize` | `5`         | Positive integer module scale                                           |
| `style.quietZone`  | `4`         | Non-negative integer border in modules                                  |
| `layout`           | `'compact'` | `'compact'` packs two rows per line; `'full'` uses two cells per module |
| `ansi`             | `false`     | `true`, `false`, or an ANSI configuration object                        |
| `ansi.mode`        | `'blocks'`  | `'blocks'` uses glyphs; `'background'` uses colored spaces              |
| `ansi.foreground`  | `'#000000'` | RGB or RGBA hexadecimal dark color                                      |
| `ansi.background`  | `'#ffffff'` | RGB or RGBA hexadecimal light color                                     |

An ANSI object enables ANSI output. Background mode has fixed full-cell geometry and therefore
rejects an explicitly supplied `layout`. The renderer does not inspect TTY state or `NO_COLOR`;
callers such as the CLI choose that policy before creating it.

Terminals have no alpha channel. RGBA background colors are composited over white, then RGBA
foreground colors are composited over that resolved background before 24-bit ANSI sequences are
written. Alpha is therefore deterministic and never silently discarded.

For `S = (matrix width + 2 × quietZone) × moduleSize`, compact output is `S` cells wide and
`ceil(S / 2)` lines high. Full and ANSI-background output are `2 × S` cells wide and `S` lines high.

Renderer options are validated and copied at factory creation. Unknown keys and unsupported
combinations throw immediately.
