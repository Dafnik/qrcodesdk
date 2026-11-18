---
'@qrcodesdk/node': patch
---

`rasterCenterImage()` decodes PNG bytes with a decoder shared with `@qrcodesdk/react-native` and rejects more malformed PNG files with `QRCodeError` code `INVALID_IMAGE_SOURCE`: a repeated or wrongly sized `IHDR` chunk, and bit depths that the PNG specification does not allow for the color type, such as 16-bit palette images.
