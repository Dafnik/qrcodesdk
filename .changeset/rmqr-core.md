---
'@qrcodesdk/core': patch
---

Add rectangular Micro QR (rMQR) codes (ISO/IEC 23941) through the new `@qrcodesdk/core/rmqr` entry point. Pass `rMQR()` as the `symbol` matrix option, such as `qrcode('LOT-2026-0042').options({symbol: rMQR()})`, to generate the rMQR code with the fewest modules that holds the payload. `rMQR({version: 'R7'})` selects the narrowest code of a height, from `'R7'` to `'R17'`, and `rMQR({version: 'R7x59'})` selects an exact version, from `'R7x43'` to `'R17x139'`. Applications that do not import `@qrcodesdk/core/rmqr` do not bundle the rMQR encoder.

rMQR codes are 7 to 17 modules high and 27 to 139 modules wide and hold up to 361 digits, 219 alphanumeric characters, 150 bytes, or 92 Kanji characters. They encode one numeric, alphanumeric, octet, or, with the `kanji` table, Kanji segment at the error-correction levels `M` and `H`. Levels `L` and `Q`, and `version`, `mask`, `eci`, or `segmenter` next to an rMQR symbol, throw `QRCodeError` with code `INVALID_OPTIONS`. Add the `QRCodeRMQRVersion`, `QRCodeRMQRHeight`, and `QRCodeRMQROptions` types.

rMQR codes reuse the standard module roles: the finder sub-pattern has the alignment roles, so `alignment()` styles it, and it stays square when `modules` has a shape, because scanners locate the code with it.
