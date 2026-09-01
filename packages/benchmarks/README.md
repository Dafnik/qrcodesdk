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

`qr-code-styling` has no public option for a fixed mask, so both styled adapters select the mask
automatically. The adapter converts each fixture's module size and margin to matching pixel width,
height, and margin values. It also maps global colors to the background and part-color fallbacks
before applying explicit dot and finder colors.

Before measurement, each library receives five warm-up passes over the fixtures used by its
category. The matrix and SVG categories also receive one pass over all 3,840 combinations. Every
workload is measured three times. Adapter order rotates between samples. Results are printed to the
console and written to the ignored `benchmark-results/latest.json` file at the workspace root.

After reviewing a benchmark run, update the performance guide from the workspace root:

```sh
pnpm turbo run generate-performance --filter=docs
```
