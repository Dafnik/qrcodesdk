# Public API policy

An export needs a consumer use case or must describe a public parameter, property, or return value.
Helpers used only between SDK packages belong to `@qrcodesdk/core/internal` and use the `ɵ` prefix.
Helpers used only within one package do not need a published export.

## Supported entry points

| Entry point                                                      | Consumer use case                                                                                             |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `@qrcodesdk/core`                                                | Build QR codes, use bundled SVG/text renderers, handle errors, and name public types                          |
| `@qrcodesdk/core/matrix`                                         | Generate matrices and implement matrix-based renderers without loading graphical output code                  |
| `@qrcodesdk/core/svg`                                            | Produce SVG strings and prepare embedded center images                                                        |
| `@qrcodesdk/core/text`                                           | Produce terminal text with layout and ANSI options                                                            |
| `@qrcodesdk/core/style`                                          | Import individual shape/pattern factories and define custom path shapes                                       |
| `@qrcodesdk/core/payload`                                        | Serialize email, phone, SMS, geographic, and Wi-Fi payloads                                                   |
| `@qrcodesdk/core/error`                                          | Identify structured SDK errors without loading renderers                                                      |
| `@qrcodesdk/browser` and its `/canvas`, `/image`, `/svg` entries | Create browser elements, prepare Canvas images, and download output                                           |
| `@qrcodesdk/node`                                                | Produce PNG buffers and prepare PNG center images                                                             |
| Framework package roots                                          | Use components, component options, download handles, styling factories, center images, and their public types |
| `@qrcodesdk/cli`                                                 | Generate output through the executable; no JavaScript library API                                             |

`QRCodeBuilder` remains public because consumers can name configured builders and use its factory.
`QRCodeMatrix`, module roles, and `QRCodeRenderer<T>` remain public for matrix inspection and custom
renderers. Error constructors, codes, details, and option types remain public for error handling.
Renderer and component option types, accessibility settings, and factory input/output types remain
public because consumers configure those values directly.

## Styling boundary

Consumers configure dimensions, colors, modules, finder patterns, and alignment patterns through
`QRCodeVisualStyle`. Custom pieces use closed relative paths in module coordinates. Finder/alignment
options select their ring shape, center shape, and color.

`finder()` and `alignment()` return opaque `QRCodeFinderStyle` and `QRCodeAlignmentStyle` values.
Their runtime representation remains a closure; the public types expose no call signature. The
brands are type-only and add no registry, wrapper, or configuration interpreter.

`customShape()` accepts any subset of the five shape paths and prepares them once. Its result
contains opaque `QRCodeShapePiece` values, which built-in factories also produce directly.
Renderers reuse prepared paths without importing the parser. Custom module shapes supply one
path. Built-in neighbor-dependent shapes return an opaque `QRCodeModulePattern`; consumers do
not construct neighbor-mask tables.

Drawing callbacks, contexts, geometry layers, path serialization, center-image placement, and the
shared styler are internal. Public custom renderers receive the matrix and own their drawing logic.

## Breaking changes in this cleanup

- Remove `QRCodeVisualStyle.parts`.
- Replace public finder/alignment drawing callbacks with opaque factory return types.
- Remove drawing helpers and callback types from public roots, `/style`, and framework re-exports.
- Replace public neighbor-path arrays with factory-owned opaque module patterns.
- Prepare custom paths with `customShape({module: path, ...})` instead of passing raw path objects
  to renderers or finder/alignment factories.

Custom path shapes, existing built-in shape factories, colors, center images, and matrix-based custom
renderers remain supported. No compatibility aliases are provided for removed drawing hooks.

## Runtime checks

TypeScript checks API option names, primitive types, literal unions, and opaque factory values.
The SDK does not repeat those checks at runtime. JavaScript callers are responsible for using the
API according to its type declarations.

Runtime checks cover value constraints that the public types do not express: numeric dimensions and
ranges, payload content and capacity, shape path syntax, XML characters, image data, and source
readiness. Branches that select behavior for supported union members remain part of the algorithms.

## Verification

API tests check supported runtime exports and factory input/output types. Package artifact tests
check that expected entry points resolve and are included in the published package. Rendering
snapshots and scanner roundtrips verify output. Consumer bundles measure minified and compressed
sizes. See [DEVELOPMENT.md](./DEVELOPMENT.md) for commands.
