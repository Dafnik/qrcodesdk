---
'@qrcodesdk/core': patch
---

Replace the nested-array matrix with an immutable `QRCodeMatrix` object containing `size`, flat row-major `modules`, and `roles`. Custom renderers must read a module at `modules[y * size + x]`. Use `QR_CODE_MODULE_ROLES` to distinguish data, finder, alignment, timing, and information modules.

Replace string-based module and finder shapes with reusable `rounded()`, `diagonal()`, `circle()`, `finder()`, `alignment()`, and `customShape()` factories from `@qrcodesdk/core/style`. Finder options now use `ring` instead of `outer`. Add independent alignment styling and custom relative SVG paths. Remove the public `@qrcodesdk/core/drawing` entry point and drawing protocol; custom renderers consume the matrix directly.

Create SVG center images with `svgCenterImage(source, layout)` and pass the result as `centerImage`, replacing inline source and layout objects. Replace `QRCodeSVGCenterImageOptions` with `QRCodeSVGCenterImage` and use `QRCodeCenterImageLayout` for shared layout options.

Speed up matrix encoding, error correction, masking, and scoring. Reduce repeated shape preparation and drawing allocations, group output by color, and compact SVG paths. Keep the matrix entry point independent of styling code so unused styling stays out of consumer bundles.

Rely on the declared TypeScript types for option object shapes and payload helper input types. Unknown option keys and incorrectly typed values no longer consistently produce `QRCodeError`; numeric bounds, colors, image sources, and custom paths still receive runtime validation.
