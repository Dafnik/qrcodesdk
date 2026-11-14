---
'@qrcodesdk/browser': patch
'@qrcodesdk/node': patch
---

The Canvas, Image element, PNG, WebP, GIF, and JPEG renderers draw rectangular matrices, such as rMQR codes, with separate output widths and heights. When Node.js raster output exceeds the pixel budget, `QRCodeError.details.value` now holds the output width and height instead of a single side length.
