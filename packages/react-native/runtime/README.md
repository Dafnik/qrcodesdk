# React Native installed-package test

The smoke test installs the packed `@qrcodesdk/core` and `@qrcodesdk/react-native` tarballs into a
React Native consumer, then uses the consumer's own Metro and Hermes compiler:

1. It runs the `@qrcodesdk/core` smoke test in the Hermes CLI.
2. It renders every component in the Hermes CLI, with host components in place of the native views,
   and checks that Node.js renders the same output. It then scans the SVG and image output with
   ZXing.
3. It bundles a real app for Android and iOS and compiles it to Hermes bytecode.

No simulator or device runs. Native rendering by react-native-svg and `Image` is not covered.
The separate [native example and simulator tests](../../../apps/native-example/README.md) cover
native rendering on iOS and Android by decoding screenshots from the running app.

Each React Native version in `fixtures/` has exact dependency versions and an npm lockfile. React
Native packages declare `react-native: *` peers, so the fixtures use legacy peer resolution.
Regenerate the lock files after changing a fixture:

```sh
node packages/react-native/runtime/update-fixtures.mjs
```

The test needs Linux, because it uses the Linux Hermes compiler, and the standalone Hermes CLI
from the [Hermes v0.13.0 release](https://github.com/facebook/hermes/releases/tag/v0.13.0).
React Native ships only the compiler. Build and pack the libraries, then run the test:

```sh
QRCODESDK_PACKAGES=/tmp/qrcodesdk-runtime-packages pnpm turbo run pack:runtime
QRCODESDK_PACKAGES=/tmp/qrcodesdk-runtime-packages \
QRCODESDK_HERMES=/absolute/path/to/hermes \
QRCODESDK_REACT_NATIVE_VERSION=0.88 \
pnpm turbo run test:react-native-runtime --filter=@qrcodesdk/react-native
```
