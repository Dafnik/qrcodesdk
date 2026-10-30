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

- Generated: `2026-10-30T17:21:13.137Z`
- Runtime: `v26.13.0` on `darwin arm64`
- CPU: `Apple M2 Pro` (12 logical cores)
- Libraries: `qrcodesdk@0.0.4`, `qrcode@1.5.4`, `qrcode-generator@2.0.4`, `qr-code-styling@1.9.2`
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
  accDescr: Throughput calculated from median time. QRCodeSDK 11,662 QR codes per second, qrcode 6,822 QR codes per second, qrcode-generator 1,823 QR codes per second. Higher is better.
  title "Static fixtures ×1 — 17 QR codes/sample"
  x-axis "Library" ["QRCodeSDK", "qrcode", "qrcode-generator"]
  y-axis "QR codes/second" 0 --> 15000
  bar [11662, 6822, 1823]
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
  accDescr: Throughput calculated from median time. QRCodeSDK 11,725 QR codes per second, qrcode 7,066 QR codes per second, qrcode-generator 1,857 QR codes per second. Higher is better.
  title "Static fixtures ×10 — 170 QR codes/sample"
  x-axis "Library" ["QRCodeSDK", "qrcode", "qrcode-generator"]
  y-axis "QR codes/second" 0 --> 15000
  bar [11725, 7066, 1857]
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
  accDescr: Throughput calculated from median time. QRCodeSDK 11,833 QR codes per second, qrcode 7,087 QR codes per second, qrcode-generator 1,888 QR codes per second. Higher is better.
  title "Static fixtures ×100 — 1,700 QR codes/sample"
  x-axis "Library" ["QRCodeSDK", "qrcode", "qrcode-generator"]
  y-axis "QR codes/second" 0 --> 15000
  bar [11833, 7087, 1888]
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
  accDescr: Throughput calculated from median time. QRCodeSDK 7,692 QR codes per second, qrcode 5,385 QR codes per second, qrcode-generator 1,224 QR codes per second. Higher is better.
  title "All combinations ×1 — 3,840 QR codes/sample"
  x-axis "Library" ["QRCodeSDK", "qrcode", "qrcode-generator"]
  y-axis "QR codes/second" 0 --> 8500
  bar [7692, 5385, 1224]
```

<details>
<summary>Exact benchmark data</summary>

| Workload             | QR codes/sample | Library                 | Median (ms) |      Min–max (ms) | QR codes/second |
| -------------------- | --------------: | ----------------------- | ----------: | ----------------: | --------------: |
| Static fixtures ×1   |              17 | QRCodeSDK v0.0.4        |       1.458 |       1.433–1.608 |          11,662 |
| Static fixtures ×1   |              17 | qrcode v1.5.4           |       2.492 |       2.397–2.691 |           6,822 |
| Static fixtures ×1   |              17 | qrcode-generator v2.0.4 |       9.325 |       9.210–9.391 |           1,823 |
| Static fixtures ×10  |             170 | QRCodeSDK v0.0.4        |      14.498 |     14.397–14.674 |          11,725 |
| Static fixtures ×10  |             170 | qrcode v1.5.4           |      24.058 |     23.805–24.847 |           7,066 |
| Static fixtures ×10  |             170 | qrcode-generator v2.0.4 |      91.549 |     90.542–93.331 |           1,857 |
| Static fixtures ×100 |           1,700 | QRCodeSDK v0.0.4        |     143.669 |   141.995–144.205 |          11,833 |
| Static fixtures ×100 |           1,700 | qrcode v1.5.4           |     239.893 |   239.616–240.499 |           7,087 |
| Static fixtures ×100 |           1,700 | qrcode-generator v2.0.4 |     900.410 |   894.832–905.053 |           1,888 |
| All combinations ×1  |           3,840 | QRCodeSDK v0.0.4        |     499.218 |   499.137–524.782 |           7,692 |
| All combinations ×1  |           3,840 | qrcode v1.5.4           |     713.061 |   712.344–739.187 |           5,385 |
| All combinations ×1  |           3,840 | qrcode-generator v2.0.4 |    3138.183 | 3078.702–3185.272 |           1,224 |

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
  accDescr: Throughput calculated from median time. QRCodeSDK 1,567 QR codes per second, qrcode 877 QR codes per second, qrcode-generator 160 QR codes per second. Higher is better.
  title "Static fixtures ×1 — 17 QR codes/sample"
  x-axis "Library" ["QRCodeSDK", "qrcode", "qrcode-generator"]
  y-axis "QR codes/second" 0 --> 2000
  bar [1567, 877, 160]
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
  accDescr: Throughput calculated from median time. QRCodeSDK 1,903 QR codes per second, qrcode 904 QR codes per second, qrcode-generator 162 QR codes per second. Higher is better.
  title "Static fixtures ×10 — 170 QR codes/sample"
  x-axis "Library" ["QRCodeSDK", "qrcode", "qrcode-generator"]
  y-axis "QR codes/second" 0 --> 2500
  bar [1903, 904, 162]
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
  accDescr: Throughput calculated from median time. QRCodeSDK 1,971 QR codes per second, qrcode 917 QR codes per second, qrcode-generator 166 QR codes per second. Higher is better.
  title "Static fixtures ×100 — 1,700 QR codes/sample"
  x-axis "Library" ["QRCodeSDK", "qrcode", "qrcode-generator"]
  y-axis "QR codes/second" 0 --> 2500
  bar [1971, 917, 166]
```

