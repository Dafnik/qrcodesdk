---
'@qrcodesdk/browser': patch
---

Create Canvas contexts with `willReadFrequently` so they are software-backed. Canvas output and the PNG, WebP, GIF, and JPEG images read back from it now have the same pixels with or without GPU acceleration.
