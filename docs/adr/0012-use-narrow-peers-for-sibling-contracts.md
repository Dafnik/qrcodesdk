# Use narrow peer ranges for sibling integration contracts

Superseded by [ADR 0038](./0038-use-renderer-owned-styling-and-a-public-drawing-protocol.md). Core no
longer exposes specially prefixed sibling integration contracts. Cross-package renderer integration uses the
stable public `@qrcodesdk/core/drawing` subpath.

Packages that consume only public QRCodeSDK APIs may declare caret peer ranges. Packages that
consume `ɵ` sibling integration contracts declare a tilde range from the Core version they build
against, and Core patch releases preserve those contracts. A breaking `ɵ` change requires a Core
minor release and coordinated releases of affected packages with new peer ranges, without forcing
unaffected packages into lockstep versioning.