<details>
<summary>Exact benchmark data</summary>

| Workload             | QR codes/sample | Library                 | Median (ms) |        Min–max (ms) | QR codes/second |
| -------------------- | --------------: | ----------------------- | ----------: | ------------------: | --------------: |
| Static fixtures ×1   |              17 | QRCodeSDK v0.0.4        |      10.852 |        9.894–10.931 |           1,567 |
| Static fixtures ×1   |              17 | qrcode v1.5.4           |      19.389 |       18.719–19.491 |             877 |
| Static fixtures ×1   |              17 | qrcode-generator v2.0.4 |     105.957 |     102.607–106.006 |             160 |
| Static fixtures ×10  |             170 | QRCodeSDK v0.0.4        |      89.311 |       87.003–96.460 |           1,903 |
| Static fixtures ×10  |             170 | qrcode v1.5.4           |     188.032 |     186.746–192.493 |             904 |
| Static fixtures ×10  |             170 | qrcode-generator v2.0.4 |    1050.384 |   1036.423–1067.125 |             162 |
| Static fixtures ×100 |           1,700 | QRCodeSDK v0.0.4        |     862.709 |     855.840–864.455 |           1,971 |
| Static fixtures ×100 |           1,700 | qrcode v1.5.4           |    1854.715 |   1832.830–1880.876 |             917 |
| Static fixtures ×100 |           1,700 | qrcode-generator v2.0.4 |   10269.303 | 10219.428–10308.818 |             166 |

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
  accDescr: Throughput calculated from median time. qrcode 4,923 QR codes per second, QRCodeSDK 2,635 QR codes per second, qrcode-generator 1,422 QR codes per second. Higher is better.
  title "Static fixtures ×1 — 17 QR codes/sample"
  x-axis "Library" ["qrcode", "QRCodeSDK", "qrcode-generator"]
  y-axis "QR codes/second" 0 --> 5500
  bar [4923, 2635, 1422]
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
  accDescr: Throughput calculated from median time. qrcode 4,899 QR codes per second, QRCodeSDK 3,946 QR codes per second, qrcode-generator 1,595 QR codes per second. Higher is better.
  title "Static fixtures ×10 — 170 QR codes/sample"
  x-axis "Library" ["qrcode", "QRCodeSDK", "qrcode-generator"]
  y-axis "QR codes/second" 0 --> 5500
  bar [4899, 3946, 1595]
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
  accDescr: Throughput calculated from median time. qrcode 4,818 QR codes per second, QRCodeSDK 3,893 QR codes per second, qrcode-generator 1,585 QR codes per second. Higher is better.
  title "Static fixtures ×100 — 1,700 QR codes/sample"
  x-axis "Library" ["qrcode", "QRCodeSDK", "qrcode-generator"]
  y-axis "QR codes/second" 0 --> 5500
  bar [4818, 3893, 1585]
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
  accDescr: Throughput calculated from median time. qrcode 3,255 QR codes per second, QRCodeSDK 2,067 QR codes per second, qrcode-generator 975 QR codes per second. Higher is better.
  title "All combinations ×1 — 3,840 QR codes/sample"
  x-axis "Library" ["qrcode", "QRCodeSDK", "qrcode-generator"]
  y-axis "QR codes/second" 0 --> 4000
  bar [3255, 2067, 975]
