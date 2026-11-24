## Workspace development

Install dependencies once, then run tasks through Turbo from the workspace root:

```sh
pnpm install
pnpm turbo run build
```

The root `package.json` keeps shortcuts for common workspace commands and release operations.
Shared task defaults live in the root `turbo.json`. Package-specific tasks and overrides live
in each package's `package.json` and `turbo.json`.

Use a filter to work on one package. Turbo builds its dependencies first:

```sh
pnpm turbo run build --filter=@qrcodesdk/node
pnpm turbo run check-types --filter=docs
```

To rebuild a package and its dependencies when source files change, use Turbo's watch mode:

```sh
pnpm turbo watch build --filter=@qrcodesdk/node
```

### Checks

```sh
pnpm turbo run check
```

This runs formatting, spelling, terminology, linting, type checking, builds, and the regular
tests. Docs linting also checks the generated package READMEs. Roundtrip tests, coverage,
size and speed reports, and installed-package smoke tests run separately.

To run individual checks:

```sh
pnpm turbo run format:check
pnpm turbo run lint
pnpm turbo run cspell
pnpm turbo run terminology
pnpm turbo run check-types
```

### Testing

```sh
pnpm turbo run test
pnpm turbo run test:roundtrips --filter=@repo/core-testing --filter=@qrcodesdk/browser --filter=@qrcodesdk/node
pnpm turbo run test:coverage
```

The `pnpm test:roundtrips` shortcut includes these filters. Keep them to avoid scheduling
builds for packages outside the roundtrip suites.

The browser package's tests require Playwright Chromium and its system dependencies.
Install the browser prerequisites using the same Playwright version as the workspace.
The CI setup is documented in `.github/actions/setup-playwright/action.yml`. Chromium CI jobs
install only the headless shell. Pass `only-shell: 'false'` if a job needs headed Chromium or a
Chromium channel. The WebKit runtime job uses the official Playwright container instead of
installing system dependencies; its image tag comes from the installed Playwright version.
Turbo passes `PLAYWRIGHT_BROWSERS_PATH` through to that runtime task so it finds the image's browsers.

Coverage clears previous reports, runs every package's raw coverage task through Turbo,
then merges the results. HTML, LCOV, and combined JSON reports are written to `coverage/`.

Installed-package smoke tests have separate consumer and browser prerequisites. See
[the runtime test guide](packages/browser/runtime/README.md) for their commands.
The React Native smoke test bundles with Metro and runs in Hermes. See
[the React Native runtime test guide](packages/react-native/runtime/README.md).

For real iOS and Android rendering, use the [native example and simulator tests](apps/native-example/README.md).
The Development workflow runs both platforms and checks QR payloads decoded from simulator screenshots:

```sh
pnpm turbo run native:tools --filter=native-example
pnpm turbo run test:native:ios --filter=native-example
pnpm turbo run test:native:android --filter=native-example
```

These tasks require native build tools and simulators. They run separately from `test` and `check`.

### Docs

Run the documentation site locally:

```sh
pnpm turbo run start --filter=docs
```

The docs also serve the dev tools at `/devtools`, a standalone page outside Starlight. They render
the shared `@repo/core-testing` fixtures with the `@qrcodesdk/angular` components (SVG, PNG, WebP,
GIF, JPEG, and Canvas), and can scan each output with ZXing. Their fixture categories are
`QR_CODE_RENDER_FIXTURE_GROUPS`, the fixtures and options that the SVG and raster snapshot tests
write to disk, so each tile matches a tracked snapshot file. Nothing renders until you pick fixtures and
renderers and press Run. Large selections, such as all combinations, render lazily in a virtual
list. The code lives in `apps/docs/src/libs/dev-tools`.

To build and preview the site:

```sh
pnpm turbo run preview --filter=docs
```

#### QR code explanation and encoding trace

