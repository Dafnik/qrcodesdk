---
title: Render Terminal Text
description: Render a QR code as an ANSI-colored string for terminals, CLIs, logs, and snapshots.

related:
  - ../../guides/customize.md
  - ./svg.md
  - ../index.md
---

Use this when you need developer-facing QR output in a terminal, CLI, log, text file, or deterministic snapshot test.

## Minimal example

```ts
import {QRCodeTextRenderer, qrcode} from '@qrcodesdk/core';

const text = qrcode('HELLO WORLD').render(QRCodeTextRenderer());

console.log(text);
```

The returned value is a string containing ANSI background colors, spaces, reset codes, and newline separators. Each QR module uses two background-colored spaces by default, avoiding gaps caused by terminal font line spacing.

## Common options

You can control the rendered text size, margin, and compact mode by passing options to `QRCodeTextRenderer`.

```ts
import {QRCodeTextRenderer, qrcode} from '@qrcodesdk/core';

const text = qrcode('HELLO WORLD').render(
  QRCodeTextRenderer({
    size: 2,
    margin: 2,
  }),
);

console.log(text);
```

| Option   |      Type | Default | Description                                               |
| -------- | --------: | ------: | --------------------------------------------------------- |
| `size`   |  `number` |     `5` | Integer scale factor for each QR module.                  |
| `margin` |  `number` |     `4` | Quiet-zone margin around the QR code, in modules.         |
| `small`  | `boolean` | `false` | Pack two scaled QR rows into each terminal row using `▀`. |

The default text renderer uses fixed 24-bit ANSI black and white, avoiding terminal palette substitutions such as gray for black. Shared `colors` options are ignored.

## Common recipes

### Print to the terminal

```ts
import {QRCodeTextRenderer, qrcode} from '@qrcodesdk/core';

const text = qrcode('HELLO WORLD').render(QRCodeTextRenderer());

console.log(text);
```

### Use alphanumeric mode

```ts
import {QRCodeTextRenderer, qrcode} from '@qrcodesdk/core';

const text = qrcode('HELLO WORLD')
  .mode('alphanumeric')
  .render(QRCodeTextRenderer({size: 1, margin: 2}));

console.log(text);
```

### Render a compact QR code

```ts
import {QRCodeTextRenderer, qrcode} from '@qrcodesdk/core';

const text = qrcode('HELLO WORLD').render(QRCodeTextRenderer({size: 1, margin: 2, small: true}));

console.log(text);
```

Compact mode uses the original plain Unicode block rendering with no ANSI escape sequences:

| Character | Meaning                          |
| --------- | -------------------------------- |
| `█`       | Upper and lower module are dark  |
| `▀`       | Upper module is dark             |
| `▄`       | Lower module is dark             |
| space     | Upper and lower module are light |

### Write to a text file

```ts
import {writeFileSync} from 'node:fs';

import {QRCodeTextRenderer, qrcode} from '@qrcodesdk/core';

const text = qrcode('HELLO WORLD').render(QRCodeTextRenderer());

writeFileSync('qrcode.txt', text, 'utf8');
```

In default mode, the ANSI escape sequences remain in the returned string when it is redirected or written to a file. The renderer does not inspect TTY state or `NO_COLOR`. Use `small: true` when plain Unicode output without escape sequences is required.

## Output details

Let `S = (matrix width + 2 × margin) × size`:

| Mode          | Visible width |    Line count | Cell technique                                      |
| ------------- | ------------: | ------------: | --------------------------------------------------- |
| Default       |       `2 × S` |           `S` | Two spaces with an ANSI background per scaled cell. |
| `small: true` |           `S` | `ceil(S / 2)` | Plain Unicode `█`, `▀`, `▄`, and spaces.            |

Every default-mode line ends with `\x1b[0m` so the QR colors do not leak into following terminal output. If compact mode has an unmatched final upper row, its missing lower row is rendered as light.
