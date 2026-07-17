# QRCodeSDK benchmarks

Run the complete benchmark suite from the workspace root:

```sh
pnpm benchmark
```

The suite compares the production build of `@qrcodesdk/core` with `qrcode` and
`qrcode-generator`. It benchmarks native matrix generation and end-to-end SVG generation for the
16 static fixtures at 1, 5, 10, 100, and 500 repetitions, followed by one pass over all 3,840 QR
code combinations.

Every workload is warmed up and measured five times. Results are printed to the console and written
to the ignored `benchmark-results/latest.json` file at the workspace root.
