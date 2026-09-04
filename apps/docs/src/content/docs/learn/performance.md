---
title: Performance
description: Matrix, automatic matrix, SVG, and styled SVG generation benchmark results for QRCodeSDK and its reference libraries.
docType: concept
---

<!-- Generated from benchmark-results/latest.json. Run `pnpm turbo run generate-performance --filter=docs` to update. -->

The matrix, automatic matrix, and SVG benchmarks compare QRCodeSDK with **qrcode** and **qrcode-generator** using its stock text encoder. Styled SVG generation compares QRCodeSDK with **qr-code-styling**. Benchmarks are environment-specific and should be read as relative comparisons, not universal guarantees.

The matrix and SVG fixtures supply explicit versions and masks. The **qrcode-generator** rows use the repository patch that applies each fixture's mask and skips automatic mask evaluation. The automatic matrix fixtures omit both options so every library selects them.

Styled SVG generation uses all 60 shared styling fixtures at 1, 10, 50 repetitions. Both libraries select the mask automatically because **qr-code-styling** has no public mask option. Fixture module size and margin determine the matching pixel dimensions passed to **qr-code-styling**, which renders SVG through a shared JSDOM environment initialized before measurement.

## Benchmark environment

- Generated: `2026-09-04T13:03:58.339Z`
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
  accDescr: Throughput calculated from median time. QRCodeSDK 11,663 QR codes per second, qrcode 6,112 QR codes per second, qrcode-generator 1,793 QR codes per second. Higher is better.
  title "Static fixtures ×1 — 17 QR codes/sample"
  x-axis "Library" ["QRCodeSDK", "qrcode", "qrcode-generator"]
  y-axis "QR codes/second" 0 --> 15000
  bar [11663, 6112, 1793]
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
  accDescr: Throughput calculated from median time. QRCodeSDK 11,605 QR codes per second, qrcode 6,105 QR codes per second, qrcode-generator 1,841 QR codes per second. Higher is better.
  title "Static fixtures ×10 — 170 QR codes/sample"
  x-axis "Library" ["QRCodeSDK", "qrcode", "qrcode-generator"]
  y-axis "QR codes/second" 0 --> 15000
  bar [11605, 6105, 1841]
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
  accDescr: Throughput calculated from median time. QRCodeSDK 11,786 QR codes per second, qrcode 5,990 QR codes per second, qrcode-generator 1,926 QR codes per second. Higher is better.
  title "Static fixtures ×100 — 1,700 QR codes/sample"
  x-axis "Library" ["QRCodeSDK", "qrcode", "qrcode-generator"]
  y-axis "QR codes/second" 0 --> 15000
  bar [11786, 5990, 1926]
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
  accDescr: Throughput calculated from median time. QRCodeSDK 6,396 QR codes per second, qrcode 5,307 QR codes per second, qrcode-generator 1,253 QR codes per second. Higher is better.
  title "All combinations ×1 — 3,840 QR codes/sample"
  x-axis "Library" ["QRCodeSDK", "qrcode", "qrcode-generator"]
  y-axis "QR codes/second" 0 --> 7500
  bar [6396, 5307, 1253]
