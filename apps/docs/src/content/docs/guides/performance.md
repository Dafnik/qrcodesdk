---
title: Performance
description: Matrix and SVG generation benchmark results for QRCodeSDK and its reference libraries.
---

<!-- Generated from benchmark-results/latest.json. Run `pnpm --filter docs generate-performance` to update. -->

These results compare QRCodeSDK with the two reference libraries used by the correctness suite. Benchmarks are environment-specific and should be read as relative comparisons, not universal guarantees.

## Benchmark environment

- Generated: `2026-07-17T21:07:54.996Z`
- Git revision: `7197095b56938f4e6372fca994d84dad36463cd1`
- Runtime: `v24.18.0` on `darwin arm64`
- CPU: `Apple M2 Pro` (12 logical cores)
- Libraries: `qrcodesdk@0.0.0`, `qrcode@1.5.4`, `qrcode-generator@2.0.4`
- Samples: 5 timed samples after 5 static warmup passes
- SVG output: 8 px/module with a 4-module quiet zone

Lower median time and relative time are better. Throughput is calculated from the median. QRCodeSDK is fixed at `1.00×` in the relative-time column.

## Matrix generation

| Workload             | QR codes/sample | Library                 | Median (ms) |      Min–max (ms) | QR codes/second | Time ÷ QRCodeSDK |
| -------------------- | --------------: | ----------------------- | ----------: | ----------------: | --------------: | ---------------: |
| Static fixtures ×1   |              16 | QRCodeSDK v0.0.0        |       2.111 |       2.032–2.503 |           7,578 |            1.00× |
| Static fixtures ×1   |              16 | qrcode v1.5.4           |       2.715 |       2.584–2.906 |           5,893 |            1.29× |
| Static fixtures ×1   |              16 | qrcode-generator v2.0.4 |       9.608 |      8.953–11.513 |           1,665 |            4.55× |
| Static fixtures ×5   |              80 | QRCodeSDK v0.0.0        |      10.521 |      9.785–11.802 |           7,604 |            1.00× |
| Static fixtures ×5   |              80 | qrcode v1.5.4           |      14.483 |     12.292–15.256 |           5,524 |            1.38× |
| Static fixtures ×5   |              80 | qrcode-generator v2.0.4 |      51.630 |     45.261–74.799 |           1,549 |            4.91× |
| Static fixtures ×10  |             160 | QRCodeSDK v0.0.0        |      19.642 |     19.173–22.022 |           8,146 |            1.00× |
| Static fixtures ×10  |             160 | qrcode v1.5.4           |      28.647 |     28.052–30.765 |           5,585 |            1.46× |
| Static fixtures ×10  |             160 | qrcode-generator v2.0.4 |      91.526 |     89.329–93.526 |           1,748 |            4.66× |
| Static fixtures ×100 |           1,600 | QRCodeSDK v0.0.0        |     190.429 |   189.626–197.584 |           8,402 |            1.00× |
| Static fixtures ×100 |           1,600 | qrcode v1.5.4           |     281.854 |   273.724–309.983 |           5,677 |            1.48× |
| Static fixtures ×100 |           1,600 | qrcode-generator v2.0.4 |     908.559 |   883.780–942.821 |           1,761 |            4.77× |
| Static fixtures ×500 |           8,000 | QRCodeSDK v0.0.0        |     931.897 |   931.244–944.434 |           8,585 |            1.00× |
| Static fixtures ×500 |           8,000 | qrcode v1.5.4           |    1210.862 | 1195.921–1224.101 |           6,607 |            1.30× |
| Static fixtures ×500 |           8,000 | qrcode-generator v2.0.4 |    4291.153 | 4265.158–4389.517 |           1,864 |            4.60× |
| All combinations ×1  |           3,840 | QRCodeSDK v0.0.0        |     691.607 |   691.234–696.090 |           5,552 |            1.00× |
| All combinations ×1  |           3,840 | qrcode v1.5.4           |     715.469 |   707.720–721.334 |           5,367 |            1.03× |
| All combinations ×1  |           3,840 | qrcode-generator v2.0.4 |    3008.988 | 2997.619–3017.367 |           1,276 |            4.35× |

## SVG generation

| Workload             | QR codes/sample | Library                 | Median (ms) |      Min–max (ms) | QR codes/second | Time ÷ QRCodeSDK |
| -------------------- | --------------: | ----------------------- | ----------: | ----------------: | --------------: | ---------------: |
| Static fixtures ×1   |              16 | QRCodeSDK v0.0.0        |       3.129 |       2.949–3.704 |           5,113 |            1.00× |
| Static fixtures ×1   |              16 | qrcode v1.5.4           |       3.820 |       3.792–3.832 |           4,188 |            1.22× |
| Static fixtures ×1   |              16 | qrcode-generator v2.0.4 |      12.216 |     11.277–16.009 |           1,310 |            3.90× |
| Static fixtures ×5   |              80 | QRCodeSDK v0.0.0        |      15.044 |     14.784–15.084 |           5,318 |            1.00× |
| Static fixtures ×5   |              80 | qrcode v1.5.4           |      18.784 |     18.451–18.913 |           4,259 |            1.25× |
| Static fixtures ×5   |              80 | qrcode-generator v2.0.4 |      55.211 |     54.541–55.822 |           1,449 |            3.67× |
| Static fixtures ×10  |             160 | QRCodeSDK v0.0.0        |      29.899 |     29.611–30.874 |           5,351 |            1.00× |
| Static fixtures ×10  |             160 | qrcode v1.5.4           |      37.053 |     36.360–37.217 |           4,318 |            1.24× |
| Static fixtures ×10  |             160 | qrcode-generator v2.0.4 |     108.534 |   108.421–109.845 |           1,474 |            3.63× |
| Static fixtures ×100 |           1,600 | QRCodeSDK v0.0.0        |     298.783 |   298.064–300.446 |           5,355 |            1.00× |
| Static fixtures ×100 |           1,600 | qrcode v1.5.4           |     365.629 |   363.287–375.698 |           4,376 |            1.22× |
| Static fixtures ×100 |           1,600 | qrcode-generator v2.0.4 |    1085.202 | 1082.054–1096.272 |           1,474 |            3.63× |
| Static fixtures ×500 |           8,000 | QRCodeSDK v0.0.0        |    1489.262 | 1482.991–1511.681 |           5,372 |            1.00× |
| Static fixtures ×500 |           8,000 | qrcode v1.5.4           |    1819.045 | 1813.234–1842.805 |           4,398 |            1.22× |
| Static fixtures ×500 |           8,000 | qrcode-generator v2.0.4 |    5416.852 | 5401.613–5446.949 |           1,477 |            3.64× |
| All combinations ×1  |           3,840 | QRCodeSDK v0.0.0        |    1186.838 | 1186.599–1188.462 |           3,235 |            1.00× |
| All combinations ×1  |           3,840 | qrcode v1.5.4           |    1359.281 | 1275.294–1428.262 |           2,825 |            1.15× |
| All combinations ×1  |           3,840 | qrcode-generator v2.0.4 |    4025.363 | 4011.074–4040.233 |             954 |            3.39× |
