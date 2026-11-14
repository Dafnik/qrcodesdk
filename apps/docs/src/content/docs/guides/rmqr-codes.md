---
title: Generate rMQR codes
description: Create rectangular Micro QR (rMQR) codes for long, narrow spaces, and choose their height or exact version.
docType: guide

related:
  - ../reference/builder.mdx
  - ./micro-qr-codes.md
  - ./customize.md
  - ../reference/custom-renderers.md
---

A rectangular Micro QR code, or rMQR code (ISO/IEC 23941), is a QR code for long, narrow spaces. It
is 7 to 17 modules high and 27 to 139 modules wide, has one finder pattern, and needs a quiet zone
of only 2 modules. It fits where a barcode would, such as on tubes, cables, edge labels, and narrow
packaging.

rMQR codes hold up to 361 digits, 219 alphanumeric characters, 150 UTF-8 bytes, or 92 Kanji
characters.

:::caution[Check your scanners first]
Many phone camera apps cannot read rMQR codes. Decoders such as ZXing-C++ can, and so can scanners
that support ISO/IEC 23941. Use rMQR codes only when you know which scanners read them, and use
standard QR codes when you don't.
:::

## Create an rMQR code

Import `rMQR()` from `@qrcodesdk/core/rmqr` and pass its result as the `symbol` matrix option. Every
renderer draws the rectangular matrix it returns:

```ts
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';
import {rMQR} from '@qrcodesdk/core/rmqr';

const svg = qrcode('LOT-2026-0042').options({symbol: rMQR()}).render(QRCodeSVGRenderer());
```

The rMQR encoder is only in `@qrcodesdk/core/rmqr`. Applications that never import it do not bundle
it.

Framework packages re-export `rMQR()`. Pass the symbol in the `matrix` options of a component:

```tsx
import {QRCodeSVG, rMQR} from '@qrcodesdk/react';

const symbol = rMQR({version: 'R7'});

export function TubeLabel({lot}: {lot: string}) {
  return <QRCodeSVG payload={lot} options={{matrix: {symbol}}} />;
}
```

## Choose the size

`rMQR()` takes one option, `version`:

| `version`                  | Selects                                                       |
| -------------------------- | ------------------------------------------------------------- |
| omitted                    | The version with the fewest modules that holds the payload    |
| a height, such as `R7`     | The narrowest version of that height that holds the payload   |
| a version, such as `R7x59` | Exactly that version, or throws when the payload does not fit |

Heights are `R7`, `R9`, `R11`, `R13`, `R15`, and `R17`. Use a height when the label has a fixed
height and room to grow sideways:

```ts
import {qrcode} from '@qrcodesdk/core';
import {rMQR} from '@qrcodesdk/core/rmqr';

qrcode('LOT-2026-0042').options({symbol: rMQR()}).matrix(); // 27 × 13, the fewest modules
qrcode('LOT-2026-0042')
  .options({symbol: rMQR({version: 'R7'})})
  .matrix(); // 59 × 7
qrcode('LOT-2026-0042')
  .options({symbol: rMQR({version: 'R7x139'})})
  .matrix(); // 139 × 7
```

The matrix reports its size as `width` and `height` in modules. When no version of the requested
height or size holds the payload, generation throws `QRCodeError` with code `PAYLOAD_TOO_LARGE`.
`rMQR()` checks its own option when you call it, so create the symbol once and reuse it.

## Error correction and other options

rMQR codes support the error-correction levels `M`, the default, and `H`. Level `H` recovers more
damage and needs a larger symbol:

```ts
qrcode('https://qrcodesdk.dev').options({symbol: rMQR()}).matrix(); // 43 × 13
qrcode('https://qrcodesdk.dev').options({symbol: rMQR(), errorCorrectionLevel: 'H'}).matrix(); // 77 × 11
```

The matrix options `mode`, `kanji`, and `errorCorrectionLevel` apply as usual. rMQR codes do not
support the levels `L` and `Q`, or `version`, `mask`, `eci`, or `segmenter` in the matrix options.
Generation throws `QRCodeError` with code `INVALID_OPTIONS` when they are set. rMQR codes use a
single fixed mask.

## Capacity

The capacity at level `M` / level `H`:

