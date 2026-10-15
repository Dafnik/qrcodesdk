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

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
