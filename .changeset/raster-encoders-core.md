---
'@qrcodesdk/core': patch
---

Add bundled lossless WebP, single-frame GIF, and baseline JPEG encoders for the `@qrcodesdk/browser` and `@qrcodesdk/node` image renderers. The encoders run without platform image APIs, so output is identical in every browser and in Node.
