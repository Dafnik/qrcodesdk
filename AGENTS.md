## Development

Run documentation tasks through Turbo from the workspace root so that dependencies are built in
the correct order:

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

Never create changesets! This is the work of a human.
