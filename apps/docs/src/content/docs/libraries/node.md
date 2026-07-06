---
title: '@qrcodesdk/node'
description: Add PNG Buffer output for Node.js apps, servers, scripts, and file generation.
---

`@qrcodesdk/node` adds renderers that depend on Node.js APIs or server-side packages. Use it with `@qrcodesdk/core` when your output needs to be PNG bytes.

## Install

```sh
pnpm add @qrcodesdk/core @qrcodesdk/node
```

## Render PNG output

```ts
import {writeFile} from 'node:fs/promises';

import {qrcode} from '@qrcodesdk/core';
import {PNGQRCodeRenderer} from '@qrcodesdk/node';

const png = qrcode('https://qrcodesdk.dev').render(
  PNGQRCodeRenderer({
    size: 8,
    margin: 4,
  }),
);

await writeFile('qrcode.png', png);
```

## Use it for

- writing QR code PNG files
- serving `image/png` responses from Node.js servers
- creating download assets
- attaching QR code images to emails
- integrating with systems that expect PNG bytes

## Package boundary

`@qrcodesdk/node` does not replace `@qrcodesdk/core`. The core package still provides `qrcode()`, matrix generation, builder options, and shared styling normalization.

## Related pages

- [Installation](/guides/installation/)
- [Render PNG in Node.js](/renderers/node/png/)
- [Customize QR Codes](/guides/customize/)