| Version | Size     |    Digits | Alphanumeric |    Bytes |   Kanji |
| ------- | -------- | --------: | -----------: | -------: | ------: |
| R7x43   | 43 × 7   |    12 / 5 |        7 / 3 |    5 / 2 |   3 / 1 |
| R7x59   | 59 × 7   |   26 / 14 |       16 / 8 |   11 / 6 |   6 / 3 |
| R7x77   | 77 × 7   |   45 / 21 |      27 / 13 |   19 / 9 |  11 / 5 |
| R7x99   | 99 × 7   |   64 / 30 |      39 / 18 |  27 / 13 |  16 / 8 |
| R7x139  | 139 × 7  |  102 / 54 |      62 / 33 |  42 / 22 | 26 / 14 |
| R9x43   | 43 × 9   |   26 / 14 |       16 / 8 |   11 / 6 |   6 / 3 |
| R9x59   | 59 × 9   |   47 / 23 |      29 / 14 |  20 / 10 |  12 / 6 |
| R9x77   | 77 × 9   |   71 / 37 |      43 / 23 |  30 / 16 |  18 / 9 |
| R9x99   | 99 × 9   |   97 / 49 |      59 / 30 |  40 / 20 | 25 / 12 |
| R9x139  | 139 × 9  |  147 / 75 |      89 / 46 |  61 / 31 | 38 / 19 |
| R11x27  | 27 × 11  |    14 / 9 |        8 / 6 |    6 / 4 |   3 / 2 |
| R11x43  | 43 × 11  |   42 / 23 |      26 / 14 |  18 / 10 |  11 / 6 |
| R11x59  | 59 × 11  |   71 / 33 |      43 / 20 |  30 / 14 |  18 / 8 |
| R11x77  | 77 × 11  |  100 / 52 |      60 / 31 |  41 / 21 | 25 / 13 |
| R11x99  | 99 × 11  |  133 / 66 |      81 / 40 |  55 / 27 | 34 / 17 |
| R11x139 | 139 × 11 |  198 / 97 |     120 / 59 |  82 / 40 | 51 / 25 |
| R13x27  | 27 × 13  |   26 / 14 |       16 / 8 |   11 / 6 |   6 / 3 |
| R13x43  | 43 × 13  |   62 / 28 |      37 / 17 |  26 / 12 |  16 / 7 |
| R13x59  | 59 × 13  |   88 / 45 |      53 / 27 |  36 / 18 | 22 / 11 |
| R13x77  | 77 × 13  |  124 / 66 |      75 / 40 |  51 / 27 | 31 / 17 |
| R13x99  | 99 × 13  |  171 / 80 |     104 / 49 |  71 / 33 | 44 / 20 |
| R13x139 | 139 × 13 | 251 / 126 |     152 / 76 | 104 / 52 | 64 / 32 |
| R15x43  | 43 × 15  |   76 / 33 |      46 / 20 |  31 / 13 |  19 / 8 |
| R15x59  | 59 × 15  |  112 / 59 |      68 / 36 |  46 / 24 | 28 / 15 |
| R15x77  | 77 × 15  |  157 / 71 |      95 / 43 |  65 / 29 | 40 / 18 |
| R15x99  | 99 × 15  | 207 / 111 |     126 / 68 |  86 / 46 | 53 / 28 |
| R15x139 | 139 × 15 | 301 / 162 |     182 / 98 | 125 / 67 | 77 / 41 |
| R17x43  | 43 × 17  |   90 / 47 |      55 / 28 |  37 / 19 | 23 / 12 |
| R17x59  | 59 × 17  |  131 / 63 |      79 / 38 |  54 / 26 | 33 / 16 |
| R17x77  | 77 × 17  |  183 / 87 |     111 / 53 |  76 / 36 | 47 / 22 |
| R17x99  | 99 × 17  | 236 / 131 |     143 / 79 |  98 / 54 | 60 / 33 |
| R17x139 | 139 × 17 | 361 / 178 |    219 / 108 | 150 / 74 | 92 / 46 |

- Octet payloads are UTF-8, so a non-ASCII character takes 2 to 4 of the available bytes.
- [Kanji mode](/reference/builder/#kanji-mode) works in every version. Pass the Kanji table from
  `@qrcodesdk/core/kanji` as the `kanji` matrix option, as for standard QR codes.

## Styling

rMQR codes take the same [visual styles](/guides/customize/) as standard QR codes, with these
differences:

- The default quiet zone is 2 modules instead of 4. Set `style.quietZone` to override it.
- `finder()` styles the one finder pattern in the top-left corner.
- The 5 × 5 finder sub-pattern in the bottom-right corner has the shape of a standard alignment
  pattern, so `alignment()` styles it. It stays square when `modules` has a shape, like the finder
  pattern, because scanners use it to locate the code.
- The 3 × 3 alignment patterns along the top and bottom edges belong to the timing patterns and take
  the module shape.
- A center image is a square sized from the height of the code, in the middle of it. Use level `H`
  and a small image, because rMQR codes have little room for error correction.

:::caution[Keep the finder ring and sub-pattern center square]
Scanners locate an rMQR code from its finder pattern and finder sub-pattern. ZXing cannot reliably
find rMQR codes whose finder ring, or the center of whose finder sub-pattern, has a shape. Shaped
finder centers, finder sub-pattern rings, and module shapes are fine.
:::

## Custom renderers

An rMQR matrix is wider than it is high. A [custom renderer](/reference/custom-renderers/) that loops
over `height` for rows and `width` for columns draws every symbol. rMQR codes reuse the standard
module roles; see [Module roles](/reference/custom-renderers/#module-roles).

## Not supported

rMQR codes in QRCodeSDK hold one segment in numeric, alphanumeric, octet, or Kanji mode.
Mixed-mode segmentation, ECI, and FNC1 (GS1) are not available for them yet.
