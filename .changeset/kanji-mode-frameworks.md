---
'@qrcodesdk/angular': patch
'@qrcodesdk/react': patch
'@qrcodesdk/svelte': patch
'@qrcodesdk/vue': patch
---

Re-export the `kanji` Shift JIS table and the `QRCodeKanji` type from `@qrcodesdk/core/kanji`. Pass `kanji` as `options.matrix.kanji` to enable Kanji mode in every component.
