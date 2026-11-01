---
'@qrcodesdk/angular': patch
'@qrcodesdk/react': patch
'@qrcodesdk/svelte': patch
'@qrcodesdk/vue': patch
---

Expose `rounded`, `diagonal`, `circle`, `finder`, `alignment`, `customShape`, `svgCenterImage`, and `canvasCenterImage`, together with their public option and shape types, directly from each framework package.

Update component options to use composable styles and prepared center image values. Replace string-based shapes and inline center image objects with the exported factories. Add the `QRCodeDownloadHandle` type to the Angular exports.
