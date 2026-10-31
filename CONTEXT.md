# QRCodeSDK

QRCodeSDK generates QR code symbols and turns them into outputs for JavaScript applications.

## Language

**Unified QR API**:
The shared typed model for payloads, matrix options, output selection, styling, and framework
components. This is QRCodeSDK's primary product promise.
_Avoid_: Collection of QR libraries, identical import path

**Runtime-neutral**:
Usable without Node.js, DOM, filesystem, or framework APIs. Runtime-neutral does not mean every
JavaScript environment is tested or supported.
_Avoid_: Universal

**Payload**:
A string or safe integer encoded by a QR code before symbol generation. A payload may be opaque text
or text that follows a recognized payload format.

**Common application payload**:
Text or a safe integer intended for one QR code symbol, including URLs and supported payload-format
output. Raw binary segments, Kanji-specific encoding, structured append, and GS1 data are outside
this category.

**Supported payload format**:
An open, widely implemented payload format with either a stable formal specification or a
documented, stable de facto convention backed by major scanners.
_Avoid_: Any commonly seen QR content

**Payload helper**:
A typed serializer that turns fields from a supported payload format into a payload. It does not
generate or configure the QR code symbol.
_Avoid_: Builder preset, QR code helper

**Renderer**:
A function that converts a valid QR code matrix produced by QRCodeSDK into an output value. A custom
renderer receives the matrix, including module roles, but not styling information. It can apply
shared visual styling by turning the matrix into a styled drawing with the public styler.

**QR code matrix**:
An immutable square grid produced by symbol generation: its size, a flat row-major array of dark
(`1`) and light (`0`) modules, and the module role of every module. Renderers read the matrix but do
not transform it in place.
_Avoid_: Mutable matrix, two-dimensional matrix

**Module role**:
The function of a module, light or dark, stored in the matrix's role grid separately from its color:
data, finder ring, finder center, separator, alignment ring, alignment center, timing, format, or
version. Roles depend only on the version, so all matrices of one size share one role grid.
_Avoid_: Module type, module value

**QR code builder**:
An immutable payload and matrix-options value that lazily generates one QR code matrix. It
reuses that matrix for every output requested from the same builder.
_Avoid_: Mutable generator, one-shot builder

**Decoder**:
A possible future capability that extracts a payload from caller-prepared image data. It does not
acquire camera frames, manage media permissions, or provide scanning UI.
_Avoid_: Scanner, camera scanner

**Managed redirect**:
A hosted URL whose destination or analytics can change without regenerating the QR code. Managed
redirects, accounts, and scan analytics are outside QRCodeSDK's scope.
_Avoid_: Dynamic QR code

**Module size**:
The positive integer size of each QR code module in rendered output. It is not a requested final width, so
the total dimensions vary with symbol version and quiet zone.

**Shared visual styling**:
Appearance options with equivalent geometry and color behavior across SVG, Canvas, browser Image,
and Node PNG output. Text styling is a smaller separate contract, while download renderers and
output-specific options such as accessibility, center images, compression, and ANSI behavior are
outside shared visual styling.
_Avoid_: Renderer-specific styling

**Shape**:
Imported, serializable path data that replaces filled squares for modules, finder rings, finder
centers, alignment rings, or alignment centers. Filled squares are the absence of a shape.
_Avoid_: Shape name, module type

**Style part**:
An imported function that draws one group of modules, such as the finder or alignment patterns, by
claiming their module roles, or that removes the modules in an area, such as behind a center image.
_Avoid_: Plugin, style preset

**Styled drawing**:
Plain, renderer-neutral data describing a QR code matrix with shared visual styling and style parts
applied: color layers of merged rectangles and shape paths. Graphical renderers fill the same styled
drawing in their output formats.
_Avoid_: Renderer-specific geometry, drawing protocol

**Prepared image source**:
Image content that the developer has already loaded or decoded into the source type required by a
renderer's center-image factory. QRCodeSDK does not fetch URLs or read paths to prepare image
sources.
_Avoid_: Image URL, image path

**Center image**:
An opt-in image drawn over the middle of a QR code, created from a prepared image source by the
output's own factory, such as `svgCenterImage()`.
_Avoid_: Logo option, center-image options object

**Framework parity**:
Equivalent framework-facing capabilities across React, Vue, Svelte, and Angular wherever each
framework permits them. Parity is an eventual goal and does not require synchronized releases.
_Avoid_: Identical framework APIs, lockstep delivery

**Supported framework version**:
A stable framework version included by that package's ecosystem-specific support policy and peer
range. QRCodeSDK does not apply one uniform lifecycle rule to every framework.
_Avoid_: Every historical version, one shared support window

**Stable package**:
A QRCodeSDK package at version 1.0 or later whose required QRCodeSDK dependencies and peers have
already reached a compatible stable major.
_Avoid_: Feature-complete package, stable adapter over an unstable dependency

**Server-rendered SVG**:
Complete SVG markup present in the initial server response before hydration. React's SVG component
may use a client boundary, but it must still produce server-rendered SVG.
_Avoid_: Hydration placeholder, React Server Component

**Component host**:
The framework-owned wrapper that contains rendered QR code output. Host attributes, classes, and
layout apply to this wrapper rather than directly to the nested SVG, Image, or Canvas element.
_Avoid_: Rendered output element

**Decorative QR code**:
A rendered QR code intentionally excluded from the accessibility tree because nearby content
already provides its meaning or action. Unlabeled visual output is decorative by default.
_Avoid_: Unnamed image

**Scan reliability**:
The likelihood that a rendered QR code can be decoded in its final medium and conditions. Valid
customization does not guarantee scan reliability; the developer must test the final artifact.
_Avoid_: Decoding guarantee

**Published package size**:
The compressed and unpacked byte size of every file shipped in one registry package. It includes
runtime JavaScript, type declarations, source maps, documentation, licenses, and package metadata.
_Avoid_: Bundle size, runtime size

**Consumer bundle size**:
The bytes retained for one documented import and usage scenario after a production bundler applies
tree shaking and minification. It depends on the selected API and does not describe install size.
_Avoid_: Package size, entry-point size
