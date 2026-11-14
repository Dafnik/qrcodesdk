---
title: Custom renderers
description: Render QR matrices directly into custom output.
docType: reference

related:
  - ../guides/customize.md
  - ../packages/core.mdx
---

A `QRCodeRenderer<T>` is a function. It receives an immutable QR matrix and returns any output type
you want. Your renderer owns its layout, drawing, and options.

Built-in renderers share an internal drawing pipeline that is not public.

:::tip[Only need custom shapes?]
You don't need a custom renderer for that. Built-in SVG, Canvas, Image element, and Node.js raster
renderers accept your own paths through [`customShape()`](/guides/customize/#custom-shapes).
:::

## Matrix-only renderer

```ts
import {type QRCodeRenderer, qrcode} from '@qrcodesdk/core';

const textRenderer: QRCodeRenderer<string> = ({width, height, modules}) => {
  const rows: string[] = [];
  for (let y = 0; y < height; y++) {
    let row = '';
    for (let x = 0; x < width; x++) row += modules[y * width + x] === 1 ? '#' : '.';
    rows.push(row);
  }
  return rows.join('\n');
};

const text = qrcode('custom output').render(textRenderer);
```

### Matrix data

A `QRCodeMatrix` is a read-only object with flat, row-major module data. The module at column `x`
and row `y` is at index `y * width + x` in both arrays.

| Property  | Type                          | Meaning                                          |
| --------- | ----------------------------- | ------------------------------------------------ |
| `width`   | `number`                      | Modules per row, without a quiet zone            |
| `height`  | `number`                      | Rows of modules, without a quiet zone            |
| `modules` | `readonly (0 \| 1)[]`         | `1` for a dark module and `0` for a light module |
| `roles`   | `readonly QRCodeModuleRole[]` | The [module role](#module-roles) of every module |

Standard and Micro QR codes are square, so their `width` and `height` are equal.
[rMQR codes](/guides/rmqr-codes/) are wider than they are high. Loop over `height` for rows and
`width` for columns, so your renderer handles every symbol.

### Module roles

`roles` records the function of every module, light or dark. `QR_CODE_MODULE_ROLES` from
`@qrcodesdk/core/matrix` names the values.

| Value | Name              | Modules                                                 |
| ----- | ----------------- | ------------------------------------------------------- |
| `0`   | `data`            | Data and error correction                               |
| `1`   | `finderRing`      | 7 × 7 finder ring, including the light gap inside it    |
| `2`   | `finderCenter`    | 3 × 3 finder center                                     |
| `3`   | `separator`       | Light border around each finder pattern                 |
| `4`   | `alignmentRing`   | 5 × 5 alignment ring, including the light gap inside it |
| `5`   | `alignmentCenter` | 1 × 1 alignment center                                  |
| `6`   | `timing`          | Timing patterns                                         |
| `7`   | `format`          | Format information, including the always-dark module    |
| `8`   | `version`         | Version information, in version 7 and later             |

- Roles depend only on the version, so every matrix of the same version shares one `roles` array.
- `modules` and `roles` are frozen. Call `slice()` for a mutable copy.

rMQR codes have no roles of their own. They reuse the standard roles:

| rMQR pattern                                     | Role                               |
| ------------------------------------------------ | ---------------------------------- |
| Finder pattern in the top-left corner            | `finderRing`, `finderCenter`       |
| Separator right of and below the finder pattern  | `separator`                        |
| 5 × 5 finder sub-pattern in the bottom-right     | `alignmentRing`, `alignmentCenter` |
| Timing patterns along the edges and between them | `timing`                           |
| 3 × 3 alignment patterns and corner patterns     | `timing`                           |
| Both copies of the format information            | `format`                           |

This example counts the dark data modules:

```ts
import {qrcode} from '@qrcodesdk/core';
import {QR_CODE_MODULE_ROLES} from '@qrcodesdk/core/matrix';

const {modules, roles} = qrcode('custom output').matrix();
let darkDataModules = 0;
for (let index = 0; index < modules.length; index++) {
  if (modules[index] === 1 && roles[index] === QR_CODE_MODULE_ROLES.data) darkDataModules++;
}
```
