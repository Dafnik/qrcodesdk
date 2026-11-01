---
'@qrcodesdk/node': patch
---

Update PNG rendering for the flat role-aware matrix and composable styles, including custom paths and independent alignment patterns. Cache rasterized shape paths across renders and combine coverage by color layer to reduce repeated work and avoid seams between adjacent pieces.

Create center images with `pngCenterImage(source, layout)` and pass the result as `centerImage`, replacing inline source and layout objects. The factory accepts PNG bytes as a `Uint8Array` and validates and decodes the image once for reuse. Replace `QRCodePNGCenterImageOptions` with `QRCodePNGCenterImage`.

Reject PNG output larger than 67,108,864 pixels before allocating its pixel buffers. Rely on declared option types instead of rejecting unknown option keys at runtime.