The "How QR codes work" page explains a generated matrix. When **Show encoding trace** is on, it
imports `apps/docs/src/components/angular/qrcode-explain-trace-chunk.ts`, which loads the trace
analysis (`explain/qrcode-trace.ts`) and its presentation in their own chunk. The trace reads the
encoded result from the matrix and checks it with the encoder's own stateless helpers, so it is
coupled to private core source:

- `qrcode-core-source.ts` is the only docs module that imports `packages/core/src`. Keep it to
  stateless helpers such as tables, bit lengths, error correction, masks, and mask scores. Do not
  import the option resolver or the Kanji registry; matrices still come from the public builder.
- Renaming or changing those core helpers can break the docs. The docs `build`, `check-types`, and
  `test` tasks list `packages/core/src` as an input, so Turbo reruns them after core source changes.
- The Analog NGP compiler uses `apps/docs/tsconfig.app.json` to check Angular code and templates
  during the docs build. That configuration also includes the imported core source. Its
  `rootDir` is the workspace root, and its `lib` leaves out `es2022.error`: core targets ES2020,
  and under the ES2022 `Error` type, `noImplicitOverride` rejects `QRCodeError.cause`.
- The explanation tests run in Vitest, because the core source imports modules without file
  extensions, which the Node test runner cannot resolve. The docs `test` task runs them after the
  Node test suites.
- The trace is a docs inspector, not a published API. Its types stay in the docs and need no `ɵ`
  prefix.

