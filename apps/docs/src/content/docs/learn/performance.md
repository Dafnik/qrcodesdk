---
title: Performance
description: Matrix, automatic matrix, SVG, and styled SVG generation benchmark results for QRCodeSDK and its reference libraries.
docType: concept
---

<!-- Generated from benchmark-results/latest.json. Run `pnpm turbo run generate-performance --filter=docs` to update. -->

The matrix, automatic matrix, and SVG benchmarks compare QRCodeSDK with **qrcode** and **qrcode-generator** using its stock text encoder. Styled SVG generation compares QRCodeSDK with **qr-code-styling**. Benchmarks are environment-specific and should be read as relative comparisons, not universal guarantees.

The matrix and SVG fixtures supply explicit versions and masks. The **qrcode-generator** rows use the repository patch that applies each fixture's mask and skips automatic mask evaluation. The automatic matrix fixtures omit both options so every library selects them.

Styled SVG generation uses all 60 shared styling fixtures at 1, 10, 100 repetitions. Both libraries select the mask automatically because **qr-code-styling** has no public mask option. Fixture module size and margin determine the matching pixel dimensions passed to **qr-code-styling**, which renders SVG through a shared JSDOM environment initialized before measurement.

## Benchmark environment

- Generated: `2026-08-28T09:45:29.530Z`
- Runtime: `v24.20.0` on `darwin arm64`
- CPU: `Apple M2 Pro` (12 logical cores)
- Libraries: `qrcodesdk@0.0.1`, `qrcode@1.5.4`, `qrcode-generator@2.0.4`, `qr-code-styling@1.9.2`
- Samples: 3 timed samples after 5 static warm-up passes and 1 exhaustive warm-up pass
- SVG output: 4 px/module with a 4-module quiet zone
- Styled SVG fixtures: 60, with fixture-derived dimensions and automatic mask selection

The charts show throughput calculated from the median time. Higher is better, and each chart lists the fastest library first. Expand the exact benchmark data beneath each section for median time, min–max range, and throughput.

## Matrix generation

```mermaid
---
config:
  xyChart:
    showDataLabel: true
    showDataLabelOutsideBar: true
---
xychart horizontal
  accTitle: Matrix generation: Static fixtures ×1 — 17 QR codes/sample
  accDescr: Throughput calculated from median time. QRCodeSDK 10,990 QR codes per second, qrcode 5,965 QR codes per second, qrcode-generator 1,844 QR codes per second. Higher is better.
  title "Static fixtures ×1 — 17 QR codes/sample"
  x-axis "Library" ["QRCodeSDK", "qrcode", "qrcode-generator"]
  y-axis "QR codes/second" 0 --> 15000
  bar [10990, 5965, 1844]
```

```mermaid
---
config:
  xyChart:
    showDataLabel: true
    showDataLabelOutsideBar: true
---
xychart horizontal
  accTitle: Matrix generation: Static fixtures ×10 — 170 QR codes/sample
  accDescr: Throughput calculated from median time. QRCodeSDK 11,662 QR codes per second, qrcode 6,076 QR codes per second, qrcode-generator 1,913 QR codes per second. Higher is better.
  title "Static fixtures ×10 — 170 QR codes/sample"
  x-axis "Library" ["QRCodeSDK", "qrcode", "qrcode-generator"]
  y-axis "QR codes/second" 0 --> 15000
  bar [11662, 6076, 1913]
```

```mermaid
---
config:
  xyChart:
    showDataLabel: true
    showDataLabelOutsideBar: true
---
xychart horizontal
  accTitle: Matrix generation: Static fixtures ×100 — 1,700 QR codes/sample
  accDescr: Throughput calculated from median time. QRCodeSDK 11,978 QR codes per second, qrcode 6,311 QR codes per second, qrcode-generator 1,955 QR codes per second. Higher is better.
  title "Static fixtures ×100 — 1,700 QR codes/sample"
  x-axis "Library" ["QRCodeSDK", "qrcode", "qrcode-generator"]
  y-axis "QR codes/second" 0 --> 15000
  bar [11978, 6311, 1955]
```

```mermaid
---
config:
  xyChart:
    showDataLabel: true
    showDataLabelOutsideBar: true
---
xychart horizontal
  accTitle: Matrix generation: All combinations ×1 — 3,840 QR codes/sample
  accDescr: Throughput calculated from median time. QRCodeSDK 6,459 QR codes per second, qrcode 5,484 QR codes per second, qrcode-generator 1,286 QR codes per second. Higher is better.
  title "All combinations ×1 — 3,840 QR codes/sample"
  x-axis "Library" ["QRCodeSDK", "qrcode", "qrcode-generator"]
  y-axis "QR codes/second" 0 --> 7500
  bar [6459, 5484, 1286]
```

