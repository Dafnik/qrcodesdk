---
'@qrcodesdk/core': patch
---

Breaking: `QRCodeMatrix` describes its dimensions with `width` (modules per row) and `height` (rows) instead of `size`. Standard and Micro QR matrices are square, so both values are equal, and the module at column `x` and row `y` is at index `y * width + x`. Replace `matrix.size` with `matrix.width`, and loop over `height` for rows in custom renderers so they also draw rectangular symbols.

The SVG and text renderers draw rectangular matrices, the default `style.quietZone` is 2 modules for every symbol shorter than 21 modules, and a center image is a square sized from the shorter side of the symbol and centered on both axes. The `dimensions` check of the built-in renderers applies to the output width and height separately.
