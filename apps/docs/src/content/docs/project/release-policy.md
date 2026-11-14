---
title: Version and output policy
description: How QRCodeSDK versions signal breaking changes, which runtimes and frameworks each package supports, and which generated artifacts stay stable.
docType: reference

related:
  - ../packages/core.mdx
  - ../packages/node.mdx
  - ../packages/cli.mdx
---

## Versioning

QRCodeSDK packages follow semantic versioning. Every package is still `0.x`, and the API is in
active development.

- Any `0.x` release, even a patch, can break exports, option names, defaults, or output.
- Read the package changelog before upgrading. Each package has its own changelog in the sidebar.
- Pin exact versions if your application cannot absorb unannounced API changes.

A package becomes stable at `1.0`, once its required QRCodeSDK dependencies reach a compatible stable
major.

### Package versions

Packages are released independently, so their version numbers can differ. They pin each other to
exact versions:

| Package                                    | Depends on                                                                        |
| ------------------------------------------ | --------------------------------------------------------------------------------- |
| Framework packages and the CLI             | Exact `@qrcodesdk/core`, plus `@qrcodesdk/browser` or `@qrcodesdk/node` if needed |
| `@qrcodesdk/browser` and `@qrcodesdk/node` | Exact `@qrcodesdk/core` as a peer dependency                                      |

- Install `@qrcodesdk/browser` or `@qrcodesdk/node` next to the exact Core version it declares.
- If you also install one of these packages directly, use the version your framework package or CLI
  depends on. The package manager then installs a single copy.

## Runtime versions

| Package              | Declared runtime requirement                                                                                                                              |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@qrcodesdk/core`    | Node.js 22.0.0 or newer (`engines.node: ">=22.0.0"`); other runtimes need native ESM, ES2020, and a global `TextEncoder`                                  |
| `@qrcodesdk/browser` | Current evergreen browsers with DOM and Canvas 2D APIs                                                                                                    |
| `@qrcodesdk/node`    | Node.js 22.0.0 or newer (`engines.node: ">=22.0.0"`)                                                                                                      |
| `@qrcodesdk/cli`     | Node.js 22.12.0 or newer (`engines.node: ">=22.12.0"`)                                                                                                    |
| Framework packages   | The [framework versions](#framework-versions) below. Image and Canvas components also need the browser requirements. `QRCodeSVG` can render on the server |

See [Runtime compatibility](/packages/core/#runtime-compatibility) for Core's Node.js, Deno, Bun,
and browser support policy.

## Framework versions

| Framework | Support policy                                | Current declared range |
| --------- | --------------------------------------------- | ---------------------- |
| Angular   | Every upstream-supported major                | 20, 21, and 22         |
| React     | Selected widely used stable majors            | 18 and 19              |
| Vue       | The current major from a tested minimum minor | 3.3 and newer          |
| Svelte    | The current major                             | 5                      |

## Generated artifacts

The same payload and options always produce the same output within one installed QRCodeSDK version.
Between releases, these can change as encoding, mask selection, markup, or rasterization changes:

- Matrix modules
- SVG markup
- PNG, WebP, GIF, and JPEG bytes

If exact artifacts matter:

1. Pin every QRCodeSDK package to an exact version.
2. Keep your own matrix, SVG, or raster fixtures.
3. Treat every upgrade as an explicit fixture update, even when the decoded payload and documented
   options behave the same.

Browser output adds one more variable. The browser draws Canvas and Image element output, so
anti-aliasing of shaped modules and center images can differ between browsers and versions. The
bundled WebP, GIF, and JPEG encoders produce identical bytes only from identical RGBA pixels.
