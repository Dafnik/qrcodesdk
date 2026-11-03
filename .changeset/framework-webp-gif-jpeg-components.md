---
'@qrcodesdk/angular': patch
'@qrcodesdk/react': patch
'@qrcodesdk/svelte': patch
'@qrcodesdk/vue': patch
---

Add `QRCodeWebP`, `QRCodeGIF`, and `QRCodeJPEG` components, which render WebP, GIF, and JPEG images, together with the `QRCodeWebPImageOptions`, `QRCodeGIFImageOptions`, and `QRCodeJPEGImageOptions` types. React, Svelte, and Vue also export `QRCodeWebPProps`, `QRCodeGIFProps`, and `QRCodeJPEGProps`.

Rename the `QRCodeImage` component to `QRCodePNG` and `QRCodeImageOptions` to `QRCodePNGImageOptions`. React, Svelte, and Vue rename `QRCodeImageProps` to `QRCodePNGProps`. The `download()` method is available on every image component and saves the file with the matching extension.
