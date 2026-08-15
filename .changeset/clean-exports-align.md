---
'@qrcodesdk/angular': patch
'@qrcodesdk/core': patch
'@qrcodesdk/react': patch
---

Tighten package export surfaces by marking cross-package implementation types as internal, using explicit Angular component exports, and emitting React's shared interfaces as type-only exports. React components now also use the platform's native child replacement API.
