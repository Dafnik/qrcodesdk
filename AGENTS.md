## Development

You (the Agent) can make breaking changes. The project is currently in active development.

Run all tasks and commands through Turbo from the workspace root so that dependencies are built in
the correct order:

For example:

```
pnpm turbo run build
pnpm turbo run check-types
pnpm turbo run start
```

```
pnpm turbo run build --filter=docs
pnpm turbo run check-types --filter=docs
pnpm turbo run start --filter=docs
```

---

All types and utilities that are only exported to be used by another @qrcodesdk library
(and are there not used for public consumption (function properties, return types)) should start with a `ɵ` prefix.

If a dependency is only used once (in one package), only add it there instead of adding it to both (the catalog & the package's package.json).

Never create changesets! This is the work of a human.

Also, checkout [DEVELOPMENT.md](./DEVELOPMENT.md)
