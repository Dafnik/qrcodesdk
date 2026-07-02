---
title: Text Renderer
description: The text renderer outputs a QR code as a plain text string. It is useful when you want to display a QR code in a terminal, print it in CLI output, write it to logs, or use it in tests and snapshots.
---

The text renderer outputs a QR code as a plain text string.

It is useful when you want to display a QR code in a terminal, print it in CLI output, write it to logs, or use it in tests and snapshots.

## Minimal example

```ts
import {QRCodeTextRenderer, qrcode} from '@qrcodesdk/core';

const text = qrcode('HELLO WORLD').render(QRCodeTextRenderer());

console.log(text);
```

The returned value is a string containing block characters and newline separators.

## Styling options

You can control the rendered text size and margin by passing options to `QRCodeTextRenderer`.

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

### Options

| Option   |     Type | Default | Description                                       |
| -------- | -------: | ------: | ------------------------------------------------- |
| `size`   | `number` |     `5` | Integer scale factor for each QR module.          |
| `margin` | `number` |     `4` | Quiet-zone margin around the QR code, in modules. |

The text renderer only uses `size` and `margin`. Color options are ignored because the output is plain text.

## Output format

The renderer uses Unicode block characters to create compact terminal output:

| Character | Meaning                          |
| --------- | -------------------------------- |
| `█`       | Upper and lower module are dark  |
| `▀`       | Upper module is dark             |
| `▄`       | Lower module is dark             |
| space     | Upper and lower module are light |

The renderer combines two vertical rows of QR modules into one terminal line, making the output shorter while preserving the QR pattern.

## Node.js examples

Because the text renderer returns a string, you can print it, write it to a file, return it from scripts, or compare it in tests.

### Print to the terminal

```ts
import {QRCodeTextRenderer, qrcode} from '@qrcodesdk/core';

const text = qrcode('HELLO WORLD').render(QRCodeTextRenderer());

console.log(text);
```

### Write to a text file

```ts
import {writeFileSync} from 'node:fs';

import {QRCodeTextRenderer, qrcode} from '@qrcodesdk/core';

const text = qrcode('HELLO WORLD').render(QRCodeTextRenderer());

writeFileSync('qrcode.txt', text, 'utf8');
```
