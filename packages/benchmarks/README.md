# QRCodeSDK benchmarks

Run the complete benchmark suite from the workspace root:

```sh
pnpm benchmark
```

The suite compares the production build of `@qrcodesdk/core` with `qrcode` and three
`qrcode-generator` encoder configurations. It benchmarks native matrix generation and end-to-end
SVG generation for the 16 static fixtures at 1, 5, 10, 100, and 500 repetitions, followed by one
pass over all 3,840 QR code combinations.

All `qrcode-generator` configurations use the repository patch that accepts the fixture's explicit
mask and skips automatic mask evaluation. They differ only in string-to-byte conversion:

- **default** uses the package's stock low-byte converter without a UTF-8 override;
- **TextEncoder** uses the platform `TextEncoder`, matching the previous benchmark configuration;
- **bundled UTF-8** uses the package's handwritten `stringToBytesFuncs['UTF-8']` converter.

The default converter truncates UTF-16 code units and therefore does not preserve the Unicode byte
fixtures. Its rows measure the stock converter's performance, not semantically equivalent Unicode
QR code content. The TextEncoder and bundled UTF-8 configurations produce the same bytes for the
valid Unicode fixtures.

Before measurement, each library is warmed with five passes over the static fixtures and one pass
over all 3,840 combinations for both benchmark categories. Every workload is then measured five
times, with adapter order rotated so each configuration occupies each position once. Results are
printed to the console and written to the ignored `benchmark-results/latest.json` file at the
workspace root.

After reviewing a benchmark run, update the performance guide from the workspace root:

```sh
pnpm turbo run generate-performance --filter=docs
```
