---
title: Performance
description: Matrix and SVG generation benchmark results for QRCodeSDK and its reference libraries.
---

<!-- Generated from benchmark-results/latest.json. Run `pnpm turbo run generate-performance --filter=docs` to update. -->

These results compare QRCodeSDK with **qrcode** and three **qrcode-generator** encoder configurations. Benchmarks are environment-specific and should be read as relative comparisons, not universal guarantees.

All **qrcode-generator** rows use the repository patch that applies each fixture's explicit mask and skips automatic mask evaluation. The **default** row uses the package's stock low-byte converter, **TextEncoder** uses the platform encoder, and **bundled UTF-8** uses the package's handwritten UTF-8 converter. The default converter truncates UTF-16 code units, so its Unicode byte fixtures do not encode content equivalent to the other rows. TextEncoder and bundled UTF-8 produce the same bytes for the valid Unicode fixtures.

## Benchmark environment

- Generated: `2026-07-19T16:22:53.979Z`
- Runtime: `v24.18.0` on `darwin arm64`
- CPU: `Apple M2 Pro` (12 logical cores)
- Libraries: `qrcode@1.5.4`, `qrcode-generator@2.0.4`, `qrcode-generator-default@2.0.4`, `qrcode-generator-utf8@2.0.4`, `qrcodesdk@0.0.0`
- Samples: 5 timed samples after 5 static warm-up passes and 1 exhaustive warm-up pass
- SVG output: 8 px/module with a 4-module quiet zone

Lower median time and relative time are better. Throughput is calculated from the median. QRCodeSDK is fixed at `1.00×` in the relative-time column.

## Matrix generation