```

<details>
<summary>Exact benchmark data</summary>

| Workload             | QR codes/sample | Library                 | Median (ms) |      Min–max (ms) | QR codes/second |
| -------------------- | --------------: | ----------------------- | ----------: | ----------------: | --------------: |
| Static fixtures ×1   |              17 | QRCodeSDK v0.0.1        |       1.458 |       1.452–1.566 |          11,663 |
| Static fixtures ×1   |              17 | qrcode v1.5.4           |       2.781 |       2.734–2.878 |           6,112 |
| Static fixtures ×1   |              17 | qrcode-generator v2.0.4 |       9.481 |       8.974–9.607 |           1,793 |
| Static fixtures ×10  |             170 | QRCodeSDK v0.0.1        |      14.649 |     14.434–14.662 |          11,605 |
| Static fixtures ×10  |             170 | qrcode v1.5.4           |      27.845 |     27.092–28.373 |           6,105 |
| Static fixtures ×10  |             170 | qrcode-generator v2.0.4 |      92.320 |     89.852–92.547 |           1,841 |
| Static fixtures ×100 |           1,700 | QRCodeSDK v0.0.1        |     144.241 |   141.503–151.893 |          11,786 |
| Static fixtures ×100 |           1,700 | qrcode v1.5.4           |     283.821 |   277.245–284.016 |           5,990 |
| Static fixtures ×100 |           1,700 | qrcode-generator v2.0.4 |     882.634 |   859.500–889.787 |           1,926 |
| All combinations ×1  |           3,840 | QRCodeSDK v0.0.1        |     600.381 |   593.616–610.568 |           6,396 |
| All combinations ×1  |           3,840 | qrcode v1.5.4           |     723.523 |   713.369–861.769 |           5,307 |
| All combinations ×1  |           3,840 | qrcode-generator v2.0.4 |    3065.471 | 3016.144–3080.619 |           1,253 |

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
  accDescr: Throughput calculated from median time. QRCodeSDK 1,365 QR codes per second, qrcode 889 QR codes per second, qrcode-generator 187 QR codes per second. Higher is better.
  title "Static fixtures ×1 — 17 QR codes/sample"
  x-axis "Library" ["QRCodeSDK", "qrcode", "qrcode-generator"]
  y-axis "QR codes/second" 0 --> 2000
  bar [1365, 889, 187]
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
  accDescr: Throughput calculated from median time. QRCodeSDK 1,356 QR codes per second, qrcode 908 QR codes per second, qrcode-generator 187 QR codes per second. Higher is better.
  title "Static fixtures ×10 — 170 QR codes/sample"
  x-axis "Library" ["QRCodeSDK", "qrcode", "qrcode-generator"]
  y-axis "QR codes/second" 0 --> 1500
  bar [1356, 908, 187]
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
  accDescr: Throughput calculated from median time. QRCodeSDK 1,357 QR codes per second, qrcode 798 QR codes per second, qrcode-generator 186 QR codes per second. Higher is better.
  title "Static fixtures ×100 — 1,700 QR codes/sample"
  x-axis "Library" ["QRCodeSDK", "qrcode", "qrcode-generator"]
  y-axis "QR codes/second" 0 --> 1500
  bar [1357, 798, 186]
```

<details>
<summary>Exact benchmark data</summary>

| Workload             | QR codes/sample | Library                 | Median (ms) |      Min–max (ms) | QR codes/second |
| -------------------- | --------------: | ----------------------- | ----------: | ----------------: | --------------: |
| Static fixtures ×1   |              17 | QRCodeSDK v0.0.1        |      12.454 |     12.393–12.585 |           1,365 |
| Static fixtures ×1   |              17 | qrcode v1.5.4           |      19.128 |     18.906–24.524 |             889 |
| Static fixtures ×1   |              17 | qrcode-generator v2.0.4 |      90.776 |     90.387–93.816 |             187 |
| Static fixtures ×10  |             170 | QRCodeSDK v0.0.1        |     125.333 |   124.775–125.402 |           1,356 |
| Static fixtures ×10  |             170 | qrcode v1.5.4           |     187.282 |   186.662–187.721 |             908 |
| Static fixtures ×10  |             170 | qrcode-generator v2.0.4 |     907.760 |   906.082–908.446 |             187 |
| Static fixtures ×100 |           1,700 | QRCodeSDK v0.0.1        |    1252.337 | 1247.044–1253.364 |           1,357 |
| Static fixtures ×100 |           1,700 | qrcode v1.5.4           |    2129.203 | 1869.964–2151.657 |             798 |
| Static fixtures ×100 |           1,700 | qrcode-generator v2.0.4 |    9134.096 | 9118.567–9154.573 |             186 |

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
  accDescr: Throughput calculated from median time. qrcode 4,040 QR codes per second, QRCodeSDK 2,891 QR codes per second, qrcode-generator 1,407 QR codes per second. Higher is better.
  title "Static fixtures ×1 — 17 QR codes/sample"
  x-axis "Library" ["qrcode", "QRCodeSDK", "qrcode-generator"]
  y-axis "QR codes/second" 0 --> 4500
  bar [4040, 2891, 1407]
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
  accDescr: Throughput calculated from median time. qrcode 4,305 QR codes per second, QRCodeSDK 3,607 QR codes per second, qrcode-generator 1,589 QR codes per second. Higher is better.
  title "Static fixtures ×10 — 170 QR codes/sample"
  x-axis "Library" ["qrcode", "QRCodeSDK", "qrcode-generator"]
  y-axis "QR codes/second" 0 --> 5000
  bar [4305, 3607, 1589]
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
  accDescr: Throughput calculated from median time. qrcode 4,648 QR codes per second, QRCodeSDK 3,595 QR codes per second, qrcode-generator 1,591 QR codes per second. Higher is better.
  title "Static fixtures ×100 — 1,700 QR codes/sample"
  x-axis "Library" ["qrcode", "QRCodeSDK", "qrcode-generator"]
  y-axis "QR codes/second" 0 --> 5500
  bar [4648, 3595, 1591]
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
  accDescr: Throughput calculated from median time. qrcode 3,042 QR codes per second, QRCodeSDK 1,746 QR codes per second, qrcode-generator 963 QR codes per second. Higher is better.
  title "All combinations ×1 — 3,840 QR codes/sample"
  x-axis "Library" ["qrcode", "QRCodeSDK", "qrcode-generator"]
  y-axis "QR codes/second" 0 --> 3500
  bar [3042, 1746, 963]
