---
'@qrcodesdk/browser': patch
---

Update Canvas, Image, and download renderers for the flat role-aware matrix and composable styles from `@qrcodesdk/core/style`. Reuse prepared paths and group drawing by color to reduce repeated rendering work.

Create Canvas and Image center images with `canvasCenterImage(source, layout)` and pass the result as `centerImage`, replacing inline source and layout objects. Replace `QRCodeCanvasCenterImageOptions` with `QRCodeCanvasCenterImage`.

Keep SVG download URLs alive for 40 seconds so browsers can start asynchronous downloads. Snapshot download options when creating the renderer, trim filenames, and use `qrcode` when the filename is empty or whitespace.

Rely on declared option types instead of rejecting unknown keys and incorrectly typed accessibility values at runtime.
