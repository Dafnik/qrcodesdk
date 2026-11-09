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
active development. Any `0.x` release, including a patch release, can contain breaking changes to
exports, option names, defaults, or output. Read the package changelog before upgrading. Each
package has its own changelog in the sidebar.

Pin exact versions in applications that cannot absorb unannounced API changes. A package becomes
stable at `1.0`, once its required QRCodeSDK dependencies have reached a compatible stable major.

Packages are released independently, so their version numbers can differ. Framework packages and the
CLI depend on exact versions of `@qrcodesdk/core` and, where needed, `@qrcodesdk/browser` or
`@qrcodesdk/node`. `@qrcodesdk/browser` and `@qrcodesdk/node` declare an exact `@qrcodesdk/core`
version as a peer dependency, so install that Core version next to them. When you also install one
of these packages directly, use the version your framework package or CLI depends on, so the
package manager installs a single copy.

## Runtime versions

| Package              | Declared runtime requirement                                                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `@qrcodesdk/core`    | Native ESM, ES2020, and a global `TextEncoder`; no `engines` field                                                                             |
| `@qrcodesdk/browser` | Current evergreen browsers with DOM and Canvas 2D APIs                                                                                         |
| `@qrcodesdk/node`    | Node.js 22.0.0 or newer (`engines.node: ">=22.0.0"`)                                                                                           |
| `@qrcodesdk/cli`     | Node.js 22.12.0 or newer (`engines.node: ">=22.12.0"`)                                                                                         |
| Framework packages   | The framework versions below; Image and Canvas components also need the browser requirements above, while `QRCodeSVG` can render on the server |

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

Identical payload and options produce deterministic output within one installed QRCodeSDK
implementation. Matrix modules, SVG markup, and PNG, WebP, GIF, and JPEG bytes may change between
releases as encoding, mask selection, markup, or rasterization changes.

If exact artifacts matter, pin every QRCodeSDK package to an exact version and retain your own matrix,
SVG, or raster fixtures. Treat every version upgrade as an explicit fixture update, even when the
decoded payload and documented options behave the same.

Browser output adds one more variable. The browser draws Canvas and Image element output, and
anti-aliasing of shaped modules and center images can differ between browsers and versions. The
bundled WebP, GIF, and JPEG encoders produce identical bytes only from identical RGBA pixels.