<details>
<summary>Exact benchmark data</summary>

| Workload             | QR codes/sample | Library                 | Median (ms) |      Min–max (ms) | QR codes/second |
| -------------------- | --------------: | ----------------------- | ----------: | ----------------: | --------------: |
| Static fixtures ×1   |              17 | QRCodeSDK v0.0.1        |       1.547 |       1.545–2.087 |          10,990 |
| Static fixtures ×1   |              17 | qrcode v1.5.4           |       2.850 |       2.756–2.938 |           5,965 |
| Static fixtures ×1   |              17 | qrcode-generator v2.0.4 |       9.217 |       9.109–9.584 |           1,844 |
| Static fixtures ×10  |             170 | QRCodeSDK v0.0.1        |      14.578 |     14.245–15.625 |          11,662 |
| Static fixtures ×10  |             170 | qrcode v1.5.4           |      27.977 |     27.303–28.456 |           6,076 |
| Static fixtures ×10  |             170 | qrcode-generator v2.0.4 |      88.870 |     88.687–91.498 |           1,913 |
| Static fixtures ×100 |           1,700 | QRCodeSDK v0.0.1        |     141.930 |   141.207–142.998 |          11,978 |
| Static fixtures ×100 |           1,700 | qrcode v1.5.4           |     269.390 |   266.435–282.264 |           6,311 |
| Static fixtures ×100 |           1,700 | qrcode-generator v2.0.4 |     869.771 |   853.769–880.533 |           1,955 |
| All combinations ×1  |           3,840 | QRCodeSDK v0.0.1        |     594.523 |   588.827–597.055 |           6,459 |
| All combinations ×1  |           3,840 | qrcode v1.5.4           |     700.175 |   699.341–711.116 |           5,484 |
| All combinations ×1  |           3,840 | qrcode-generator v2.0.4 |    2985.574 | 2962.032–2991.011 |           1,286 |

</details>

## Automatic matrix generation

```mermaid
---
config:
  xyChart:
    showDataLabel: true
    showDataLabelOutsideBar: true
---
xychart horizontal
  accTitle: Automatic matrix generation: Static fixtures ×1 — 17 QR codes/sample
  accDescr: Throughput calculated from median time. QRCodeSDK 1,369 QR codes per second, qrcode 728 QR codes per second, qrcode-generator 187 QR codes per second. Higher is better.
  title "Static fixtures ×1 — 17 QR codes/sample"
  x-axis "Library" ["QRCodeSDK", "qrcode", "qrcode-generator"]
  y-axis "QR codes/second" 0 --> 2000
  bar [1369, 728, 187]
```

```mermaid
---
config:
  xyChart:
    showDataLabel: true
    showDataLabelOutsideBar: true
---
xychart horizontal
  accTitle: Automatic matrix generation: Static fixtures ×10 — 170 QR codes/sample
  accDescr: Throughput calculated from median time. QRCodeSDK 1,370 QR codes per second, qrcode 729 QR codes per second, qrcode-generator 190 QR codes per second. Higher is better.
  title "Static fixtures ×10 — 170 QR codes/sample"
  x-axis "Library" ["QRCodeSDK", "qrcode", "qrcode-generator"]
  y-axis "QR codes/second" 0 --> 2000
  bar [1370, 729, 190]
```

```mermaid
---
config:
  xyChart:
    showDataLabel: true
    showDataLabelOutsideBar: true
---
xychart horizontal
  accTitle: Automatic matrix generation: Static fixtures ×100 — 1,700 QR codes/sample
  accDescr: Throughput calculated from median time. QRCodeSDK 1,362 QR codes per second, qrcode 841 QR codes per second, qrcode-generator 188 QR codes per second. Higher is better.
  title "Static fixtures ×100 — 1,700 QR codes/sample"
  x-axis "Library" ["QRCodeSDK", "qrcode", "qrcode-generator"]
  y-axis "QR codes/second" 0 --> 1500
  bar [1362, 841, 188]
```

<details>
<summary>Exact benchmark data</summary>

