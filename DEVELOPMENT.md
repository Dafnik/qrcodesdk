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
benchmarks, performance-file checks, and installed-package smoke tests run separately.

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
The CI setup is documented in `.github/actions/setup-playwright/action.yml`.

Coverage clears previous reports, runs every package's raw coverage task through Turbo,
then merges the results. HTML, LCOV, and combined JSON reports are written to `coverage/`.

Installed-package smoke tests have separate consumer and browser prerequisites. See
[the runtime test guide](packages/browser/runtime/README.md) for their commands.

### Docs

Run the documentation site locally:

```sh
pnpm turbo run start --filter=docs
```

To build and preview the site:

```sh
pnpm turbo run preview --filter=docs
```

Generate or check package READMEs:

```sh
pnpm turbo run generate-readmes --filter=docs
pnpm turbo run check-readmes --filter=docs
```

Performance generation and validation read `benchmark-results/latest.json`.
Run the full benchmark task first to create that file:

```sh
pnpm turbo run benchmark --filter=@repo/benchmarks
pnpm turbo run generate-performance --filter=docs
pnpm turbo run check-performance --filter=docs
```

### Benchmarks

Run the full benchmark suite, or either focused benchmark against the core source:

```sh
pnpm turbo run benchmark --filter=@repo/benchmarks
pnpm turbo run benchmark:matrix --filter=@qrcodesdk/core
pnpm turbo run benchmark:styler --filter=@qrcodesdk/core
```

### Updating snapshots

Snapshot tasks build the required packages first and always execute, including when updating
tracked snapshot files. Without the update flags, they compare against the existing snapshots.

For SVG and text snapshots:

```sh
UPDATE_SVG_SNAPSHOTS=1 UPDATE_TEXT_SNAPSHOTS=1 \
pnpm turbo run test:snapshots --filter=@repo/core-testing
```

For PNG snapshots:

```sh
UPDATE_PNG_SNAPSHOTS=1 \
pnpm turbo run test:snapshots --filter=@qrcodesdk/node
```

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
