# QRCodeSDK

QRCodeSDK generates QR code symbols and turns them into outputs for JavaScript applications.

## Language

**Unified QR API**:
The shared typed model for payloads, matrix configuration, output selection, styling, and framework
components. This is QRCodeSDK's primary product promise.
_Avoid_: Collection of QR libraries, identical import path

**Runtime-neutral**:
Usable without Node.js, DOM, filesystem, or framework APIs. Runtime-neutral does not mean every
JavaScript environment is tested or supported.
_Avoid_: Runtime-agnostic, universal

**Payload**:
The data encoded by a QR code before symbol generation. A payload may be opaque text or text that
follows a recognized payload format.

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
renderer receives only the raw light-and-dark module matrix, not styling information or the semantic
roles of modules.

**QR code matrix**:
An immutable square grid of light and dark modules produced by symbol generation. Renderers read the
matrix but do not transform it in place.
_Avoid_: Pixel grid, mutable matrix

**QR code builder**:
An immutable payload and matrix-configuration value that lazily generates one QR code matrix. It
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

**Render size**:
The integer scale of each QR code module in rendered output. It is not a requested final width, so
the total dimensions vary with symbol version and quiet zone.
_Avoid_: Output width, fixed size

**Shared visual styling**:
Appearance options with equivalent geometry and color behavior across SVG, Canvas, browser Image,
and Node PNG output. Text styling is a smaller separate contract, while download renderers and
output-specific options such as accessibility, image overlays, compression, and ANSI behavior are
outside shared visual styling.
_Avoid_: Renderer-specific styling

**Styled drawing**:
An immutable, renderer-neutral description of a QR code matrix with shared visual styling applied.
Graphical renderers paint the same styled drawing into their output formats.
_Avoid_: Style plan, renderer-specific geometry

**Prepared image source**:
Image content that the developer has already loaded or decoded into the source type required by a
renderer. QRCodeSDK does not fetch URLs or read paths to prepare image sources.
_Avoid_: Image URL, image path

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
_Avoid_: Scan safety, decoding guarantee

**Published package size**:
The compressed and unpacked byte size of every file shipped in one registry package. It includes
runtime JavaScript, type declarations, source maps, documentation, licenses, and package metadata.
_Avoid_: Bundle size, runtime size

**Consumer bundle size**:
The bytes retained for one documented import and usage scenario after a production bundler applies
tree shaking and minification. It depends on the selected API and does not describe install size.
_Avoid_: Package size, entry-point size