| Workload             | QR codes/sample | Library                 | Median (ms) |      Min–max (ms) | QR codes/second |
| -------------------- | --------------: | ----------------------- | ----------: | ----------------: | --------------: |
| Static fixtures ×1   |              17 | QRCodeSDK v0.0.1        |      12.419 |     12.388–12.947 |           1,369 |
| Static fixtures ×1   |              17 | qrcode v1.5.4           |      23.349 |     23.292–24.986 |             728 |
| Static fixtures ×1   |              17 | qrcode-generator v2.0.4 |      90.787 |     90.693–92.546 |             187 |
| Static fixtures ×10  |             170 | QRCodeSDK v0.0.1        |     124.111 |   123.837–128.827 |           1,370 |
| Static fixtures ×10  |             170 | qrcode v1.5.4           |     233.136 |   230.470–234.598 |             729 |
| Static fixtures ×10  |             170 | qrcode-generator v2.0.4 |     894.704 |   891.418–898.874 |             190 |
| Static fixtures ×100 |           1,700 | QRCodeSDK v0.0.1        |    1248.530 | 1242.400–1430.421 |           1,362 |
| Static fixtures ×100 |           1,700 | qrcode v1.5.4           |    2021.649 | 1811.305–2159.983 |             841 |
| Static fixtures ×100 |           1,700 | qrcode-generator v2.0.4 |    9039.941 | 9019.662–9704.444 |             188 |

</details>

## SVG generation

```mermaid
---
config:
  xyChart:
    showDataLabel: true
    showDataLabelOutsideBar: true
---
xychart horizontal
  accTitle: SVG generation: Static fixtures ×1 — 17 QR codes/sample
  accDescr: Throughput calculated from median time. qrcode 4,319 QR codes per second, QRCodeSDK 3,618 QR codes per second, qrcode-generator 1,294 QR codes per second. Higher is better.
  title "Static fixtures ×1 — 17 QR codes/sample"
  x-axis "Library" ["qrcode", "QRCodeSDK", "qrcode-generator"]
  y-axis "QR codes/second" 0 --> 5000
  bar [4319, 3618, 1294]
```

```mermaid
---
config:
  xyChart:
    showDataLabel: true
    showDataLabelOutsideBar: true
---
xychart horizontal
  accTitle: SVG generation: Static fixtures ×10 — 170 QR codes/sample
  accDescr: Throughput calculated from median time. qrcode 4,411 QR codes per second, QRCodeSDK 3,713 QR codes per second, qrcode-generator 1,498 QR codes per second. Higher is better.
  title "Static fixtures ×10 — 170 QR codes/sample"
  x-axis "Library" ["qrcode", "QRCodeSDK", "qrcode-generator"]
  y-axis "QR codes/second" 0 --> 5000
  bar [4411, 3713, 1498]
```

```mermaid
---
config:
  xyChart:
    showDataLabel: true
    showDataLabelOutsideBar: true
---
xychart horizontal
  accTitle: SVG generation: Static fixtures ×100 — 1,700 QR codes/sample
  accDescr: Throughput calculated from median time. qrcode 4,429 QR codes per second, QRCodeSDK 3,871 QR codes per second, qrcode-generator 1,536 QR codes per second. Higher is better.
  title "Static fixtures ×100 — 1,700 QR codes/sample"
  x-axis "Library" ["qrcode", "QRCodeSDK", "qrcode-generator"]
  y-axis "QR codes/second" 0 --> 5000
  bar [4429, 3871, 1536]
```

```mermaid
---
config:
  xyChart:
    showDataLabel: true
    showDataLabelOutsideBar: true
---
xychart horizontal
  accTitle: SVG generation: All combinations ×1 — 3,840 QR codes/sample
  accDescr: Throughput calculated from median time. qrcode 2,963 QR codes per second, QRCodeSDK 1,879 QR codes per second, qrcode-generator 943 QR codes per second. Higher is better.
  title "All combinations ×1 — 3,840 QR codes/sample"
  x-axis "Library" ["qrcode", "QRCodeSDK", "qrcode-generator"]
  y-axis "QR codes/second" 0 --> 3500
  bar [2963, 1879, 943]
```

<details>
<summary>Exact benchmark data</summary>

