# Installed-package tests

The browser and framework smoke tests install the tarballs produced by the build job.
They use real browsers to check SVG, Canvas and Image output. The framework tests also
build a consumer application, check its framework version and reject browser console errors.

CI uses `dafnik/setup-node-pnpm` to install the workspace dependencies. Playwright and Turbo
come from the workspace. Each consumer installs its dependencies in a temporary directory,
independently of the workspace.

Each framework/version pair in `fixtures/` has exact dependency versions and an npm lockfile.
The runner copies the shared template and existing smoke component into a temporary consumer,
runs `npm ci`, then installs the current local tarballs without saving them to the fixture.
The tarballs are intentionally absent from the fixture lock files because their contents and
versions change with the library under test. No application generator runs during CI.

Renovate leaves these compatibility fixtures unchanged so that updates cannot move a test
to a different framework version. Update their dependencies deliberately, then regenerate
the lock files from the workspace root:

```sh
pnpm turbo run update:runtime-fixtures --filter=@qrcodesdk/browser
```

Build and pack the libraries, then run a consumer test:

```sh
QRCODESDK_PACKAGES=/tmp/qrcodesdk-runtime-packages pnpm turbo run pack:runtime
QRCODESDK_PACKAGES=/tmp/qrcodesdk-runtime-packages \
QRCODESDK_FRAMEWORK=vue QRCODESDK_FRAMEWORK_VERSION=3.3 \
pnpm turbo run test:framework-runtime --filter=@qrcodesdk/browser
```

The selected Playwright browser and its system dependencies must already be installed.
All framework consumers need Chromium.

For the browser smoke test, point `QRCODESDK_CONSUMER` at a consumer directory with the packed
`@qrcodesdk/core` and `@qrcodesdk/browser` packages installed in its `node_modules`:

```sh
QRCODESDK_BROWSER=chromium QRCODESDK_CONSUMER=/absolute/path/to/consumer \
pnpm turbo run test:browser-runtime --filter=@qrcodesdk/browser
```