```

<details>
<summary>Exact benchmark data</summary>

| Workload             | QR codes/sample | Library                 | Median (ms) |      Min–max (ms) | QR codes/second |
| -------------------- | --------------: | ----------------------- | ----------: | ----------------: | --------------: |
| Static fixtures ×1   |              17 | QRCodeSDK v0.0.4        |       6.452 |       6.177–7.005 |           2,635 |
| Static fixtures ×1   |              17 | qrcode v1.5.4           |       3.453 |       3.425–3.503 |           4,923 |
| Static fixtures ×1   |              17 | qrcode-generator v2.0.4 |      11.952 |     10.727–13.433 |           1,422 |
| Static fixtures ×10  |             170 | QRCodeSDK v0.0.4        |      43.082 |     42.700–45.749 |           3,946 |
| Static fixtures ×10  |             170 | qrcode v1.5.4           |      34.702 |     34.631–35.831 |           4,899 |
| Static fixtures ×10  |             170 | qrcode-generator v2.0.4 |     106.577 |   106.120–106.942 |           1,595 |
| Static fixtures ×100 |           1,700 | QRCodeSDK v0.0.4        |     436.647 |   425.734–439.220 |           3,893 |
| Static fixtures ×100 |           1,700 | qrcode v1.5.4           |     352.873 |   348.928–358.824 |           4,818 |
| Static fixtures ×100 |           1,700 | qrcode-generator v2.0.4 |    1072.682 | 1061.574–1072.786 |           1,585 |
| All combinations ×1  |           3,840 | QRCodeSDK v0.0.4        |    1857.669 | 1853.819–1912.676 |           2,067 |
| All combinations ×1  |           3,840 | qrcode v1.5.4           |    1179.635 | 1176.890–1199.931 |           3,255 |
| All combinations ×1  |           3,840 | qrcode-generator v2.0.4 |    3937.437 | 3901.811–4054.548 |             975 |

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
  accDescr: Throughput calculated from median time. QRCodeSDK 2,687 QR codes per second, qr-code-styling 128 QR codes per second. Higher is better.
  title "Styled fixtures ×1 — 60 QR codes/sample"
  x-axis "Library" ["QRCodeSDK", "qr-code-styling"]
  y-axis "QR codes/second" 0 --> 3000
  bar [2687, 128]
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
  accDescr: Throughput calculated from median time. QRCodeSDK 3,278 QR codes per second, qr-code-styling 129 QR codes per second. Higher is better.
  title "Styled fixtures ×10 — 600 QR codes/sample"
  x-axis "Library" ["QRCodeSDK", "qr-code-styling"]
  y-axis "QR codes/second" 0 --> 4000
  bar [3278, 129]
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
  accDescr: Throughput calculated from median time. QRCodeSDK 3,504 QR codes per second, qr-code-styling 128 QR codes per second. Higher is better.
  title "Styled fixtures ×50 — 3,000 QR codes/sample"
  x-axis "Library" ["QRCodeSDK", "qr-code-styling"]
  y-axis "QR codes/second" 0 --> 4000
  bar [3504, 128]
```

<details>
<summary>Exact benchmark data</summary>

| Workload            | QR codes/sample | Library                | Median (ms) |        Min–max (ms) | QR codes/second |
| ------------------- | --------------: | ---------------------- | ----------: | ------------------: | --------------: |
| Styled fixtures ×1  |              60 | QRCodeSDK v0.0.4       |      22.328 |       18.914–22.889 |           2,687 |
| Styled fixtures ×1  |              60 | qr-code-styling v1.9.2 |     467.841 |     466.264–468.095 |             128 |
| Styled fixtures ×10 |             600 | QRCodeSDK v0.0.4       |     183.065 |     168.400–188.675 |           3,278 |
| Styled fixtures ×10 |             600 | qr-code-styling v1.9.2 |    4653.124 |   4651.470–4673.028 |             129 |
| Styled fixtures ×50 |           3,000 | QRCodeSDK v0.0.4       |     856.131 |     840.906–858.806 |           3,504 |
| Styled fixtures ×50 |           3,000 | qr-code-styling v1.9.2 |   23417.179 | 23391.239–24206.670 |             128 |

</details>