The speed report measures the explanation with the trace off and on (`--only=explain/`). See
[Size and speed reports](#size-and-speed-reports).

Generate or check package READMEs:

```sh
pnpm turbo run generate-readmes --filter=docs
pnpm turbo run check-readmes --filter=docs
```

### Size and speed reports

[`@repo/perf`](packages/perf/README.md) measures the bundle size and speed of every feature.
Nothing here compares QRCodeSDK with other libraries. Build the reports from the workspace root:

```sh
pnpm turbo run report:size --filter=@repo/perf
pnpm turbo run report:speed --filter=@repo/perf
pnpm turbo run report:speed:browser --filter=@repo/perf
```

- The size report builds about 60 small apps, such as "matrix with Micro QR" or "React with all
  components", with Vite. Source maps attribute every byte to a source file and code area. esbuild
  and webpack build the same apps as a check.
- The speed report times each workload in its own Node.js process or Chromium page. Run it without
  other build or test tasks competing for CPU time.
- Both reports are written to `packages/perf/reports/`. The dev tools show them at
  `/devtools/size` and `/devtools/speed`, next to the committed baseline in
  `packages/perf/baseline/`.

Every PR receives an informational size report against `packages/perf/baseline/size.json` on
`main`. The PR workflow builds the PR merged onto its target branch and measures every scenario
with Vite, esbuild, and webpack where supported, plus published package sizes. It does not rebuild
`main`. A separate trusted workflow compares the report with the committed baseline and updates
one bot comment, including the baseline's source commit and measurement date. Growth does not fail
a size budget in CI. Build or report failures appear in the comment with a link to the run logs.

The **Update size baseline** workflow measures current `main` daily at 03:00 Austria time
(`Europe/Vienna`, including daylight saving time) and commits only the size baseline back to `main`.
It can also be run manually on `main`. Its separate commit job
uses a token of a dedicated GitHub App that may bypass the rulesets protecting `main`. If `main`
changes during measurement, the update fails rather than committing an outdated result; rerun the
workflow. Failed or delayed schedules leave the previous baseline in place. Existing PR comments
refresh on their next measurement run, not automatically when the baseline changes.

The committed baseline is also used by local reports and the docs. To update it locally:

```sh
pnpm turbo run report:size --filter=@repo/perf -- --update-baseline
```

Speed measurements run only on developer machines. Timings only compare with the
baseline when they come from the same machine and runtime. To compare with another commit on any
machine, build it and run both builds interleaved:

```sh
pnpm turbo run report:speed --filter=@repo/perf -- --against=main
```

### Public API and internal exports

- Supported consumer entry points are documented in the **Public API** section of each package page,
  for example [`packages/core.mdx`](apps/docs/src/content/docs/packages/core.mdx#public-api). The
  `exports` field of each package's `package.json` lists every published subpath.
- Exports that exist only for other `@qrcodesdk` packages live in `@qrcodesdk/core/internal`,
  `@qrcodesdk/core/internal/gif`, `@qrcodesdk/core/internal/jpeg`, `@qrcodesdk/core/internal/raster`,
  `@qrcodesdk/core/internal/webp`, and `@qrcodesdk/core/internal/zlib`. Their names start with `ɵ`, as [AGENTS.md](./AGENTS.md) requires.
  [`verify-package-artifact.mjs`](packages/core-testing/scripts/verify-package-artifact.mjs) checks
  the published entry points and the dependency policy between packages.
- The breaking styling API changes, including the move to `@qrcodesdk/core/style` factories and
  the removal of `@qrcodesdk/core/drawing`, are recorded under 0.0.5 in the
  [core changelog](packages/core/CHANGELOG.md).

### Updating snapshots

Center-image fixtures share rasterized copies of the square and landscape QRCodeSDK logos.
After changing the logo assets, regenerate their pixels before updating the snapshots:

```sh
pnpm turbo run generate:fixture-logos --filter=@repo/core-testing
```

Snapshot tasks build the required packages first and always execute, including when updating
tracked snapshot files. Without the update flags, they compare against the existing snapshots.

For SVG and text snapshots:

```sh
UPDATE_SVG_SNAPSHOTS=1 UPDATE_TEXT_SNAPSHOTS=1 \
pnpm turbo run test:snapshots --filter=@repo/core-testing
```

For PNG, WebP, GIF, and JPEG snapshots:

```sh
UPDATE_PNG_SNAPSHOTS=1 UPDATE_WEBP_SNAPSHOTS=1 UPDATE_GIF_SNAPSHOTS=1 UPDATE_JPEG_SNAPSHOTS=1 \
pnpm turbo run test:snapshots --filter=@qrcodesdk/node
```

### rMQR reference symbols

`packages/core/tests/rmqr/__fixtures__/zint-rmqr.txt` holds rMQR symbols generated by zint through
the zxing-wasm writer. The core rMQR tests compare the encoder with them module by module. The
generator never calls the QRCodeSDK encoder. Regenerate the file after updating zxing-wasm with:

```sh
pnpm turbo run generate:rmqr-fixtures --filter=@repo/core-testing
```

### Kanji table

`packages/core/src/kanji/table.ts` is generated from the WHATWG Shift_JIS decoder built into
Node.js. Do not edit it by hand. Regenerate it with:

```sh
pnpm turbo run generate:kanji-table --filter=@qrcodesdk/core
```

The core Kanji tests compare the table with the platform decoder for every UTF-16 code unit, so a
stale or edited table fails `pnpm turbo run test --filter=@qrcodesdk/core`.

## Releasing

Each package is published by its own release workflow when its `@qrcodesdk/<package>@<version>`
tag is pushed.

1. Add changesets for the unreleased changes with `pnpm changeset`.
2. Run `pnpm release:version`. It bumps the versions, writes the changelogs, and commits them
   as `chore: release <version>`.
3. Push `main`.
4. Run `pnpm release:tag` to create the release tags locally.
5. Run `pnpm release:push` to push the tags in dependency order.

`pnpm release:push` waits for a package to be available on npm before pushing the tags of
the packages that depend on it, starting with core, then browser and node, then the
framework adapters and the CLI. It watches the release workflows through the GitHub CLI (`gh`)
and stops when a workflow fails or a package does not appear on npm within 20 minutes. Running
it again pushes the remaining tags. Use `pnpm release:push --dry-run` to print the push order
without pushing anything.