| Workload             | QR codes/sample | Library                 | Median (ms) |      Min–max (ms) | QR codes/second |
| -------------------- | --------------: | ----------------------- | ----------: | ----------------: | --------------: |
| Static fixtures ×1   |              17 | QRCodeSDK v0.0.1        |       4.699 |       4.658–4.815 |           3,618 |
| Static fixtures ×1   |              17 | qrcode v1.5.4           |       3.936 |       3.795–4.115 |           4,319 |
| Static fixtures ×1   |              17 | qrcode-generator v2.0.4 |      13.134 |     12.814–16.756 |           1,294 |
| Static fixtures ×10  |             170 | QRCodeSDK v0.0.1        |      45.786 |     43.967–46.162 |           3,713 |
| Static fixtures ×10  |             170 | qrcode v1.5.4           |      38.538 |     37.353–39.788 |           4,411 |
| Static fixtures ×10  |             170 | qrcode-generator v2.0.4 |     113.450 |   111.377–118.259 |           1,498 |
| Static fixtures ×100 |           1,700 | QRCodeSDK v0.0.1        |     439.107 |   438.129–440.315 |           3,871 |
| Static fixtures ×100 |           1,700 | qrcode v1.5.4           |     383.856 |   373.911–387.527 |           4,429 |
| Static fixtures ×100 |           1,700 | qrcode-generator v2.0.4 |    1106.628 | 1086.954–1131.310 |           1,536 |
| All combinations ×1  |           3,840 | QRCodeSDK v0.0.1        |    2043.499 | 2020.362–2079.144 |           1,879 |
| All combinations ×1  |           3,840 | qrcode v1.5.4           |    1296.185 | 1286.884–1352.158 |           2,963 |
| All combinations ×1  |           3,840 | qrcode-generator v2.0.4 |    4070.803 | 4029.315–4093.384 |             943 |

</details>

## Styled SVG generation

```mermaid
---
config:
  xyChart:
    showDataLabel: true
    showDataLabelOutsideBar: true
---
xychart horizontal
  accTitle: Styled SVG generation: Styled fixtures ×1 — 60 QR codes/sample
  accDescr: Throughput calculated from median time. QRCodeSDK 2,408 QR codes per second, qr-code-styling 101 QR codes per second. Higher is better.
  title "Styled fixtures ×1 — 60 QR codes/sample"
  x-axis "Library" ["QRCodeSDK", "qr-code-styling"]
  y-axis "QR codes/second" 0 --> 3000
  bar [2408, 101]
```

```mermaid
---
config:
  xyChart:
    showDataLabel: true
    showDataLabelOutsideBar: true
---
xychart horizontal
  accTitle: Styled SVG generation: Styled fixtures ×10 — 600 QR codes/sample
  accDescr: Throughput calculated from median time. QRCodeSDK 2,799 QR codes per second, qr-code-styling 104 QR codes per second. Higher is better.
  title "Styled fixtures ×10 — 600 QR codes/sample"
  x-axis "Library" ["QRCodeSDK", "qr-code-styling"]
  y-axis "QR codes/second" 0 --> 3500
  bar [2799, 104]
```

```mermaid
---
config:
  xyChart:
    showDataLabel: true
    showDataLabelOutsideBar: true
---
xychart horizontal
  accTitle: Styled SVG generation: Styled fixtures ×100 — 6,000 QR codes/sample
  accDescr: Throughput calculated from median time. QRCodeSDK 2,740 QR codes per second, qr-code-styling 101 QR codes per second. Higher is better.
  title "Styled fixtures ×100 — 6,000 QR codes/sample"
  x-axis "Library" ["QRCodeSDK", "qr-code-styling"]
  y-axis "QR codes/second" 0 --> 3500
  bar [2740, 101]
```

<details>
<summary>Exact benchmark data</summary>

| Workload             | QR codes/sample | Library                | Median (ms) |        Min–max (ms) | QR codes/second |
| -------------------- | --------------: | ---------------------- | ----------: | ------------------: | --------------: |
| Styled fixtures ×1   |              60 | QRCodeSDK v0.0.1       |      24.913 |       23.265–26.399 |           2,408 |
| Styled fixtures ×1   |              60 | qr-code-styling v1.9.2 |     592.585 |     587.140–598.296 |             101 |
| Styled fixtures ×10  |             600 | QRCodeSDK v0.0.1       |     214.367 |     212.450–218.275 |           2,799 |
| Styled fixtures ×10  |             600 | qr-code-styling v1.9.2 |    5795.746 |   5794.763–5797.046 |             104 |
| Styled fixtures ×100 |           6,000 | QRCodeSDK v0.0.1       |    2190.077 |   2089.891–2408.082 |           2,740 |
| Styled fixtures ×100 |           6,000 | qr-code-styling v1.9.2 |   59498.362 | 58845.397–61576.687 |             101 |

</details>
