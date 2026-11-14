---
title: Generate Micro QR codes
description: Create small Micro QR codes for short payloads, and fall back to standard QR codes when they do not fit.
docType: guide

related:
  - ../reference/builder.mdx
  - ./customize.md
  - ../reference/errors.md
  - ../learn/how-qr-codes-work.mdx
---

A Micro QR code is a smaller relative of the standard QR code, with one finder pattern instead of
three. It is 11 to 17 modules wide and needs a quiet zone of only 2 modules, so it fits where a
standard QR code does not, such as on small parts, labels, and printed circuit boards.

Micro QR codes hold little data: at most 35 digits, 21 alphanumeric characters, or 15 UTF-8 bytes.

:::caution[Check your scanners first]
Many phone camera apps cannot read Micro QR codes. Industrial scanners and libraries such as ZXing
can. Use Micro QR codes only when you know which scanners read them, or let
[`fallback`](#fall-back-to-a-standard-qr-code) switch to a standard QR code.
:::

## Create a Micro QR code

Import `microQR()` from `@qrcodesdk/core/micro` and pass its result as the `symbol` matrix option.
Every renderer draws the matrix it returns:

```ts
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';
import {microQR} from '@qrcodesdk/core/micro';

const svg = qrcode('01234567')
  .options({symbol: microQR(), errorCorrectionLevel: 'L'})
  .render(QRCodeSVGRenderer());
```

The Micro QR encoder is only in `@qrcodesdk/core/micro`. Applications that never import it do not
bundle it.

Framework packages re-export `microQR()`. Pass the symbol in the `matrix` options of a component:

```tsx
import {QRCodeSVG, microQR} from '@qrcodesdk/react';

const symbol = microQR();

export function PartLabel({serial}: {serial: string}) {
  return <QRCodeSVG payload={serial} options={{matrix: {symbol}}} />;
}
```

## Options

`microQR()` takes the options that are specific to Micro QR codes:

| Option     | Type                           | Default   | Meaning                                                          |
| ---------- | ------------------------------ | --------- | ---------------------------------------------------------------- |
| `version`  | `'M1' \| 'M2' \| 'M3' \| 'M4'` | automatic | Symbol size, from 11 × 11 (M1) to 17 × 17 (M4) modules           |
| `mask`     | integer `0`–`3`                | automatic | Mask pattern; automatic selection maximizes dark edge modules    |
| `fallback` | `boolean`                      | `false`   | Generates a standard QR code when no Micro QR code fits the data |

The matrix options `mode` and `errorCorrectionLevel` apply as usual. Micro QR codes do not support
`version`, `mask`, `eci`, or `segmenter` in the matrix options, and generation throws `QRCodeError`
with code `INVALID_OPTIONS` when they are set.

`microQR()` checks its own options when you call it, so create the symbol once and reuse it.

## Capacity and error correction

Automatic selection returns the smallest version that holds the payload at the requested
error-correction level. The default level is `M`, as for standard QR codes.

| Version | Size    | Level | Digits | Alphanumeric | Bytes |
| ------- | ------- | ----- | -----: | -----------: | ----: |
| M1      | 11 × 11 | –     |      5 |            – |     – |
| M2      | 13 × 13 | L     |     10 |            6 |     – |
|         |         | M     |      8 |            5 |     – |
| M3      | 15 × 15 | L     |     23 |           14 |     9 |
|         |         | M     |     18 |           11 |     7 |
| M4      | 17 × 17 | L     |     35 |           21 |    15 |
|         |         | M     |     30 |           18 |    13 |
|         |         | Q     |     21 |           13 |     9 |

- Micro QR codes do not support level `H`, and only M4 supports `Q`.
- M1 detects errors but cannot correct them. Automatic selection therefore never picks it. Request
  it with `version: 'M1'` and level `L` or `M`.
- Alphanumeric payloads need at least M2 and octet payloads at least M3.
- Octet payloads are UTF-8, so a non-ASCII character takes 2 to 4 of the available bytes.

## Fall back to a standard QR code

When no Micro QR code can hold the payload at the requested level, generation throws `QRCodeError`
with code `PAYLOAD_TOO_LARGE`. Set `fallback: true` to generate a standard QR code instead:

```ts
import {qrcode} from '@qrcodesdk/core';
import {microQR} from '@qrcodesdk/core/micro';

const symbol = microQR({fallback: true});

qrcode('12345').options({symbol}).matrix().size; // 13: a Micro QR code (M2)
qrcode('https://qrcodesdk.dev').options({symbol}).matrix().size; // 25: a standard QR code
```

The fallback uses the same `mode` and `errorCorrectionLevel`, including level `H`, with automatic
version and mask. It adds almost nothing to your bundle because the standard encoder is already
part of it.

## Styling

Micro QR codes take the same [visual styles](/guides/customize/) as standard QR codes, with two
differences:

- The default quiet zone is 2 modules instead of 4. Set `style.quietZone` to override it.
- `finder()` styles the single finder pattern, and `alignment()` has nothing to style.

:::caution[Keep the finder ring sharp]
Scanners locate a Micro QR code from its one finder pattern. ZXing cannot find finder rings with a
corner radius of `0.5` or more, such as `rounded()` or `circle()` rings, although the same rings
scan fine on standard QR codes. Rounded finder centers and module shapes are fine.
:::

## Not supported

Micro QR codes in QRCodeSDK hold one segment in numeric, alphanumeric, or octet mode. Mixed-mode
segmentation, Kanji mode, ECI, and FNC1 are not available for them.