| Workload             | QR codes/sample | Library                                 | Median (ms) |      Min–max (ms) | QR codes/second | Time ÷ QRCodeSDK |
| -------------------- | --------------: | --------------------------------------- | ----------: | ----------------: | --------------: | ---------------: |
| Static fixtures ×1   |              16 | QRCodeSDK v0.0.0                        |       1.974 |       1.914–2.081 |           8,107 |            1.00× |
| Static fixtures ×1   |              16 | qrcode v1.5.4                           |       2.839 |       2.815–2.904 |           5,635 |            1.44× |
| Static fixtures ×1   |              16 | qrcode-generator (default) v2.0.4       |       8.666 |       8.627–9.171 |           1,846 |            4.39× |
| Static fixtures ×1   |              16 | qrcode-generator (TextEncoder) v2.0.4   |       8.899 |       8.668–9.204 |           1,798 |            4.51× |
| Static fixtures ×1   |              16 | qrcode-generator (bundled UTF-8) v2.0.4 |       8.640 |       8.572–9.201 |           1,852 |            4.38× |
| Static fixtures ×5   |              80 | QRCodeSDK v0.0.0                        |       9.454 |       9.352–9.934 |           8,462 |            1.00× |
| Static fixtures ×5   |              80 | qrcode v1.5.4                           |      14.126 |     13.704–14.888 |           5,664 |            1.49× |
| Static fixtures ×5   |              80 | qrcode-generator (default) v2.0.4       |      43.970 |     43.530–45.682 |           1,819 |            4.65× |
| Static fixtures ×5   |              80 | qrcode-generator (TextEncoder) v2.0.4   |      43.706 |     43.540–46.376 |           1,830 |            4.62× |
| Static fixtures ×5   |              80 | qrcode-generator (bundled UTF-8) v2.0.4 |      43.562 |     42.951–46.039 |           1,836 |            4.61× |
| Static fixtures ×10  |             160 | QRCodeSDK v0.0.0                        |      18.858 |     18.672–19.837 |           8,484 |            1.00× |
| Static fixtures ×10  |             160 | qrcode v1.5.4                           |      27.964 |     27.179–29.593 |           5,722 |            1.48× |
| Static fixtures ×10  |             160 | qrcode-generator (default) v2.0.4       |      88.095 |     85.976–91.463 |           1,816 |            4.67× |
| Static fixtures ×10  |             160 | qrcode-generator (TextEncoder) v2.0.4   |      89.023 |     85.731–90.418 |           1,797 |            4.72× |
| Static fixtures ×10  |             160 | qrcode-generator (bundled UTF-8) v2.0.4 |      85.627 |     84.672–87.751 |           1,869 |            4.54× |
| Static fixtures ×100 |           1,600 | QRCodeSDK v0.0.0                        |     188.331 |   185.407–189.617 |           8,496 |            1.00× |
| Static fixtures ×100 |           1,600 | qrcode v1.5.4                           |     242.329 |   239.300–289.429 |           6,603 |            1.29× |
| Static fixtures ×100 |           1,600 | qrcode-generator (default) v2.0.4       |     881.202 |   855.737–962.392 |           1,816 |            4.68× |
| Static fixtures ×100 |           1,600 | qrcode-generator (TextEncoder) v2.0.4   |     862.291 |   859.789–892.410 |           1,856 |            4.58× |
| Static fixtures ×100 |           1,600 | qrcode-generator (bundled UTF-8) v2.0.4 |     857.690 |   848.784–915.924 |           1,865 |            4.55× |
| Static fixtures ×500 |           8,000 | QRCodeSDK v0.0.0                        |     935.092 |   930.429–963.297 |           8,555 |            1.00× |
| Static fixtures ×500 |           8,000 | qrcode v1.5.4                           |    1231.037 | 1202.147–1270.438 |           6,499 |            1.32× |
| Static fixtures ×500 |           8,000 | qrcode-generator (default) v2.0.4       |    4342.271 | 4317.762–4358.163 |           1,842 |            4.64× |
| Static fixtures ×500 |           8,000 | qrcode-generator (TextEncoder) v2.0.4   |    4358.719 | 4269.516–4412.829 |           1,835 |            4.66× |
| Static fixtures ×500 |           8,000 | qrcode-generator (bundled UTF-8) v2.0.4 |    4315.586 | 4233.130–4397.102 |           1,854 |            4.62× |
| All combinations ×1  |           3,840 | QRCodeSDK v0.0.0                        |     706.824 |   698.236–722.354 |           5,433 |            1.00× |
| All combinations ×1  |           3,840 | qrcode v1.5.4                           |     750.501 |   726.526–810.043 |           5,117 |            1.06× |
| All combinations ×1  |           3,840 | qrcode-generator (default) v2.0.4       |    3091.146 | 3039.789–3129.492 |           1,242 |            4.37× |
| All combinations ×1  |           3,840 | qrcode-generator (TextEncoder) v2.0.4   |    3096.348 | 3034.111–3119.019 |           1,240 |            4.38× |
| All combinations ×1  |           3,840 | qrcode-generator (bundled UTF-8) v2.0.4 |    3070.797 | 3033.239–3107.015 |           1,250 |            4.34× |

## SVG generation