```

<details>
<summary>Exact benchmark data</summary>

| Workload             | QR codes/sample | Library                 | Median (ms) |      Min–max (ms) | QR codes/second |
| -------------------- | --------------: | ----------------------- | ----------: | ----------------: | --------------: |
| Static fixtures ×1   |              17 | QRCodeSDK v0.0.1        |       5.880 |       4.574–7.027 |           2,891 |
| Static fixtures ×1   |              17 | qrcode v1.5.4           |       4.208 |       4.013–4.253 |           4,040 |
| Static fixtures ×1   |              17 | qrcode-generator v2.0.4 |      12.084 |     11.636–16.153 |           1,407 |
| Static fixtures ×10  |             170 | QRCodeSDK v0.0.1        |      47.130 |     47.039–47.626 |           3,607 |
| Static fixtures ×10  |             170 | qrcode v1.5.4           |      39.493 |     39.283–39.980 |           4,305 |
| Static fixtures ×10  |             170 | qrcode-generator v2.0.4 |     106.996 |   106.723–107.659 |           1,589 |
| Static fixtures ×100 |           1,700 | QRCodeSDK v0.0.1        |     472.856 |   472.120–473.321 |           3,595 |
| Static fixtures ×100 |           1,700 | qrcode v1.5.4           |     365.719 |   364.734–381.233 |           4,648 |
| Static fixtures ×100 |           1,700 | qrcode-generator v2.0.4 |    1068.605 | 1066.869–1084.734 |           1,591 |
| All combinations ×1  |           3,840 | QRCodeSDK v0.0.1        |    2199.083 | 2198.726–2200.344 |           1,746 |
| All combinations ×1  |           3,840 | qrcode v1.5.4           |    1262.302 | 1261.986–1263.098 |           3,042 |
| All combinations ×1  |           3,840 | qrcode-generator v2.0.4 |    3989.001 | 3983.264–3992.285 |             963 |

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
  accDescr: Throughput calculated from median time. QRCodeSDK 2,372 QR codes per second, qr-code-styling 107 QR codes per second. Higher is better.
  title "Styled fixtures ×1 — 60 QR codes/sample"
  x-axis "Library" ["QRCodeSDK", "qr-code-styling"]
  y-axis "QR codes/second" 0 --> 3000
  bar [2372, 107]
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
  accDescr: Throughput calculated from median time. QRCodeSDK 2,537 QR codes per second, qr-code-styling 108 QR codes per second. Higher is better.
  title "Styled fixtures ×10 — 600 QR codes/sample"
  x-axis "Library" ["QRCodeSDK", "qr-code-styling"]
  y-axis "QR codes/second" 0 --> 3000
  bar [2537, 108]
```

```mermaid
---
config:
  xyChart:
    showDataLabel: true
    showDataLabelOutsideBar: true
---
xychart horizontal
  accTitle: Styled SVG generation: Styled fixtures ×50 — 3,000 QR codes/sample
  accDescr: Throughput calculated from median time. QRCodeSDK 2,630 QR codes per second, qr-code-styling 108 QR codes per second. Higher is better.
  title "Styled fixtures ×50 — 3,000 QR codes/sample"
  x-axis "Library" ["QRCodeSDK", "qr-code-styling"]
  y-axis "QR codes/second" 0 --> 3000
  bar [2630, 108]
```

<details>
<summary>Exact benchmark data</summary>

| Workload            | QR codes/sample | Library                | Median (ms) |        Min–max (ms) | QR codes/second |
| ------------------- | --------------: | ---------------------- | ----------: | ------------------: | --------------: |
| Styled fixtures ×1  |              60 | QRCodeSDK v0.0.1       |      25.293 |       23.933–26.665 |           2,372 |
| Styled fixtures ×1  |              60 | qr-code-styling v1.9.2 |     559.173 |     555.872–564.520 |             107 |
| Styled fixtures ×10 |             600 | QRCodeSDK v0.0.1       |     236.470 |     226.530–239.063 |           2,537 |
| Styled fixtures ×10 |             600 | qr-code-styling v1.9.2 |    5576.909 |   5552.169–5581.269 |             108 |
| Styled fixtures ×50 |           3,000 | QRCodeSDK v0.0.1       |    1140.588 |   1137.680–1141.704 |           2,630 |
| Styled fixtures ×50 |           3,000 | qr-code-styling v1.9.2 |   27882.020 | 27877.122–27922.017 |             108 |

</details>
