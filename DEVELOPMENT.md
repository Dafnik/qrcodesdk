## Workspace development

```sh
pnpm install
pnpm build
```

### Checks

Run the following command to check for formatting, linting, spelling, type errors, build errors, and test failures:

```shell
pnpm check
```

### Linting

```sh
pnpm format:check
pnpm lint
pnpm cspell
pnpm check-types
```

### Testing

```sh
pnpm test
pnpm test:roundtrips
pnpm test:coverage
```

### Docs

Run the documentation site locally:

```sh
pnpm turbo run start --filter=docs
```

#### Generate and check readmes and performance files:

```sh
pnpm turbo run generate-readmes --filter=docs
pnpm turbo run check-readmes --filter=docs
```

```sh
pnpm turbo run generate-performance --filter=docs
pnpm turbo run check-performance --filter=docs
```

### Benchmarks

```sh
pnpm benchmark
```

Run the focused matrix hot-path benchmarks:

```sh
pnpm turbo run benchmark:matrix --filter=@qrcodesdk/core
```

### Updating snapshots

#### Core

```shell
UPDATE_SVG_SNAPSHOTS=1 \
UPDATE_TEXT_SNAPSHOTS=1 \
pnpm --filter @repo/core-testing exec vitest run \
tests/svg/svg-renderer.snapshot.e2e.spec.ts \
tests/svg/svg-renderer.snapshot.unit.spec.ts \
tests/text/text-renderer.snapshot.e2e.spec.ts \
tests/text/text-renderer.snapshot.unit.spec.ts
```

#### Node

```shell
UPDATE_PNG_SNAPSHOTS=1 \
pnpm --filter @qrcodesdk/node exec vitest run \
tests/png/png-renderer.snapshot.e2e.spec.ts \
tests/png/png-renderer.snapshot.unit.spec.ts
```
