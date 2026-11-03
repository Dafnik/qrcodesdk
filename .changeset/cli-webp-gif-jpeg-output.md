---
'@qrcodesdk/cli': patch
---

Add `webp`, `gif`, and `jpeg` output formats. `--format` is inferred from `.webp`, `.gif`, `.jpg`, and `.jpeg` output paths, and the interactive format prompt lists the new formats. JPEG output accepts `--quality` from 1 to 100 (default `92`) and `--matte` as an opaque `#rrggbb` color for transparent pixels (default `#ffffff`).