| Workload             | QR codes/sample | Library                                 | Median (ms) |      Min–max (ms) | QR codes/second | Time ÷ QRCodeSDK |
| -------------------- | --------------: | --------------------------------------- | ----------: | ----------------: | --------------: | ---------------: |
| Static fixtures ×1   |              16 | QRCodeSDK v0.0.0                        |       3.356 |       3.324–3.372 |           4,767 |            1.00× |
| Static fixtures ×1   |              16 | qrcode v1.5.4                           |       3.847 |       3.706–4.283 |           4,159 |            1.15× |
| Static fixtures ×1   |              16 | qrcode-generator (default) v2.0.4       |      10.964 |     10.829–17.015 |           1,459 |            3.27× |
| Static fixtures ×1   |              16 | qrcode-generator (TextEncoder) v2.0.4   |      12.398 |     11.254–17.213 |           1,291 |            3.69× |
| Static fixtures ×1   |              16 | qrcode-generator (bundled UTF-8) v2.0.4 |      11.638 |     11.013–17.996 |           1,375 |            3.47× |
| Static fixtures ×5   |              80 | QRCodeSDK v0.0.0                        |      15.796 |     15.070–15.963 |           5,065 |            1.00× |
| Static fixtures ×5   |              80 | qrcode v1.5.4                           |      18.977 |     18.177–20.434 |           4,216 |            1.20× |
| Static fixtures ×5   |              80 | qrcode-generator (default) v2.0.4       |      54.397 |     54.120–55.041 |           1,471 |            3.44× |
| Static fixtures ×5   |              80 | qrcode-generator (TextEncoder) v2.0.4   |      54.616 |     54.124–57.932 |           1,465 |            3.46× |
| Static fixtures ×5   |              80 | qrcode-generator (bundled UTF-8) v2.0.4 |      54.628 |     53.400–57.328 |           1,464 |            3.46× |
| Static fixtures ×10  |             160 | QRCodeSDK v0.0.0                        |      31.530 |     30.179–31.914 |           5,075 |            1.00× |
| Static fixtures ×10  |             160 | qrcode v1.5.4                           |      37.459 |     36.783–39.964 |           4,271 |            1.19× |
| Static fixtures ×10  |             160 | qrcode-generator (default) v2.0.4       |     113.131 |   107.355–125.982 |           1,414 |            3.59× |
| Static fixtures ×10  |             160 | qrcode-generator (TextEncoder) v2.0.4   |     109.847 |   107.611–110.797 |           1,457 |            3.48× |
| Static fixtures ×10  |             160 | qrcode-generator (bundled UTF-8) v2.0.4 |     110.734 |   108.835–115.098 |           1,445 |            3.51× |
| Static fixtures ×100 |           1,600 | QRCodeSDK v0.0.0                        |     311.248 |   300.431–315.844 |           5,141 |            1.00× |
| Static fixtures ×100 |           1,600 | qrcode v1.5.4                           |     381.646 |   370.465–392.614 |           4,192 |            1.23× |
| Static fixtures ×100 |           1,600 | qrcode-generator (default) v2.0.4       |    1096.624 | 1080.021–1119.370 |           1,459 |            3.52× |
| Static fixtures ×100 |           1,600 | qrcode-generator (TextEncoder) v2.0.4   |    1103.031 | 1075.805–1126.734 |           1,451 |            3.54× |
| Static fixtures ×100 |           1,600 | qrcode-generator (bundled UTF-8) v2.0.4 |    1085.334 | 1083.655–1128.400 |           1,474 |            3.49× |
| Static fixtures ×500 |           8,000 | QRCodeSDK v0.0.0                        |    1529.553 | 1478.697–1575.675 |           5,230 |            1.00× |
| Static fixtures ×500 |           8,000 | qrcode v1.5.4                           |    1868.208 | 1816.761–2037.515 |           4,282 |            1.22× |
| Static fixtures ×500 |           8,000 | qrcode-generator (default) v2.0.4       |    5386.594 | 5338.327–5614.956 |           1,485 |            3.52× |
| Static fixtures ×500 |           8,000 | qrcode-generator (TextEncoder) v2.0.4   |    5493.820 | 5345.992–5631.079 |           1,456 |            3.59× |
| Static fixtures ×500 |           8,000 | qrcode-generator (bundled UTF-8) v2.0.4 |    5464.658 | 5326.877–5590.730 |           1,464 |            3.57× |
| All combinations ×1  |           3,840 | QRCodeSDK v0.0.0                        |    1196.678 | 1187.856–1282.228 |           3,209 |            1.00× |
| All combinations ×1  |           3,840 | qrcode v1.5.4                           |    1408.491 | 1306.079–1508.178 |           2,726 |            1.18× |
| All combinations ×1  |           3,840 | qrcode-generator (default) v2.0.4       |    4011.464 | 3991.603–4164.833 |             957 |            3.35× |
| All combinations ×1  |           3,840 | qrcode-generator (TextEncoder) v2.0.4   |    4027.352 | 3990.983–4120.782 |             953 |            3.37× |
| All combinations ×1  |           3,840 | qrcode-generator (bundled UTF-8) v2.0.4 |    4027.912 | 3989.988–4163.098 |             953 |            3.37× |
