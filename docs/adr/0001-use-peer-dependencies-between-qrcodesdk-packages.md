# Use peer dependencies between QRCodeSDK packages

Framework packages provide a convenient component API, but their users must explicitly install the
compatible `@qrcodesdk/core` and `@qrcodesdk/browser` packages. We keep these internal SDK packages
as peer dependencies to favor a single resolved copy and avoid duplicate browser bytes, accepting a
more involved installation even though multiple compatible Core copies would not break correctness.
