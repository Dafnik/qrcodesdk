---
'@qrcodesdk/node': patch
---

Add `QRCodeWebPRenderer`, `QRCodeGIFRenderer`, and `QRCodeJPEGRenderer`, which render lossless WebP, single-frame GIF, and baseline JPEG bytes as a `Buffer`. They accept the same style and `rasterCenterImage()` options as `QRCodePNGRenderer`, exported as `QRCodeRasterRendererOptions`, and share its 67,108,864-pixel output limit.

GIF output supports 256 colors and binary transparency. Pixels with an alpha value below `transparency.threshold` (default `128`) become transparent. JPEG output takes a `quality` from 1 to 100 (default `92`) and blends transparent pixels onto `transparency.matte` (default `#ffffff`).
