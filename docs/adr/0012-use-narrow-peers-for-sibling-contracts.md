# Use narrow peer ranges for sibling integration contracts

Packages that consume only public QRCodeSDK APIs may declare caret peer ranges. Packages that
consume `ɵ` sibling integration contracts declare a tilde range from the Core version they build
against, and Core patch releases preserve those contracts. A breaking `ɵ` change requires a Core
minor release and coordinated releases of affected packages with new peer ranges, without forcing
unaffected packages into lockstep versioning.
