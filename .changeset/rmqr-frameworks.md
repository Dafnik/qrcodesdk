---
'@qrcodesdk/angular': patch
'@qrcodesdk/react': patch
'@qrcodesdk/svelte': patch
'@qrcodesdk/vue': patch
---

Expose `rMQR` together with the `QRCodeRMQRVersion`, `QRCodeRMQRHeight`, and `QRCodeRMQROptions` types directly from each framework package. Render an rMQR code by passing the symbol in the component's matrix options, such as `options={{matrix: {symbol: rMQR()}}}`.
