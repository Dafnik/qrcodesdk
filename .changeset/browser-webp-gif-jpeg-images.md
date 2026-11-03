---
'@qrcodesdk/browser': patch
---

Add `QRCodeWebPImageRenderer`, `QRCodeGIFImageRenderer`, and `QRCodeJPEGImageRenderer`, which render an image element backed by a lossless WebP, single-frame GIF, or baseline JPEG data URL. Each renderer is also available from its own `@qrcodesdk/browser/webp`, `@qrcodesdk/browser/gif`, and `@qrcodesdk/browser/jpeg` entry point.

GIF output supports 256 colors and binary transparency. Pixels with an alpha value below `transparency.threshold` (default `128`) become transparent. JPEG output takes a `quality` from 1 to 100 (default `92`) and blends transparent pixels onto `transparency.matte` (default `#ffffff`).

Rename `QRCodeImageRenderer` to `QRCodePNGImageRenderer` and `QRCodeImageOptions` to `QRCodePNGImageOptions`, and add the `@qrcodesdk/browser/png` entry point. `QRCodeDownloadImageRenderer` now downloads the output of any image renderer and picks the `.png`, `.webp`, `.gif`, or `.jpg` extension from the image's data URL.
