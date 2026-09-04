# Use renderer-owned styling and a public drawing protocol

Styling belongs to renderer factories, while `QRCodeBuilder` remains responsible only for payload
and matrix configuration. SVG, Canvas, browser Image, and Node PNG consume the complete
`QRCodeVisualStyle`; Text consumes the smaller `QRCodeTextStyle`. Unsupported and unknown renderer
options fail rather than being ignored.

`createQRCodeStyler()` validates and snapshots visual style at factory creation, compiles immutable
drawings, and caches them by matrix identity. Built-in and custom graphical renderers paint those
drawings through the synchronous callback types exported from `@qrcodesdk/core/drawing`. The
protocol exposes stable geometry and lifecycle semantics without exposing Core's layers, finder
maps, compaction, path storage, or caches.

Renderer factories also validate and snapshot their nested option groups when called. Resource
handles remain owned by their renderer and are retained by identity. Accessibility, prepared image
sources, PNG compression, and ANSI behavior are renderer concerns, not styling. This keeps shared
visual behavior portable without pretending that every output supports the same capabilities.
