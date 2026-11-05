# QRCodeSDK benchmarks

Run the complete benchmark suite from the workspace root:

```sh
pnpm benchmark
```

The suite compares the production build of `@qrcodesdk/core` with `qrcode` and
`qrcode-generator`. It measures native matrix generation and end-to-end SVG generation for the 17
static fixtures at 1, 10, and 100 repetitions, followed by one pass over all 3,840 QR code
combinations. Automatic matrix generation uses the same static fixtures without a fixed version or
mask at 1, 10, and 100 repetitions.

The `qrcode-generator` adapter uses the package's stock `stringToBytes` implementation. For matrix
and SVG generation, the repository patch applies each fixture's explicit mask and skips automatic
mask evaluation. The automatic matrix category omits both version and mask for every library.

Styled SVG generation compares `@qrcodesdk/core` with `qr-code-styling`. It runs all 60 fixtures
from `packages/core-testing/src/styling-fixtures.ts` at 1, 10, and 50 repetitions. The
`qr-code-styling` adapter renders SVG through a shared JSDOM environment and serializes it with
`getRawData('svg')`. JSDOM starts before measurement. QRCodeSDK uses its public SVG renderer. Both
adapters include matrix generation, styling, and SVG serialization in the timed operation.
QRCodeSDK fixtures create their shape and finder values once when the fixture module loads, so
factory setup is not part of the timed operation. The core styler benchmark measures factory setup
separately.

`qr-code-styling` has no public option for a fixed mask, so both styled adapters select the mask
automatically. The adapter converts each fixture's module size and margin to matching pixel width,
height, and margin values. It maps the foreground to the dots and the finder color to both finder
parts. Each fixture describes its shapes by name, and the adapters map those names to each library's
shape options.

Before measurement, each library receives five warm-up passes over the fixtures used by its
category. The matrix and SVG categories also receive one pass over all 3,840 combinations. Every
workload is measured three times. Adapter order rotates between samples. Results are printed to the
console and written to the ignored `benchmark-results/latest.json` file at the workspace root.

After reviewing a benchmark run, update the performance guide from the workspace root:

```sh
pnpm turbo run generate-performance --filter=docs
```

Run the focused JPEG encoder benchmark from the workspace root:

```sh
pnpm turbo run benchmark:jpeg --filter=@repo/benchmarks
```

It measures quality 92 encoding of grayscale and color QR codes at versions 1, 10, and 40, with
four pixels per module and a four-module quiet zone. Matrix generation and RGBA pixel preparation
finish before timing. Each workload receives two warm-up encodes followed by three samples of
five encodes. The timed operation includes matte blending, grayscale detection, both integer DCT
passes, optimized Huffman table construction, and JPEG serialization. Results use the suite's
median, minimum, maximum, and throughput statistics, and output byte lengths form a consumption
checksum. The console table and ignored `benchmark-results/latest-jpeg.json` are separate from the
comparison report used by the performance guide. Run it without other builds or tests competing
for CPU time.

Measure SVG rendering separately from matrix generation:

```sh
pnpm turbo run benchmark:svg --filter=@repo/benchmarks
```

This compares the production SVG renderers at versions 1, 10, and 40, with four pixels per module,
a four-module quiet zone, error correction M, and mask 0. QRCodeSDK measurements include both a
reused renderer and a fresh renderer per operation. Matrices are prepared before timing. The
`qrcode` comparison calls its production `lib/renderer/svg-tag.js` module because its public SVG
API always generates a matrix. The full suite above continues to measure the public APIs with
matrix generation included. Both benchmarks retain their output so the runtime cannot discard it.
