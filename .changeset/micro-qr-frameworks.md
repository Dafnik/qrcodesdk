---
'@qrcodesdk/angular': patch
'@qrcodesdk/react': patch
'@qrcodesdk/svelte': patch
'@qrcodesdk/vue': patch
---

Expose `microQR` together with the `QRCodeMicroVersion`, `QRCodeMicroMask`, `QRCodeMicroOptions`, `QRCodeSymbol`, `QRCodeStandardMatrixOptions`, and `QRCodeSymbolMatrixOptions` types directly from each framework package. Render a Micro QR code by passing the symbol in the component's matrix options, such as `options={{matrix: {symbol: microQR()}}}`.
