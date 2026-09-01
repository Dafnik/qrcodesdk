# Export payload helpers from the Core entry point

Typed payload helpers are named exports from the main `@qrcodesdk/core` entry point rather than
subpath exports or a separate package. This makes helpers easier to discover and keeps one import
style, relying on consumer tree-shaking to remove unused helpers and accepting their inclusion in
native ESM downloads that do not tree-shake.
