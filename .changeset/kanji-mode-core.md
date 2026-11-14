---
'@qrcodesdk/core': patch
---

Add opt-in QR code Kanji mode, which packs each double-byte Shift JIS character into 13 bits instead of UTF-8 bytes, so Japanese text fits smaller symbols. Import the Shift JIS table from the new `@qrcodesdk/core/kanji` entry point and pass it as the `kanji` matrix option or with `.kanji(kanji)`. The table adds about 13 kB gzipped and stays out of bundles that don't import it.

With the table, `mode: 'kanji'` forces Kanji mode, `auto` mode picks Kanji mode when every character fits, and `automaticSegmenter` combines Kanji segments with numeric, alphanumeric, and octet segments. Custom segmenters receive the table as `kanji` in their options and can return `{mode: 'kanji'}` segments. Kanji mode only accepts characters that decode back unchanged, and Kanji segments never get an ECI header.

Kanji mode or Kanji segments without the table throw `QRCodeError` with code `INVALID_OPTIONS`; characters outside the table throw `INVALID_PAYLOAD`. `QRCodeEncodingMode` and `QRCodeMode` now include `'kanji'`, so exhaustive `switch` statements over them need a new case. The new `QRCodeKanji` type describes the table.
