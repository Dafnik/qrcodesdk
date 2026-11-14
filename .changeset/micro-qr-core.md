---
'@qrcodesdk/core': patch
---

Add Micro QR codes (M1 to M4) through the new `@qrcodesdk/core/micro` entry point. Pass `microQR()` as the `symbol` matrix option, such as `qrcode('12345').options({symbol: microQR()})`, to generate the smallest Micro QR code that holds the payload. `microQR()` accepts `version` (`'M1'` to `'M4'`), `mask` (`0` to `3`), and `fallback`, which generates a standard QR code when no Micro QR code can hold the payload. Applications that do not import `@qrcodesdk/core/micro` do not bundle the Micro QR encoder.

Micro QR codes support levels `L` and `M`, and `Q` in M4. M1 only detects errors, so it is used only when requested with `version: 'M1'`. Setting `version`, `mask`, `eci`, or `segmenter` next to a Micro QR symbol throws `QRCodeError` with code `INVALID_OPTIONS`.

`QRCodeMatrixOptions` is now the union of `QRCodeStandardMatrixOptions` and `QRCodeSymbolMatrixOptions`. Interfaces can no longer extend `QRCodeMatrixOptions`; extend `QRCodeStandardMatrixOptions` instead, and use it when deriving types with `Omit` or `Pick`. Add the `QRCodeSymbol`, `QRCodeMicroVersion`, `QRCodeMicroMask`, and `QRCodeMicroOptions` types.

The default `style.quietZone` of the built-in renderers is now 2 modules for Micro QR codes and stays 4 modules for standard QR codes. `finder()` styles only the finder patterns that a symbol contains.
